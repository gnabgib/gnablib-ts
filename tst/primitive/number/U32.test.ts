import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { asLE } from '../../../src/endian';
import { U32 } from '../../../src/primitive/number';
import util from 'util';

const tsts = suite('U32');

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

	[0x12345678, 1, 0x2468acf0],
	[0x12345678, 31, 0x91a2b3c],
	[0x12345678, 32, 0x12345678],
	[0x12345678, 33, 0x2468acf0],
];
for (const [start, by, result] of lRot) {
	tsts(start + ' rol ' + by, () => {
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
	const u0 = U32.fromArray(src, 0);
	const u1 = U32.fromArray(src, 1);
	assert.is(u0.value, 13);
	assert.is(u1.value, 29);

	//Confirm u0 is just a view onto src - change to src effect u0
	src[0] = 44;
	assert.is(u0.value, 44); //changed by src update
	assert.is(u1.value, 29); //no change
});

tsts('fromBuffer', () => {
	const a = Uint32Array.of(0x12345678);
	const u = U32.fromBuffer(a.buffer);
	assert.equal(u.toString(), '12345678');
});

tsts('zero/min/max', () => {
	assert.is(U32.zero.value, 0, 'zero');
	assert.is(U32.min.value, 0, 'min');
	assert.is(U32.max.value, 0xffffffff, 'max');
});

const rot32 = [
	//Start, left, end
	[0, 0, 0],
	[0, 1, 0],
	[0, 4, 0],
	[0, 7, 0],
	[0, 15, 0],
	[0, 31, 0],

	[1, 0, 1],
	[1, 1, 2],
	[1, 4, 0x10],
	[1, 7, 0x80],
	[1, 15, 0x8000],
	[1, 31, 0x80000000],
	[1, 32, 1],

	[2, 0, 2],
	[2, 1, 4],
	[2, 4, 0x20],
	[2, 7, 0x100],
	[2, 15, 0x10000],
	[2, 31, 1],

	[4, 0, 4],
	[4, 1, 0x8],
	[4, 4, 0x40],
	[4, 7, 0x200],
	[4, 15, 0x20000],
	[4, 31, 2],

	[8, 0, 8],
	[8, 1, 0x10],
	[8, 4, 0x80],
	[8, 7, 0x400],
	[8, 15, 0x40000],
	[8, 31, 4],

	[0x80, 0, 0x80],
	[0x80, 1, 0x100],
	[0x80, 4, 0x800],
	[0x80, 7, 0x4000],
	[0x80, 15, 0x400000],
	[0x80, 31, 0x40],

	[0x800, 0, 0x800],
	[0x800, 1, 0x1000],
	[0x800, 4, 0x8000],
	[0x800, 7, 0x40000],
	[0x800, 15, 0x4000000],
	[0x800, 31, 0x400],

	[0x8000, 0, 0x8000],
	[0x8000, 1, 0x10000],
	[0x8000, 4, 0x80000],
	[0x8000, 7, 0x400000],
	[0x8000, 15, 0x40000000],
	[0x8000, 31, 0x4000],

	[0x80000, 0, 0x80000],
	[0x80000, 1, 0x100000],
	[0x80000, 4, 0x800000],
	[0x80000, 7, 0x4000000],
	[0x80000, 15, 4],
	[0x80000, 31, 0x40000],

	[0x800000, 0, 0x800000],
	[0x800000, 1, 0x1000000],
	[0x800000, 4, 0x8000000],
	[0x800000, 7, 0x40000000],
	[0x800000, 15, 0x40],
	[0x800000, 31, 0x400000],

	[0x8000000, 0, 0x8000000],
	[0x8000000, 1, 0x10000000],
	[0x8000000, 4, 0x80000000],
	[0x8000000, 7, 0x4],
	[0x8000000, 15, 0x400],
	[0x8000000, 31, 0x4000000],

	[0x10000000, 0, 0x10000000],
	[0x10000000, 1, 0x20000000],
	[0x10000000, 4, 1],
	[0x10000000, 7, 8],
	[0x10000000, 15, 0x800],
	[0x10000000, 31, 0x8000000],

	[0x20000000, 0, 0x20000000],
	[0x20000000, 1, 0x40000000],
	[0x20000000, 4, 2],
	[0x20000000, 7, 0x10],
	[0x20000000, 15, 0x1000],
	[0x20000000, 31, 0x10000000],

	[0x40000000, 0, 0x40000000],
	[0x40000000, 1, 0x80000000],
	[0x40000000, 4, 4],
	[0x40000000, 7, 0x20],
	[0x40000000, 15, 0x2000],
	[0x40000000, 31, 0x20000000],

	[0x80000000, 0, 0x80000000],
	[0x80000000, 1, 1],
	[0x80000000, 4, 8],
	[0x80000000, 7, 0x40],
	[0x80000000, 15, 0x4000],
	[0x80000000, 31, 0x40000000],

	//1010=a, 0101=5, odd shift=switch, even shift=other
	[0xaaaaaaaa, 0, 0xaaaaaaaa],
	[0xaaaaaaaa, 1, 0x55555555],
	[0xaaaaaaaa, 4, 0xaaaaaaaa],
	[0xaaaaaaaa, 7, 0x55555555],
	[0xaaaaaaaa, 15, 0x55555555],
	[0xaaaaaaaa, 31, 0x55555555],

	//1000=8 move 1 0001, move 2 0010 move 3 0100, move 4=1000
	[0x88888888, 0, 0x88888888],
	[0x88888888, 1, 0x11111111],
	[0x88888888, 4, 0x88888888],
	[0x88888888, 7, 0x44444444],
	[0x88888888, 15, 0x44444444],
	[0x88888888, 31, 0x44444444],

	//=0100 1001 0010 0100 1001 0010 0100 1001
	[0x49249249, 0, 0x49249249],
	[0x49249249, 1, 0x92492492],
	[0x49249249, 4, 0x92492494],
	[0x49249249, 7, 0x924924a4],
	[0x49249249, 15, 0x4924a492],
	[0x49249249, 31, 0xa4924924],

	[0x01234567, 0, 0x01234567],
	[0x01234567, 1, 0x02468ace],
	[0x01234567, 4, 0x12345670],
	[0x01234567, 7, 0x91a2b380],
	[0x01234567, 15, 0xa2b38091],
	[0x01234567, 31, 0x8091a2b3],

	[0x0a442081, 0, 0x0a442081],
	[0x0a442081, 1, 0x14884102],
	[0x0a442081, 4, 0xa4420810],
	[0x0a442081, 7, 0x22104085],
	[0x0a442081, 15, 0x10408522],
	[0x0a442081, 31, 0x85221040],

	[0x0103070f, 0, 0x0103070f],
	[0x0103070f, 1, 0x02060e1e],
	[0x0103070f, 4, 0x103070f0],
	[0x0103070f, 7, 0x81838780],
	[0x0103070f, 15, 0x83878081],
	[0x0103070f, 31, 0x80818387],
];

for (const [start, by, expectLeft] of rot32) {
	const left = U32.rol(start, by) >>> 0;
	tsts('rol32:' + start + ',' + by, () => {
		assert.is(left, expectLeft);
	});

	tsts('ror32:' + left + ',' + by, () => {
		assert.is(U32.ror(left, by) >>> 0, start);
	});
}

const rol32OversizedTests = [
	[0xffff0000, 1, 0xfffe0001], //Would catch an unsigned right shift
	//Oversized tests - make sure the input is truncated
	[0x1fffff1ff, 3, 0xffff8fff],
	[0x1fffff1ff, 11, 0xff8fffff],
	[0x1fffff1ff, 31, 0xfffff8ff],
	[0xf0f0f0f0f0, 4, 0x0f0f0f0f],
	[0xf0f0f0f0f0, 8, 0xf0f0f0f0],
];
for (const [start, by, expect] of rol32OversizedTests) {
	tsts(`rol32 (${hex.fromI32(start)},${by})`, () => {
		const actual = U32.rol(start, by) >>> 0;
		assert.is(actual, expect);
	});
}

const ror32OversizedTests = [
	[0xffff0000, 1, 0x7fff8000], //Would catch an unsigned right shift
	//Oversized tests - make sure the input is truncated
	[0x1fffff1ff, 3, 0xfffffe3f],
	[0x1fffff1ff, 11, 0x3ffffffe],
	[0x1fffff1ff, 31, 0xffffe3ff],
	[0xf0f0f0f0f0, 4, 0x0f0f0f0f],
	[0xf0f0f0f0f0, 8, 0xf0f0f0f0],
];
for (const [start, by, expect] of ror32OversizedTests) {
	tsts(`ror32 (${hex.fromI32(start)},${by})`, () => {
		const actual = U32.ror(start, by) >>> 0;
		assert.is(actual, expect);
	});
}

const ltTest: [number, number][] = [
	[0x01020304, 0x01020305],
	[0x00000000, 0xffffffff],
	[0x00000000, 0x00000001],
	[0xfffffff0, 0xffffffff],
];
for (const [a, b] of ltTest) {
	//Constant time
	tsts(`${a} <=.ct ${b}`, () => {
		assert.is(U32.ctLte(a, b), true);
	});
	tsts(`! ${b} <=.ct ${a}`, () => {
		assert.is(U32.ctLte(b, a), false);
	});

	tsts(`${a} <.ct ${b}`, () => {
		assert.is(U32.ctLt(a, b), true);
	});
	tsts(`! ${b} <.ct ${a}`, () => {
		assert.is(U32.ctLt(b, a), false);
	});

	tsts(`${b} >=.ct ${a}`, () => {
		assert.is(U32.ctGte(b, a), true);
	});
	tsts(`! ${a} >=.ct ${b}`, () => {
		assert.is(U32.ctGte(a, b), false);
	});

	tsts(`${b} >.ct ${a}`, () => {
		assert.is(U32.ctGt(b, a), true);
	});
	tsts(`! ${a} >.ct ${b}`, () => {
		assert.is(U32.ctGt(a, b), false);
	});

	tsts(`! ${a} ==.ct ${b}`, () => {
		assert.is(U32.ctEq(a, b), false);
	});
	tsts(`! ${b} ==.ct ${a}`, () => {
		assert.is(U32.ctEq(b, a), false);
	});
}

const eq64Test: number[] = [
	0x00000000, 0x00000001, 0x01020304, 0x01020305, 0xfffffff0, 0xffffffff,
];
for (const a of eq64Test) {
	const b = a;

	//Constant time
	tsts(`${a} ==.ct ${a}`, () => {
		assert.is(U32.ctEq(a, b), true);
	});

	tsts(`${a} <=.ct ${a}`, () => {
		assert.is(U32.ctLte(a, b), true);
	});

	tsts(`! ${a} <.ct ${a}`, () => {
		assert.is(U32.ctLt(a, b), false);
	});

	tsts(`${a} >=.ct ${a}`, () => {
		assert.is(U32.ctGte(a, b), true);
	});

	tsts(`! ${a} >.ct ${a}`, () => {
		assert.is(U32.ctGt(a, b), false);
	});
}

tsts(`ctSelect`, () => {
	const a = 0x01020304;
	const b = 0xf0e0d0c0;

	assert.equal(U32.ctSelect(a, b, true) >>> 0, a);
	assert.equal(U32.ctSelect(a, b, false) >>> 0, b);
});

const sameSignTests: [number, number, boolean][] = [
	[0, 2147483647, true], //highest i32
	[0, 2147483648, false], //While these are the same sign, we've exceeded U32
	[0, -1, false],
	[-1, -1000000, true],
	[-1, -2147483648, true], //lowest i32
];
for (const [a, b, match] of sameSignTests) {
	tsts(`${a} same sign as ${b}`, () => {
		assert.is(U32.sameSign(a, b), match);
	});
}

const averageTests: [number, number, number][] = [
	[1, 3, 2],
	[10, 30, 20],
];
for (const [a, b, avg] of averageTests) {
	tsts(`average(${a},${b})`, () => {
		assert.is(U32.average(a, b), avg);
	});
}

const fromBytesLeTests: [Uint8Array, number, number][] = [
	[Uint8Array.of(0x12, 0x34, 0x56, 0x78), 0, 0x78563412],
	[Uint8Array.of(0x78, 0x56, 0x34, 0x12), 0, 0x12345678],
	[Uint8Array.of(0x78, 0x56, 0x34, 0x12), 1, 0x123456],
	[Uint8Array.of(0x78, 0x56), 0, 0x5678],
];
for (const [u8, pos, expect] of fromBytesLeTests) {
	tsts(`${u8}[${pos}]`, () => {
		assert.equal(U32.iFromBytesLE(u8, pos), expect);
	});
}

const fromBytesBeTests: [Uint8Array, number, number][] = [
	[Uint8Array.of(0x12, 0x34, 0x56, 0x78), 0, 0x12345678],
	[Uint8Array.of(0x78, 0x56, 0x34, 0x12), 0, 0x78563412],
	[Uint8Array.of(0x12, 0x34, 0x56, 0x78), 1, 0x345678],
	[Uint8Array.of(0x12, 0x34, 0x56, 0x78), 2, 0x5678],
	[Uint8Array.of(0x12, 0x34, 0x56, 0x78), 3, 0x78],
	[Uint8Array.of(0x78, 0x56, 0x34, 0x12), 1, 0x563412],
	[Uint8Array.of(0x56, 0x78), 0, 0x5678],
];
for (const [u8, pos, expect] of fromBytesBeTests) {
	tsts(`${u8}[${pos}]`, () => {
		assert.equal(U32.iFromBytesBE(u8, pos), expect);
	});
}

const toBytesLETests: [number, string][] = [
	[0x12345678, '78563412'],
	[0x78563412, '12345678'],
];
for (const [num, expect] of toBytesLETests) {
	tsts(`toBytesLE(${num})`, () => {
		assert.equal(hex.fromBytes(U32.toBytesLE(num)), expect);
	});
}

const toBytesBETests: [number, string][] = [
	[0x12345678, '12345678'],
	[0x78563412, '78563412'],
];
for (const [num, expect] of toBytesBETests) {
	tsts(`toBytesBE(${num})`, () => {
		assert.equal(hex.fromBytes(U32.toBytesBE(num)), expect);
	});
}

const lsbTests: [number, number, number][] = [
	[0x12345678, 0, 0x78],
	[0x12345678, 1, 0x56],
	[0x12345678, 2, 0x34],
	[0x12345678, 3, 0x12],
];
for (const [u32, which, expect] of lsbTests) {
	tsts(`lsb(${u32}[which])`, () => {
		const u = U32.fromInt(u32);
		assert.equal(u.lsb(which), expect);
	});
}

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

tsts('clone', () => {
	const a = U32.fromInt(1);
	const b = a.clone();
	assert.equal(a.toString(), b.toString());
});

// tsts('general',()=>{
//     const o=U32.fromInt(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });
tsts.run();
