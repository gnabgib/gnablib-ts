import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as base64 from '../../src/encoding/Base64';
import * as utf8 from '../../src/encoding/Utf8';
import { Hex } from '../../src/encoding/Hex';
import * as stringExt from '../../src/primitive/StringExt';

const tsts = suite('Base64/RFC 4648');

const asciiSet = [
	//ASCII,    Enc
	['', ''],
	['f', 'Zg=='],
	['fo', 'Zm8='],
	['foo', 'Zm9v'],
	['foob', 'Zm9vYg=='],
	['fooba', 'Zm9vYmE='],
	['foobar', 'Zm9vYmFy'],
	['Hello!', 'SGVsbG8h'],
	['Hello, world!', 'SGVsbG8sIHdvcmxkIQ=='],
	['Many hands make light work.', 'TWFueSBoYW5kcyBtYWtlIGxpZ2h0IHdvcmsu'],
];
//https://datatracker.ietf.org/doc/html/rfc4648#section-10

for (const pair of asciiSet) {
	tsts('Encode:' + pair[0], () => {
		const u = utf8.toBytes(pair[0]);
		assert.is(base64.fromBytes(u, { cPad: true }), pair[1]);
	});

	tsts('Decode:' + pair[1], () => {
		const u = base64.toBytes(pair[1]);
		assert.is(utf8.fromBytes(u), pair[0]);
	});
}

//Test the complete mapping (every char)
const hexSet = [
	//Hex,                                              enc
	[
		'00108310518720928B30D38F41149351559761969B71D79F8218A39259A7A29AABB2DBAFC31CB3D35DB7E39EBBF3DFBF',
		base64.tbl,
	],
	[
		'FFEF7CEFAE78DF6D74CF2C70BEEB6CAEAA689E69648E28607DE75C6DA6585D65544D24503CE34C2CA2481C61440C2040',
		stringExt.reverse(base64.tbl),
	],
];

for (const pair of hexSet) {
	tsts('Encode:' + pair[0], () => {
		const u = Hex.toBytes(pair[0]);
		assert.is(base64.fromBytes(u, { cPad: true }), pair[1]);
	});

	tsts('Decode:' + pair[1], () => {
		const u = base64.toBytes(pair[1]);
		assert.is(Hex.fromBytes(u), pair[0]);
	});
}

tsts.run();
