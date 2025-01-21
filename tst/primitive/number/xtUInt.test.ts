import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { parseDec, parseHex, sign16, sign32, sign8 } from '../../../src/primitive/number/xtUInt';

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

tsts.run();
