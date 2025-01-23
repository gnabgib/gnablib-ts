import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U256 } from '../../../src/primitive/number/U256';
import util from 'util';

const tsts = suite('U256');

const h0 = '0000000000000000000000000000000000000000000000000000000000000000';
const h1 = '0000000000000000000000000000000000000000000000000000000000000001';
const hMax = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
const hNum = '0102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2122';
// - binary -
// 0000000100000010000000110000010000000101000001100000011100001000
// 0000100100001010000010110000110000001101000011100000111100010001
// 0001001000010011000101000001010100010110000101110001100000011001
// 0001101000011011000111000001110100011110000111110010000100100010
// - decimal -
// 455867356320691211509944977504407603731653194725149516170553416058002153762
const hNNum = 'FEFDFCFBFAF9F8F7F6F5F4F3F2F1F0EEEDECEBEAE9E8E7E6E5E4E3E2E1E0DEDD';
const hexBuild = (h: string) => U256.fromBytesBE(hex.toBytes(h));

const toStrTest = [
	h0,
	h1,
	'1000000000000000000000000000000000000000000000000000000000000000',
	'FEDCBA9876543210000000000000000000000000000000000000000000000000',
	'0000000000000000000000000000000000000000000000000FEDCBA987654321',
	'C4D5E6F78091A2B3000000000000000000000000000000000000000000000000',
	'000000000000000000000000000000000000000000000000C4D5E6F78091A2B3',
	hNum,
];
for (const expect of toStrTest) {
	tsts(`${expect}.toString`, () => {
		const u = hexBuild(expect);
		assert.is(u.toString(), expect);
	});
}

const u32le_hex_tests: [number[], string][] = [
	[
		[1, 2, 3, 4, 5, 6, 7, 8],
		'0000000800000007000000060000000500000004000000030000000200000001',
	],
	[
		[67305985, 0x8070605, 9, 0, 0, 0, 0, 0],
		'0000000000000000000000000000000000000000000000090807060504030201',
	],
];
for (const [u32s, expect] of u32le_hex_tests) {
	const fromUints = U256.fromI32s(...u32s);
	tsts(`fromUints(${u32s})`, () => {
		assert.is(fromUints.toString(), expect);
	});

	const fromBytesBE = hexBuild(expect);
	tsts(`fromBytesBE(${expect})`, () => {
		assert.is(fromBytesBE.toString(), expect, 'fromBytesBE');
	});

	tsts(`mount(${expect})`, () => {
		const arr = Uint32Array.from(u32s);
		const u = U256.mount(arr);
		assert.is(u.toString(), expect);
	});
}

const fromIntTests: [number, string][] = [[1, h1]];
for (const [int, expect] of fromIntTests) {
	tsts(`fromInt(${int})`, () => {
		const u = U256.fromInt(int);
		assert.is(u.toString(), expect);
	});
}

//#region ShiftOps
// prettier-ignore
const lShift_tests: [string, number, string][] = [
    [h0, 0, h0],
    [h0, 1, h0],
    [h0, 13, h0],
    [h0, 32, h0],

    [hMax, 0, hMax],
    [hMax, 1, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE'],
    [hMax, 13, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE000'],
    [hMax, 32, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000'],
    [hMax, 64, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000'],

    [hNum, 0, hNum],
    [hNum, 1, '020406080A0C0E10121416181A1C1E222426282A2C2E30323436383A3C3E4244'],
    [hNum, 2, '04080C1014181C2024282C3034383C44484C5054585C6064686C7074787C8488'],
    [hNum, 16, '030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F21220000'],
    [hNum, 32, '05060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F212200000000'],
    [hNum, 65, '121416181A1C1E222426282A2C2E30323436383A3C3E42440000000000000000'],
    [hNum, 120, '1112131415161718191A1B1C1D1E1F2122000000000000000000000000000000'],
    [hNum, 240, '2122000000000000000000000000000000000000000000000000000000000000'],
    //Can exceed size
    [hNum, 300, h0],
];
for (const [start, by, expect] of lShift_tests) {
	tsts(`${start} << ${by}`, () => {
		const a = hexBuild(start);
		const b = a.lShift(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
	});
}
// prettier-ignore
const rShift_tests: [string, number, string][] = [
    [h0, 0, h0],
    [h0, 1, h0],
    [h0, 13, h0],
    [h0, 32, h0],

    [hMax, 0, hMax],
    [hMax, 1, '7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    [hMax, 13, '0007FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    [hMax, 32, '00000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    [hMax, 64, '0000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],

    [hNum, 0, hNum],
    [hNum, 1, '0081018202830384048505860687078889098A0A8B0B8C0C8D0D8E0E8F0F9091'],
    [hNum, 2, '004080C1014181C2024282C3034383C44484C5054585C6064686C7074787C848'],
    [hNum, 16, '00000102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F'],
    [hNum, 32, '000000000102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D'],
    [hNum, 65, '00000000000000000081018202830384048505860687078889098A0A8B0B8C0C'],
    [hNum, 120, '0000000000000000000000000000000102030405060708090A0B0C0D0E0F1112'],
    [hNum, 240, '0000000000000000000000000000000000000000000000000000000000000102'],
    //Can exceed size
    [hNum, 300, h0],
];
for (const [start, by, expect] of rShift_tests) {
	tsts(`${start} >> ${by}`, () => {
		const a = hexBuild(start);
		const b = a.rShift(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
	});
}
// prettier-ignore
const lRot_tests: [string, number, string][] = [
    [hNum, 0, hNum],
    [hNum, 1, '020406080A0C0E10121416181A1C1E222426282A2C2E30323436383A3C3E4244'],
    [hNum, 2, '04080C1014181C2024282C3034383C44484C5054585C6064686C7074787C8488'],
    [hNum, 16, '030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F21220102'],
    [hNum, 32, '05060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F212201020304'],
    [hNum, 65, '121416181A1C1E222426282A2C2E30323436383A3C3E4244020406080A0C0E10'],
    [hNum, 120, '1112131415161718191A1B1C1D1E1F21220102030405060708090A0B0C0D0E0F'],
    [hNum, 240, '21220102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F'],
    //Can exceed size
    [hNum, 300, '60708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F212201020304050'],
];
for (const [start, by, expect] of lRot_tests) {
	tsts(`${start} ROL ${by}`, () => {
		const a = hexBuild(start);
		const b = a.lRot(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
	});
}
//Note these are the same as lRot(256-#)
// prettier-ignore
const rRot_tests: [string, number, string][] = [
    //https://onlinetools.com/binary/rotate-binary-bits
    //https://www.rapidtables.com/convert/number/binary-to-hex.html
    [hNum, 0, hNum],
    [hNum, 1, '0081018202830384048505860687078889098A0A8B0B8C0C8D0D8E0E8F0F9091'],
];
for (const [start, by, expect] of rRot_tests) {
	tsts(`${start} ROR ${by}`, () => {
		const a = hexBuild(start);
		const b = a.rRot(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
	});
}
//#endregion

//#region LogicOps
const xor_tests = [
	// A^0=A: Anything xor zero is anything
	[h0, hNum, hNum],
	// A^1=~A:  Anything XOR 1 is its compliment
	[hMax, hNum, hNNum],
	// A^~A=1 Anything xor its compliment is 1
	[hNum, hNNum, hMax],
	// A^A=A Anything xor itself is 0
	[hNum, hNum, h0],
];
for (const [aHex, bHex, expect] of xor_tests) {
	tsts(`${aHex} ^ ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.xor(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation');
	});
}

const or_tests = [
	// A|0=A: Anything or zero is anything
	[hNum, h0, hNum],
	// A|1=1:  Anything or 1 is 1
	[hNum, hMax, hMax],
	// A|~A=1: Anything or its compliment is 1
	[hNum, hNNum, hMax],
	// A|A=A: Anything or itself is itself
	[hNum, hNum, hNum],
];
for (const [aHex, bHex, expect] of or_tests) {
	tsts(`${aHex} | ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.or(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation');
	});
}

const and_tests = [
	// A&0=0: Zero and anything is zero
	[h0, hNum, h0],
	// A&1=A:  All set and anything is anything
	[hMax, hNum, hNum],
	// A&~A=0: Anything and its compliment is 0
	[hNum, hNNum, h0],
	// A&A=A: Anything and itself is itself
	[hNum, hNum, hNum],
];
for (const [aHex, bHex, expect] of and_tests) {
	tsts(`${aHex} & ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.and(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation');
	});
}

const not_tests = [
	[h0, hMax],
	[hNum, hNNum],
];
for (const [start, expect] of not_tests) {
	tsts(`~${start}`, () => {
		const a = hexBuild(start);
		const res = a.not();
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
	});
}
//#endregion

//#region Arithmetic

// prettier-ignore
const add_tests=[
    // A+0=A: Anything plus zero is anything (like or)
    [hNum,h0,hNum],
    [hMax,h1,h0],
    [hMax,hNum,'0102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2121'],//Ends up being the same as -1 because of wrap
];
for (const [aHex, bHex, expect] of add_tests) {
	tsts(`${aHex} + ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.add(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation-a');
		assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
	});
}

// prettier-ignore
const sub_tests:[string,string,string][]=[
    [h1,h1,h0],
    [h0,h1,hMax],
    [hNum,h1,'0102030405060708090A0B0C0D0E0F1112131415161718191A1B1C1D1E1F2121'],
];
for (const [aHex, bHex, expect] of sub_tests) {
	tsts(`${aHex} - ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.sub(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation-a');
		assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
	});
}

// // prettier-ignore
const mul_tests = [
	//https://www.dcode.fr/big-numbers-multiplication
	[h0, hNum, h0],
	[h1, hNum, hNum],
	[
		hNum,
		hNum,
		'B4CCC29543CD306C806B2BC12A667656C0F7FAC85FBFE7D68B0441410285C884',
	],
];
for (const [aHex, bHex, expect] of mul_tests) {
	tsts(`${aHex} * ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.mul(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation-a');
		assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
	});
}
//#endregion

//#region Comparable
const neq_tests: [string, string][] = [
	[h0, h1],
	[hNum, h0],
	[hNum, h1],
	[hNum, hMax],
];
for (const [aHex, bHex] of neq_tests) {
	const a = hexBuild(aHex);
	const b = hexBuild(bHex);
	tsts(`${aHex} != ${bHex}`, () => {
		assert.is(a.eq(b), false);
	});
	tsts(`${bHex} != ${aHex}`, () => {
		assert.is(b.eq(a), false);
	});
}

const eq_set: string[] = [h0, h1, hNum, hMax];
for (const aHex of eq_set) {
	const bHex = aHex;
	const a = hexBuild(aHex);
	const b = hexBuild(bHex);
	tsts(`${aHex} == ${aHex}`, () => {
		assert.is(a.eq(b), true);
	});
	tsts(`${aHex} <= ${bHex}`, () => {
		assert.is(a.lte(b), true);
	});
	tsts(`${aHex} >= ${bHex}`, () => {
		assert.is(a.gte(b), true);
	});
}

// prettier-ignore
const lt_set:[string,string][]=[
    [h0,h1],
    [h1,hNum],
    [hNum,hMax]
];
for (const [aHex, bHex] of lt_set) {
	const a = hexBuild(aHex);
	const b = hexBuild(bHex);
	tsts(`${aHex} < ${bHex}`, () => {
		assert.is(a.lt(b), true);
	});
	tsts(`${bHex} > ${aHex}`, () => {
		assert.is(b.gt(a), true);
	});
	tsts(`${aHex} <= ${bHex}`, () => {
		assert.is(a.lte(b), true);
	});
	tsts(`${bHex} >= ${aHex}`, () => {
		assert.is(b.gte(a), true);
	});
}
//#endregion

tsts(`clone`, () => {
	//Really just for coverage (since you cannot mutate, what's the value of a clone?)
	const a = U256.fromInt(1);
	const b = a.clone();
	//Object eq tests
	assert.is(a, a);
	assert.is.not(a, b);
});

tsts(`zero`, () => {
	assert.equal(U256.zero.toBytesBE(), new Uint8Array(32));
});

tsts('[Symbol.toStringTag]', () => {
	const o = U256.fromInt(1);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U256') > 0, true);
});

tsts('util.inspect', () => {
	const o = U256.fromInt(1);
	const u = util.inspect(o);
	assert.is(u.startsWith('U256('), true);
});

tsts.run();
