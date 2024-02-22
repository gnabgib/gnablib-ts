import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Duration, DurationExact } from '../../src/datetime/Duration';
import { IDurationParts } from '../../src/datetime/interfaces/IDurationParts';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';

const tsts = suite('Duration');

function dbug(p: IDurationParts): string {
	return `(${p.y ?? 0} ${p.m ?? 0} ${p.d ?? 0} ${p.h ?? 0} ${p.i ?? 0} ${
		p.s ?? 0
	} ${p.us ?? 0})`;
}

tsts(`zero`, () => {
	const du = Duration.zero;
	assert.equal(du.toString(), '0s');
	assert.equal(du.toIso8601(), 'P0D');
});
tsts(`max`, () => {
	const du = Duration.max;
	assert.equal(du.toString(), '367200y');
	assert.equal(du.toIso8601(), 'P367200Y');
});

const newSet: [IDurationParts, string, string][] = [
	[{}, '0s', 'P0D'],
	[{ y: 1 }, '1y', 'P1Y'],
	[{ m: 1 }, '1m', 'P1M'],
	[{ d: 1 }, '1d', 'P1D'],
	[{ h: 1 }, '1h', 'PT1H'],
	[{ i: 1 }, '1i', 'PT1M'],
	[{ s: 1 }, '1s', 'PT1S'],
	[{ us: 1 }, '0.000001s', 'PT0.000001S'],
	[{ y: 1, m: 3, d: 5 }, '1y3m5d', 'P1Y3M5D'],
	[{ y: 3, m: 5, d: 7 }, '3y5m7d', 'P3Y5M7D'],
	[
		{ y: 3, m: 5, d: 7, h: 11, i: 13, s: 17, us: 19 },
		'3y5m7d11h13i17.000019s',
		'P3Y5M7DT11H13M17.000019S',
	],
];
for (const [p, str, iso] of newSet) {
	const du = Duration.new(p);
	tsts(`${dbug(p)}`, () => {
		assert.equal(du.year, p.y ?? 0, 'y');
		assert.equal(du.month, p.m ?? 0, 'm');
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

const newFracSet: [IDurationParts, string, string][] = [
	[{ y: 1.5 }, '1y6m', 'P1Y6M'],
	[{ m: 1.5 }, '1.5m', 'P1.5M'],
	[{ d: 1.5 }, '1d12h', 'P1DT12H'],
	[{ d: 1.9 }, '1d21h36i', 'P1DT21H36M'],
	[{ d: 1.99 }, '1d23h45i36s', 'P1DT23H45M36S'],
	[{ h: 1.5 }, '1h30i', 'PT1H30M'],
	[{ i: 1.5 }, '1i30s', 'PT1M30S'],
	[{ s: 1.5 }, '1.500000s', 'PT1.500000S'],
	[{ s: 1.1 }, '1.100000s', 'PT1.100000S'],
	[{ s: 1.01 }, '1.010000s', 'PT1.010000S'],
	[{ s: 1.001 }, '1.001000s', 'PT1.001000S'], //floating point error
	[{ us: 1.5 }, '0.000001s', 'PT0.000001S'], //us truncated (NOT rounded)
];
for (const [p, str, iso] of newFracSet) {
	const du = Duration.new(p);
	tsts(`${dbug(p)}.toString`, () => {
		assert.equal(du.toString(), str);
	});
	tsts(`${dbug(p)}.toIso8601`, () => {
		assert.equal(du.toIso8601(), iso);
	});
}

const rollupSet: [IDurationParts, string, string][] = [
	//max values in various units:
	[{ m: 4406400 }, '367200y', 'P367200Y'],
	[{ d: 134117046 }, '367200y', 'P367200Y'],
	[{ h: 3218809104 }, '367200y', 'P367200Y'],
	[{ m: 13 }, '1y1m', 'P1Y1M'],
	[{ d: 146098 }, '400y1d', 'P400Y1D'],
	[{ h: 24 }, '1d', 'P1D'],
	[{ i: 60 }, '1h', 'PT1H'],
	[{ s: 60 }, '1i', 'PT1M'],
	[{ us: 1000000 }, '1s', 'PT1S'],
];
for (const [p, str, iso] of rollupSet) {
	const du = Duration.new(p);
	tsts(`${dbug(p)}.toString`, () => {
		assert.equal(du.toString(), str);
	});
	tsts(`${dbug(p)}.toIso8601`, () => {
		assert.equal(du.toIso8601(), iso);
	});
}

const badNewSet: IDurationParts[] = [
	{ y: -1 },
	{ m: -1 },
	{ d: -1 },
	{ h: -1 },
	{ i: -1 },
	{ s: -1 },
	{ us: -1 },
	//Exceed max
	{ y: 367201 },
	{ m: 4406401 },
	{ d: 134117047 },
	{ h: 3218809105 },
	//Exceed max in combo
	{ y: 367200, us: 1 },
	{ y: 367200, s: 1 },
	{ y: 367200, i: 1 },
	{ y: 367200, h: 1 },
	{ y: 367200, d: 1 },
	{ y: 367200, m: 1 },
	{ d: 134117046, us: 1 },
	{ d: 134117046, s: 1 },
	{ d: 134117046, i: 1 },
	{ d: 134117046, h: 1 },
	{ d: 134117046, m: 1 },
	{ d: 134117046, y: 1 },
];
for (const parts of badNewSet) {
	tsts(`${dbug(parts)} throws`, () => {
		assert.throws(() => Duration.new(parts));
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
	[WindowStr.new('\t1d '), '1d'], //Whitespace consumed
	[WindowStr.new(' 1h 2i '), '1h2i'], //Whitespace consumed
	[WindowStr.new('1y'), '1y'],
	//Fractional pieces ok
	[WindowStr.new('1.5y'), '1y6m'],
	[WindowStr.new('1.5m'), '1.5m'],
	//[WindowStr.new('1.5d'), '1d12h'],
	[WindowStr.new('1.5h'), '1h30i'],
	[WindowStr.new('1.5i'), '1i30s'],
	[WindowStr.new('1.5s'), '1.500000s'],
];
for (const [w, str] of parseSet) {
	tsts(`parse(${w.debug()})`, () => {
		const du = Duration.parse(w);
		assert.equal(du.toString(), str);
	});
}

const badParseSet: WindowStr[] = [
	WindowStr.new('0'), //There's no units here
	WindowStr.new('1d!'), //Good until !
	WindowStr.new('1min'), //Good until `in`
	WindowStr.new('-1d'),
	WindowStr.new('134117047d'), //Too big
	WindowStr.new('367201y'), //Too big
	WindowStr.new('1dh'), //There's no hours specified
	WindowStr.new('1d h'), //There's no hours specified
	WindowStr.new(' d h'), //There's nothing specified
	WindowStr.new('0Ad'), //How many days is 0a?
	WindowStr.new('0Ay'), //How many years is 0a?
	WindowStr.new('0Am'), //How many months is 0a?
	WindowStr.new('4409617m'), //Exceeds max
];
for (const w of badParseSet) {
	tsts(`parse(${w.debug()}) throws`, () => {
		assert.throws(() => Duration.parse(w));
	});
}

//console.log(Duration.parse(WindowStr.new('134363824d')))

tsts('[Symbol.toStringTag]', () => {
	const o = Duration.zero;
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Duration') > 0, true);
});

tsts('util.inspect', () => {
	const o = Duration.zero;
	const u = util.inspect(o);
	assert.is(u.startsWith('Duration('), true);
});

const serSet: [IDurationParts, string, string][] = [
	[{ s: 0 }, '0s', '0000000000000000000000'],
	[{ us: 1 }, '0.000001s', '0000000000000000000001'],
	[{ s: 1 }, '1s', '0000000000000000100000'], //1<<20
	[{ i: 1 }, '1i', '0000000000000004000000'], //1<<26
	[{ h: 1 }, '1h', '0000000000000100000000'], //1<<32
	[{ h: 2.25 }, '2h15i', '000000000000023C000000'], //2<<32 | 15<<26
	[{ d: 1 }, '1d', '0000000000002000000000'], //1<<37
	[{ d: 3, s: 13 }, '3d13s', '0000000000006000D00000'], //3<<27 | 13<<20
	[{ d: 3, h: 5, i: 7, s: 13 }, '3d5h7i13s', '000000000000651CD00000'], //3<<27 | 5<<32 | 7<<26 | 13<<20
	[{ m: 2 }, '2m', '000005A000000000000000'],
	[{ y: 2 }, '2y', '0000438000000000000000'],
];
for (const [parts, str, ser] of serSet) {
	const du = Duration.new(parts);
	tsts(`(${du}).toString()`, () => {
		assert.is(du.toString(), str);
	});
	tsts(`(${du}).ser()`, () => {
		var bw = new BitWriter(Math.ceil(Duration.serialBits / 8));
		du.serialize(bw);
		assert.is(hex.fromBytes(bw.getBytes()), ser);
	});

	tsts(`deser(${ser})`, () => {
		const bytes = hex.toBytes(ser);
		const br = new BitReader(bytes);
		const du2 = Duration.deserialize(br).validate();
		assert.is(du2.toString(), str);
	});
}

const toTimeLikeSet:[IDurationParts,string][]=[
    [{s:0},'0'],
    [{s:1},'1'],
    [{i:1},'1:00'],
    [{h:1},'1:00:00'],
    [{d:1},'24:00:00'],
    //Exact max:
    [{h:500},'500:00:00'],
    [{d:20,h:20},'500:00:00'],
    //Capped values
    [{h:501},'500:00:00'],
    [{d:21},'500:00:00'],
    [{m:1},'500:00:00'],
    [{y:1},'500:00:00'],
];
for(const [parts,timeLike] of toTimeLikeSet) {
    const du=Duration.new(parts);
    tsts(`toTimeLike(${du})`,()=>{
        assert.is(du.toTimeLike(),timeLike);
    })
}

const gtSet: [Duration, Duration][] = [
	[Duration.new({ d: 1 }), Duration.new({ h: 1 })],
	[Duration.new({ i: 1 }), Duration.new({ s: 1 })],
	[Duration.new({ h: 1 }), Duration.new({ us: 1 })],
	[Duration.new({ d: 1, us: 1 }), Duration.new({ d: 1 })],
    //Note: The gt test compares each aspect without rollup, so while
    // 1y60d is certainly longer than 1y1m, we can't convert m<->d without
    // making assumptions about month-length.
    //A more ambiguous case: 1y30d is sometimes <1y1m but sometimes = and sometimes >
    [Duration.new({ y: 1, m: 1 }), Duration.new({ y: 1 })],
];
for (const [a, b] of gtSet) {
	tsts(`${a}>${b}`, () => {
		assert.equal(a.gt(b), true);
	});
	tsts(`${b}<${a}`, () => {
		assert.equal(b.gt(a), false);
	});
}

const addDurationSet:[Duration,Duration,string][]=[
	
	[Duration.new({d:1}),Duration.new({d:1}),'2d'],
	[Duration.new({d:1}),Duration.new({m:1}),'1m1d'],
	[Duration.new({y:1}),Duration.new({d:1}),'1y1d'],
	[Duration.new({y:1}),Duration.new({h:25}),'1y1d1h'],
	[Duration.new({ y: 3, m: 5, d: 7, h: 11, i: 13, s: 17, us: 19 }),Duration.zero,'3y5m7d11h13i17.000019s'],
	[Duration.max,Duration.new({us:1}),'367200y'],
	[Duration.max,Duration.new({s:1}),'367200y'],
	[Duration.max,Duration.new({i:1}),'367200y'],
	[Duration.max,Duration.new({h:1}),'367200y'],
	[Duration.max,Duration.new({d:1}),'367200y'],
	[Duration.max,Duration.new({m:1}),'367200y'],
	[Duration.max,Duration.new({y:1}),'367200y'],
	//Transition boundaries
	[Duration.new({i:59}),Duration.new({i:1}),'1h'],
	[Duration.new({i:59}),Duration.new({s:61}),'1h1s'],
	[Duration.new({d:146096}),Duration.new({d:1}),'400y'],
	[Duration.new({d:146096}),Duration.new({d:2}),'400y1d'],
];
for(const [a,b,str] of addDurationSet) {
	tsts(`${a}+${b}=${str}`, () => {
		const c = a.add(b);
		assert.equal(c.toString(), str);
	});	
}

const addDurationExactSet:[Duration,DurationExact,string][]=[
	[Duration.new({d:1}),DurationExact.new({d:1}),'2d'],
	[Duration.new({y:1}),DurationExact.new({d:1}),'1y1d'],
	[Duration.new({y:1}),DurationExact.new({h:25}),'1y1d1h'],
	[Duration.new({ y: 3, m: 5, d: 7, h: 11, i: 13, s: 17, us: 19 }),DurationExact.zero,'3y5m7d11h13i17.000019s'],
	[Duration.max,DurationExact.new({us:1}),'367200y'],
	[Duration.max,DurationExact.new({s:1}),'367200y'],
	[Duration.max,DurationExact.new({i:1}),'367200y'],
	[Duration.max,DurationExact.new({h:1}),'367200y'],
	[Duration.max,DurationExact.new({d:1}),'367200y'],
];
for(const [a,b,str] of addDurationExactSet) {
	tsts(`${a}+${b}=${str}`, () => {
		const c = a.add(b);
		assert.equal(c.toString(), str);
	});	
}

const subDurationSet:[Duration,Duration,string][]=[
	[Duration.new({d:1}),Duration.new({d:1}),'0s'],
	[Duration.new({d:1}),Duration.new({h:1}),'23h'],
	[Duration.new({m:13}),Duration.new({y:1}),'1m'],
	//Without a context, moving between y-m and d-h-i-s is impossible.. so zero
	[Duration.new({m:1}),Duration.new({d:1}),'0s'],
	[Duration.new({m:1}),Duration.new({h:1}),'0s'],
	[Duration.new({m:1}),Duration.new({i:1}),'0s'],
	[Duration.new({m:1}),Duration.new({s:1}),'0s'],
	[Duration.new({m:1}),Duration.new({us:1}),'0s'],
];
for(const [a,b,str] of subDurationSet) {
	tsts(`${a}-${b}=${str}`, () => {
		const c = a.sub(b);
		assert.equal(c.toString(), str);
	});	
}

const subDurationExactSet:[Duration,DurationExact,string][]=[
	[Duration.new({d:1}),DurationExact.new({d:1}),'0s'],
	[Duration.new({d:1}),DurationExact.new({h:1}),'23h'],
];
for(const [a,b,str] of subDurationExactSet) {
	tsts(`${a}-${b}=${str}`, () => {
		const c = a.sub(b);
		assert.equal(c.toString(), str);
	});	
}

tsts('coverage', () => {
	const d = Duration.zero;
	assert.equal(d.serialSizeBits, 88);
    assert.equal(Duration.zero.gt(Duration.zero),false);
});

tsts.run();
