import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Float } from '../../../src/primitive/number';

const tsts = suite('Float');

const parseDecSet: [string, number, number][] = [
	//Input, JS.parseInt, expect

	//From MDN
	['123', 123, 123],
	[' 123  ', 123, 123],
	['077', 77, 77],
	['ff', Number.NaN, Number.NaN], //JS doesn't assume this is hex
	['0xFF', 0, Number.NaN],
	['xyz', Number.NaN, Number.NaN],

	['', Number.NaN, Number.NaN],
	['421', 421, 421],
	['-421', -421, -421],
	['- 421', Number.NaN, Number.NaN],
	[' 421', 421, 421],
	['+421', 421, 421],
	['Infinity', Number.POSITIVE_INFINITY, Number.NaN],
    ['-Infinity', Number.NEGATIVE_INFINITY, Number.NaN],
	['+Inf', Number.NaN, Number.NaN],
	['-Inf', Number.NaN, Number.NaN],
	['hop1.61803398875', Number.NaN, Number.NaN],
	//The reasons parseInt is questionable
	['4wd', 4, Number.NaN],
	['1 is the loneliest', 1, Number.NaN], //It's a song
	['421e+0', 421, Number.NaN],
    ['421e+1', 4210, Number.NaN],
	['421hop', 421, Number.NaN],
	['0x10', 0, Number.NaN],
	['0b11', 0, Number.NaN], //Could be considered binary
	['0o7', 0, Number.NaN], //Could be considered octal
	['1e3', 1000, Number.NaN],

    //Everything above was int-ish, these are floats
	['1.61803398875', 1.61803398875, 1.61803398875], //JS just truncates the decimal parts
    ['1.9', 1.9, 1.9],
	['2.1', 2.1, 2.1],
	['2.0', 2, 2],
];

for (const [input, jsExpect, expect] of parseDecSet) {
	tsts(`parseDec(${input})`, () => {
		assert.equal(Number.parseFloat(input), jsExpect, 'parseFloat');
		assert.equal(Float.parseDec(input), expect, 'parseDec');
	});
}

tsts.run();
