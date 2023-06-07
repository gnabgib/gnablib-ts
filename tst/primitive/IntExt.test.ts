import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Hex } from '../../src/encoding/Hex';
import * as intExt from '../../src/primitive/IntExt';
import {
	sign16,
	sign32,
	sign8,
	uintFromScaleBytes,
	uintToScaleBytes,
} from '../../src/primitive/IntExt';

const tsts = suite('IntExt');

const sign8Set = [
	//Low numbers
	[1, 1],
	[0, 0],
	[10, 10],
	//Large numbers
	[0x7f, 127],
	[0x80, -128],
	[0xfe, -2],
	[0xff, -1],
	//Already negative numbers
	[-1, -1],
];
for (const test of sign8Set) {
	tsts('sign8 ' + test[0], () => {
		assert.is(sign8(test[0]), test[1]);
	});
}

const sign16Set = [
	//Low numbers
	[1, 1],
	[0, 0],
	[10, 10],
	//Large numbers
	[0x7fff, 32767],
	[0x8000, -32768],
	[0xfffe, -2],
	[0xffff, -1],
	//Already negative numbers
	[-1, -1],
];
for (const test of sign16Set) {
	tsts('sign16 ' + test[0], () => {
		assert.is(sign16(test[0]), test[1]);
	});
}

const sign32Set = [
	//Low numbers
	[1, 1],
	[0, 0],
	[10, 10],
	//Large numbers
	[0x7fffffff, 2147483647],
	[0x80000000, -2147483648],
	[0xfffffffe, -2],
	[0xffffffff, -1],
	//Already negative numbers
	[-1, -1],
];
for (const test of sign32Set) {
	tsts('sign32 ' + test[0], () => {
		assert.is(sign32(test[0]), test[1]);
	});
}

const scaleCodes = [
	[0, '00'],
	[1, '01'],
	[127, '7F'],
	//127 | 0x7f
	[128, '8080'],
	[129, '8081'],
	[16383, 'BFFF'],
	//16383 | 0x3fff
	[16384, 'C04000'],
	[20000, 'C04E20'],
	[2097151, 'DFFFFF'],
	//2097151 | 0x1fffff
	[2097152, 'E0200000'],
	[268435455, 'EFFFFFFF'],
	//268435455| 0xfffffff
	[268435456, 'F010000000'],
	[34359738367, 'F7FFFFFFFF'],
	//34359738367| 0x7ffffffff
	[34359738368, 'F80800000000'],
	[4398046511103, 'FBFFFFFFFFFF'],
	//4398046511103 | 0x3ffffffffff
	[4398046511104, 'FC040000000000'],
	[562949953421311, 'FDFFFFFFFFFFFF'],
	//562949953421311 | 0x1ffffffffffff
	[562949953421312, 'FE02000000000000'],
	[9007199254740991, 'FE1FFFFFFFFFFFFF'], //Max safe int

	//Base 10 majors:
	[10, '0A'],
	[100, '64'],
	[1000, '83E8'],
	[10000, 'A710'],
	[100000, 'C186A0'],
	[1000000, 'CF4240'],
	[10000000, 'E0989680'],
	[100000000, 'E5F5E100'],
	[1000000000, 'F03B9ACA00'],
	[10000000000, 'F2540BE400'],
	[100000000000, 'F8174876E800'],
	[1000000000000, 'F8E8D4A51000'],
	[10000000000000, 'FC09184E72A000'],
	[100000000000000, 'FC5AF3107A4000'],
	[1000000000000000, 'FE038D7EA4C68000'],

	//Base 2 majors:
	[2, '02'],
	[4, '04'],
	[8, '08'],
	[16, '10'],
	[32, '20'],
	[64, '40'],
	//128 above
	[256, '8100'],
	[512, '8200'],
	[1024, '8400'],
	[2048, '8800'],
	[4096, '9000'],
	[8192, 'A000'],
	//16384 above
	[32768, 'C08000'],
	[65536, 'C10000'],
	[131072, 'C20000'],
	[262144, 'C40000'],
	[524288, 'C80000'],
	[1048576, 'D00000'],
	//2097152 above
	[4194304, 'E0400000'],
	[8388608, 'E0800000'],
	[16777216, 'E1000000'],
	[33554432, 'E2000000'],
	[67108864, 'E4000000'],
	[134217728, 'E8000000'],
	//268435456 above
	[536870912, 'F020000000'],
	[1073741824, 'F040000000'],
	[2147483648, 'F080000000'],
	[4294967296, 'F100000000'],
	[8589934592, 'F200000000'],
	[17179869184, 'F400000000'],
	//34359738368 above
	[68719476736, 'F81000000000'],
	[137438953472, 'F82000000000'],
	[274877906944, 'F84000000000'],
	[549755813888, 'F88000000000'],
	[1099511627776, 'F90000000000'],
	[2199023255552, 'FA0000000000'],
	//4398046511104 above
	[8796093022208, 'FC080000000000'],
	[17592186044416, 'FC100000000000'],
	[35184372088832, 'FC200000000000'],
	[70368744177664, 'FC400000000000'],
	[140737488355328, 'FC800000000000'],
	[281474976710656, 'FD000000000000'],
	// //562949953421312 above
	[1125899906842624, 'FE04000000000000'],
	[2251799813685248, 'FE08000000000000'],
	[4503599627370496, 'FE10000000000000'], //Technically still a safe int (but +1 isn't possible)
];

for (const test of scaleCodes) {
	tsts('Encode:' + test[0], () => {
		const num = test[0] as number;
		const enc = uintToScaleBytes(num);
		assert.equal(Hex.fromBytes(enc), test[1]);
	});
	tsts('Decode:' + test[1], () => {
		const num = test[0] as number;
		const bytes = Hex.toBytes(test[1] as string);
		const res = uintFromScaleBytes(bytes);
		assert.equal(res.value, num);
	});
}

const strictParseIntDec = [
	['421', 421],
	['-421', -421],
	['- 421', undefined],
	[' 421', 421],
	['+421', 421],
	['Infinity', undefined],
	['421e+0', undefined], //would be 421 with parseInt
	['421hop', undefined], //would be 421 with parseInt
	['hop1.61803398875', undefined],
	['1.61803398875', undefined], //Would be 1 with parseInt
	['0x10', undefined], //Hex fails
	['0e7', undefined], //Octal on other platform - fails
];

for (const test of strictParseIntDec) {
	tsts('Parse base 10 ' + test[0], () => {
		assert.equal(intExt.strictParseDecInt(test[0] as string, 10), test[1]);
	});
}

const strictParseIntHex = [
	['ff', 255],
	['FE', 254],
	['20', 32],
	['+20', 32], //2*16, not 2*10
	['-20', -32],
	['- 20', undefined], //sign must touch number
	['0xfd', 253], //Can start with 0x
	['-0xfc', -252], //Can start with 0x, can be negative
	['+0xfb', 251], //Can start with 0x, can have sign
	['0xFA', 250], //Case insensitive ext symbols
	['- 0xfd', undefined], //Sign must touch 0x starter
	['xfc', undefined], //Not a valid leading
];
for (const test of strictParseIntHex) {
	tsts('Parse base 16 ' + test[0], () => {
		assert.equal(intExt.strictParseHexInt(test[0] as string), test[1]);
	});
}

tsts.run();
