import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';

const tsts = suite('Utf8/RFC 3629'); //(2044)

const bytesPairs = [
	//https://en.wikipedia.org/wiki/UTF-8#Encoding
	[[0x24], 0x24],
	[[0xc2, 0xa3], 0xa3],
	[[0xe0, 0xa4, 0xb9], 0x939],
	[[0xe2, 0x82, 0xac], 0x20ac],
	[[0xed, 0x95, 0x9c], 0xd55c],
	[[0xf0, 0x90, 0x8d, 0x88], 0x10348],
];

for (const pair of bytesPairs) {
	tsts('codePointFromBytes: ' + pair[0], () => {
		assert.is(utf8.codePointFromBytes(pair[0] as number[]), pair[1]);
	});
	tsts('bytesFromCodePoint: ' + pair[1], () => {
		assert.is(
			hex.fromBytes(new Uint8Array(utf8.bytesFromCodePoint(pair[1] as number))),
			hex.fromBytes(new Uint8Array(pair[0] as number[]))
		);
	});
}

const stringHexPairs = [
	['a', '61'],
	[' ', '20'],
	['gnabgib', '676E6162676962'],
	//https://datatracker.ietf.org/doc/html/rfc3629#section-7
	['A≢Α.', '41E289A2CE912E'],
	['한국어', 'ED959CEAB5ADEC96B4'], //korean meaning: the Korean language (hangugeo)
	['日本語', 'E697A5E69CACE8AA9E'], //Japanese meaning" the Japanese language (nihongo)
	['𣎴', 'F0A38EB4'], //Chinese meaning: stump of tree (without BOM in eg)
];

for (const pair of stringHexPairs) {
	tsts('toBytes: ' + pair[0], () => {
		const b = utf8.toBytes(pair[0]);
		assert.is(hex.fromBytes(b), pair[1]);
	});
	tsts('fromBytes: ' + pair[0], () => {
		const b = hex.toBytes(pair[1]);
		assert.is(utf8.fromBytes(b), pair[0]);
	});

	// tsts('bytesFromCodePoint: '+pair[1],()=> {
	//     assert.is(
	//         hex.fromBytes(new Uint8Array(utf8.bytesFromCodePoint(pair[1] as number))),
	//         hex.fromBytes(new Uint8Array(pair[0] as number[]))
	//         );
	// });
}

tsts.run();
