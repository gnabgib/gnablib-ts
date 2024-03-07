import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { DateTimeUtc } from '../../src/datetime/dt';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';
import { IDurationExactParts, IDurationParts } from '../../src/datetime/interfaces/IDurationParts';
import { Duration, DurationExact } from '../../src/datetime/Duration';

const tsts = suite('DateTimeUtc');

interface dtParts {
	y: number;
	m: number;
	d: number;
	h: number;
	i: number;
	s: number;
	us: number;
}

const serSet: [dtParts, string, string, string][] = [
	[
		//min
		{ y: -10000, m: 1, d: 1, h: 0, i: 0, s: 0, us: 0 },
		'-10000-01-01T00:00:00.000000Z',
		'0000000000000000',
		'"-10000-01-01T00:00:00.000000"',
	],
	[
		{ y: 2024, m: 1, d: 14, h: 11, i: 41, s: 7, us: 543271 },
		'2024-01-14T11:41:07.543271Z',
		'5DF00D5D23C25138',
		'"2024-01-14T11:41:07.543271"',
	],
	[
		//max
		{ y: 22767, m: 12, d: 31, h: 23, i: 59, s: 59, us: 999999 },
		'+22767-12-31T23:59:59.999999Z',
		'FFFF7EBF7DFA11F8',
		'"+22767-12-31T23:59:59.999999"',
	],
];
for (const [o, str, serStr, jsonStr] of serSet) {
	//Note! Because DateOnly fits in 24bits, DateTime.ser = DateOnly.ser + TimeOnly.ser
	// we could use sub types inside DateTime, but then the individual components would
	// be nested (eg You can access `DateTime.Year`, vs `DateTime.Date.Year`)
	const d = DateTimeUtc.new(o.y, o.m, o.d, o.h, o.i, o.s, o.us);
	tsts(`toString(${str})`, () => {
		assert.is(d.toString(), str);
	});
	tsts(`ser(${str})`, () => {
		var bw = new BitWriter(Math.ceil(DateTimeUtc.serialBits / 8));
		d.serialize(bw);
		assert.is(hex.fromBytes(bw.getBytes()), serStr);
	});
	tsts(`deser(${serStr})`, () => {
		const bytes = hex.toBytes(serStr);
		const br = new BitReader(bytes);
		const deser = DateTimeUtc.deserialize(br).validate();
		assert.is(deser.toString(), str);
	});
	tsts(`toJSON(${str})`, () => {
		const json = JSON.stringify(d);
		assert.equal(json, jsonStr);
	});
}

tsts(`deser with invalid source value (FFFFFFFFFFFFFFFFFF) throws`, () => {
	const bytes = Uint8Array.of(0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff);
	const br = new BitReader(bytes);
	assert.throws(() => DateTimeUtc.deserialize(br).validate());
});
tsts(`deser without source data throws`, () => {
	const bytes = new Uint8Array();
	const br = new BitReader(bytes);
	assert.throws(() => DateTimeUtc.deserialize(br).validate());
});

tsts(`new`, () => {
	const d = DateTimeUtc.new(2000, 1, 2, 11, 41, 6, 12345);
	assert.is(d.toString(), '2000-01-02T11:41:06.012345Z');
	assert.is(d.year, 2000, 'year');
	assert.is(d.hour, 11, 'hour');
	assert.is(d.microsecond, 12345, 'microsecond');
	//ValueOf puts all numbers together without delimiters
	assert.is(d.valueOf(), '20000102114106012345');
});

{
	//For anywhere that isn't offset=0, one of these would
	// fail if the offset isn't being compensated for
	const y = 2024;
	const m = 2;
	const d = 4;
	const i = 6;
	const s = 7;
	const ms = 789;
	for (let h = 0; h < 24; h++) {
		const dt = new Date(y, m - 1, d, h, i, s, ms);
		tsts(`fromDate(${dt})`, () => {
			const dto = DateTimeUtc.fromDate(dt);
			assert.is(dto.year, y, 'y');
			assert.is(dto.month, m, 'mo');
			assert.is(dto.day, d, 'd');
			assert.is(dto.hour, h, 'h');
			assert.is(dto.minute, i, 'mi');
			assert.is(dto.second, s, 's');
			assert.is(dto.microsecond, ms * 1000, 'microsecond');
		});
		tsts(`toDate(${dt})`, () => {
			const dto = DateTimeUtc.new(y, m, d, h, i, s, ms * 1000);
			const dateO = dto.toDate();
			assert.is(dateO.getUTCFullYear(), y, 'y');
			assert.is(dateO.getUTCMonth() + 1 /*because, that makes sense*/, m, 'mo');
			assert.is(dateO.getUTCDate(), d, 'd');
			assert.is(dateO.getUTCHours(), h, 'h');
			assert.is(dateO.getUTCMinutes(), i, 'mi');
			assert.is(dateO.getUTCSeconds(), s, 's');
			assert.is(dateO.getUTCMilliseconds(), ms, 'ms');
		});
	}
}

const fromUnixTimeMsSet: [number, string][] = [
	//2024-01-20 07:13:30.542
	[1705734810542, '2024-01-20T07:13:30.542000Z'],
	//2024-01-20 07:13:30.542789
	[1705734810542.789, '2024-01-20T07:13:30.542789Z'],
];
for (const [epoch, expect] of fromUnixTimeMsSet) {
	tsts(`fromUnixTimeMs(${epoch})`, () => {
		const e = DateTimeUtc.fromUnixTimeMs(epoch);
		assert.is(e.toString(), expect);
	});
}

const unixTimeSet: [dtParts, number, number, string][] = [
	[
		{ y: 2024, m: 1, d: 20, h: 7, i: 13, s: 30, us: 0 },
		1705734810,
		1705734810000,
		'2024-01-20T07:13:30.000000Z',
	],
	[
		{ y: 2024, m: 1, d: 20, h: 7, i: 13, s: 30, us: 534000 },
		1705734810.534,
		1705734810534,
		'2024-01-20T07:13:30.534000Z',
	],
	[
		{ y: 2024, m: 1, d: 20, h: 7, i: 13, s: 30, us: 542000 },
		1705734810.542,
		1705734810542,
		'2024-01-20T07:13:30.542000Z',
	],
	[
		{ y: 2024, m: 1, d: 20, h: 7, i: 13, s: 30, us: 542789 },
		1705734810.542789,
		1705734810542.789,
		'2024-01-20T07:13:30.542789Z',
	],
];
for (const [o, epoch, epochMs, str] of unixTimeSet) {
	const dt = DateTimeUtc.new(o.y, o.m, o.d, o.h, o.i, o.s, o.us);
	tsts(`toString(${str})`, () => {
		assert.is(dt.toString(), str);
	});
	tsts(`toUnixTime(${str})`, () => {
		assert.is(dt.toUnixTime(), epoch);
	});
	tsts(`toUnixTimeMs(${str})`, () => {
		assert.is(dt.toUnixTimeMs(), epochMs);
	});
	tsts(`fromUnixTime(${epoch})`, () => {
		const fr = DateTimeUtc.fromUnixTime(epoch);
		assert.is(fr.toString(), str);
	});
	tsts(`fromUnixTimeMs(${epochMs})`, () => {
		const fr = DateTimeUtc.fromUnixTimeMs(epochMs);
		assert.is(fr.toString(), str);
	});
}

tsts(`now`, () => {
	const dt = new Date();
	const d = DateTimeUtc.now();
	//This isn't a great test, but let's use a date object to compare
	//Could fail NYE/midnight
	assert.is(d.year, dt.getUTCFullYear());
	//Could fail end of month/midnight
	assert.is(d.month, dt.getUTCMonth() + 1); //JS stores months off by 1 (0=Jan)
	//Could fail midnight
	assert.is(d.day, dt.getUTCDate()); //Not a great name, JS
	//Could fail end of hour
	assert.is(d.hour, dt.getUTCHours(), 'hour');

	//The rest are too risky, so just range check
	const mNum = d.minute;
	assert.is(mNum >= 0 && mNum <= 59, true, 'Minute in range');
	const sNum = d.second;
	assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
	const usNum = d.microsecond;
	assert.is(usNum >= 0 && usNum <= 999999, true, 'In valid range');
});

tsts('[Symbol.toStringTag]', () => {
	const o = DateTimeUtc.min;
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('DateTimeUtc') > 0, true);
});

tsts('util.inspect', () => {
	const o = DateTimeUtc.min;
	const u = util.inspect(o);
	assert.is(u.startsWith('DateTimeUtc('), true);
});

tsts('serialSizeBits', () => {
	const o = DateTimeUtc.min;
	const bits = o.serialSizeBits;
	assert.is(bits > 0 && bits < 64, true); //Make sure it fits in 64 bits
});

tsts(`min`, () => {
	const dto = DateTimeUtc.min;
	assert.is(dto.valueOf(), '-100000101000000000000');
});
tsts(`max`, () => {
	const dto = DateTimeUtc.max;
	assert.is(dto.valueOf(), '+227671231235959999999');
});

const fromValueSet:string[]=[
    '20230131020304567890'
];
for(const sVal of fromValueSet) {
	tsts(`fromValue(${sVal})`, () => {
		const dto = DateTimeUtc.fromValue(sVal);
        assert.equal(dto.valueOf(),sVal);
	});    
}

const addDeSet:[string,IDurationExactParts,string][]=[
	['20230131'+'020304567890', {d:1}, '20230201020304567890'],
	['20230131'+'020304567890', {h:1}, '20230131030304567890'],
	['20230131'+'020304567890', {h:22}, '20230201000304567890'],
	['20230131'+'020304567890', {i:1}, '20230131020404567890'],
	['20230131'+'020304567890', {i:57}, '20230131030004567890'],
	['20230131'+'020304567890', {s:1}, '20230131020305567890'],
	['20230131'+'020304567890', {s:56}, '20230131020400567890'],
	['20230131'+'020304567890', {us:1}, '20230131020304567891'],
	['20230131'+'020304567890', {us:432110}, '20230131020305000000'],
	['20000101'+'010203456789',{d:1000},'20020927010203456789'],
	['20000101'+'010203456789',{i:59},'20000101020103456789'],
];
for (const [sVal, duParts, expect] of addDeSet) {
	const dto = DateTimeUtc.fromValue(sVal);
	const du=DurationExact.new(duParts);
	tsts(`(${dto}).add(${du})`, () => {
		assert.is(dto.add(du).valueOf(), expect);
	});
}

const addDvSet:[string,IDurationParts,string][]=[
	['20240229'+'020304567890', {y:1}, '20250228020304567890'],
	['20240229'+'020304567890', {y:4}, '20280229020304567890'],
	['20240229'+'020304567890', {m:1}, '20240329020304567890'],
	['20240131'+'020304567890', {m:1}, '20240229020304567890'],
	['20230131'+'020304567890', {m:1,d:1}, '20230301020304567890'],
	['20240131'+'020304567890', {m:1,d:1}, '20240301020304567890'],
	['20240501'+'020304567890', {m:1.5}, '20240616020304567890'],// 50% of June's 30d = 15d
	['20240101'+'020304567890', {m:1.5}, '20240215020304567890'],
	['20240131'+'020304567890', {m:1.5}, '20240314020304567890'],// +1m=feb, 50%*29d = 14d
	['20230131'+'020304567890', {m:1}, '20230228020304567890'],
	['20230131'+'020304567890', {y:1}, '20240131020304567890'],
	['20230131'+'230000000000', {h:1}, '20230201000000000000'],
	['20230131'+'230000000000', {m:1,h:1}, '20230301000000000000'],
	['20240131'+'230000000000', {m:1,h:1}, '20240301000000000000'],
	['20000101'+'010203456789',{d:1000},'20020927010203456789'],
	['20000101'+'010203456789',{i:59},'20000101020103456789'],
];
for (const [sVal,duParts,expect] of addDvSet) {
	const dto = DateTimeUtc.fromValue(sVal);
	const du=Duration.new(duParts);
	tsts(`(${dto}).add(${du})`, () => {
		assert.is(dto.add(du).valueOf(), expect);
	});
}

const subDeSet:[string,IDurationExactParts,string][]=[
	['20230131'+'020304567890', {d:1}, '20230130'+'020304567890'],
	['20230131'+'020304567890', {h:1}, '20230131'+'010304567890'],
	['20230131'+'020304567890', {h:22}, '20230130'+'040304567890'],
	['20230131'+'020304567890', {i:1}, '20230131'+'020204567890'],
	['20230131'+'020304567890', {i:57}, '20230131'+'010604567890'],
	['20230131'+'020304567890', {s:1}, '20230131'+'020303567890'],
	['20230131'+'020304567890', {s:56}, '20230131'+'020208567890'],
	['20230131'+'020304567890', {us:1}, '20230131'+'020304567889'],
	['20230131'+'020304567890', {us:432110}, '20230131'+'020304135780'],
	['20000101'+'010203456789',{d:1000},'19970406'+'010203456789'],
	['20000101'+'010203456789',{i:59},'20000101'+'000303456789'],
];
for (const [sVal, duParts, expect] of subDeSet) {
	const dto = DateTimeUtc.fromValue(sVal);
	const du=DurationExact.new(duParts);
	tsts(`(${dto}).sub(${du})`, () => {
		assert.is(dto.sub(du).valueOf(), expect);
	});
}

const subDvSet:[string,IDurationParts,string][]=[
	['20240229'+'020304567890', {y:1}, '20230228'+'020304567890'],
	['20240229'+'020304567890', {y:4}, '20200229'+'020304567890'],
	['20240229'+'020304567890', {m:1}, '20240129'+'020304567890'],
	['20240131'+'020304567890', {m:1}, '20231231'+'020304567890'],
	['20240331'+'020304567890', {m:1}, '20240229'+'020304567890'],
	['20230331'+'020304567890', {m:1}, '20230228'+'020304567890'],
	['20230131'+'020304567890', {m:1,d:1}, '20221230'+'020304567890'],
	['20240501'+'020304567890', {m:1.5}, '20240317'+'020304567890'],// 50% of April's 30d = 15d
	['20240101'+'020304567890', {m:1.5}, '20231116'+'020304567890'],
	['20240331'+'020304567890', {m:1.5}, '20240215'+'020304567890'],// -1m=feb, 50%*29d = 14d
	['20230331'+'020304567890', {m:1.5}, '20230214'+'020304567890'],// -1m=feb, 50%*29d = 14d
	['20230331'+'020304567890', {m:1}, '20230228'+'020304567890'],
	['20230131'+'020304567890', {y:1}, '20220131'+'020304567890'],
	['20230131'+'005900000000', {h:1}, '20230130'+'235900000000'],
	['20230101'+'000000000000', {m:1,h:1}, '20221130'+'230000000000'],
	['20230301'+'000000000000', {m:1,h:1}, '20230131'+'230000000000'],
	['20240301'+'000000000000', {m:1,h:1}, '20240131'+'230000000000'],
	['20000101'+'010203456789',{d:1000},'19970406'+'010203456789'],
	['20000101'+'010203456789',{i:59},'20000101'+'000303456789'],
	['20000101'+'010203456789',{y:2000},'00000101'+'010203456789'],
	['20000101'+'010203456789',{y:2001},'-00010101'+'010203456789'],
	['20240131'+'010203456789',{m:0.5},'20240116'+'010203456789'],
	['20240131'+'010203456789',{m:1},'20231231'+'010203456789'],
];
for (const [sVal,duParts,expect] of subDvSet) {
	const dto = DateTimeUtc.fromValue(sVal);
	const du=Duration.new(duParts);
	tsts(`(${dto}).sub(${du})`, () => {
		assert.is(dto.sub(du).valueOf(), expect);
	});
}

const eqSet:[string,string][]=[
	['20240228'+'020304567890','20240228'+'020304567890'],
];
const gtSet:[string,string][]=[
	['20250228'+'020304567890','20240228'+'020304567890'],//1y
	['20240328'+'020304567890','20240228'+'020304567890'],//1m
	['20240229'+'020304567890','20240228'+'020304567890'],//1d
	['20240228'+'030304567890','20240228'+'020304567890'],//1h
	['20240228'+'020404567890','20240228'+'020304567890'],//1i
	['20240228'+'020305567890','20240228'+'020304567890'],//1s
	['20240228'+'020304667890','20240228'+'020304567890'],
	['20240228'+'020304568890','20240228'+'020304567890'],
	['20240228'+'020304567891','20240228'+'020304567890'],
];
for(const [a,b] of eqSet) {
	const dta=DateTimeUtc.fromValue(a);
	const dtb=DateTimeUtc.fromValue(b);
	tsts(`! ${dta}>${dtb}`, () => {
		assert.is(dta.gt(dtb),false);
	});
	tsts(`${dta}>=${dtb}`, () => {
		assert.is(dta.gte(dtb),true);
	});
	tsts(`! ${dta}<${dtb}`, () => {
		assert.is(dta.lt(dtb),false);
	});
	tsts(`${dta}<=${dtb}`, () => {
		assert.is(dta.lte(dtb),true);
	});
	tsts(`${dta}==${dtb}`, () => {
		assert.is(dta.eq(dtb),true);
	});
	tsts(`! ${dta}!=${dtb}`, () => {
		assert.is(dta.neq(dtb),false);
	});
}
for(const [a,b] of gtSet) {
	const dta=DateTimeUtc.fromValue(a);
	const dtb=DateTimeUtc.fromValue(b);
	tsts(`${dta}>${dtb}`, () => {
		assert.is(dta.gt(dtb),true);
	});
	tsts(`${dta}>=${dtb}`, () => {
		assert.is(dta.gte(dtb),true);
	});
	tsts(`! ${dta}<${dtb}`, () => {
		assert.is(dta.lt(dtb),false);
	});
	tsts(`! ${dta}<=${dtb}`, () => {
		assert.is(dta.lte(dtb),false);
	});
	tsts(`! ${dta}==${dtb}`, () => {
		assert.is(dta.eq(dtb),false);
	});
	tsts(`${dta}!=${dtb}`, () => {
		assert.is(dta.neq(dtb),true);
	});
}

const diffSet:[string,string,string][]=[
	['20240228'+'020304567890','20240228'+'020304567890','0s'],
	['20250228'+'020304567890','20240228'+'020304567890','1y'],
	['20240328'+'020304567890','20240228'+'020304567890','1m'],
	['20240229'+'020304567890','20240228'+'020304567890','1d'],
	['20240228'+'030304567890','20240228'+'020304567890','1h'],
	['20240228'+'020404567890','20240228'+'020304567890','1i'],
	['20240228'+'020305567890','20240228'+'020304567890','1s'],

	['20240229'+'020304567890','20230228'+'020304567890','1y1d'],
	['20250228'+'020304567890','20240229'+'020304567890','11m28d'],
	['20230131'+'020304567890', '20221230'+'020304567890','1m1d'],
	['20240228'+'010203456789','20240129'+'010203456789','30d'],
];
for(const [a,b,du] of diffSet) {
	const dta=DateTimeUtc.fromValue(a);
	const dtb=DateTimeUtc.fromValue(b);
	tsts(`v ${dta} -  ${dtb}`,()=>{
		const diff=dta.diff(dtb);
		assert.equal(diff.toString(),du);
	});
}

const diffExactSet:[string,string,string][]=[
	['20240228'+'020304567890','20240228'+'020304567890','0s'],
	['20250228'+'020304567890','20240228'+'020304567890','366d'],//Leap
	['20240228'+'020304567890','20230228'+'020304567890','365d'],
	['20240228'+'010203456789','20240129'+'010203456789','30d'],
	['20240328'+'020304567890','20240228'+'020304567890','29d'],//leap
	['20230328'+'020304567890','20230228'+'020304567890','28d'],
	['20240228'+'020304567890','20240128'+'020304567890','31d'],
	['20240229'+'020304567890','20240228'+'020304567890','1d'],
	['20240228'+'030304567890','20240228'+'020304567890','1h'],
	['20240228'+'020404567890','20240228'+'020304567890','1i'],
	['20240228'+'020305567890','20240228'+'020304567890','1s'],
	['20240228'+'020304567890','20240228'+'020304567889','0.000001s'],

	//pull-down cases
	['20240228'+'020304567890','20240227'+'030304567890','23h'],
	['20240228'+'020304567890','20240228'+'010404567890','59i'],
	['20240228'+'020304567890','20240228'+'020205567890','59s'],
	['20240228'+'020304567890','20240228'+'020303567891','0.999999s'],
];
for(const [a,b,du] of diffExactSet) {
	const dta=DateTimeUtc.fromValue(a);
	const dtb=DateTimeUtc.fromValue(b);
	tsts(`e ${dta} -  ${dtb}`,()=>{
		const diff=dta.diffExact(dtb);
		assert.equal(diff.toString(),du);
	});
}

// tsts(`asLocal`, () => {
// 	const start = DateTimeLocal.nowUtc();
// 	//A test that doesn't fail can't do much more than confirm that isUtc toggles
// 	assert.is(start.isUtc, true);
// 	const end = start.asLocal();
// 	assert.is(end.isUtc, false);
// 	//console.log(`start=${start.toString()} end=${end.toString()}`);
// });


const parseSet: [WindowStr, string, number][] = [
	//Just numbers (assume valueOf compat, but notice the extra z part)
	[WindowStr.new('-100000101000000000000'), '-10000-01-01T00:00:00.000000Z', 0], //min
	[WindowStr.new('20010203235959999999'), '2001-02-03T23:59:59.999999Z', 0],
	[WindowStr.new('20230131020304567890'), '2023-01-31T02:03:04.567890Z', 0],
	[WindowStr.new('227671231235959999999'), '+22767-12-31T23:59:59.999999Z', 0], //max

	//T separated numbers
	[WindowStr.new('-100000101T000000000000'), '-10000-01-01T00:00:00.000000Z', 0], //min
	[WindowStr.new('20010203T235959999999'), '2001-02-03T23:59:59.999999Z', 0],
	[WindowStr.new('20230131T020304567890'), '2023-01-31T02:03:04.567890Z', 0],
	[WindowStr.new('+227671231T235959999999'), '+22767-12-31T23:59:59.999999Z', 0], //max
	[WindowStr.new('227671231T235959999999'), '+22767-12-31T23:59:59.999999Z', 0], //max

	//T separated regular, date separated
	[
		WindowStr.new('-10000-01-01T000000000000'),
		'-10000-01-01T00:00:00.000000Z',
		0,
	], //min
	[WindowStr.new('2001-02-03T235959999999'), '2001-02-03T23:59:59.999999Z', 0],
	[WindowStr.new('2023-01-31T020304567890'), '2023-01-31T02:03:04.567890Z', 0],
	[
		WindowStr.new('22767-12-31T235959999999'),
		'+22767-12-31T23:59:59.999999Z',
		0,
	], //max

	//T separated numbers,time separated
	[
		WindowStr.new('-100000101T00:00:00.000000'),
		'-10000-01-01T00:00:00.000000Z',
		0,
	], //min
	[WindowStr.new('20010203T23:59:59.999999'), '2001-02-03T23:59:59.999999Z', 0],
	[WindowStr.new('20230131T02:03:04.567890'), '2023-01-31T02:03:04.567890Z', 0],
	[
		WindowStr.new('+227671231T23:59:59.999999'),
		'+22767-12-31T23:59:59.999999Z',
		0,
	], //max

	//all separated
	[
		WindowStr.new('-10000-01-01T00:00:00.000000'),
		'-10000-01-01T00:00:00.000000Z',
		0,
	], //min
	[
		WindowStr.new('2001-02-03T23:59:59.999999z'),
		'2001-02-03T23:59:59.999999Z',
		0,
	],
	[
		WindowStr.new('2023-01-31T02:03:04.567890Z'),
		'2023-01-31T02:03:04.567890Z',
		0,
	],
	[
		WindowStr.new('+22767-12-31T23:59:59.999999'),
		'+22767-12-31T23:59:59.999999Z',
		0,
	], //max
	[
		WindowStr.new('22767-12-31T23:59:59.999999'),
		'+22767-12-31T23:59:59.999999Z',
		0,
	], //don't need the + in non-strict
	//Alt date separators
	[
		WindowStr.new('2023/01/31T02:03:04.567890'),
		'2023-01-31T02:03:04.567890Z',
		0,
	],
	[
		WindowStr.new('2023.01.31T02:03:04.567890'),
		'2023-01-31T02:03:04.567890Z',
		0,
	],
	//Spacey
	[
		WindowStr.new(' 2023 - 01 - 31 T 02:03:04.567890'),
		'2023-01-31T02:03:04.567890Z',
		0,
	],

	//.. it's complicated
	[WindowStr.new('1-1-1T2:2:2.2'), '0001-01-01T02:02:02.200000Z', 0],
	[WindowStr.new('99-12-31T0:0:0.0'), '0099-12-31T00:00:00.000000Z', 0], //Notice party like 99 is quite a while ago
	//RFC3339
	[WindowStr.new('1985-04-12T23:20:50.52'), '1985-04-12T23:20:50.520000Z', 0],
];
for (const [w, expect, expectLen] of parseSet) {
	tsts(`parse(${w.debug()})`, () => {
		const to = DateTimeUtc.parse(w);
		assert.equal(to.toString(), expect);
		assert.is(w.length, expectLen, 'remaining length');
	});
}

const badParseStrictSet: WindowStr[] = [
    WindowStr.new('1985-04-12T23:20:50.52'),//missing z
	WindowStr.new('2023-01-31T02:03:04.5'), //us short
	WindowStr.new('2023-01-31T02:03:4.567890'), //s short
	WindowStr.new('2023-01-31T02:3:04.567890'), //mi short
	WindowStr.new('2023-01-31T2:03:04.567890'), //h short
	WindowStr.new('2023-01-3T02:03:04.567890'), //d short
	WindowStr.new('2023-1-31T02:03:04.567890'), //mo short
	WindowStr.new('23-01-31T02:03:04.567890'), //y short
	WindowStr.new('1-1-1T2:2:2.2'), //Whole lotta short
	WindowStr.new('22767-12-31T23:59:59.999999z'), //Need a + for 5 digit years
];
for (const w of badParseStrictSet) {
	tsts(`parse-strict ${w.debug()} throws`, () => {
		assert.throws(() => DateTimeUtc.parse(w, true));
	});
}

const badParseSet: WindowStr[] = [
	WindowStr.new('1536'),
	WindowStr.new('15:36:.'),
	WindowStr.new('1536:31.123456'),
	WindowStr.new('-10000-01-01'), //Just a date
	WindowStr.new('23:59:59.999999z'), //Just a time
	WindowStr.new('2023-01-31T02:03:04567890'), //missing last time delim
	WindowStr.new('2023-01-31T02:0304.567890'), //missing second last time delim
	WindowStr.new('2023-01-31T0203:04.567890'), //missing third last time delim
	WindowStr.new('2023-0131T02:03:04.567890'), //missing second date delim
	WindowStr.new('202301-31T02:03:04.567890'), //missing first date delim
	WindowStr.new('20010229235959999999'),//Day invalid in date
	WindowStr.new('20010203245959999999'),//Hour invalid in time
];
for (const w of badParseSet) {
	tsts(`parse ${w.debug()} throws`, () => {
		assert.throws(() => DateTimeUtc.parse(w));
	});
}

tsts(`parse-now`, () => {
	const w = WindowStr.new('now');
	const dt = DateTimeUtc.parse(w);
	const dateO = new Date();

	//This isn't a great test, but let's use a date object to compare
	//(tiny chance of this test failing near midnight)
	assert.is(dt.year, dateO.getUTCFullYear(),'y');
	assert.is(dt.month, dateO.getUTCMonth() + 1,'m'); //JS stores months off by 1 (0=Jan)
	assert.is(dt.day, dateO.getUTCDate(),'d'); //Not a great name, JS

	const h = dt.hour;
	assert.is(h >= 0 && h <= 23, true, 'hour in range');
	const m = dt.minute;
	assert.is(m >= 0 && m <= 59, true, 'minute in range');
	const s = dt.second;
	assert.is(s >= 0 && s <= 59, true, 'second in range');
	const us = dt.microsecond;
	assert.is(us >= 0 && us <= 999999, true, 'microsecond in range');
});

//add

tsts.run();
