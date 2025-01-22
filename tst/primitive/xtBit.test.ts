import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	countBitsSet,
	countLeadZeros,
	lsbMask,
	reverse,
	nextPow2
} from '../../src/primitive/xtBit';

const tsts = suite('bitExt');

const countBitsSet_tests: [number, number][] = [
	[0, 0],
	[1, 1],
	[2, 1],
	[3, 2],
	[4, 1],
	[5, 2],
	[6, 2],
	[7, 3],
	[2147483648, 1], //2**31
	[-1, 32],
	[4294967295, 32], //2**32-1
	[0xf,4],
	[0xff,8],
	[0xf0ff,12],
	[0xffff, 16],
	[1 << 16, 1],
];
for (const [n, expect] of countBitsSet_tests) {
	tsts(`countBitsSet(${n})`, () => {
		const found = countBitsSet(n);
		assert.equal(found, expect);
	});
}

const lsbMask_tests = [
	[0, 0],
	[1, 0b1],
	[2, 0b11],
	[3, 0b111],
	[4, 0b1111],
	[5, 0b11111],
	[6, 0b111111],
	[7, 0b1111111],
	[8, 0b11111111],
	[9, 0b111111111],
	[10, 0b1111111111],
	[16, 0xffff],
	[31, 0x7fffffff],
	[32, 0xffffffff],
];
for (const [bits, expect] of lsbMask_tests) {
	tsts(`lsbMask(${bits})`, () => {
		assert.is(lsbMask(bits), expect);
	});
}

const reverse_tests: [number, number, number][] = [
	[0, 1, 0],
	[0, 5, 0], //bitsPow2 has no effect on.. 0
	[1,1,2],
	[1,2,8],
	[1,3,0x80],
	[1,4,0x8000],
	//[1,5,0x80000000],//Since this sets high bit, we get an int/unsigned issue
	[2,2,4],
	[2,3,0x40],
	[2,4,0x4000],
	[2,5,0x40000000],
	[3,1,3],
	[3,2,0xC],
	[3,3,0xC0],
	[3,4,0xC000],
	//[3,5,0xC0000000],//Since this sets high bit, we get an int/unsigned issue
	[0x12,3,0x48],
	[0x1234,4,0x2C48],
	[0x13579BCE,5,0x73D9EAC8],
	[0b11111011110111011010,5,0b1011011101111011111000000000000]
];
for (const [n, bitsPow2, expect] of reverse_tests) {
	tsts(`reverse(${n},${bitsPow2})`, () => {
		assert.is(reverse(n, bitsPow2), expect);
	});
	tsts(`reverse(${expect},${bitsPow2})`, () => {
		assert.is(reverse(expect, bitsPow2), n);
	});
}
const reverse_throws: number[] = [0, 6, 32, 0xff];
for (const bitsPow2 of reverse_throws) {
	tsts(`reverse(0x12345678,${bitsPow2}) throws`, () => {
		assert.throws(() => reverse(0x12345678, bitsPow2));
	});
}

const countLeadZeros_tests: [number, number][] = [
	[0, 32],
	[3, 30],
	[1054 , 21],
	[0x6d2b79f5,1],//Const from mulberry32
	[0x4c957f2d,1],//Const from Pcg32
	[0x5851f42d,1],//Const from Pcg32

	[1, 31],//2**0
	[2, 30],//2**1
	[4, 29],//2**2
	[8, 28],//2**3
	[16, 27],//2**4
	[32, 26],//2**5
	[64, 25],//2**6
	[128, 24],//2**7
	[256, 23],//2**8
	[512, 22],//2**9
	[1024, 21],//2**10
	[2048, 20],//2**11
	[4096, 19],//2**12
	[8192, 18],//2**13
	[16384, 17],//2**14
	[32768, 16],//2**15
	[65536, 15],//2**16
	[131072, 14],//2**17
	[262144, 13],//2**18
	[524288, 12],//2**19
	[1048576, 11],//2**20
	[2097152, 10],//2**21
	[4194304, 9],//2**22
	[8388608, 8],//2**23
	[16777216,7],//2**24
	[33554432,6],//2**25
	[67108864,5],//2**26
	[134217728,4],//2**27
	[268435456,3],//2**28
	[536870912,2],//2**29
	[1073741824,1],//2**30
	[2147483648, 0],//2**31
	[-1,0],
	[4294967295,0],//2**32-1
];
for (const [n, expect] of countLeadZeros_tests) {
	tsts(`countLeadZeros(${n})`, () => {
		const found = countLeadZeros(n);
		assert.equal(found, expect);
	});
}

const nextPow2_tests: [number, number][] = [
	[0, 0],
	[1, 1],
	[2, 2],
	[3, 4],
	[4, 4],
	[5, 8],
	[6, 8],
	[7, 8],
	[8, 8],
	[63, 64],
	[64, 64],
	[65, 128],
	[127, 128],//2**7
	[128, 128],
	[129, 256],//2**8
	[256, 256],
	[257, 512],//2**9
	[512, 512],
	[513, 1024],//2**10
	[1024, 1024],
	[1025, 2048],//2**11
	[2048, 2048],
	[2049, 4096],//2**12
	[4096, 4096],
	[4097, 8192],//2**13
	[8192, 8192],
	[8193, 16384],//2**14
	[16384, 16384],
	[16385, 32768],//2**15
	[32769, 65536],//2**16
	[65537, 131072],//2**17
	[131073, 262144],//2**18
	[262145, 524288],//2**19
	[524289, 1048576],//2**20
	[1048577, 2097152],//2**21
	[2097153, 4194304],//2**22
	[4194305, 8388608],//2**23
	[8388609, 16777216],//2**24
	[16777217, 33554432],//2**25
	[33554433, 67108864],//2**26
	[67108865, 134217728],//2**27
	[134217729, 268435456],//2**28
	[268435457, 536870912],//2**29
	[536870913, 1073741824],//2**30
	[1073741825, 2147483648],//2**31
	//2**32+ isn't possible with 32bit integers (which JS is constrained to)
	//[2147483649, 4294967296],
];
for (const [n, expect] of nextPow2_tests) {
	tsts(`nextPow2(${n})`, () => {
		const found = nextPow2(n);
		assert.equal(found, expect);
	});
}

tsts.run();
