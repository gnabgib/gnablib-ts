import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { base64 } from '../../src/encoding/Base64';
import { utf8 } from '../../src/encoding/Utf8';
import { hex } from '../../src/encoding/Hex';

const tsts = suite('Base64/RFC 4648');

const asciiSet = [
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
	//https://en.wikipedia.org/wiki/Base64
	['light w', 'bGlnaHQgdw=='],
	['light wo', 'bGlnaHQgd28='],
	['light wor', 'bGlnaHQgd29y'],
];
//https://datatracker.ietf.org/doc/html/rfc4648#section-10

for (const [str, b64] of asciiSet) {
	tsts(`Encode(${str})`, () => {
		const u = utf8.toBytes(str);
		assert.is(base64.fromBytes(u), b64);
	});

	tsts(`Decode(${b64})`, () => {
		const u = base64.toBytes(b64);
		assert.is(utf8.fromBytes(u), str);
	});
}

const hexSet = [
	//Test the complete mapping (every char)
	[
		'00108310518720928B30D38F41149351559761969B71D79F8218A39259A7A29AABB2DBAFC31CB3D35DB7E39EBBF3DFBF',
		base64.tbl,
	],
	[
		'FFEF7CEFAE78DF6D74CF2C70BEEB6CAEAA689E69648E28607DE75C6DA6585D65544D24503CE34C2CA2481C61440C2040',
		'/+9876543210zyxwvutsrqponmlkjihgfedcbaZYXWVUTSRQPONMLKJIHGFEDCBA',
	],
	['14FB9C03D97E', 'FPucA9l+'],
];

for (const [strHex, b64] of hexSet) {
	tsts(`Encode(x${strHex})`, () => {
		const u = hex.toBytes(strHex);
		assert.is(base64.fromBytes(u), b64);
	});

	tsts(`Decode(${b64})`, () => {
		const u = base64.toBytes(b64);
		assert.is(hex.fromBytes(u), strHex);
	});
}

tsts.run();
