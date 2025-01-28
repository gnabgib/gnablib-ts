import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { asLE } from '../../../src/endian';
import { U32 } from '../../../src/primitive/number';
import util from 'util';

const tsts = suite('U32');

//#region ShiftOps
const lRot = [
	[0x00000000, 0, 0x00000000],
	[0x00000000, 1, 0x00000000],
	[0x00000000, 3, 0x00000000],
	[0x00000000, 13, 0x00000000],
	[0x00000000, 29, 0x00000000],

	[0x00000001, 0, 0x00000001],
	[0x00000001, 1, 0x00000002],
	[0x00000001, 3, 0x00000008],
	[0x00000001, 13, 0x00002000],
	[0x00000001, 29, 0x20000000],

	[0x0f0f0f0f, 0, 0x0f0f0f0f],
	[0x0f0f0f0f, 1, 0x1e1e1e1e],
	[0x0f0f0f0f, 2, 0x3c3c3c3c],
	[0x0f0f0f0f, 3, 0x78787878],
	[0x0f0f0f0f, 4, 0xf0f0f0f0],
	[0x0f0f0f0f, 13, 0xe1e1e1e1],
	[0x0f0f0f0f, 29, 0xe1e1e1e1],

	[0xf0f0f0f0, 0, 0xf0f0f0f0],
	[0xf0f0f0f0, 1, 0xe1e1e1e1],
	[0xf0f0f0f0, 2, 0xc3c3c3c3],
	[0xf0f0f0f0, 3, 0x87878787],
	[0xf0f0f0f0, 4, 0x0f0f0f0f],
	[0xf0f0f0f0, 13, 0x1e1e1e1e],
	[0xf0f0f0f0, 29, 0x1e1e1e1e],

	[0x0000ffff, 0, 0x0000ffff],
	[0x0000ffff, 1, 0x0001fffe],
	[0x0000ffff, 3, 0x0007fff8],
	[0x0000ffff, 13, 0x1fffe000],
	[0x0000ffff, 29, 0xe0001fff],
	[0x0000ffff, 32, 0x0000ffff],

	[0xffffffff, 0, 0xffffffff],
	[0xffffffff, 1, 0xffffffff],
	[0xffffffff, 3, 0xffffffff],
	[0xffffffff, 13, 0xffffffff],
	[0xffffffff, 29, 0xffffffff],
	[0xffffffff, 32, 0xffffffff],

	[0x12345678, 0, 0x12345678],
	[0x12345678, 1, 0x2468acf0],
	[0x12345678, 31, 0x91a2b3c],
	[0x12345678, 32, 0x12345678],
	[0x12345678, 33, 0x2468acf0],
];
for (const [start, by, result] of lRot) {
	tsts(`${start}.lRot(${by})`, () => {
		const u = U32.fromInt(start);
		assert.is(u.lRot(by).value, result);
	});
}

const lShift = [
	[0x00000000, 0, 0x00000000],
	[0x00000000, 1, 0x00000000],
	[0x00000000, 3, 0x00000000],
	[0x00000000, 13, 0x00000000],
	[0x00000000, 29, 0x00000000],

	[0x00000001, 0, 0x00000001],
	[0x00000001, 1, 0x00000002],
	[0x00000001, 3, 0x00000008],
	[0x00000001, 13, 0x00002000],
	[0x00000001, 29, 0x20000000],

	[0x0f0f0f0f, 0, 0x0f0f0f0f],
	[0x0f0f0f0f, 1, 0x1e1e1e1e],
	[0x0f0f0f0f, 3, 0x78787878],
	[0x0f0f0f0f, 13, 0xe1e1e000],
	[0x0f0f0f0f, 29, 0xe0000000],

	[0xffffffff, 0, 0xffffffff],
	[0xffffffff, 1, 0xfffffffe],
	[0xffffffff, 3, 0xfffffff8],
	[0xffffffff, 13, 0xffffe000],
	[0xffffffff, 29, 0xe0000000],
	[0xffffffff, 30, 0xc0000000],
	[0xffffffff, 31, 0x80000000],
	//Can exceed
	[0xffffffff, 32, 0],
	[0xffffffff, 33, 0],
];
for (const [start, by, result] of lShift) {
	tsts(start + ' << ' + by, () => {
		const u = U32.fromInt(start);
		assert.is(u.lShift(by).value, result);
	});
}

const rShift = [
	[0x00000000, 0, 0x00000000],
	[0x00000000, 1, 0x00000000],
	[0x00000000, 3, 0x00000000],
	[0x00000000, 13, 0x00000000],
	[0x00000000, 29, 0x00000000],

	[0x00000001, 0, 0x00000001],
	[0x00000001, 1, 0x00000000],
	[0x00000001, 3, 0x00000000],
	[0x00000001, 13, 0x00000000],
	[0x00000001, 29, 0x00000000],

	[0x0f0f0f0f, 0, 0x0f0f0f0f],
	[0x0f0f0f0f, 1, 0x07878787],
	[0x0f0f0f0f, 3, 0x01e1e1e1],
	[0x0f0f0f0f, 13, 0x00007878],
	[0x0f0f0f0f, 29, 0x00000000],

	[0xffffffff, 0, 0xffffffff],
	[0xffffffff, 1, 0x7fffffff],
	[0xffffffff, 3, 0x1fffffff],
	[0xffffffff, 13, 0x0007ffff],
	[0xffffffff, 29, 0x00000007],
	[0xffffffff, 31, 1],
	//Can exceed
	[0xffffffff, 32, 0],
	[0xffffffff, 33, 0],
];
for (const [start, by, result] of rShift) {
	tsts(start + ' >> ' + by, () => {
		const u = U32.fromInt(start);
		assert.is(u.rShift(by).value, result);
	});
}

const rRot = [
	[0x00000000, 0, 0x00000000],
	[0x00000000, 1, 0x00000000],
	[0x00000000, 3, 0x00000000],
	[0x00000000, 13, 0x00000000],
	[0x00000000, 29, 0x00000000],

	[0x00000001, 0, 0x00000001],
	[0x00000001, 1, 0x80000000],
	[0x00000001, 3, 0x20000000],
	[0x00000001, 13, 0x00080000],
	[0x00000001, 29, 0x00000008],

	[0x0f0f0f0f, 0, 0x0f0f0f0f],
	[0x0f0f0f0f, 1, 0x87878787],
	[0x0f0f0f0f, 2, 0xc3c3c3c3],
	[0x0f0f0f0f, 3, 0xe1e1e1e1],
	[0x0f0f0f0f, 4, 0xf0f0f0f0],
	[0x0f0f0f0f, 13, 0x78787878],
	[0x0f0f0f0f, 29, 0x78787878],

	[0xf0f0f0f0, 0, 0xf0f0f0f0],
	[0xf0f0f0f0, 1, 0x78787878],
	[0xf0f0f0f0, 2, 0x3c3c3c3c],
	[0xf0f0f0f0, 3, 0x1e1e1e1e],
	[0xf0f0f0f0, 4, 0x0f0f0f0f],

	[0x0000ffff, 0, 0x0000ffff],
	[0x0000ffff, 1, 0x80007fff],
	[0x0000ffff, 3, 0xe0001fff],
	[0x0000ffff, 13, 0xfff80007],
	[0x0000ffff, 29, 0x0007fff8],
	[0x0000ffff, 32, 0x0000ffff],

	[0xffffffff, 0, 0xffffffff],
	[0xffffffff, 1, 0xffffffff],
	[0xffffffff, 3, 0xffffffff],
	[0xffffffff, 13, 0xffffffff],
	[0xffffffff, 29, 0xffffffff],
	[0xffffffff, 32, 0xffffffff],

	[0x12345678, 0, 0x12345678],
	[0x12345678, 1, 0x91a2b3c],
	[0x12345678, 31, 0x2468acf0],
	[0x12345678, 32, 0x12345678],
	[0x12345678, 33, 0x91a2b3c],
];
for (const [start, by, result] of rRot) {
	tsts(start + ' ror ' + by, () => {
		const u = U32.fromInt(start);
		assert.is(u.rRot(by).value, result);
	});
}
//#endregion

//#region LogicOps
const xor = [
	// A^0=A: Anything xor zero is anything
	[0x00000000, 0xffffffff, 0xffffffff],
	[0x00000000, 0x01234567, 0x01234567],
	[0x00000000, 0x76543210, 0x76543210],
	[0x00000000, 0x00000000, 0x00000000],
	// A^1=~A:  Anything XOR 1 is its compliment
	[0xffffffff, 0xffffffff, 0x00000000],
	[0xffffffff, 0x01234567, 0xfedcba98],
	[0xffffffff, 0x76543210, 0x89abcdef],
	// A^~A=1 Anything xor its compliment is 1
	[0x0000ffff, 0xffff0000, 0xffffffff],
	[0xc3a5a53c, 0x3c5a5ac3, 0xffffffff],
	[0xc35a5a3c, 0x3ca5a5c3, 0xffffffff],
	[0xfedcba98, 0x01234567, 0xffffffff],
	// A^A=A Anything xor itself is 0
	[0x0000ffff, 0x0000ffff, 0x00000000],
	[0xc3a5a53c, 0xc3a5a53c, 0x00000000],
	[0xc35a5a3c, 0xc35a5a3c, 0x00000000],
	[0xfedcba98, 0xfedcba98, 0x00000000],
	// Other cases
	[0x00000001, 0x00000002, 0x00000003],
	[0x00000001, 0xffffffff, 0xfffffffe],
];
for (const [a, b, result] of xor) {
	tsts(a + ' ^ ' + b, () => {
		const u = U32.fromInt(a);
		assert.is(u.xor(U32.fromInt(b)).value, result);
	});
}

const or = [
	// A|0=A: Anything or zero is anything
	[0x00000000, 0xffffffff, 0xffffffff],
	[0x00000000, 0x01234567, 0x01234567],
	[0x00000000, 0x76543210, 0x76543210],
	[0x00000000, 0x00000000, 0x00000000],
	// A|1=1:  Anything or 1 is 1
	[0xffffffff, 0xffffffff, 0xffffffff],
	[0xffffffff, 0x01234567, 0xffffffff],
	[0xffffffff, 0x76543210, 0xffffffff],
	// A|~A=1: Anything or its compliment is 1
	[0x0000ffff, 0xffff0000, 0xffffffff],
	[0xc3a5a53c, 0x3c5a5ac3, 0xffffffff],
	[0xc35a5a3c, 0x3ca5a5c3, 0xffffffff],
	[0x76543210, 0x01234567, 0x77777777],
	// A|A=A: Anything or itself is itself
	[0x0000ffff, 0x0000ffff, 0x0000ffff],
	[0xc3a5a53c, 0xc3a5a53c, 0xc3a5a53c],
	[0xc35a5a3c, 0xc35a5a3c, 0xc35a5a3c],
	[0x76543210, 0x76543210, 0x76543210],
	// Any bits set override the other value (form of masking)
	[0x76543210, 0x000fffff, 0x765fffff],
	[0xc3a5a53c, 0x000fffff, 0xc3afffff],
	[0x76543210, 0xfffff000, 0xfffff210],
	[0xc3a5a53c, 0xfffff000, 0xfffff53c],
	[0x00000001, 0x00000002, 0x00000003],
	[0x00000001, 0xffffffff, 0xffffffff],
];
for (const [a, b, result] of or) {
	tsts(a + ' | ' + b, () => {
		const u = U32.fromInt(a);
		assert.is(u.or(U32.fromInt(b)).value, result);
	});
}

const and = [
	// A&0=0: Zero and anything is zero
	[0x00000000, 0xffffffff, 0x00000000],
	[0x00000000, 0x01234567, 0x00000000],
	[0x00000000, 0x76543210, 0x00000000],
	[0x00000000, 0x00000000, 0x00000000],
	// A&1=A:  All set and anything is anything
	[0xffffffff, 0xffffffff, 0xffffffff],
	[0xffffffff, 0x01234567, 0x01234567],
	[0xffffffff, 0x76543210, 0x76543210],
	// A&~A=0: Anything and its compliment is 0
	[0x0000ffff, 0xffff0000, 0x00000000],
	[0xc3a5a53c, 0x3c5a5ac3, 0x00000000],
	[0xc35a5a3c, 0x3ca5a5c3, 0x00000000],
	[0x76543210, 0x01234567, 0x00000000],
	// A&A=A: Anything and itself is itself
	[0x0000ffff, 0x0000ffff, 0x0000ffff],
	[0xc3a5a53c, 0xc3a5a53c, 0xc3a5a53c],
	[0xc35a5a3c, 0xc35a5a3c, 0xc35a5a3c],
	[0x76543210, 0x76543210, 0x76543210],
	// Only bits set to true in both survive (form of masking)
	[0x76543210, 0x000fffff, 0x00043210],
	[0xc3a5a53c, 0x000fffff, 0x0005a53c],
	[0x76543210, 0xfffff000, 0x76543000],
	[0xc3a5a53c, 0xfffff000, 0xc3a5a000],
	[0x00000001, 0x00000002, 0x00000000],
	[0x00000001, 0xffffffff, 0x00000001],
];
for (const [a, b, result] of and) {
	tsts(a + ' & ' + b, () => {
		const u = U32.fromInt(a);
		assert.is(u.and(U32.fromInt(b)).value, result);
	});
}

const not = [
	[0x00000000, 0xffffffff],
	[0x0000ffff, 0xffff0000],
	[0xffff0000, 0x0000ffff],
	[0xffffffff, 0x00000000],
	[0xc3a5a53c, 0x3c5a5ac3], //A=1010, 5=0101, C=1100, 3=0011
	[0xc35a5a3c, 0x3ca5a5c3],
	[0x76543210, 0x89abcdef],
	[0x01234567, 0xfedcba98],
];
for (const [start, result] of not) {
	tsts('~' + start, () => {
		const u = U32.fromInt(start);
		assert.is(u.not().value, result);
	});
}
//#endregion

//#region Arithmetic
const addTest = [
	// A+0=A: Anything plus zero is anything (like or)
	[0x00000000, 0xffffffff, 0xffffffff],
	[0x00000000, 0x01234567, 0x01234567],
	[0x00000000, 0x76543210, 0x76543210],
	[0x00000000, 0x00000000, 0x00000000],
	// A+1=A:  Anything plus 1 overflows
	[0xffffffff, 0xffffffff, 0xfffffffe], //Overflow
	[0xffffffff, 0x01234567, 0x01234566], //Overflow
	[0xffffffff, 0x76543210, 0x7654320f], //Overflow
	[0xffffffff, 0x00000000, 0xffffffff],
	// A+~A .. is 1 (like or)
	[0x0000ffff, 0xffff0000, 0xffffffff],
	[0xc3a5a53c, 0x3c5a5ac3, 0xffffffff],
	[0xc35a5a3c, 0x3ca5a5c3, 0xffffffff],
	[0x76543210, 0x89abcdef, 0xffffffff],
	// A+A=2A
	[0x0000ffff, 0x0000ffff, 0x0001fffe],
	[0xc3a5a53c, 0xc3a5a53c, 0x874b4a78], //Overflow
	[0xc35a5a3c, 0xc35a5a3c, 0x86b4b478], //Overflow
	[0x76543210, 0x76543210, 0xeca86420], //Overflow
	// Others
	[0x76543210, 0xffffffff, 0x7654320f],
	[0xc3a5a53c, 0x000fffff, 0xc3b5a53b],
	[0x00000001, 0x00000002, 0x00000003],
	[0x00000001, 0xffffffff, 0x00000000], //Overflow
];
for (const [a, b, result] of addTest) {
	tsts(a + ' + ' + b, () => {
		const u = U32.fromInt(a);
		assert.is(u.add(U32.fromInt(b)).value, result);
	});
}

const subTest = [
	[1, 1, 0],
	[2, 1, 1],
	[0, 1, 0xffffffff],
	[0, 2, 0xfffffffe],
];
for (const [a, b, result] of subTest) {
	tsts(a + ' - ' + b, () => {
		const u = U32.fromInt(a);
		assert.is(u.sub(U32.fromInt(b)).value, result);
	});
}

const mul = [
	[0x00000001, 0x00000002, 0x00000002],
	[0x0000ffff, 0x0000ffff, 0xfffe0001],
	[0x000fffff, 0x000fffff, 0xffe00001],
	[0x00ffffff, 0x00ffffff, 0xfe000001],
	[0x0fffffff, 0x0fffffff, 0xe0000001],
	[0xffffffff, 0xffffffff, 0x00000001],
	[0x0000ffff, 0x00000003, 0x0002fffd],
	[0x000fffff, 0x00000035, 0x034fffcb],
	[0x00ffffff, 0x00000357, 0x56fffca9],
	[0x0fffffff, 0x0000357b, 0xafffca85],
	[0xffffffff, 0x000357bd, 0xfffca843],
	[0x00000001, 0xffffffff, 0xffffffff],
	[0xee6b2800, 0x0000000d, 0x1b710800], //4B*13 =52B
	[0x3b9aca00, 0x3b9aca00, 0xa7640000], //1B*1B=1x10^18
	[0xbcdef123, 0x0beba7e9, 0x32584ddb],
	[0x7fffffff, 0x00000010, 0xfffffff0], //Prove it is unsigned
	[0x11111111, 0x0000000f, 0xffffffff],
	[0x11111111, 0x000000ee, 0xddddddce],
	[0x11111111, 0x00000ddd, 0x999998ad],
	[0x11111111, 0x0000cccc, 0x3333258c],
	[0x11111111, 0x000bbbbb, 0xaaa9e26b],
	[0x11111111, 0x00aaaaaa, 0xfff49f4a],
	[0x11111111, 0x09999999, 0x328f5c29],
	[0x11111111, 0x88888888, 0x3b2a1908],
	[0x11111111, 0x77777777, 0xb3c4d5e7],
	[0x11111111, 0x66666666, 0x2c5f92c6],
	[0x11111111, 0x55555555, 0xa4fa4fa5],
];
for (const [a, b, result] of mul) {
	tsts(a + ' * ' + b, () => {
		const u = U32.fromInt(a);
		assert.is(u.mul(U32.fromInt(b)).value, result);
	});
}
//#endregion

//#region Comparable
const neq_tests:[number,number][]=[
	[0, 1],
	[0x12345678,0],
	[0x12345678,1],
	[0x12345678,0xffffffff],
];
for (const [aNum, bNum] of neq_tests) {
	const a =U32.fromInt(aNum);
	const b = U32.fromInt(bNum);
	tsts(`${aNum} != ${bNum}`, () => {
		assert.is(a.eq(b), false);
	});
	tsts(`${bNum} != ${aNum}`, () => {
		assert.is(b.eq(a), false);
	});
}

const eq_set: number[] = [0, 1, 0x12345678, 0xffffffff];
for (const aNum of eq_set) {
	const bNum = aNum;
	const a =U32.fromInt(aNum);
	const b = U32.fromInt(bNum);
	tsts(`${aNum} == ${aNum}`, () => {
		assert.is(a.eq(b), true);
		assert.is(a.eq(bNum), true);
	});
	tsts(`${aNum} <= ${bNum}`, () => {
		assert.is(a.lte(b), true);
		assert.is(a.lte(bNum), true);
	});
	tsts(`${aNum} >= ${bNum}`, () => {
		assert.is(a.gte(b), true);
		assert.is(a.gte(bNum), true);
	});
}

const lt_set:[number,number][]=[
	[0,1],
	[1,0x12345678],
	[0x12345678,0xffffffff],
	[0x12345678,0x12345679],
];
for (const [aNum, bNum] of lt_set) {
	const a =U32.fromInt(aNum);
	const b = U32.fromInt(bNum);
	tsts(`${aNum} < ${bNum}`, () => {
		assert.is(a.lt(b), true);
		assert.is(a.lt(bNum), true);
	});
	tsts(`${bNum} > ${aNum}`, () => {
		assert.is(b.gt(a), true);
		assert.is(b.gt(aNum), true);
	});
	tsts(`${aNum} <= ${bNum}`, () => {
		assert.is(a.lte(b), true);
	});
	tsts(`${bNum} >= ${aNum}`, () => {
		assert.is(b.gte(a), true);
	});
}
//#endregion

tsts('toString', () => {
	const u = U32.fromInt(0x12345678);
	//endian isn't relevant
	assert.is(u.toString(), '12345678');
});

tsts('toBytesLE', () => {
	//littleEndian
	const u = U32.fromInt(0x01020304);
	assert.is(u.value, 0x01020304);
	const b = u.toBytesLE();
	//Because toBytes is PLATFORM encoded, let's fix
	asLE.i32(b);
	assert.is(u.value, 0x01020304);
	assert.is(hex.fromBytes(b), '04030201');
});

const fromInt: [number, number | undefined][] = [
	[0, 0],
	[1, 1],
	[0xffffffff, 0xffffffff],
	[-1, undefined],
	[0x1ffffffff, undefined],
];
for (const [start, expect] of fromInt) {
	tsts(`fromInt(${start})`, () => {
		if (expect === undefined) {
			assert.throws(() => U32.fromInt(start));
		} else {
			assert.is(U32.fromInt(start).value, expect);
		}
	});
}

tsts('fromArray', () => {
	const src = new Uint32Array([13, 29]);
	const u0 = U32.mount(src, 0);
	const u1 = U32.mount(src, 1);
	assert.is(u0.value, 13);
	assert.is(u1.value, 29);

	//Confirm u0 is just a view onto src - change to src effect u0
	src[0] = 44;
	assert.is(u0.value, 44); //changed by src update
	assert.is(u1.value, 29); //no change
});

tsts('zero', () => {
	assert.is(U32.zero.value, 0, 'zero');
});

const lsbTests: [number, number, number][] = [
	[0x12345678, 0, 0x78],
	[0x12345678, 1, 0x56],
	[0x12345678, 2, 0x34],
	[0x12345678, 3, 0x12],
];
for (const [u32, which, expect] of lsbTests) {
	tsts(`lsb(${u32}[which])`, () => {
		const u = U32.fromInt(u32);
		assert.equal(u.getByte(which), expect);
	});
}

tsts('clone', () => {
	const a = U32.fromInt(1);
	const b = a.clone();
	assert.equal(a.toString(), b.toString());
});

tsts('clone32', () => {
	const a = U32.fromInt(1);
	const b = a.clone32();
	assert.is(a.value,b[0]);
});

tsts(`mut`, () => {
	const h13 = '0000000D';
	const a = U32.fromInt(13);
	assert.is(hex.fromBytes(a.toBytesBE()), h13);
	const b = a.mut();
	b.addEq(U32.fromInt(1));
	assert.is(hex.fromBytes(a.toBytesBE()), h13, 'a has not changed');
	assert.is(hex.fromBytes(b.toBytesBE()), '0000000E', 'b is updated');
});

tsts('[Symbol.toStringTag]', () => {
	const o = U32.fromInt(13);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U32') > 0, true);
});

tsts('util.inspect', () => {
	const o = U32.fromInt(13);
	const u = util.inspect(o);
	assert.is(u.startsWith('U32('), true);
});



// tsts('general',()=>{
//     const o=U32.fromInt(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });
tsts.run();
