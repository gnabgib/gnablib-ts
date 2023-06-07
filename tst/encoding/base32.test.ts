import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as base32 from '../../src/encoding/Base32';
import * as utf8 from '../../src/encoding/Utf8';
import { Hex } from '../../src/encoding/Hex';
import * as stringExt from '../../src/primitive/StringExt';

const tsts = suite('Base32/RFC 4648');

const asciiSet = [
	//ASCII,    Enc
	['', ''],
	['f', 'MY======'],
	['fo', 'MZXQ===='],
	['foo', 'MZXW6==='],
	['foob', 'MZXW6YQ='],
	['fooba', 'MZXW6YTB'],
	['foobar', 'MZXW6YTBOI======'],
	['Hello!', 'JBSWY3DPEE======'],
	['Hello, world!', 'JBSWY3DPFQQHO33SNRSCC==='],
];
//https://datatracker.ietf.org/doc/html/rfc4648#page-8

for (const pair of asciiSet) {
	tsts('Encode:' + pair[0], () => {
		const u = utf8.toBytes(pair[0]);
		assert.is(base32.fromBytes(u), pair[1]);
	});

	tsts('Decode:' + pair[1], () => {
		const u = base32.toBytes(pair[1]);
		assert.is(utf8.fromBytes(u), pair[0]);
	});
}

//Test the complete mapping (every char)
const hexSet = [
	//Hex,                                              enc
	['00443214C74254B635CF84653A56D7C675BE77DF', base32.tbl],
	['FFBBCDEB38BDAB49CA307B9AC5A928398A418820', stringExt.reverse(base32.tbl)], //'765432ZYXWVUTSRQPONMLKJIHGFEDCBA'],
];

for (const pair of hexSet) {
	tsts('Encode:' + pair[0], () => {
		const u = Hex.toBytes(pair[0]);
		assert.is(base32.fromBytes(u), pair[1]);
	});

	tsts('Decode:' + pair[1], () => {
		const u = base32.toBytes(pair[1]);
		assert.is(Hex.fromBytes(u), pair[0]);
	});
}

tsts('toBytes:', () => {
	assert.throws(()=>base32.toBytes('['));
	assert.equal(base32.toBytes(' MY======',{ignore:' '}),Uint8Array.of(102));
});


//todo:undo
tsts.run();
