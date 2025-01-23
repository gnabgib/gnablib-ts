import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { I64 } from '../../../src/primitive/number/I64';
import { I64Mut } from '../../../src/primitive/number/I64Mut';
import util from 'util';

const tsts = suite('I64');

//#region Builds
// prettier-ignore
const fromInt_tests: [number, string][] = [
	[0, '0000000000000000'],
	[1, '0000000000000001'],
	[0xbeef, '000000000000BEEF'],
	[0xffffffff, '00000000FFFFFFFF'], //Max u32
	[4294967296, '0000000100000000'], //x100000000
	[4294967297, '0000000100000001'],
	[4294967298, '0000000100000002'],
	[Number.MAX_SAFE_INTEGER, '001FFFFFFFFFFFFF'], //Max int representable in JS
	[-0, '0000000000000000'], //FP64 allows this value even if integers don't
	[-1, 'FFFFFFFFFFFFFFFF'],
	[-2, 'FFFFFFFFFFFFFFFE'],
	[-4294967295, 'FFFFFFFF00000001'],
	[-4294967296, 'FFFFFFFF00000000'],
	[-4294967297, 'FFFFFFFEFFFFFFFF'],
	[-4294967298, 'FFFFFFFEFFFFFFFE'],
	[-8589934591, 'FFFFFFFE00000001'],
	[-8589934592, 'FFFFFFFE00000000'],
	[-8589934593, 'FFFFFFFDFFFFFFFF'],
	[Number.MIN_SAFE_INTEGER, 'FFE0000000000001'], //Min int representable in JS
];
for (const [i52, expect] of fromInt_tests) {
	tsts(`fromInt(${i52})`, () => {
		const a = I64.fromInt(i52);
		assert.is(hex.fromBytes(a.toBytesBE()), expect);
	});
	tsts(`fromBytesBE(${expect})`, () => {
		const a = I64.fromBytesBE(hex.toBytes(expect));
		assert.is(hex.fromBytes(a.toBytesBE()), expect);
	});
}

// prettier-ignore
const bad_fromInt_tests: number[] = [
	//Out of range
	1e16, -1e16,
	//Floating point (although technically the above are too)
	1.3,
];
for (const bad of bad_fromInt_tests) {
	tsts(`fromInt(${bad}) throws`, () => {
		assert.throws(() => I64.fromInt(bad));
	});
}

// prettier-ignore
const fromI32s_tests: [number[], string][] = [
	[[], '0000000000000000'],
	[[0], '0000000000000000'],
	[[0, 0], '0000000000000000'],
	[[1], '0000000000000001'],
	[[0, 1], '0000000100000000'],
	[[-1], 'FFFFFFFFFFFFFFFF'],
	//Strange builds
	[[-1, 0], '00000000FFFFFFFF'],
	[[0, -1], 'FFFFFFFF00000000'],
];
for (const [i32s, expect] of fromI32s_tests) {
	tsts(`fromI32s(${i32s})`, () => {
		const a = I64.fromI32s(...i32s);
		assert.is(hex.fromBytes(a.toBytesBE()), expect);
	});
}

const bad_fromI32s_tests: number[][] = [
	//Too many supplied
	[0, 0, 0],
	[0, 0, 0, 0],
];
for (const bad of bad_fromI32s_tests) {
	tsts(`fromI32s(${bad}) throws`, () => {
		assert.throws(() => I64.fromI32s(...bad));
	});
}

const bad_fromBytesBE_tests: string[] = [
	//Undersized
	'',
	'00',
	'0000',
	'000000',
	'00000000',
	'0000000000',
	'000000000000',
];
for (const bad of bad_fromBytesBE_tests) {
	tsts(`fromBytesBE(${bad}) throws`, () => {
		assert.throws(() => I64.fromBytesBE(hex.toBytes(bad)));
	});
}

// prettier-ignore
const mount_tests: [Uint32Array, number, string][] = [
	[Uint32Array.of(0, 1, 2, 3), 0, '0000000100000000'],
	[Uint32Array.of(0, 1, 2, 3), 1, '0000000200000001'],
	[Uint32Array.of(0, 1, 2, 3), 2, '0000000300000002'],
	[Uint32Array.of(0xffffffff, 0xffffffff), 0, 'FFFFFFFFFFFFFFFF'],
];
for (const [arr, pos, expect] of mount_tests) {
	tsts(`mount([${arr.length}],${pos})`, () => {
		const u = I64.mount(arr, pos);
		assert.is(hex.fromBytes(u.toBytesBE()), expect);
	});
}

const bad_mount_tests: [Uint32Array, number][] = [
	[new Uint32Array(0), 0],
	[new Uint32Array(0), 1],
	[new Uint32Array(0), 2],
	[new Uint32Array(1), 0],
	[new Uint32Array(1), 1],
	[new Uint32Array(1), 2],
	[new Uint32Array(2), 1],
	[new Uint32Array(2), 2],
];
for (const [arr, pos] of bad_mount_tests) {
	tsts(`mount([${arr.length}],${pos}) throws`, () => {
		assert.throws(() => I64.mount(arr, pos));
	});
}
//#endregion

//#region ShiftOps
// prettier-ignore
const lShift_tests: [string, number, string][] = [
	['0000000000000000', 0, '0000000000000000'],
	['0000000000000000', 1, '0000000000000000'],
	['0000000000000000', 13, '0000000000000000'],
	['0000000000000000', 32, '0000000000000000'],

	['FFFFFFFFFFFFFFFF', 0, 'FFFFFFFFFFFFFFFF'],
	['FFFFFFFFFFFFFFFF', 1, 'FFFFFFFFFFFFFFFE'],
	['FFFFFFFFFFFFFFFF', 13, 'FFFFFFFFFFFFE000'],
	['FFFFFFFFFFFFFFFF', 32, 'FFFFFFFF00000000'],
	['FFFFFFFFFFFFFFFF', 64, '0000000000000000'],

	['FEDCBA9876543210', 0, 'FEDCBA9876543210'],
	['FEDCBA9876543210', 1, 'FDB97530ECA86420'],
	['FEDCBA9876543210', 4, 'EDCBA98765432100'],
	['FEDCBA9876543210', 8, 'DCBA987654321000'],
	['FEDCBA9876543210', 16, 'BA98765432100000'],
	['FEDCBA9876543210', 24, '9876543210000000'],
	['FEDCBA9876543210', 28, '8765432100000000'],
	['FEDCBA9876543210', 31, '3B2A190800000000'],
	['FEDCBA9876543210', 32, '7654321000000000'],
	['FEDCBA9876543210', 33, 'ECA8642000000000'],
	['FEDCBA9876543210', 36, '6543210000000000'],
	['FEDCBA9876543210', 48, '3210000000000000'],
	['FEDCBA9876543210', 63, '0000000000000000'],
	['FEDCBA9876543210', 64, '0000000000000000'],
	//['FEDCBA9876543210', -1, '7F6E5D4C3B2A1908'],

	['0123456789ABCDEF', 0, '0123456789ABCDEF'],
	['0123456789ABCDEF', 1, '02468ACF13579BDE'],
	['0123456789ABCDEF', 4, '123456789ABCDEF0'],
	['0123456789ABCDEF', 8, '23456789ABCDEF00'],
	['0123456789ABCDEF', 16, '456789ABCDEF0000'],
	['0123456789ABCDEF', 24, '6789ABCDEF000000'],
	['0123456789ABCDEF', 28, '789ABCDEF0000000'],
	['0123456789ABCDEF', 31, 'C4D5E6F780000000'],
	['0123456789ABCDEF', 32, '89ABCDEF00000000'],
	['0123456789ABCDEF', 33, '13579BDE00000000'],
	['0123456789ABCDEF', 48, 'CDEF000000000000'],
	['0123456789ABCDEF', 64, '0000000000000000'],

	['8765432112345678', 8, '6543211234567800'],
	['8765432112345678', 44, '4567800000000000'],

	//We can exceed size with shifts
	['0123456789ABCDEF', 65, '0000000000000000'],
	['0123456789ABCDEF', 96, '0000000000000000'],
	['0123456789ABCDEF', 128, '0000000000000000'],
];
for (const [start, by, expect] of lShift_tests) {
	tsts(`${start} << ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = I64.fromBytesBE(aBytes);
		const b = a.lShift(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
	});
}

// prettier-ignore
const rShift_tests: [string, number, string][] = [
	['0000000000000000', 0, '0000000000000000'],
	['0000000000000000', 1, '0000000000000000'],
	['0000000000000000', 13, '0000000000000000'],
	['0000000000000000', 32, '0000000000000000'],
	['0000000000000000', 64, '0000000000000000'],

	['0123456789ABCDEF', 0, '0123456789ABCDEF'],
	['0123456789ABCDEF', 1, '0091A2B3C4D5E6F7'],
	['0123456789ABCDEF', 4, '00123456789ABCDE'],
	['0123456789ABCDEF', 8, '000123456789ABCD'],
	['0123456789ABCDEF', 16, '00000123456789AB'],
	['0123456789ABCDEF', 24, '0000000123456789'],
	['0123456789ABCDEF', 28, '0000000012345678'],
	['0123456789ABCDEF', 31, '0000000002468ACF'],
	['0123456789ABCDEF', 32, '0000000001234567'],
	['0123456789ABCDEF', 33, '000000000091A2B3'],
	['0123456789ABCDEF', 48, '0000000000000123'],
	['0123456789ABCDEF', 63, '0000000000000000'],
	['0123456789ABCDEF', 64, '0000000000000000'],

	//We can exceed size with shifts
	['0123456789ABCDEF', 65, '0000000000000000'],
	['0123456789ABCDEF', 96, '0000000000000000'],
	['0123456789ABCDEF', 128, '0000000000000000'],

	['FFFFFFFFFFFFFFFF', 0, 'FFFFFFFFFFFFFFFF'],

	//Valid for U64:
	// ['FFFFFFFFFFFFFFFF', 1, '7FFFFFFFFFFFFFFF'],
	// ['FFFFFFFFFFFFFFFF', 13, '0007FFFFFFFFFFFF'],
	// ['FFFFFFFFFFFFFFFF', 32, '00000000FFFFFFFF'],
	// ['FFFFFFFFFFFFFFFF', 64, '0000000000000000'],

	// ['FEDCBA9876543210', 0, 'FEDCBA9876543210'],
	// ['FEDCBA9876543210', 1, '7F6E5D4C3B2A1908'],
	// ['FEDCBA9876543210', 4, '0FEDCBA987654321'],
	// ['FEDCBA9876543210', 8, '00FEDCBA98765432'],
	// ['FEDCBA9876543210', 16, '0000FEDCBA987654'],
	// ['FEDCBA9876543210', 24, '000000FEDCBA9876'],
	// ['FEDCBA9876543210', 28, '0000000FEDCBA987'],
	// ['FEDCBA9876543210', 31, '00000001FDB97530'],
	// ['FEDCBA9876543210', 32, '00000000FEDCBA98'],
	// ['FEDCBA9876543210', 33, '000000007F6E5D4C'],
	// ['FEDCBA9876543210', 36, '000000000FEDCBA9'],
	// ['FEDCBA9876543210', 48, '000000000000FEDC'],
	// ['FEDCBA9876543210', 63, '0000000000000001'],
	// ['FEDCBA9876543210', 64, '0000000000000000'],
	//Valid for I64:
	['FFFFFFFFFFFFFFFF', 1, 'FFFFFFFFFFFFFFFF'],
	['FFFFFFFFFFFFFFFF', 13, 'FFFFFFFFFFFFFFFF'],
	['FFFFFFFFFFFFFFFF', 32, 'FFFFFFFFFFFFFFFF'],
	['FFFFFFFFFFFFFFFF', 64, 'FFFFFFFFFFFFFFFF'],

	['FEDCBA9876543210', 0, 'FEDCBA9876543210'],
	['FEDCBA9876543210', 1, 'FF6E5D4C3B2A1908'],
	['FEDCBA9876543210', 4, 'FFEDCBA987654321'],
	['FEDCBA9876543210', 8, 'FFFEDCBA98765432'],
	['FEDCBA9876543210', 16, 'FFFFFEDCBA987654'],
	['FEDCBA9876543210', 24, 'FFFFFFFEDCBA9876'],
	['FEDCBA9876543210', 28, 'FFFFFFFFEDCBA987'],
	['FEDCBA9876543210', 31, 'FFFFFFFFFDB97530'],
	['FEDCBA9876543210', 32, 'FFFFFFFFFEDCBA98'],
	['FEDCBA9876543210', 33, 'FFFFFFFFFF6E5D4C'],
	['FEDCBA9876543210', 36, 'FFFFFFFFFFEDCBA9'],
	['FEDCBA9876543210', 48, 'FFFFFFFFFFFFFEDC'],
	['FEDCBA9876543210', 63, 'FFFFFFFFFFFFFFFF'],
	['FEDCBA9876543210', 64, 'FFFFFFFFFFFFFFFF'],
	['8000000000000000', 0, '8000000000000000'],
	['8000000000000000', 1, 'C000000000000000'],
	['8000000000000000', 2, 'E000000000000000'],
	['8000000000000000', 3, 'F000000000000000'],
	['8000000000000000', 4, 'F800000000000000'],
];
for (const [start, by, expect] of rShift_tests) {
	tsts(`${start} >> ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = I64.fromBytesBE(aBytes);
		const b = a.rShift(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
	});
}

// prettier-ignore
const lRotTest: [string, number, string][] = [
	['0000000000000000', 0, '0000000000000000'],
	['0000000000000000', 1, '0000000000000000'],
	['0000000000000000', 13, '0000000000000000'],
	['0000000000000000', 32, '0000000000000000'],
	['0000000000000000', 64, '0000000000000000'],

	['FEDCBA9876543210', 0, 'FEDCBA9876543210'],
	['FEDCBA9876543210', 1, 'FDB97530ECA86421'],
	['FEDCBA9876543210', 4, 'EDCBA9876543210F'],
	['FEDCBA9876543210', 8, 'DCBA9876543210FE'],
	['FEDCBA9876543210', 12, 'CBA9876543210FED'],
	['FEDCBA9876543210', 16, 'BA9876543210FEDC'],
	['FEDCBA9876543210', 20, 'A9876543210FEDCB'],
	['FEDCBA9876543210', 24, '9876543210FEDCBA'],
	['FEDCBA9876543210', 28, '876543210FEDCBA9'],
	['FEDCBA9876543210', 31, '3B2A19087F6E5D4C'],
	['FEDCBA9876543210', 32, '76543210FEDCBA98'],
	['FEDCBA9876543210', 33, 'ECA86421FDB97530'],
	['FEDCBA9876543210', 36, '6543210FEDCBA987'],
	['FEDCBA9876543210', 40, '543210FEDCBA9876'],
	['FEDCBA9876543210', 44, '43210FEDCBA98765'],
	['FEDCBA9876543210', 48, '3210FEDCBA987654'],
	['FEDCBA9876543210', 52, '210FEDCBA9876543'],
	['FEDCBA9876543210', 56, '10FEDCBA98765432'],
	['FEDCBA9876543210', 60, '0FEDCBA987654321'],
	['FEDCBA9876543210', 63, '7F6E5D4C3B2A1908'],
	['FEDCBA9876543210', 64, 'FEDCBA9876543210'],

	['0123456789ABCDEF', 0, '0123456789ABCDEF'],
	['0123456789ABCDEF', 1, '02468ACF13579BDE'],
	['0123456789ABCDEF', 2, '048D159E26AF37BC'],
	['0123456789ABCDEF', 3, '091A2B3C4D5E6F78'],
	['0123456789ABCDEF', 4, '123456789ABCDEF0'],
	['0123456789ABCDEF', 8, '23456789ABCDEF01'],
	['0123456789ABCDEF', 12, '3456789ABCDEF012'],
	['0123456789ABCDEF', 16, '456789ABCDEF0123'],
	['0123456789ABCDEF', 20, '56789ABCDEF01234'],
	['0123456789ABCDEF', 24, '6789ABCDEF012345'],
	['0123456789ABCDEF', 28, '789ABCDEF0123456'],
	['0123456789ABCDEF', 31, 'C4D5E6F78091A2B3'],
	['0123456789ABCDEF', 32, '89ABCDEF01234567'],
	['0123456789ABCDEF', 33, '13579BDE02468ACF'],
	['0123456789ABCDEF', 36, '9ABCDEF012345678'],
	['0123456789ABCDEF', 40, 'ABCDEF0123456789'],
	['0123456789ABCDEF', 44, 'BCDEF0123456789A'],
	['0123456789ABCDEF', 48, 'CDEF0123456789AB'],
	['0123456789ABCDEF', 52, 'DEF0123456789ABC'],
	['0123456789ABCDEF', 56, 'EF0123456789ABCD'],
	['0123456789ABCDEF', 60, 'F0123456789ABCDE'],
	['0123456789ABCDEF', 63, '8091A2B3C4D5E6F7'],
	['0123456789ABCDEF', 64, '0123456789ABCDEF'],
	//We can exceed
	['0123456789ABCDEF', 65, '02468ACF13579BDE'], //Same as 1
	['0123456789ABCDEF', -1, '8091A2B3C4D5E6F7'], //Same as 63
];
for (const [start, by, expect] of lRotTest) {
	tsts(`${start} ROL ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = I64.fromBytesBE(aBytes);
		const b = a.lRot(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
	});
}

// prettier-ignore
const rRotTest: [string, number, string][] = [
	['0000000000000000', 0, '0000000000000000'],
	['0000000000000000', 1, '0000000000000000'],
	['0000000000000000', 13, '0000000000000000'],
	['0000000000000000', 32, '0000000000000000'],
	['0000000000000000', 64, '0000000000000000'],

	['FEDCBA9876543210', 0, 'FEDCBA9876543210'],
	['FEDCBA9876543210', 1, '7F6E5D4C3B2A1908'],
	['FEDCBA9876543210', 4, '0FEDCBA987654321'],
	['FEDCBA9876543210', 8, '10FEDCBA98765432'],
	['FEDCBA9876543210', 12, '210FEDCBA9876543'],
	['FEDCBA9876543210', 16, '3210FEDCBA987654'],
	['FEDCBA9876543210', 20, '43210FEDCBA98765'],
	['FEDCBA9876543210', 24, '543210FEDCBA9876'],
	['FEDCBA9876543210', 28, '6543210FEDCBA987'],
	['FEDCBA9876543210', 31, 'ECA86421FDB97530'],
	['FEDCBA9876543210', 32, '76543210FEDCBA98'],
	['FEDCBA9876543210', 33, '3B2A19087F6E5D4C'],
	['FEDCBA9876543210', 36, '876543210FEDCBA9'],
	['FEDCBA9876543210', 40, '9876543210FEDCBA'],
	['FEDCBA9876543210', 44, 'A9876543210FEDCB'],
	['FEDCBA9876543210', 48, 'BA9876543210FEDC'],
	['FEDCBA9876543210', 52, 'CBA9876543210FED'],
	['FEDCBA9876543210', 56, 'DCBA9876543210FE'],
	['FEDCBA9876543210', 60, 'EDCBA9876543210F'],
	['FEDCBA9876543210', 63, 'FDB97530ECA86421'],
	['FEDCBA9876543210', 64, 'FEDCBA9876543210'],

	['0123456789ABCDEF', 0, '0123456789ABCDEF'],
	['0123456789ABCDEF', 1, '8091A2B3C4D5E6F7'],
	['0123456789ABCDEF', 4, 'F0123456789ABCDE'],
	['0123456789ABCDEF', 8, 'EF0123456789ABCD'],
	['0123456789ABCDEF', 12, 'DEF0123456789ABC'],
	['0123456789ABCDEF', 16, 'CDEF0123456789AB'],
	['0123456789ABCDEF', 20, 'BCDEF0123456789A'],
	['0123456789ABCDEF', 24, 'ABCDEF0123456789'],
	['0123456789ABCDEF', 28, '9ABCDEF012345678'],
	['0123456789ABCDEF', 31, '13579BDE02468ACF'],
	['0123456789ABCDEF', 32, '89ABCDEF01234567'],
	['0123456789ABCDEF', 33, 'C4D5E6F78091A2B3'],
	['0123456789ABCDEF', 36, '789ABCDEF0123456'],
	['0123456789ABCDEF', 40, '6789ABCDEF012345'],
	['0123456789ABCDEF', 44, '56789ABCDEF01234'],
	['0123456789ABCDEF', 48, '456789ABCDEF0123'],
	['0123456789ABCDEF', 52, '3456789ABCDEF012'],
	['0123456789ABCDEF', 56, '23456789ABCDEF01'],
	['0123456789ABCDEF', 60, '123456789ABCDEF0'],
	['0123456789ABCDEF', 63, '02468ACF13579BDE'],
	['0123456789ABCDEF', 64, '0123456789ABCDEF'],
	//We can exceed
	['0123456789ABCDEF', 65, '8091A2B3C4D5E6F7'], //Same as 1
	['0123456789ABCDEF', -1, '02468ACF13579BDE'], //Same as 63
];
for (const [start, by, expect] of rRotTest) {
	tsts(`${start} ROR ${by}`, () => {
		const aBytes = hex.toBytes(start);
		const a = I64.fromBytesBE(aBytes);
		const b = a.rRot(by);
		assert.is(hex.fromBytes(b.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), start, 'No mutation');
	});
}
//#endregion

//#region LogicOps
// prettier-ignore
const xor_tests=[
    // A^0=A: Anything xor zero is anything
    ['0000000000000000','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['0000000000000000','0123456789ABCDEF','0123456789ABCDEF'],
    ['0000000000000000','FEDCBA9876543210','FEDCBA9876543210'],
    ['0000000000000000','0000000000000000','0000000000000000'],
    // A^1=~A:  Anything XOR 1 is its compliment
    ['FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF','0000000000000000'],
    ['FFFFFFFFFFFFFFFF','0123456789ABCDEF','FEDCBA9876543210'],
    ['FFFFFFFFFFFFFFFF','FEDCBA9876543210','0123456789ABCDEF'],
    // A^~A=1 Anything xor its compliment is 1
    ['00000000FFFFFFFF','FFFFFFFF00000000','FFFFFFFFFFFFFFFF'],
    ['C3A5A5A5A5A5A53C','3C5A5A5A5A5A5AC3','FFFFFFFFFFFFFFFF'],
    ['C35A5A5A5A5A5A3C','3CA5A5A5A5A5A5C3','FFFFFFFFFFFFFFFF'],
    ['FEDCBA9876543210','0123456789ABCDEF','FFFFFFFFFFFFFFFF'],
    // A^A=A Anything xor itself is 0
    ['00000000FFFFFFFF','00000000FFFFFFFF','0000000000000000'],
    ['C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C','0000000000000000'],
    ['C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C','0000000000000000'],
    ['FEDCBA9876543210','FEDCBA9876543210','0000000000000000'],
    // Other cases
    ['FEDCBA9876543210','0000000FFFFFFFFF','FEDCBA9789ABCDEF'],
    ['C3A5A5A5A5A5A53C','0000000FFFFFFFFF','C3A5A5AA5A5A5AC3'],
    ['FEDCBA9876543210','FFFFFFFFF0000000','0123456786543210'],
    ['C3A5A5A5A5A5A53C','FFFFFFFFF0000000','3C5A5A5A55A5A53C'],
    ['0000000000000001','0000000000000002','0000000000000003'],
    ['0000000000000001','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFE'],
];
for (const [aHex, bHex, expect] of xor_tests) {
	tsts(`${aHex} ^ ${bHex}`, () => {
		const a = I64.fromBytesBE(hex.toBytes(aHex));
		const b = I64.fromBytesBE(hex.toBytes(bHex));
		const res = a.xor(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation');
	});
}

// prettier-ignore
const or_tests=[
    // A|0=A: Anything or zero is anything
    ['0000000000000000','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['0000000000000000','0123456789ABCDEF','0123456789ABCDEF'],
    ['0000000000000000','FEDCBA9876543210','FEDCBA9876543210'],
    ['0000000000000000','0000000000000000','0000000000000000'],
    // A|1=1:  Anything or 1 is 1
    ['FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['FFFFFFFFFFFFFFFF','0123456789ABCDEF','FFFFFFFFFFFFFFFF'],
    ['FFFFFFFFFFFFFFFF','FEDCBA9876543210','FFFFFFFFFFFFFFFF'],
    // A|~A=1: Anything or its compliment is 1
    ['00000000FFFFFFFF','FFFFFFFF00000000','FFFFFFFFFFFFFFFF'],
    ['C3A5A5A5A5A5A53C','3C5A5A5A5A5A5AC3','FFFFFFFFFFFFFFFF'],
    ['C35A5A5A5A5A5A3C','3CA5A5A5A5A5A5C3','FFFFFFFFFFFFFFFF'],
    ['FEDCBA9876543210','0123456789ABCDEF','FFFFFFFFFFFFFFFF'],
    // A|A=A: Anything or itself is itself
    ['00000000FFFFFFFF','00000000FFFFFFFF','00000000FFFFFFFF'],
    ['C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C'],
    ['C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C'],
    ['FEDCBA9876543210','FEDCBA9876543210','FEDCBA9876543210'],
    // Any bits set override the other value (form of masking)
    ['FEDCBA9876543210','0000000FFFFFFFFF','FEDCBA9FFFFFFFFF'],
    ['C3A5A5A5A5A5A53C','0000000FFFFFFFFF','C3A5A5AFFFFFFFFF'],
    ['FEDCBA9876543210','FFFFFFFFF0000000','FFFFFFFFF6543210'],
    ['C3A5A5A5A5A5A53C','FFFFFFFFF0000000','FFFFFFFFF5A5A53C'],
    ['0000000000000001','0000000000000002','0000000000000003'],
    ['0000000000000001','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
];
for (const [aHex, bHex, expect] of or_tests) {
	tsts(`${aHex} | ${bHex}`, () => {
		const a = I64.fromBytesBE(hex.toBytes(aHex));
		const b = I64.fromBytesBE(hex.toBytes(bHex));
		const res = a.or(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation');
	});
}

// prettier-ignore
const and_tests=[
    // A&0=0: Zero and anything is zero
    ['0000000000000000','FFFFFFFFFFFFFFFF','0000000000000000'],
    ['0000000000000000','0123456789ABCDEF','0000000000000000'],
    ['0000000000000000','FEDCBA9876543210','0000000000000000'],
    ['0000000000000000','0000000000000000','0000000000000000'],
    // A&1=A:  All set and anything is anything
    ['FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['FFFFFFFFFFFFFFFF','0123456789ABCDEF','0123456789ABCDEF'],
    ['FFFFFFFFFFFFFFFF','FEDCBA9876543210','FEDCBA9876543210'],
    // A&~A=0: Anything and its compliment is 0
    ['00000000FFFFFFFF','FFFFFFFF00000000','0000000000000000'],
    ['C3A5A5A5A5A5A53C','3C5A5A5A5A5A5AC3','0000000000000000'],
    ['C35A5A5A5A5A5A3C','3CA5A5A5A5A5A5C3','0000000000000000'],
    ['FEDCBA9876543210','0123456789ABCDEF','0000000000000000'],
    // A&A=A: Anything and itself is itself
    ['00000000FFFFFFFF','00000000FFFFFFFF','00000000FFFFFFFF'],
    ['C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C'],
    ['C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C'],
    ['FEDCBA9876543210','FEDCBA9876543210','FEDCBA9876543210'],
    // Only bits set to true in both survive (form of masking)
    ['FEDCBA9876543210','0000000FFFFFFFFF','0000000876543210'],
    ['C3A5A5A5A5A5A53C','0000000FFFFFFFFF','00000005A5A5A53C'],
    ['FEDCBA9876543210','FFFFFFFFF0000000','FEDCBA9870000000'],
    ['C3A5A5A5A5A5A53C','FFFFFFFFF0000000','C3A5A5A5A0000000'],
    ['0000000000000001','0000000000000002','0000000000000000'],
    ['0000000000000001','FFFFFFFFFFFFFFFF','0000000000000001'],
];
for (const [aHex, bHex, expect] of and_tests) {
	tsts(`${aHex} & ${bHex}`, () => {
		const a = I64.fromBytesBE(hex.toBytes(aHex));
		const b = I64.fromBytesBE(hex.toBytes(bHex));
		const res = a.and(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation');
	});
}

// prettier-ignore
const not_tests = [
	['0000000000000000', 'FFFFFFFFFFFFFFFF'],
	['00000000FFFFFFFF', 'FFFFFFFF00000000'],
	['FFFFFFFF00000000', '00000000FFFFFFFF'],
	['FFFFFFFFFFFFFFFF', '0000000000000000'],
	['C3A5A5A5A5A5A53C', '3C5A5A5A5A5A5AC3'], //A=1010, 5=0101, C=1100, 3=0011
	['C35A5A5A5A5A5A3C', '3CA5A5A5A5A5A5C3'],
	['FEDCBA9876543210', '0123456789ABCDEF'],
	['0123456789ABCDEF', 'FEDCBA9876543210'],
];
for (const [start, expect] of not_tests) {
	tsts(`~${start}`, () => {
		const a = I64.fromBytesBE(hex.toBytes(start));
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
    ['0000000000000000','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['0000000000000000','0123456789ABCDEF','0123456789ABCDEF'],
    ['0000000000000000','FEDCBA9876543210','FEDCBA9876543210'],
    ['0000000000000000','0000000000000000','0000000000000000'],
    // A+1=A:  Anything plus 1 overflows
    ['FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFE'],//Overflow
    ['FFFFFFFFFFFFFFFF','0123456789ABCDEF','0123456789ABCDEE'],//Overflow
    ['FFFFFFFFFFFFFFFF','FEDCBA9876543210','FEDCBA987654320F'],//Overflow
    ['FFFFFFFFFFFFFFFF','0000000000000000','FFFFFFFFFFFFFFFF'],
    // A+~A .. is 1 (like or)
    ['00000000FFFFFFFF','FFFFFFFF00000000','FFFFFFFFFFFFFFFF'],
    ['C3A5A5A5A5A5A53C','3C5A5A5A5A5A5AC3','FFFFFFFFFFFFFFFF'],
    ['C35A5A5A5A5A5A3C','3CA5A5A5A5A5A5C3','FFFFFFFFFFFFFFFF'],
    ['FEDCBA9876543210','0123456789ABCDEF','FFFFFFFFFFFFFFFF'],
    // A+A=2A
    ['00000000FFFFFFFF','00000000FFFFFFFF','00000001FFFFFFFE'],
    ['C3A5A5A5A5A5A53C','C3A5A5A5A5A5A53C','874B4B4B4B4B4A78'],//Overflow
    ['C35A5A5A5A5A5A3C','C35A5A5A5A5A5A3C','86B4B4B4B4B4B478'],//Overflow
    ['FEDCBA9876543210','FEDCBA9876543210','FDB97530ECA86420'],//Overflow
    // Others
    ['FEDCBA9876543210','0000000FFFFFFFFF','FEDCBAA87654320F'],
    ['C3A5A5A5A5A5A53C','0000000FFFFFFFFF','C3A5A5B5A5A5A53B'],
    ['FEDCBA9876543210','FFFFFFFFF0000000','FEDCBA9866543210'],//Overflow
    ['C3A5A5A5A5A5A53C','FFFFFFFFF0000000','C3A5A5A595A5A53C'],//Overflow
    ['0000000000000001','0000000000000002','0000000000000003'],
    ['0000000000000001','FFFFFFFFFFFFFFFF','0000000000000000'],//Overflow
];
for (const [aHex, bHex, expect] of add_tests) {
	tsts(`${aHex} + ${bHex}`, () => {
		const a = I64.fromBytesBE(hex.toBytes(aHex));
		const b = I64.fromBytesBE(hex.toBytes(bHex));
		const res = a.add(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation-a');
		assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
	});
}

// prettier-ignore
const sub_tests:[number,number,string][]=[
    [1,1,'0000000000000000'],
    [2,1,'0000000000000001'],
    [0,2,'FFFFFFFFFFFFFFFE'],
    [0xffffffff,1,'00000000FFFFFFFE'],
    [1,0,'0000000000000001'],
];
for (const [aNum, bNum, expect] of sub_tests) {
	tsts(`${aNum} - ${bNum}`, () => {
		const a = I64.fromInt(aNum);
		const b = I64.fromInt(bNum);
		const aHex = a.toString();
		const bHex = b.toString();
		const res = a.sub(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation-a');
		assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
	});
}

// prettier-ignore
const mul_tests=[
    ['0000000000000001','0000000000000002','0000000000000002'],
    ['000000000000FFFF','000000000000FFFF','00000000FFFE0001'],
    ['00000000000FFFFF','00000000000FFFFF','000000FFFFE00001'],
    ['0000000000FFFFFF','0000000000FFFFFF','0000FFFFFE000001'],
    ['000000000FFFFFFF','000000000FFFFFFF','00FFFFFFE0000001'],
    ['00000000FFFFFFFF','00000000FFFFFFFF','FFFFFFFE00000001'],
    ['0000000FFFFFFFFF','0000000FFFFFFFFF','FFFFFFE000000001'],
    ['000000FFFFFFFFFF','000000FFFFFFFFFF','FFFFFE0000000001'],
    ['00000FFFFFFFFFFF','00000FFFFFFFFFFF','FFFFE00000000001'],
    ['0000FFFFFFFFFFFF','0000FFFFFFFFFFFF','FFFE000000000001'],
    ['000FFFFFFFFFFFFF','000FFFFFFFFFFFFF','FFE0000000000001'],
    ['00FFFFFFFFFFFFFF','00FFFFFFFFFFFFFF','FE00000000000001'],
    ['0FFFFFFFFFFFFFFF','0FFFFFFFFFFFFFFF','E000000000000001'],
    ['FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF','0000000000000001'],
    ['000000000000FFFF','0000000000000003','000000000002FFFD'],
    ['00000000000FFFFF','0000000000000035','00000000034FFFCB'],
    ['0000000000FFFFFF','0000000000000357','0000000356FFFCA9'],
    ['000000000FFFFFFF','000000000000357B','00000357AFFFCA85'],
    ['00000000FFFFFFFF','00000000000357BD','000357BCFFFCA843'],
    ['0000000FFFFFFFFF','0000000000357BDB','0357BDAFFFCA8425'],
    ['000000FFFFFFFFFF','000000000357BDB7','57BDB6FFFCA84249'],
    ['00000FFFFFFFFFFF','00000000357BDB75','BDB74FFFCA84248B'],
    ['0000FFFFFFFFFFFF','0000000357BDB753','B752FFFCA84248AD'],
    ['000FFFFFFFFFFFFF','000000357BDB7535','534FFFCA84248ACB'],
    ['00FFFFFFFFFFFFFF','00000357BDB75357','56FFFCA84248ACA9'],
    ['0FFFFFFFFFFFFFFF','0000357BDB75357B','AFFFCA84248ACA85'],
    ['FFFFFFFFFFFFFFFF','000357BDB75357BD','FFFCA84248ACA843'],
    ['0000000000000001','FFFFFFFFFFFFFFFF','FFFFFFFFFFFFFFFF'],
    ['00000000EE6B2800','000000000000000D','0000000C1B710800'],//4B*13 =52B
    ['000000003B9ACA00','000000003B9ACA00','0DE0B6B3A7640000'],//1B*1B=1x10^18
    ['0000000ABCDEF123','000000000BEBA7E9','7FFFFFFF32584DDB'],
    ['7FFFFFFFFFFFFFFF','0000000000000010','FFFFFFFFFFFFFFF0'],//Prove it is unsigned
    ['1111111111111111','000000000000000F','FFFFFFFFFFFFFFFF'],
    ['1111111111111111','00000000000000EE','DDDDDDDDDDDDDDCE'],
    ['1111111111111111','0000000000000DDD','99999999999998AD'],
    ['1111111111111111','000000000000CCCC','333333333333258C'],
    ['1111111111111111','00000000000BBBBB','AAAAAAAAAAA9E26B'],
    ['1111111111111111','0000000000AAAAAA','FFFFFFFFFFF49F4A'],
    ['1111111111111111','0000000009999999','33333333328F5C29'],
    ['1111111111111111','0000000088888888','444444443B2A1908'],
    ['1111111111111111','0000000777777777','33333332B3C4D5E7'],
    ['1111111111111111','0000006666666666','FFFFFFF92C5F92C6'],
    ['1111111111111111','0000055555555555','AAAAAA4FA4FA4FA5'],
    ['1111111111111111','0000444444444444','33332EA61D950C84'],
    ['1111111111111111','0003333333333333','999962FC962FC963'],
    ['1111111111111111','0022222222222222','DDDB97530ECA8642'],
    ['1111111111111111','0111111111111111','FFEDCBA987654321'],
];
for (const [aHex, bHex, expect] of mul_tests) {
	tsts(`${aHex} * ${bHex}`, () => {
		const a = I64.fromBytesBE(hex.toBytes(aHex));
		const b = I64.fromBytesBE(hex.toBytes(bHex));
		const res = a.mul(b);
		assert.is(hex.fromBytes(res.toBytesBE()), expect);
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation-a');
		assert.is(hex.fromBytes(b.toBytesBE()), bHex, 'No mutation-b');
	});
}

// prettier-ignore
const abs_tests = [
    [0, 0],
    [1, 1],
    [2, 2],
    [127, 127],
    [128, 128],
    [32768, 32768],
    [8388607, 8388607],
    [2147483647, 2147483647],
    [549755813887, 549755813887],
    [140737488355327, 140737488355327],
    [9007199254740991, 9007199254740991], //MAX_SAFE_INT
    [-1, 1],
    [-127, 127],
    [-128, 128],
    [-32767, 32767],
    [-32768, 32768],
    [-8388607, 8388607],
    [-8388608, 8388608],
    [-2147483647, 2147483647],
    [-2147483648, 2147483648],
    [-4294967296, 4294967296],
    [-549755813887, 549755813887],
    [-549755813888, 549755813888],
    [-140737488355327, 140737488355327],
    [-140737488355328, 140737488355328],
    [-9007199254740991, 9007199254740991], //MIN_SAFE_INT
];
for (const [aNum, bNum] of abs_tests) {
	const a = I64.fromInt(aNum);
	const aHex = hex.fromBytes(a.toBytesBE());
	const b = I64.fromInt(bNum);
	tsts(`abs(${aNum})`, () => {
		const res = a.abs();
		assert.equal(hex.fromBytes(res.toBytesBE()), hex.fromBytes(b.toBytesBE()));
		assert.is(hex.fromBytes(a.toBytesBE()), aHex, 'No mutation-a');
	});
}
//#endregion

//#region Comparable
// prettier-ignore
const eq_tests:[number,number,boolean][]=[
    [0,0,true],
    [0,1,false],
    [0,0xffffffff,false],

    [1,0,false],
    [1,1,true],
    [1,0xffffffff,false],

    [0xffffffff,0,false],
    [0xffffffff,1,false],
    [0xffffffff,0xffffffff,true],

    //0x00000001 00000001 = 4294967297
    [4294967297,0,false],
    [4294967297,1,false],
    [4294967297,4294967296,false],
    [4294967297,4294967297,true],

];
for (const [aNum, bNum, expect] of eq_tests) {
	tsts(`${aNum}==${bNum}`, () => {
		const a = I64.fromInt(aNum);
		const b = I64.fromInt(bNum);
		assert.is(a.eq(b), expect);
	});
}

const eq_set: string[] = [
	'0000000000000000',
	'0000000000000001',
	'0102030405060708',
	'0102030405060709',
	'FFFFFFFFFFFFFFF0',
	'FFFFFFFFFFFFFFFF',
];
for (const aHex of eq_set) {
	const bHex = aHex;
	const a = I64.fromBytesBE(hex.toBytes(aHex));
	const b = I64.fromBytesBE(hex.toBytes(bHex));
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
    ['0000000000000000','0000000000000001'],
    ['0000000000000001','0000000000000002'],
    ['FFFFFFFFFFFFFFFF','0000000000000000'],
    ['8000000000000000','7FFFFFFFFFFFFFFF'],//min < max
    ['FFFFFFFFFFFFFFFE','FFFFFFFFFFFFFFFF'],//-2 < -1
];
for (const [aHex, bHex] of lt_set) {
	const a = I64.fromBytesBE(hex.toBytes(aHex));
	const b = I64.fromBytesBE(hex.toBytes(bHex));
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
	const a = I64.fromInt(1);
	const b = a.clone();
	//Object eq tests
	assert.is(a, a);
	assert.is.not(a, b);
});

tsts(`clone32`, () => {
	//Really just for coverage
	const a = I64.fromInt(1);
	const a32 = a.clone32();
	assert.instance(a32, Uint32Array);
	assert.is(a32.length, 2);
	assert.is(a32[0], 1);
	assert.is(a32[1], 0);
});

tsts(`mut`, () => {
	const a = I64.fromInt(1);
	assert.is(hex.fromBytes(a.toBytesBE()), '0000000000000001');
	const b = a.mut();
	b.addEq(I64.fromInt(1));
	assert.is(hex.fromBytes(b.toBytesBE()), '0000000000000002');
});

const getByte_tests: [string, number, number][] = [
	['0123456789ABCDEF', 0, 0xef],
	['0123456789ABCDEF', 1, 0xcd],
	['0123456789ABCDEF', 2, 0xab],
	['0123456789ABCDEF', 3, 0x89],
	['0123456789ABCDEF', 4, 0x67],
	['0123456789ABCDEF', 5, 0x45],
	['0123456789ABCDEF', 6, 0x23],
	['0123456789ABCDEF', 7, 1],
];
for (const [aHex, byteIdx, expect] of getByte_tests) {
	const a = I64.fromBytesBE(hex.toBytes(aHex));
	tsts(`${aHex}.getByte(${byteIdx})`, () => {
		assert.is(hex.fromBytes(a.toBytesBE()), aHex);
		assert.is(a.getByte(byteIdx), expect, hex.fromByte(expect));
	});
}

const bad_getByte_tests: number[] = [-1, 8, 100];
for (const bad of bad_getByte_tests) {
	const a = I64.fromInt(0x12);
	tsts(`0x12.getByte(${bad}) throws`, () => {
		assert.throws(() => a.getByte(bad));
	});
}

tsts('zero', () => {
	const z = I64.zero;
	assert.is(z.toString(), '0000000000000000');
});

tsts('[Symbol.toStringTag]', () => {
	const o = I64.fromInt(1);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('I64') > 0, true);
});

tsts('util.inspect', () => {
	const o = I64.fromInt(1);
	const u = util.inspect(o);
	assert.is(u.startsWith('I64'), true);
});

tsts.run();
