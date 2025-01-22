import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { fromGlScaleBytes, parseDec, parseHex, sign16, sign32, sign8, toGlScaleBytes } from '../../../src/primitive/number/xtUint';
import { hex } from '../../../src/codec/Hex';
import { ParseProblem } from '../../../src/error';

const tsts = suite('XtUInt');

const parseDecSet: [string, number, number][] = [
	//Input, JS.parseInt, expect

	//From MDN
	['123', 123, 123],
	[' 123  ', 123, 123],
	['077', 77, 77],
	['1.9', 1, Number.NaN], //This isn't a nice feature in JS
	['ff', Number.NaN, Number.NaN], //JS doesn't assume this is hex
	['0xFF', 255, Number.NaN], //Note we're testing against parseInt without a radix.. how useful is this feature?
	['xyz', Number.NaN, Number.NaN],

	['', Number.NaN, Number.NaN],
	['421', 421, 421],
	['-421', -421, Number.NaN],
	['- 421', Number.NaN, Number.NaN],
	[' 421', 421, 421],
	['+421', 421, Number.NaN],
	['Infinity', Number.NaN, Number.NaN],
	['+Inf', Number.NaN, Number.NaN],
	['-Inf', Number.NaN, Number.NaN],
	['hop1.61803398875', Number.NaN, Number.NaN],
	//The reasons parseInt is questionable
	['4wd', 4, Number.NaN],
	['1 is the loneliest', 1, Number.NaN], //It's a song
	['421e+0', 421, Number.NaN],
	['421hop', 421, Number.NaN],
	['1.61803398875', 1, Number.NaN], //JS just truncates the decimal parts
	['0x10', 16, Number.NaN],
	['0b11', 0, Number.NaN], //Could be considered binary
	['0o7', 0, Number.NaN], //Could be considered octal
	['1e3', 1, Number.NaN], //In Sci not that's 1000
	['2.1', 2, Number.NaN],
	['2.0', 2, Number.NaN], //JS gets the correct answer, but only by chance not checking after the decimal
];

for (const [input, jsExpect, expect] of parseDecSet) {
	tsts(`parseDec(${input})`, () => {
		assert.equal(Number.parseInt(input), jsExpect, 'parseInt');
		assert.equal(parseDec(input), expect, 'parseDec');
	});
}

const parseHexSet: [string, number, number][] = [
	['ff', 255, 255],
	['Fe', 254, 254],
	['20', 32, 32], //Hex yo
	['+20', 32, Number.NaN],
	['-20', -32, Number.NaN],
	['0xfd', 253, 253],
	['-0xfc', -252, Number.NaN],
	['+0xfB', 251, Number.NaN],
	['- 0xfd', Number.NaN, Number.NaN],
	['1e3', 483, 483], //Well! that looks like sci-note !danger
	['0b11', 2833, 2833], //Well! that looks like binary !danger
	['xfc', Number.NaN, Number.NaN],
	//The reasons parseInt is questionable
	['4wd', 4, Number.NaN],
	['1 is the loneliest', 1, Number.NaN], //It's a song
	['421e+0', 16926, Number.NaN],
	['friend', 15, Number.NaN],
	['0o7', 0, Number.NaN], //Could be considered octal
	['2.1', 2, Number.NaN],
];
for (const [input, jsExpect, expect] of parseHexSet) {
	tsts(`parseHex(${input})`, () => {
		assert.equal(Number.parseInt(input, 16), jsExpect, 'parseInt');
		assert.equal(parseHex(input), expect, 'parseHex');
	});
}

const sign8Set: [number, number][] = [
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
	[-128, -128],
];
for (const [input, expect] of sign8Set) {
	tsts('sign8 ' + input, () => {
		assert.is(sign8(input), expect);
	});
}

const sign16Set: [number, number][] = [
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
for (const [input, expect] of sign16Set) {
	tsts('sign16 ' + input, () => {
		assert.is(sign16(input), expect);
	});
}

const sign32Set: [number, number][] = [
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
for (const [input, expect] of sign32Set) {
	tsts('sign32 ' + input, () => {
		assert.is(sign32(input), expect);
	});
}

const gscale_tests:[number,string][]=[
	[0, '00'],
	[1, '01'],
	[127, '7F'],//2**7 -1
	//BE for 128-1023
	[128, '8080'],//2**7
	[129, '8081'],
	[1023, '83FF'],//2**10 -1 = 0b10000011 11111111
	// Now it's LE
	[1024, 'C00004'],//2**10 = 0b11000001 00000100 00000000
	[16383, 'C0FF3F'],
	[16384, 'C00040'],
	[20000, 'C0204E'],
	[65534, 'C0FEFF'],//2**16 -2
	[65535, 'C0FFFF'],//2**16 -1
	[65536, 'C1000001'],//2**16
	[16777215, 'C1FFFFFF'],//2**24 -1
	[16777216, 'C200000001'],//2**24
	[4294967295, 'C2FFFFFFFF'],//2**32 -1 = MAX (for U32)
];
for(const [u32,expect] of gscale_tests) {
	tsts(`toGscaleBytes(${u32})`, () => {
		assert.is(hex.fromBytes(toGlScaleBytes(u32)),expect);
	});
	tsts(`fromGscaleBytes(${expect})`,()=>{
		const ret=fromGlScaleBytes(hex.toBytes(expect));
		if (ret instanceof ParseProblem) assert.equal(false,true,ret.toString());
		const [num,bCount]=ret;
		assert.is(num,u32);
	});
}

//These are one way since they're multiple encodings of the same number (get a better encoder)
const fromGscaleBytes_denorm_tests:[string,number][]=[
	//<128 can be encoded 3 ways +2 more C ways
	['00',0],
	['8000',0],
	['C00000',0],
	['C1000000',0],
	['C200000000',0],
	['7F',127],
	['807F',127],
	['C07F00',127],
	['C17F0000',127],
	['C27F000000',127],
	//<1024 can be encoded 2 ways +2 more C ways
	['8080',128],
	['C08000',128],
	['C1800000',128],
	['C280000000',128],
	['83FF',1023],
	['C0FF03',1023],
	['C1FF0300',1023],
	['C2FF030000',1023],
	//rest < number of bytes, can be encoded with the wrong length
	['C0FFFF',65535],
	['C1FFFF00',65535],
	['C2FFFF0000',65535],
	['C1FFFFFF',16777215],
	['C2FFFFFF00',16777215],
];
for(const [hx,expect] of fromGscaleBytes_denorm_tests) {
	tsts(`fromGscaleBytes(${hx})=${expect}`,()=>{
		const ret=fromGlScaleBytes(hex.toBytes(hx));
		if (ret instanceof ParseProblem) assert.equal(false,true,ret.toString());
		const [num]=ret;
		assert.is(num,expect);
	});
}

const fromGscaleBytes_oversize_tests:string[]=[
	'',
	//Indicator suggests the length should be longer
	'80',
	'C0',
	'C000',
	'C1',
	'C100',
	'C10000',
	'C2',
	'C200',
	'C20000',
	'C2000000',
	//Indicator is out of range
	'C3',
	'C4',
	'C5',
	'C6',
	'C7',
	'C8',
	'C9',
	'CA',
	'CB',
	'CC',
	'CD',
	'CE',
	'CF',
	'D0',
	'E0',
	'F0',
]
for(const hx of fromGscaleBytes_oversize_tests) {
	tsts(`fromGscaleBytes(${hx}) generates a problem`,()=>{
		const ret=fromGlScaleBytes(hex.toBytes(hx));
		assert.instance(ret,ParseProblem);
	});
}

tsts.run();
