import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as crockford32 from '../../src/encoding/Crockford32';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import * as stringExt from '../../src/primitive/StringExt';

const tsts = suite('Base32/Crockford');
const set = [
	//ASCII,    Enc
	['', ''],
	['f', 'CR'],
	['fo', 'CSQG'],
	['foo', 'CSQPY'],
	['foob', 'CSQPYRG'],
	['fooba', 'CSQPYRK1'],
	['foobar', 'CSQPYRK1E8'],
];
//https://cryptii.com/pipes/crockford-base32

for (const pair of set) {
	tsts('Encode:' + pair[0], () => {
		const u = utf8.toBytes(pair[0]);
		assert.is(crockford32.fromBytes(u), pair[1]);
	});

	tsts('Decode:' + pair[1], () => {
		const u = crockford32.toBytes(pair[1]);
		assert.is(utf8.fromBytes(u), pair[0]);
	});
}

//Test the complete mapping (every char)
const hexSet = [
	//Hex,                                              enc
	['00443214C74254B635CF84653A56D7C675BE77DF', crockford32.tbl],
	[
		'FFBBCDEB38BDAB49CA307B9AC5A928398A418820',
		stringExt.reverse(crockford32.tbl),
	], // 'ZYXWVTSRQPNMKJHGFEDCBA9876543210'],
];

for (const pair of hexSet) {
	tsts('Encode:' + pair[0], () => {
		const u = hex.toBytes(pair[0]);
		assert.is(crockford32.fromBytes(u), pair[1]);
	});

	tsts('Decode:' + pair[1], () => {
		const u = crockford32.toBytes(pair[1]);
		const h = hex.fromBytes(u);
		assert.is(h, pair[0]);
	});
}

tsts('Decode quriks 0/o/O', () => {
	//Min size=2, so let's just double up
	const c0 = hex.fromBytes(crockford32.toBytes('00'));
	const co = hex.fromBytes(crockford32.toBytes('oo'));
	const cO = hex.fromBytes(crockford32.toBytes('OO'));
	assert.is(c0, co, '0=o');
	assert.is(cO, co, 'O=o');
});

tsts('Decode quriks 1/i/I/l/L', () => {
	//Min size=2, so let's just double up
	const c1 = hex.fromBytes(crockford32.toBytes('11'));
	const ci = hex.fromBytes(crockford32.toBytes('ii'));
	const cI = hex.fromBytes(crockford32.toBytes('II'));
	const cl = hex.fromBytes(crockford32.toBytes('ll'));
	const cL = hex.fromBytes(crockford32.toBytes('LL'));
	assert.is(c1, ci, '1=i');
	assert.is(ci, cI, 'i=I');
	assert.is(cI, cl, 'I=l');
	assert.is(cl, cL, 'l=L');
});

tsts('Ignore dash', () => {
	assert.is('f', utf8.fromBytes(crockford32.toBytes('C-R')));
});

tsts('Lowercase OK', () => {
	assert.is('f', utf8.fromBytes(crockford32.toBytes('cr')));
});

tsts.run();
