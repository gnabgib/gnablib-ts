import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { U32 } from '../../../src/primitive/number/U32Static';
import { ByteWriter } from '../../../src/primitive/ByteWriter';

const tsts = suite('U32Static');

const bytesLE_tests:[number,string][]=[
    [0x78563412,'12345678'],
    [0x12345678,'78563412'],
];
const bytes=new Uint8Array(4);
for(const [u32,uHex] of bytesLE_tests) {
    tsts(`intoBytesLE(${u32})`,()=>{
        const bw=ByteWriter.mount(bytes);
        U32.intoBytesLE(u32,bw);
        assert.is(hex.fromBytes(bytes),uHex);
    });

    tsts(`fromBytesLE(x${uHex})`,()=>{
        assert.equal(U32.fromBytesLE(hex.toBytes(uHex)),u32);
    })
}

const bytesBE_tests:[number,string][]=[
    [0x12345678,'12345678',],
    [0x78563412,'78563412'],
];
for(const [u32,uHex] of bytesBE_tests) {
    tsts(`intoBytesBE(${u32})`,()=>{
        const bw=ByteWriter.mount(bytes);
        U32.intoBytesBE(u32,bw);
        assert.is(hex.fromBytes(bytes),uHex);
    });

    tsts(`fromBytesBE(x${uHex})`,()=>{
        assert.equal(U32.fromBytesBE(hex.toBytes(uHex)),u32);
    })
}

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
    const left = U32.lRot(start, by) >>> 0;
    tsts('rol32:' + start + ',' + by, () => {
        assert.is(left, expectLeft);
    });

    tsts('ror32:' + left + ',' + by, () => {
        assert.is(U32.rRot(left, by) >>> 0, start);
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
        const actual = U32.lRot(start, by) >>> 0;
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
        const actual = U32.rRot(start, by) >>> 0;
        assert.is(actual, expect);
    });
}

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

tsts.run();