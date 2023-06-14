import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { luhnInt, luhnStr } from '../../src/checksum/luhn';

const tsts = suite('Luhn/ISO 7812');

//https://www.dcode.fr/luhn-algorithm
const sumStr = [
	['7992739871', 3],
	['07992739871', 3], //Front zero does nothing
	['79927398710', 4], //Bag zero changes calc
	['1234567', 4],
	['12345678', 2],
	['0123456789', 7],
	['1234567890', 3],
	['4992739871', 6],
	['123456781234567', 0],
	['411111111111111', 1],
	['123456781234567', 0],
	['987654321', 7],
	['98765432123456789', 6],
	['9876543210123456789', 4],
	['1', 8],
	['10', 9],
	['100', 8],
	['1000', 9],
	['10000', 8],
	['2', 6],
	['12', 5],
	['212', 1],
	['1212', 0],
	['21212', 6],
	['18', 2],
	['182', 6],
	['1826', 7],
	['18267', 5],
];

for (const pair of sumStr) {
	tsts('SumStr: ' + pair[0], () => {
		assert.is(luhnStr(pair[0] as string), pair[1]);
	});
}

//Max safe int:9007199254740991 (16 digits)
const sumInt = [
	[7992739871, 3],
	[79927398710, 4],
	[1234567, 4],
	[12345678, 2],
	[123456789, 7],
	[1234567890, 3],
	[4992739871, 6],
	[123456781234567, 0],
	[411111111111111, 1],
	[123456781234567, 0],
	[987654321, 7],
	[1, 8],
	[10, 9],
	[100, 8],
	[1000, 9],
	[10000, 8],
	[2, 6],
	[12, 5],
	[212, 1],
	[1212, 0],
	[21212, 6],
	[18, 2],
	[182, 6],
	[1826, 7],
	[18267, 5],
];

for (const pair of sumInt) {
	tsts('SumInt: ' + pair[0], () => {
		assert.is(luhnInt(pair[0]), pair[1]);
	});
}

tsts.run();
