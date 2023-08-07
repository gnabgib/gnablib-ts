import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { base32hex, hex, utf8 } from '../../src/codec';

const tsts = suite('Base32hex/RFC 4648');

const asciiTests:[string,string][]= [
	['', ''],
	['f',      'CO======'],
	['fo',     'CPNG===='],
	['foo',    'CPNMU==='],
	['foob',   'CPNMUOG='],
	['fooba',  'CPNMUOJ1'],
	['foobar', 'CPNMUOJ1E8======'],
];
//https://datatracker.ietf.org/doc/html/rfc4648#page-8

for (const [str,enc] of asciiTests) {
	tsts(`Encode(${str})`, () => {
		const u = utf8.toBytes(str);
		assert.is(base32hex.fromBytes(u), enc);
	});

	tsts(`Decode(${enc})`, () => {
		const u = base32hex.toBytes(enc);
		assert.is(utf8.fromBytes(u), str);
	});
}

//Test the complete mapping (every char)
const hexTests:[string,string][] = [
	//Hex,                                              enc
	[
		'00443214C74254B635CF84653A56D7C675BE77DF',
		'0123456789ABCDEFGHIJKLMNOPQRSTUV',
	],
	[
		'FFBBCDEB38BDAB49CA307B9AC5A928398A418820',
		'VUTSRQPONMLKJIHGFEDCBA9876543210',
	],
];

for (const [strHex,enc] of hexTests) {
	tsts(`Encode(x${strHex})`, () => {
		const u = hex.toBytes(strHex);
		assert.is(base32hex.fromBytes(u), enc);
	});

	tsts(`Decode(${enc})`, () => {
		const u = base32hex.toBytes(enc);
		assert.is(hex.fromBytes(u), strHex);
	});
}

const asciiDecodeQuirkTests:[string,string][]=[
	//Lower case is ok
	['cpnmuoj1e8','666F6F626172'],//foobar in ASCII
];
for(const [enc,strHex] of asciiDecodeQuirkTests) {
	tsts(`Decode(${enc})`, () => {
		const u = base32hex.toBytes(enc);
		assert.is(hex.fromBytes(u), strHex);
	});
}

tsts.run();
