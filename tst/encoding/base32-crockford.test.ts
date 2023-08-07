import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { crockford32, hex, utf8 } from '../../src/codec';

const tsts = suite('Base32/Crockford');

const asciiTests:[string,string][] = [
	['', ''],
	['f', 'CR'],
	['fo', 'CSQG'],
	['foo', 'CSQPY'],
	['foob', 'CSQPYRG'],
	['fooba', 'CSQPYRK1'],
	['foobar', 'CSQPYRK1E8'],
];
//https://cryptii.com/pipes/crockford-base32

for (const [str,enc] of asciiTests) {
	tsts(`Encode(${str})`, () => {
		const u = utf8.toBytes(str);
		assert.is(crockford32.fromBytes(u), enc);
	});

	tsts(`Decode(${enc})`, () => {
		const u = crockford32.toBytes(enc);
		assert.is(utf8.fromBytes(u), str);
	});
}

//Test the complete mapping (every char)
const hexTests:[string,string][] = [
	[
		'00443214C74254B635CF84653A56D7C675BE77DF', 
		'0123456789ABCDEFGHJKMNPQRSTVWXYZ'
	],
	[
		'FFBBCDEB38BDAB49CA307B9AC5A928398A418820',
		'ZYXWVTSRQPNMKJHGFEDCBA9876543210',
	],
];

for (const [strHex,enc] of hexTests) {
	tsts(`Encode(x${strHex})`, () => {
		const u = hex.toBytes(strHex);
		assert.is(crockford32.fromBytes(u), enc);
	});

	tsts(`Decode(${enc})`, () => {
		const u = crockford32.toBytes(enc);
		const h = hex.fromBytes(u);
		assert.is(h, strHex);
	});
}

const asciiDecodeQuirkTests:[string,string][]=[
	//Note we double because the smallest Base32 encoding is 2 chars long
	['00','00'],
	['oo','00'],
	['OO','00'],
	//00001000=8
	['10','08'],
	['i0','08'],
	['I0','08'],
	['l0','08'],
	['L0','08'],
	//Lower case is ok
	['csqpyrk1e8','666F6F626172'],//foobar in ASCII
];
for(const [enc,strHex] of asciiDecodeQuirkTests) {
	tsts(`Decode(${enc})`, () => {
		const u = crockford32.toBytes(enc);
		assert.is(hex.fromBytes(u), strHex);
	});
}

tsts.run();
