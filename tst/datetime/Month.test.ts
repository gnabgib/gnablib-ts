import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Month } from '../../src/datetime/dt';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';

const tsts = suite('Month');

const serSet: [number, string][] = [
	[1, '00'], //b0000
	[2, '10'],
	[3, '20'],
	[4, '30'],
	[5, '40'],
	[6, '50'],
	[7, '60'],
	[8, '70'],
	[9, '80'],
	[10, '90'],
	[11, 'A0'],
	[12, 'B0'],
];
for (const [mo, ser] of serSet) {
	tsts(`ser(${mo})`, () => {
		const m = Month.new(mo);
		assert.equal(m.valueOf(), mo);

		const bw = new BitWriter(Math.ceil(Month.serialBits / 8));
		m.serialize(bw);
		assert.is(hex.fromBytes(bw.getBytes()), ser);
	});

	tsts(`deser(${ser})`, () => {
		const bytes = hex.toBytes(ser);
		const br = new BitReader(bytes);
		const m = Month.deserialize(br);
		assert.is(m.valueOf(), mo);
	});
}

tsts(`deser with invalid source value (13) throws`, () => {
	const bytes = Uint8Array.of(0xc0);
	const br = new BitReader(bytes);
	assert.throws(() => Month.deserialize(br).validate());
});

tsts(`deser without source data throws`, () => {
	const bytes = new Uint8Array();
	const br = new BitReader(bytes);
	assert.throws(() => Month.deserialize(br).validate());
});

const toStrSet: [number, string, string, string][] = [
	[1, '1', '01', '1'],
	[2, '2', '02', '2'],
	[12, '12', '12', '12'],
];
for (const [mo, str, isoStr, jsonStr] of toStrSet) {
	const m = Month.new(mo);
	tsts(`toString(${mo})`, () => {
		assert.equal(m.toString(), str);
	});
	tsts(`toIsoString(${mo})`, () => {
		assert.equal(m.toIsoString(), isoStr);
	});
	tsts(`toJSON(${mo})`, () => {
		const json = JSON.stringify(m);
		assert.equal(json, jsonStr);
	});
}

tsts(`new`, () => {
	const m = Month.new(11);
	assert.is(m.valueOf(), 11);
	assert.is(m.toString(), '11');
});

tsts(`fromDate`, () => {
	var dt = new Date(2001, 2, 3, 4, 5, 6);
	var m = Month.fromDate(dt);
	assert.is(m.valueOf(), dt.getMonth() + 1); //JS stores months 0 based
});

tsts(`fromDateUtc`, () => {
	var dt = new Date(2001, 2, 3, 4, 5, 6);
	var m = Month.fromDateUtc(dt);
	assert.is(m.valueOf(), dt.getUTCMonth() + 1); //JS stores months 0 based
});

tsts(`now`, () => {
	var dt = new Date();
	var m = Month.now();
	//This isn't a great test, but let's use a date object to compare
	//(tiny chance of this test failing near midnight)
	assert.is(m.valueOf(), dt.getMonth() + 1); //JS stores months 0 based
});

const parseSet: [WindowStr, number, number][] = [
	//Exhaustive month-int
	[WindowStr.new('01'), 1, 0],
	[WindowStr.new('02'), 2, 0],
	[WindowStr.new('03'), 3, 0],
	[WindowStr.new('04'), 4, 0],
	[WindowStr.new('05'), 5, 0],
	[WindowStr.new('06'), 6, 0],
	[WindowStr.new('07'), 7, 0],
	[WindowStr.new('08'), 8, 0],
	[WindowStr.new('09'), 9, 0],
	[WindowStr.new('10'), 10, 0],
	[WindowStr.new('11'), 11, 0],
	[WindowStr.new('12'), 12, 0],
	//Doesn't have to be zero padded
	[WindowStr.new('1'), 1, 0],
	[WindowStr.new('2'), 2, 0],
	[WindowStr.new('3'), 3, 0],
	[WindowStr.new('4'), 4, 0],
	[WindowStr.new('5'), 5, 0],
	[WindowStr.new('6'), 6, 0],
	[WindowStr.new('7'), 7, 0],
	[WindowStr.new('8'), 8, 0],
	[WindowStr.new('9'), 9, 0],
	//Exhaustive month-short (may fail if tests run in different locality)
	[WindowStr.new('jan'), 1, 0],
	[WindowStr.new('feb'), 2, 0],
	[WindowStr.new('mar'), 3, 0],
	[WindowStr.new('apr'), 4, 0],
	[WindowStr.new('may'), 5, 0],
	[WindowStr.new('jun'), 6, 0],
	[WindowStr.new('jul'), 7, 0],
	[WindowStr.new('aug'), 8, 0],
	[WindowStr.new('sep'), 9, 0],
	[WindowStr.new('oct'), 10, 0],
	[WindowStr.new('nov'), 11, 0],
	[WindowStr.new('dec'), 12, 0],
	[WindowStr.new('NOV'), 11, 0],
	//Exhaustive month-long (may fail if tests run in different locality)
	[WindowStr.new('January'), 1, 0],
	[WindowStr.new('February'), 2, 0],
	[WindowStr.new('March'), 3, 0],
	[WindowStr.new('April'), 4, 0],
	[WindowStr.new('May'), 5, 0],
	[WindowStr.new('June'), 6, 0],
	[WindowStr.new('July'), 7, 0],
	[WindowStr.new('August'), 8, 0],
	[WindowStr.new('September'), 9, 0],
	[WindowStr.new('October'), 10, 0],
	[WindowStr.new('November'), 11, 0],
	[WindowStr.new('December'), 12, 0],
	[WindowStr.new(' December '), 12, 1], //Trailing space not consumed

	[WindowStr.new('20240208', 4, 2), 2, 0],

	//This should match, but will only work if locale=fr
	//[WindowStr.new('février'),2,0],

	//Can be space padded
	[WindowStr.new(' 1 '), 1, 1],

	//Note: Could fail at the end of the month :|
	[WindowStr.new('now'), new Date().getMonth() + 1, 0],
	[WindowStr.new('NOW'), new Date().getMonth() + 1, 0],
	[WindowStr.new(' NoW '), new Date().getMonth() + 1, 1], //Leading space is trimmed, but not trailing
];
for (const [w, expect, expectLen] of parseSet) {
	tsts(`parse(${w.debug()})`, () => {
		const m = Month.parse(w);
		assert.equal(m.valueOf(), expect);
		assert.is(w.length, expectLen, 'remaining length');
	});
}

const badParseStrict: WindowStr[] = [
	//Should be zero padded
	WindowStr.new('1'),
	WindowStr.new('3'),
];
for (const w of badParseStrict) {
	tsts(`${w.debug()} parse strict throws`, () => {
		assert.throws(() => Month.parse(w, true));
	});
}

const badParse: WindowStr[] = [
	//Bad strings
	WindowStr.new(''), //Empty string not allowed
	WindowStr.new('tomorrow'), //We support "now" only
	WindowStr.new('1.5'), //Floating point - not allowed
	WindowStr.new('1e1'), //10 in scientific - not allowed, although technically a valid number
	WindowStr.new('+01'), //Can't have sign
	WindowStr.new('-02'), //"
	WindowStr.new('-2'),
	WindowStr.new('A'), //Hex isn't allowed (good ol' tenth month)
	//Out of range:
	WindowStr.new('0'),
	WindowStr.new('00'),
	WindowStr.new('13'),
	WindowStr.new('1000'),
	//Trailing text
	WindowStr.new('dec dec'),
	WindowStr.new('December 1'),
];
for (const w of badParse) {
	tsts(`badParse(${w.debug()})`, () => {
		//@ts-ignore - this is the point of the test
		assert.throws(() => Month.parse(w));
	});
}

tsts('[Symbol.toStringTag]', () => {
	const o = Month.now();
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Month') > 0, true);
});

tsts('util.inspect', () => {
	const o = Month.now();
	const u = util.inspect(o);
	assert.is(u.startsWith('Month('), true);
});

tsts('serialSizeBits', () => {
	const o = Month.now();
	const bits = o.serialSizeBits;
	assert.is(bits > 0 && bits < 64, true); //Make sure it fits in 64 bits
});

//While these are brittle, I think we know the first and last month of any year
tsts(`min`, () => {
	const m = Month.min;
	assert.is(m.valueOf(), 1);
});
tsts(`max`, () => {
	const m = Month.max;
	assert.is(m.valueOf(), 12);
});

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
	tsts(`lastDay(${y} ${m})`, () => {
		assert.is(Month.lastDay(m,y), dim);
	});
}
tsts(`lastDay(1)`, () => {
    assert.is(Month.lastDay(1), 31);
});

tsts.run();
