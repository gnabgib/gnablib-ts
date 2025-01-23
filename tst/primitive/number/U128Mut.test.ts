import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U128, U128Mut } from '../../../src/primitive/number/U128';

const tsts = suite('U128Mut');

const h0 = '00000000000000000000000000000000';
const h1 = '00000000000000000000000000000001';
const hMax = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
const hNum = '0102030405060708090A0B0C0D0E0F11';
// - binary -
// 0000000100000010000000110000010000000101000001100000011100001000
// 0000100100001010000010110000110000001101000011100000111100010001
// - decimal -
// 1339673755198158349044581307228491537
const hNNum = 'FEFDFCFBFAF9F8F7F6F5F4F3F2F1F0EE';
const hexBuild = (h: string) => U128Mut.fromBytesBE(hex.toBytes(h));

const toStrTest = [
	h0,
	h1,
	'10000000000000000000000000000000',
	'FEDCBA98765432100000000000000000',
	'00000000000000000FEDCBA987654321',
	'C4D5E6F78091A2B30000000000000000',
	'0000000000000000C4D5E6F78091A2B3',
	hNum,
];
for (const expect of toStrTest) {
	tsts(`${expect}.toString`, () => {
		const u = hexBuild(expect);
		assert.is(u.toString(), expect);
	});
}

const u32le_hex_tests: [number[], string][] = [
	[[1, 2, 3, 4], '00000004000000030000000200000001'],
];
for (const [u32s, expect] of u32le_hex_tests) {
	const fromUints = U128Mut.fromI32s(...u32s);
	tsts(`fromUints(${u32s})`, () => {
		assert.is(fromUints.toString(), expect);
	});

	const fromBytesBE = hexBuild(expect);
	tsts(`fromBytesBE(${expect})`, () => {
		assert.is(fromBytesBE.toString(), expect, 'fromBytesBE');
	});

	tsts(`mount(${expect})`, () => {
		const arr = Uint32Array.from(u32s);
		const u = U128Mut.mount(arr);
		assert.is(u.toString(), expect);
	});
}

const fromIntTests: [number, string][] = [[1, h1]];
for (const [int, expect] of fromIntTests) {
	tsts(`fromInt(${int})`, () => {
		const u = U128Mut.fromInt(int);
		assert.is(u.toString(), expect);
	});
}

// prettier-ignore
const u8le_hex_tests: [Uint8Array, string][] = [
	[Uint8Array.of(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0),'000102030405060708090A0B0C0D0E0F',],
	[Uint8Array.of(1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),'00000000000000000000000000000001',],
	[Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1),'01000000000000000000000000000000',],
];
for (const [bytesLE, expect] of u8le_hex_tests) {
	tsts(`fromBytesLE(${expect})`, () => {
		const u = U128Mut.fromBytesLE(bytesLE);
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
    [hMax, 1, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE'],
    [hMax, 13, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFE000'],
    [hMax, 32, 'FFFFFFFFFFFFFFFFFFFFFFFF00000000'],
    [hMax, 64, 'FFFFFFFFFFFFFFFF0000000000000000'],

    [hNum, 0, hNum],
    [hNum, 1, '020406080A0C0E10121416181A1C1E22'],
    [hNum, 2, '04080C1014181C2024282C3034383C44'],
    [hNum, 16, '030405060708090A0B0C0D0E0F110000'],
    [hNum, 32, '05060708090A0B0C0D0E0F1100000000'],
    [hNum, 65, '121416181A1C1E220000000000000000'],
    [hNum, 120, '11000000000000000000000000000000'],
    //Can exceed size
    [hNum, 600, h0],
];
for (const [start, by, expect] of lShift_tests) {
	tsts(`${start} <<= ${by}`, () => {
		const a = hexBuild(start);
		const b = a.lShiftEq(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(a, b);
	});
}
// prettier-ignore
const rShift_tests: [string, number, string][] = [
    [h0, 0, h0],
    [h0, 1, h0],
    [h0, 13, h0],
    [h0, 32, h0],

    [hMax, 0, hMax],
    [hMax, 1, '7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    [hMax, 13, '0007FFFFFFFFFFFFFFFFFFFFFFFFFFFF'],
    [hMax, 32, '00000000FFFFFFFFFFFFFFFFFFFFFFFF'],
    [hMax, 64, '0000000000000000FFFFFFFFFFFFFFFF'],

    [hNum, 0, hNum],
    [hNum, 1, '00810182028303840485058606870788'],
    [hNum, 2, '004080C1014181C2024282C3034383C4'],
    [hNum, 16, '00000102030405060708090A0B0C0D0E'],
    [hNum, 32, '000000000102030405060708090A0B0C'],
    [hNum, 65, '00000000000000000081018202830384'],
    [hNum, 120, '00000000000000000000000000000001'],
    //Can exceed size
    [hNum, 600, h0],
];
for (const [start, by, expect] of rShift_tests) {
	tsts(`${start} >>= ${by}`, () => {
		const a = hexBuild(start);
		const b = a.rShiftEq(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(a, b);
	});
}
//https://onlinetools.com/binary/rotate-binary-bits
//https://www.rapidtables.com/convert/number/binary-to-hex.html
// prettier-ignore
const lRot_tests: [string, number, string][] = [
    [hNum, 0, hNum],
    [hNum, 1, '020406080A0C0E10121416181A1C1E22'],
    [hNum, 2, '04080C1014181C2024282C3034383C44'],
    [hNum, 16, '030405060708090A0B0C0D0E0F110102'],
    [hNum, 32, '05060708090A0B0C0D0E0F1101020304'],
    [hNum, 65, '121416181A1C1E22020406080A0C0E10'],
    [hNum, 120, '110102030405060708090A0B0C0D0E0F'],
    //Can exceed size
    [hNum, 600, '0C0D0E0F110102030405060708090A0B'],
];
for (const [start, by, expect] of lRot_tests) {
	tsts(`${start} ROL= ${by}`, () => {
		const a = hexBuild(start);
		const b = a.lRotEq(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(a, b);
	});
}
//Note these are the same as lRot(256-#)
// prettier-ignore
const rRot_tests: [string, number, string][] = [
    [hNum, 0, hNum],
    [hNum, 1, '80810182028303840485058606870788'],
];
for (const [start, by, expect] of rRot_tests) {
	tsts(`${start} ROR= ${by}`, () => {
		const a = hexBuild(start);
		const b = a.rRotEq(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(a, b);
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
	tsts(`${aHex} ^= ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.xorEq(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(a, res);
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
	tsts(`${aHex} |= ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.orEq(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(a, res);
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
	tsts(`${aHex} &= ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.andEq(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(a, res);
	});
}

const not_tests = [
	[h0, hMax],
	[hNum, hNNum],
];
for (const [start, expect] of not_tests) {
	tsts(`~=${start}`, () => {
		const a = hexBuild(start);
		const res = a.notEq();
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(a, res);
	});
}
//#endregion

//#region Arithmetic

// prettier-ignore
const add_tests=[
    // A+0=A: Anything plus zero is anything (like or)
    [hNum,h0,hNum],
    [hMax,h1,h0],
    [hMax,hNum,'0102030405060708090A0B0C0D0E0F10'],//Ends up being the same as -1 because of wrap
];
for (const [aHex, bHex, expect] of add_tests) {
	tsts(`${aHex} += ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.addEq(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(a, res);
		assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
	});
}

// prettier-ignore
const sub_tests:[string,string,string][]=[
    [h1,h1,h0],
    [h0,h1,hMax],
    [hNum,h1,'0102030405060708090A0B0C0D0E0F10'],
];
for (const [aHex, bHex, expect] of sub_tests) {
	tsts(`${aHex} -= ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.subEq(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(a, res);
		assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
	});
}

// // prettier-ignore
const mul_tests: [string, string, string][] = [
	//https://www.dcode.fr/big-numbers-multiplication
	[h0, hNum, h0],
	[h1, hNum, hNum],
	[hNum, hNum, '35AF166AAAD5EAE8CE9B4DE560BEFF21'],
];
for (const [aHex, bHex, expect] of mul_tests) {
	tsts(`${aHex} *= ${bHex}`, () => {
		const a = hexBuild(aHex);
		const b = hexBuild(bHex);
		const res = a.mulEq(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(a, res);
		assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
	});
}
//#endregion

tsts('set', () => {
	const o = U128Mut.fromInt(1);
	const i1 = U128.fromInt(2);

	assert.is(hex.fromBytes(o.toBytesBE()), h1);

	o.addEq(i1);
	assert.is(hex.fromBytes(o.toBytesBE()), '00000000000000000000000000000003');

	o.set(i1);
	assert.is(hex.fromBytes(o.toBytesBE()), '00000000000000000000000000000002');
});

tsts('u64at', () => {
	const u128 = U128Mut.fromI32s(1, 2, 3, 4);
	assert.is(
		hex.fromBytes(u128.toBytesBE()),
		'00000004000000030000000200000001'
	);
	const u0 = u128.u64at(0);
	const u1 = u128.u64at(1);
	assert.throws(() => u128.u64at(2), 'Only two u64 are available');
	assert.is(hex.fromBytes(u0.toBytesBE()), '0000000200000001');
	assert.is(hex.fromBytes(u1.toBytesBE()), '0000000400000003');
	u128.set(U128.fromI32s(5, 6, 7, 8));
	assert.is(
		hex.fromBytes(u128.toBytesBE()),
		'00000008000000070000000600000005'
	);
	assert.is(
		hex.fromBytes(u0.toBytesBE()),
		'0000000600000005',
		'u0 has updated'
	);
});

tsts('zero', () => {
	const o = U128Mut.fromInt(1);

	assert.is(hex.fromBytes(o.toBytesBE()), h1);

	o.zero();
	assert.is(hex.fromBytes(o.toBytesBE()), h0);
});

tsts.run();
