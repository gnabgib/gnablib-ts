import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { DurationExact } from '../../src/datetime/Duration';
import { IDurationExactParts } from '../../src/datetime/interfaces/IDurationParts';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';

const tsts = suite('DurationExact');

function dbug(d: IDurationExactParts): string {
	return `(${d.d ?? 0} ${d.h ?? 0} ${d.i ?? 0} ${d.s ?? 0} ${d.us ?? 0})`;
}

tsts(`zero`, () => {
	const du = DurationExact.zero;
	assert.equal(du.toString(), '0s');
	assert.equal(du.toIso8601(), 'P0D');
});
tsts(`max`, () => {
	const du = DurationExact.max;
	assert.equal(du.toString(), '134117046d');
	assert.equal(du.toIso8601(), 'P134117046D');
});

//These must be pure (not fractions/oversized) to allow comparison with source parts
const newSet: [IDurationExactParts, string, string][] = [
	[{}, '0s', 'P0D'],
	[{ d: 1 }, '1d', 'P1D'],
	[{ h: 1 }, '1h', 'PT1H'],
	[{ i: 1 }, '1i', 'PT1M'],
	[{ s: 1 }, '1s', 'PT1S'],
	[{ us: 1 }, '0.000001s', 'PT0.000001S'],
	[{ us: 100 }, '0.000100s', 'PT0.000100S'],
	[
		{ d: 1, h: 3, i: 5, s: 11, us: 13 },
		'1d3h5i11.000013s',
		'P1DT3H5M11.000013S',
	],
];
for (const [p, str, iso] of newSet) {
	const du = DurationExact.new(p);
	tsts(`${dbug(p)}`, () => {
		assert.equal(du.day, p.d ?? 0, 'd');
		assert.equal(du.hour, p.h ?? 0, 'h');
		assert.equal(du.minute, p.i ?? 0, 'i');
		assert.equal(du.second, p.s ?? 0, 's');
		assert.equal(du.microsecond, p.us ?? 0, 'us');
	});
	tsts(`${dbug(p)}.toString`, () => {
		assert.equal(du.toString(), str);
	});
	tsts(`${dbug(p)}.toJSON`, () => {
		assert.equal(du.toJSON(), str);
	});
	tsts(`${dbug(p)}.toIso8601`, () => {
		assert.equal(du.toIso8601(), iso);
	});
}

//Fractional values rollup/down so we can't test compare the final components from parts
const newFracSet: [IDurationExactParts, string, string][] = [
	[{ d: 1.5 }, '1d12h', 'P1DT12H'],
	[{ d: 1.9 }, '1d21h36i', 'P1DT21H36M'],
	[{ d: 1.99 }, '1d23h45i36s', 'P1DT23H45M36S'],
	[{ d: 1.999 }, '1d23h58i33.600000s', 'P1DT23H58M33.600000S'],
	[{ d: 1.9999 }, '1d23h59i51.360000s', 'P1DT23H59M51.360000S'],
	[{ d: 1.99999 }, '1d23h59i59.136000s', 'P1DT23H59M59.136000S'],
	[{ d: 1.999999 }, '1d23h59i59.913600s', 'P1DT23H59M59.913600S'],
	[{ d: 1.9999999 }, '1d23h59i59.991360s', 'P1DT23H59M59.991360S'],
	[{ d: 1.99999999 }, '1d23h59i59.999136s', 'P1DT23H59M59.999136S'],
	[{ h: 1.5 }, '1h30i', 'PT1H30M'],
	[{ i: 1.5 }, '1i30s', 'PT1M30S'],
	[{ s: 1.5 }, '1.500000s', 'PT1.500000S'],
	[{ s: 1.1 }, '1.100000s', 'PT1.100000S'],
	[{ s: 1.01 }, '1.010000s', 'PT1.010000S'],
	[{ s: 1.001 }, '1.001000s', 'PT1.001000S'], //floating point error
	[{ us: 1.5 }, '0.000001s', 'PT0.000001S'], //us truncated (NOT rounded)
];
for (const [p, str, iso] of newFracSet) {
	const du = DurationExact.new(p);
	tsts(`${dbug(p)}.toString`, () => {
		assert.equal(du.toString(), str);
	});
	tsts(`${dbug(p)}.toIso8601`, () => {
		assert.equal(du.toIso8601(), iso);
	});
}

//Rollups oversize an element expecting it to roll into the elements above
const rollupSet: [IDurationExactParts, string, string][] = [
	[{ h: 3218809104 }, '134117046d', 'P134117046D'], //aka max
	[{ h: 24 }, '1d', 'P1D'],
	[{ i: 60 }, '1h', 'PT1H'],
	[{ s: 60 }, '1i', 'PT1M'],
	[{ us: 1000000 }, '1s', 'PT1S'],
];
for (const [p, str, iso] of rollupSet) {
	const du = DurationExact.new(p);
	tsts(`${dbug(p)}.toString`, () => {
		assert.equal(du.toString(), str);
	});
	tsts(`${dbug(p)}.toIso8601`, () => {
		assert.equal(du.toIso8601(), iso);
	});
}

const badNewSet: IDurationExactParts[] = [
	{ d: -1 },
	{ h: -1 },
	{ i: -1 },
	{ s: -1 },
	{ us: -1 },
	{ d: 134117047 }, //Exceeds allowed days
	//Exceeds max in combination:
	{ d: 134117046, us: 1 },
	{ d: 134117046, s: 1 },
	{ d: 134117046, i: 1 },
	{ d: 134117046, h: 1 },
	{ h: 3218809105 }, //=134117046d 1h
];
for (const parts of badNewSet) {
	tsts(`${dbug(parts)} throws`, () => {
		assert.throws(() => DurationExact.new(parts));
	});
}

const parseSet: [WindowStr, string][] = [
	[WindowStr.new('0s'), '0s'],
	[WindowStr.new('0S'), '0s'],
	[WindowStr.new('1s'), '1s'],
	[WindowStr.new('1i'), '1i'],
	[WindowStr.new('1I'), '1i'],
	[WindowStr.new('1h'), '1h'],
	[WindowStr.new('1H'), '1h'],
	[WindowStr.new('1d'), '1d'],
	[WindowStr.new('1D'), '1d'],
	[WindowStr.new('1D2H3I4S'), '1d2h3i4s'],
	[WindowStr.new('0.000001s'), '0.000001s'],
	[WindowStr.new('0.000001S'), '0.000001s'],
	[WindowStr.new('0.01S'), '0.010000s'],
	[WindowStr.new('0.1s'), '0.100000s'],
	[WindowStr.new('1d '), '1d'], //Trailing space consumed
	[WindowStr.new('\t1d '), '1d'],
	[WindowStr.new(' 1h 2i '), '1h2i'],
    [WindowStr.new(' 24h '),'1d'],
	//Fractional pieces ok
	[WindowStr.new('1.5d'), '1d12h'],
	[WindowStr.new('1.5h'), '1h30i'],
	[WindowStr.new('1.5i'), '1i30s'],
	[WindowStr.new('1.5s'), '1.500000s'],
];
for (const [w, str] of parseSet) {
	tsts(`parse(${w.debug()})`, () => {
		const du = DurationExact.parse(w);
		assert.equal(du.toString(), str);
	});
}

const badParseSet: WindowStr[] = [
	WindowStr.new('0'), //There's no units here
	WindowStr.new('1y'), //What's a y?
	WindowStr.new('1d!'), //Good until !
	WindowStr.new('1min'), //Good until `in`
	WindowStr.new('-1d'),
	WindowStr.new('134117047d'), //Too big
    WindowStr.new('134117046d1s'), //Too big
	WindowStr.new('1dh'), //There's no hours specified
	WindowStr.new('1d h'), //There's no hours specified
	WindowStr.new(' d h'), //There's nothing specified
	WindowStr.new('0Ad'), //How many days is 0a?
	WindowStr.new('0As'), //How many seconds is 0a?
];
for (const w of badParseSet) {
	tsts(`parse(${w.debug()}) throws`, () => {
		assert.throws(() => DurationExact.parse(w));
	});
}

tsts('[Symbol.toStringTag]', () => {
	const o = DurationExact.zero;
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('DurationExact') > 0, true);
});

tsts('util.inspect', () => {
	const o = DurationExact.zero;
	const u = util.inspect(o);
	assert.is(u.startsWith('DurationExact('), true);
});

const serSet: [IDurationExactParts, string, string, string][] = [
	[{ s: 0 }, '0s', '0000000000000000', '0'],
	[{ us: 1 }, '0.000001s', '0000000000000001', '0.000001'],
	[{ s: 1 }, '1s', '0000000000100000', '1'], //1<<20
	[{ i: 1 }, '1i', '0000000004000000', '1:00'], //1<<26
	[{ h: 1 }, '1h', '0000000100000000', '1:00:00'], //1<<32
	[{ h: 2.25 }, '2h15i', '000000023C000000', '2:15:00'], //2<<32 | 15<<26
	[{ d: 1 }, '1d', '0000002000000000', '24:00:00'], //1<<37
	[{ d: 3, s: 13 }, '3d13s', '0000006000D00000', '72:00:13'], //3<<27 | 13<<20
	[{ d: 3, h: 5, i: 7, s: 13 }, '3d5h7i13s', '000000651CD00000', '77:07:13'], //3<<27 | 5<<32 | 7<<26 | 13<<20
];
const bytes=new Uint8Array(Math.ceil(DurationExact.serialBits / 8));
for (const [parts, str, ser, timeLike] of serSet) {
	const du = DurationExact.new(parts);
	tsts(`(${du}).toString()`, () => {
		assert.is(du.toString(), str);
	});

	tsts(`(${du}).ser()`, () => {
		const bw=BitWriter.mount(bytes);
		du.serialize(bw);
		assert.is(hex.fromBytes(bytes), ser);
	});

	tsts(`deser(${ser})`, () => {
		const bytes = hex.toBytes(ser);
		const br = BitReader.mount(bytes);
		const du2 = DurationExact.deserialize(br).validate();
		assert.is(du2.toString(), str);
	});

	tsts(`toTimeLike(${du})`, () => {
		assert.is(du.toTimeLike(), timeLike);
	});

	tsts(`fromTimeLike(${timeLike})`, () => {
		const du2 = DurationExact.fromTimeLike(timeLike); //.validate();
		assert.is(du2.toString(), str);
	});
}

const badDeserSet:string[]=[
    'FFFFFFFFFFFFFFFF',
    'FFCED6C000000001',//134117046d0.000001s
];
for(const ser of badDeserSet) {
    const bytes=hex.toBytes(ser);
	const br = BitReader.mount(bytes);
    assert.throws(()=>DurationExact.deserialize(br).validate());
}

tsts(`toTimeLike(501h) caps at 500h`, () => {
	//Because this is only one way (501h will cap at 500) we can't include in serSer
	const du = DurationExact.new({ h: 501 });
	assert.is(du.toTimeLike(), '500:00:00');
});

const badFromTimeLikeSet: string[] = [
	//Parse constraints:
	'100', //Too large for seconds
	'100:1', //Too large for minutes
	'501:0:0', //Too large for hours
	//Number.toFloat/toInteger would consider 1a=1
	'1a', //Not a valid int
	'1a:1', //""
	'1a:1:1', //""
	//Just bad inputs:
	'1:::1', //That's an IP mate
	'1 hour',
];
for (const str of badFromTimeLikeSet) {
	tsts(`fromTimeLike(${str}) throws`, () => {
		assert.throws(() => DurationExact.fromTimeLike(str));
	});
}

tsts('serialSizeBits', () => {
	const o = DurationExact.zero;
	const bits = o.serialSizeBits;
	assert.is(bits > 0 && bits <= 64, true); //Make sure it fits in 64 bits
});

const fromUsSet: [number, string][] = [
	[0, '0s'],
	[1e6, '1s'],
	[60e6, '1i'],
	[9007199254740991, '104249d23h47i34.740991s'], //max safe int
	[1.1e19, '127314814d19h33i20s'], // 11,000,000,000,000,000,000 / usPerD = 127,314,814d
	//max days = 11,596,411,612,800,000,000 us
];
for (const [us, str] of fromUsSet) {
	tsts(`fromUs(${us})`, () => {
		const du = DurationExact.fromUs(us);
		assert.equal(du.toString(), str);
	});
}
const badFromUsSet: number[] = [
	-1, //negative
	-1e6, //negative
	1.2e19, //> max days
];
for (const us of badFromUsSet) {
	tsts(`fromUs(${us}) throws`, () => {
		assert.throws(() => DurationExact.fromUs(us));
	});
}

tsts(`(4e7h 1u) loses precision`, () => {
	const du = DurationExact.new({ h: 4e7, us: 1 });
	assert.equal(du.toString(), '1666666d16h'); //the us was lost
});

const addSet: [DurationExact, DurationExact, string][] = [
	[DurationExact.new({ d: 1 }), DurationExact.new({ i: 1 }), '1d1i'],
	[DurationExact.new({ d: 1 }), DurationExact.zero, '1d'],
	[DurationExact.new({ s: 1 }), DurationExact.new({ h: 1 }), '1h1s'],
	[DurationExact.new({ us: 13 }), DurationExact.new({ us: 7 }), '0.000020s'],
	[
		DurationExact.max,
		DurationExact.new({ d: 3 }),
		DurationExact.max.toString(),
	],
	[
		DurationExact.max,
		DurationExact.new({ i: 3 }),
		DurationExact.max.toString(),
	],
	[
		DurationExact.max,
		DurationExact.new({ us: 1 }),
		DurationExact.max.toString(),
	],
    [DurationExact.new({i:59}),DurationExact.new({i:1}),'1h'],
];
for (const [a, b, str] of addSet) {
	tsts(`${a}+${b}=${str}`, () => {
		const c = a.add(b);
		assert.equal(c.toString(), str);
	});
}

const subSet: [DurationExact, DurationExact, string][] = [
	[DurationExact.new({ d: 1 }), DurationExact.new({ h: 1 }), '23h'],
	[DurationExact.new({ d: 1 }), DurationExact.new({ h: 25 }), '0s'],
	[DurationExact.new({ h: 1 }), DurationExact.new({ i: 1 }), '59i'],
	[DurationExact.new({ s: 1 }), DurationExact.new({ us: 100000 }), '0.900000s'],
];
for (const [a, b, str] of subSet) {
	tsts(`${a}-${b}=${str}`, () => {
		const c = a.sub(b);
		assert.equal(c.toString(), str);
	});
}

const gtSet: [DurationExact, DurationExact][] = [
	[DurationExact.new({ d: 1 }), DurationExact.new({ h: 1 })],
	[DurationExact.new({ i: 1 }), DurationExact.new({ s: 1 })],
	[DurationExact.new({ h: 1 }), DurationExact.new({ us: 1 })],
	[DurationExact.new({ d: 1, us: 1 }), DurationExact.new({ d: 1 })],
];
for (const [a, b] of gtSet) {
	tsts(`${a}>${b}`, () => {
		assert.equal(a.gt(b), true);
	});
	tsts(`${b}<${a}`, () => {
		assert.equal(b.gt(a), false);
	});
}

const notGtSet: [DurationExact, DurationExact][] = [
	[DurationExact.zero, DurationExact.max],
	[DurationExact.zero, DurationExact.zero],
];
for (const [a, b] of notGtSet) {
	tsts(`! ${a}>${b}`, () => {
		assert.equal(a.gt(b), false);
	});
}

tsts.run();
