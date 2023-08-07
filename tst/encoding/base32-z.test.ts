import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8, zbase32 } from '../../src/codec';

const tsts = suite('Base32/z-base-32');

const asciiTests:[string,string][] = [
	['', ''],
	['f', 'ca'],
	['fo', 'c3zo'],
	['foo', 'c3zs6'],
	['foob', 'c3zs6ao'],
	['fooba', 'c3zs6aub'],
	['foobar', 'c3zs6aubqe'],
];
//https://cryptii.com/pipes/crockford-base32

for (const [str,enc] of asciiTests) {
	tsts(`Encode(${str})`, () => {
		const u = utf8.toBytes(str);
		assert.is(zbase32.fromBytes(u), enc);
	});

	tsts(`Decode(${enc})`, () => {
		const u = zbase32.toBytes(enc);
		assert.is(utf8.fromBytes(u), str);
	});
}

//Test the complete mapping (every char)
const hexTests:[string,string][] = [
	[
		'00443214C74254B635CF84653A56D7C675BE77DF', 
		'ybndrfg8ejkmcpqxot1uwisza345h769'
	],
	[
		'FFBBCDEB38BDAB49CA307B9AC5A928398A418820',
		'967h543azsiwu1toxqpcmkje8gfrdnby',
	],
];

for (const [strHex,enc] of hexTests) {
	tsts(`Encode(x${strHex})`, () => {
		const u = hex.toBytes(strHex);
		assert.is(zbase32.fromBytes(u), enc);
	});

	tsts(`Decode(${enc})`, () => {
		const u = zbase32.toBytes(enc);
		const h = hex.fromBytes(u);
		assert.is(h, strHex);
	});
}

const asciiDecodeQuirkTests:[string,string][]=[
	//Upper case is ok
	['C3ZS6AUBQE','666F6F626172'],//foobar in ASCII
];
for(const [enc,strHex] of asciiDecodeQuirkTests) {
	tsts(`Decode(${enc})`, () => {
		const u = zbase32.toBytes(enc);
		assert.is(hex.fromBytes(u), strHex);
	});
}

tsts.run();
