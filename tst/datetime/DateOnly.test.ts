import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { DateOnly } from '../../src/datetime/DateOnly';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';

const tsts = suite('DateOnly');

const serSet: [number, number, number, string, string, string][] = [
	[-10000, 1, 1, '-10000-01-01', '000000', '"-10000-01-01"'], //Yep, the null date, also min
	[1952, 12, 31, '1952-12-31', '5D617E', '"1952-12-31"'], //010111010110000 1011 11110
	[2024, 1, 14, '2024-01-14', '5DF00D', '"2024-01-14"'], //010111011111000 0000 01101
	[22767, 12, 31, '+22767-12-31', 'FFFF7E', '"+22767-12-31"'], //max
];
for (const [yr, mo, da, str, serStr, jsonStr] of serSet) {
	tsts(`ser(${yr} ${mo} ${da})`, () => {
		var d = DateOnly.new(yr, mo, da);

		assert.is(d.toString(), str);

		var bw = new BitWriter(Math.ceil(DateOnly.serialBits / 8));
		d.serialize(bw);
		assert.is(hex.fromBytes(bw.getBytes()), serStr);
	});

	tsts(`deser(${serStr})`, () => {
		const bytes = hex.toBytes(serStr);
		const br = new BitReader(bytes);
		const d = DateOnly.deserialize(br).validate();
		assert.is(d.year, yr, 'year');
		assert.is(d.month, mo, 'month');
		assert.is(d.day, da, 'day');
		assert.is(d.toString(), str);
	});

	tsts(`toJSON(${yr} ${mo} ${da})`, () => {
		var d = DateOnly.new(yr, mo, da);
		const json = JSON.stringify(d);
		assert.equal(json, jsonStr);
	});
}

tsts(`deser with invalid source value (FFFFFFFF) throws`, () => {
	const bytes = Uint8Array.of(0xff, 0xff, 0xff);
	const br = new BitReader(bytes);
	assert.throws(() => DateOnly.deserialize(br).validate());
});
tsts(`deser without source data throws`, () => {
	const bytes = new Uint8Array();
	const br = new BitReader(bytes);
	assert.throws(() => DateOnly.deserialize(br).validate());
});
tsts(`deser without storage space throws`, () => {
	const stor = new Uint8Array(0);
	const bytes = Uint8Array.of(0xff, 0xff, 0x7e);
	const br = new BitReader(bytes);
	assert.throws(() => DateOnly.deserialize(br, stor).validate());
});

tsts(`new`, () => {
	const d = DateOnly.new(2000, 1, 2);
	assert.is(d.toString(), '2000-01-02');
	assert.is(d.year, 2000, 'year');
	assert.is(d.month, 1, 'month');
	assert.is(d.day, 2, 'day');
	//Value off uses base 10 shifting of month/year
	assert.is(d.valueOf(), 20000102);
});
tsts(`new-provide storage`, () => {
	const stor = new Uint8Array(DateOnly.storageBytes);
	const d = DateOnly.new(2000, 1, 2, stor);
	assert.is(d.toString(), '2000-01-02');
	assert.is(d.year, 2000);
	assert.is(d.month, 1);
	assert.is(d.day, 2);
	//Value off uses base 10 shifting of month/year
	assert.is(d.valueOf(), 20000102);
});

{
	//For anywhere that isn't offset=0, one of these would
	// fail if the offset isn't being compensated for
	const y = 2024;
	const m = 2;
	const d = 4;
	for (let h = 0; h < 24; h++) {
		const dt = new Date(y, m - 1, d, h);
		const dto = DateOnly.fromDate(dt);
		tsts(`fromDate(${dt})`, () => {
			assert.is(dto.year, y, 'y');
			assert.is(dto.month, m, 'm');
			assert.is(dto.day, d, 'd');
		});
		tsts(`toDate(${dt})`, () => {
			const dateO = dto.toDate();
			assert.is(dateO.getFullYear(), y, 'y');
			assert.is(dateO.getMonth() + 1 /*because, that makes sense*/, m, 'm');
			assert.is(dateO.getDate(), d, 'd');
			//assert.is(dtO.toDate().valueOf(),days*DateOnly.msPerDay);
		});
		tsts(`fromDateUtc(${dt})`, () => {
			const dtu = new Date(Date.UTC(y, m - 1, d, h));
			const dto = DateOnly.fromDateUtc(dtu);
			assert.is(dto.year, y, 'y');
			assert.is(dto.month, m, 'm');
			assert.is(dto.day, d, 'd');
		});
	}
}

const fromUnixTimeSet: [number, string][] = [
	//2024-01-20 07:13:30
	[1705734810, '2024-01-20'],
	//2024-01-20 07:13:30.534
	[1705734810.534, '2024-01-20'],
];
for (const [epoch, str] of fromUnixTimeSet) {
	const e = DateOnly.fromUnixTime(epoch);
	tsts(`fromUnixTime(${epoch})`, () => {
		assert.is(e.toString(), str);
	});
}

//Because `fromUnixTime` ignores lower units (smaller than day) we can't
// roundtrip from unix->DateOnly->unix (unless h/m/s are zeroed)
const toUnixTimeSet: [number, number, number, string, number, number][] = [
	[2001, 2, 3, '2001-02-03', 981158400, 981158400000],
	[2024, 1, 20, '2024-01-20', 1705708800, 1705708800000],
	[2024, 2, 1, '2024-02-01', 1706745600, 1706745600000],
];
for (const [y, m, d, str, epoch, epochMs] of toUnixTimeSet) {
	const dt = DateOnly.new(y, m, d);
	tsts(`toUnixTime(${str})`, () => {
		assert.is(dt.toString(), str);
		assert.is(dt.toUnixTime(), epoch);
	});
	tsts(`toUnixTimeMs(${str})`, () => {
		assert.is(dt.toUnixTimeMs(), epochMs);
	});
	//We can back convert epoch to date with these zeroed values
	tsts(`fromUnixTime(${epoch})`, () => {
		const fr = DateOnly.fromUnixTime(epoch);
		assert.is(fr.toString(), str);
	});
	tsts(`fromUnixTimeMs(${epochMs})`, () => {
		const fr = DateOnly.fromUnixTimeMs(epochMs);
		assert.is(fr.toString(), str);
	});
}

const toUnixDaySet: [number, number, number, number][] = [
	//Yet to find a calculator:
	[-466, 9, 2, -889487],
	[-366, 9, 2, -852962],
	[-266, 9, 2, -816438],
	[-166, 9, 2, -779914],
	[-66, 9, 2, -743390],
	//Vetted, need a second source:
	[1, 1, 1, -719162],
	[66, 9, 2, -695177],
	[166, 9, 2, -658653],
	[266, 9, 2, -622129],
	[366, 9, 2, -585605],
	[466, 9, 2, -549080],
	[1166, 9, 2, -293411],
	[1266, 9, 2, -256886],
	[1366, 9, 2, -220362],
	[1466, 9, 2, -183838],
	[1566, 9, 2, -147314],
	[1666, 9, 2, -110789], //Fire of london
	[1766, 9, 2, -74265],
	[1866, 9, 2, -37741],
	[1966, 9, 2, -1217],
	[2066, 9, 2, 35308],
	[2166, 9, 2, 71832],
	[2266, 9, 2, 108356],
	[2366, 9, 2, 144880],
	[2466, 9, 2, 181405],
	[1969, 1, 1, -365],
	[1969, 12, 31, -1],
	//As defined:
	[-1, 2, 28, -719835],
	[0, 2, 28, -719470],
	[0, 2, 29, -719469], //0 was a leap year (%400), not Mary and Joseph noticed
	[0, 3, 1, -719468], //epochShift
	[1970, 1, 1, 0], //epoch
	[1970, 1, 2, 1],
	[1970, 1, 31, 30],
	[1970, 2, 1, 31],
	[1971, 1, 1, 365],
	[1972, 1, 1, 730], //365+365
	[1973, 1, 1, 1096], //3*365+1 1972 was leap
	[1974, 1, 1, 1461], //4*365+1
	[1974, 3, 1, 1520],
	[2000, 3, 1, 11017],
	[2001, 4, 23, 11435],
	[2021, 4, 23, 18740],
];
for (const [y, m, d, unix] of toUnixDaySet) {
	const dt = DateOnly.new(y, m, d);
	tsts(`toUnixDays(${y} ${m} ${d})`, () => {
		assert.is(dt.toUnixDays(), unix);
	});
	tsts(`fromUnixDays(${unix})`, () => {
		const fr = DateOnly.fromUnixDays(unix);
		assert.is(fr.year, y, 'year');
		assert.is(fr.month, m, 'month');
		assert.is(fr.day, d, 'day');
	});
}

const dimSet: [number, number, number][] = [
	[2024, 1, 31],
	[2024, 2, 29], //Leap year
	[2024, 3, 31],
	[2024, 4, 30],
	[2024, 5, 31],
	[2024, 6, 30],
	[2024, 7, 31],
	[2024, 8, 31],
	[2024, 9, 30],
	[2024, 10, 31],
	[2024, 11, 30],
	[2024, 12, 31],

	[2025, 1, 31],
	[2025, 2, 28],
	[2025, 3, 31],
	[2025, 4, 30],
	[2025, 5, 31],
	[2025, 6, 30],
	[2025, 7, 31],
	[2025, 8, 31],
	[2025, 9, 30],
	[2025, 10, 31],
	[2025, 11, 30],
	[2025, 12, 31],
];
for (const [y, m, dim] of dimSet) {
	tsts(`daysInMonth(${y} ${m})`, () => {
		assert.is(DateOnly.daysInMonth(y, m), dim);
	});
}

const fromUnixTimeMsSet: [number, string][] = [
	//2024-01-20 07:13:30.542
	[1705734810542, '2024-01-20'],
	//2024-01-20 07:13:30.542789
	[1705734810542.789, '2024-01-20'],
];
for (const [epoch, expect] of fromUnixTimeMsSet) {
	tsts(`fromUnixTimeMs(${epoch})`, () => {
		const e = DateOnly.fromUnixTimeMs(epoch);
		assert.is(e.toString(), expect);
	});
}

tsts(`now`, () => {
	const dt = new Date();
	const d = DateOnly.now();
	//This isn't a great test, but let's use a date object to compare
	//(tiny chance of this test failing near midnight)
	assert.is(d.year, dt.getFullYear());
	assert.is(d.month, dt.getMonth() + 1); //JS stores months off by 1 (0=Jan)
	assert.is(d.day, dt.getDate()); //Not a great name, JS
});

tsts(`nowUtc`, () => {
	const dt = new Date();
	const d = DateOnly.nowUtc();
	//This isn't a great test, but let's use a date object to compare
	//(tiny chance of this test failing near midnight UTC)
	assert.is(d.year, dt.getUTCFullYear());
	assert.is(d.month, dt.getUTCMonth() + 1); //JS stores months off by 1 (0=Jan)
	assert.is(d.day, dt.getUTCDate()); //Not a great name, JS
});

tsts('[Symbol.toStringTag]', () => {
	const o = DateOnly.now();
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('DateOnly') > 0, true);
});

tsts('util.inspect', () => {
	const o = DateOnly.now();
	const u = util.inspect(o);
	assert.is(u.startsWith('DateOnly('), true);
});

tsts('serialSizeBits', () => {
	const o = DateOnly.now();
	const bits = o.serialSizeBits;
	assert.is(bits > 0 && bits < 64, true); //Make sure it fits in 64 bits
});

const dowSet: [number, number][] = [
	[-7, 4],
	[-6, 5],
	[-5, 6],
	[-4, 0],
	[-3, 1],
	[-2, 2],
	[-1, 3],
	[0, 4], //We know it was a thursday
	[1, 5],
	[2, 6],
	[3, 0],
	[4, 1],
	[5, 2],
	[6, 3],
	[7, 4],
	[19758, 1], //We know it's a Monday (when running this test)
];
//console.log(DateOnly.new(2024,2,5).toUnixDays());
for (const [unixDay, dow] of dowSet) {
	tsts(`dayOfWeek(${unixDay})`, () => {
		assert.is(DateOnly.dayOfWeek(unixDay), dow);
	});
}

const addSafeSet: [number, number, number][] = [
	[20240130, 30, 20240229],
	[20240201, -1, 20240131],
	[20240301, -1, 20240229],
	[20240630, 30, 20240730],

	//Leap year related
	[20240301, -365, 20230302],
	[20240301, -366, 20230301],
	[20240201, 365, 20250131],
	[20240201, 366, 20250201],
];
for (const [sVal, days, expect] of addSafeSet) {
	tsts(`(${sVal}).addDays(${days})`, () => {
		const dto = DateOnly.fromValue(sVal);
		assert.is(dto.addSafe(days).valueOf(), expect);
	});
}

const addSet: [number, number, number, number][] = [
	[20230131, 0, 1, 20230228], //Clamped back to 28 (not leap)
	[20230131, 1, 1, 20240229], //Because leap we can go to 29
	[20230228, 1, 0, 20240228],
	[20240131, 0, 1, 20240229], //Clamped back to 29 (leap)
	[20240131, 1, 1, 20250228], //Clamped back to 28 (not leap)
	[20240229, 1, 1, 20250329], //Jump, but not to last day
	[20240229, 1, 0, 20250228], //Not to leap
	[20240229, 3, 0, 20270228], //Not to leap
	[20240229, 4, 0, 20280229], //Back to leap
	[20240930, 0, 1, 20241030],
];
for (const [sVal, yAdd, mAdd, expect] of addSet) {
	tsts(`(${sVal}).add(${yAdd} ${mAdd})`, () => {
		const dto = DateOnly.fromValue(sVal);
		assert.is(dto.add(yAdd, mAdd).valueOf(), expect);
	});
}

tsts(`min`,()=>{
    const dto=DateOnly.min;
    assert.is(dto.valueOf(),-100000101);
});
tsts(`max`,()=>{
    const dto=DateOnly.max;
    assert.is(dto.valueOf(),227671231);
});


const parseSet:[WindowStr,number,number][]=[
    [WindowStr.new('2024-01-02'),20240102,0],
    //Other formats
    [WindowStr.new('2024/01/02'),20240102,0],
    [WindowStr.new('2024.01.02'),20240102,0],
    [WindowStr.new('20240102'),20240102,0],
    [WindowStr.new('+20240102'),20240102,0],
    //Trailing space consumed
    [WindowStr.new('2024-01-02 '),20240102,0],
    [WindowStr.new(' 2024 - 01 - 02 '),20240102,0],
    [WindowStr.new('2024 - 1 - 2\t \t'),20240102,0],
    [WindowStr.new('2024\t-\t1 -\t2\r\n'),20240102,0],
];
for(const [w,expect,expectLen] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const dt=DateOnly.parse(w);
        assert.equal(dt.valueOf(),expect);
        assert.is(w.length,expectLen,'remaining length');
    });
}

const badParseStrictSet:WindowStr[]=[
    WindowStr.new('2024-1-02'),//zero pad month
    WindowStr.new('2024-01-2'),//zero pad day
    WindowStr.new('20-01-02'),//zero pad year, honestly y2k man
    WindowStr.new('2024/01/02'),//can only use dashes
    WindowStr.new('12-11-10'),//what kind of a date is this?
];
for(const w of badParseStrictSet) {
    tsts(`parse-strict ${w.debug()} throws`,()=>{
        assert.throws(()=>DateOnly.parse(w,true));
    })
}

const badParseSet:WindowStr[]=[
    WindowStr.new('2024-01/02'),//Can't have mixed delims
    WindowStr.new('2024 01 02'),//Spaces are not valid delims (because we support spaces in the parts)
];
for(const w of badParseSet) {
    tsts(`parse ${w.debug()} throws`,()=>{
        assert.throws(()=>DateOnly.parse(w));
    })
}

tsts(`parse-now`, () => {
    const w=WindowStr.new('now');
	const dt = new Date();
    const d=DateOnly.parse(w);
	//This isn't a great test, but let's use a date object to compare
	//(tiny chance of this test failing near midnight)
	assert.is(d.year, dt.getFullYear());
	assert.is(d.month, dt.getMonth() + 1); //JS stores months off by 1 (0=Jan)
	assert.is(d.day, dt.getDate()); //Not a great name, JS
});

//console.log(`-13%12 = (${-13%12} ${(-13/12)} ${(-13/12)|0}) -12%12 = (${-12%12} ${-12/12} ${(-12/12)|0}) -11%12 = (${-11%12} ${-11/12} ${(-11/12)|0})`);

tsts.run();
