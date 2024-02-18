import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { UInt } from '../../../src/primitive/number';

const tsts = suite('UInt');

const parseDecSet:[string,number,number][]= [
    //Input, JS.parseInt, expect

    //From MDN
    ['123',123,123],
    [' 123  ',123,123],
    ['077',77,77],
    ['1.9',1,Number.NaN],//This isn't a nice feature in JS
    ['ff',Number.NaN,Number.NaN],//JS doesn't assume this is hex
    ['0xFF',255,Number.NaN],//Note we're testing against parseInt without a radix.. how useful is this feature?
    ['xyz',Number.NaN,Number.NaN],

    ['',Number.NaN, Number.NaN],
	['421', 421, 421],
	['-421', -421, Number.NaN],
	['- 421', Number.NaN, Number.NaN],
	[' 421', 421,421],
	['+421', 421,Number.NaN],
	['Infinity', Number.NaN,Number.NaN],
    ['+Inf', Number.NaN,Number.NaN],
    ['-Inf', Number.NaN,Number.NaN],
	['hop1.61803398875', Number.NaN,Number.NaN],
    //The reasons parseInt is questionable
    ['4wd',4,Number.NaN],
    ['1 is the loneliest',1,Number.NaN],//It's a song
	['421e+0', 421, Number.NaN],
	['421hop', 421, Number.NaN],
	['1.61803398875', 1, Number.NaN],//JS just truncates the decimal parts
	['0x10', 16, Number.NaN],
    ['0b11',0,Number.NaN],//Could be considered binary
	['0o7', 0, Number.NaN], //Could be considered octal
    ['1e3',1,Number.NaN],//In Sci not that's 1000
    ['2.1',2,Number.NaN],
    ['2.0',2,Number.NaN],//JS gets the correct answer, but only by chance not checking after the decimal
];

for (const [input,jsExpect,expect] of parseDecSet) {
	tsts(`parseDec(${input})`, () => {
        assert.equal(Number.parseInt(input),jsExpect,'parseInt');
        assert.equal(UInt.parseDec(input),expect,'parseDec');
	});
}

tsts.run();