import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { b64, hex, utf8 } from '../../src/codec';

const tsts = suite('B64 (sortable)');

const asciiTests:[string,string][] = [
	['', ''],
	['f', 'NU'],
	['fo', 'Naw'],
	['foo', 'Naxj'],
	['foob', 'NaxjMU'],
	['fooba', 'NaxjMa2'],
	['foobar', 'NaxjMa3m'],
	['Hello!', 'G4JgP4wV'],
	['Hello, world!', 'G4JgP4wg65RjQalY6E'],
	['Many hands make light work.', 'HK3iSG/cMKtYQm/hMKhZ64ldNqVo65RjQagi'],
    //https://en.wikipedia.org/wiki/Base64
    ['light w'  ,'P4ZbO5EURk'],
    ['light wo' ,'P4ZbO5EURqw'],
    ['light wor','P4ZbO5EURqxm'],

];
//https://datatracker.ietf.org/doc/html/rfc4648#section-10

for (const [str,enc] of asciiTests) {
	tsts(`Encode(${str})`, () => {
		const u = utf8.toBytes(str);
		assert.is(b64.fromBytes(u), enc);
	});

	tsts(`Decode(${enc})`, () => {
		const u = b64.toBytes(enc);
		assert.is(utf8.fromBytes(u), str);
	});
}

//Test the complete mapping (every char)
const hexSet:[string,string][] = [
	[
		'00108310518720928B30D38F41149351559761969B71D79F8218A39259A7A29AABB2DBAFC31CB3D35DB7E39EBBF3DFBF',
        b64.tbl,
	],
	[
		'FFEF7CEFAE78DF6D74CF2C70BEEB6CAEAA689E69648E28607DE75C6DA6585D65544D24503CE34C2CA2481C61440C2040',
		'zyxwvutsrqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA9876543210/.',
	],
    [
        '14FB9C03D97E','3DiQ.xZy'
    ]
];

for (const [strHex,enc] of hexSet) {
	tsts(`Encode(x${strHex})`, () => {
		const u = hex.toBytes(strHex);
		assert.is(b64.fromBytes(u), enc);
	});

	tsts(`Decode(${enc})`, () => {
		const u = b64.toBytes(enc);
		assert.is(hex.fromBytes(u), strHex);
	});
}

tsts.run();
