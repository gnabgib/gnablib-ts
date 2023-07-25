import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { crc24 } from '../../src/checksum/crc24';
import { utf8 } from '../../src/encoding/Utf8';

const tsts = suite('CRC24/RFC 4880');

const asciiSet:[string,number][] = [
    //https://github.com/froydnj/ironclad/blob/master/testing/test-vectors/crc24.testvec
	['', 0xb704ce],
	['a', 0xf25713],
    ['abc', 0xba1c7b],
    ['message digest', 0xdbf0b6],
    ['abcdefghijklmnopqrstuvwxyz', 0xed3665],
    ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 0x4662cd],
    ['12345678901234567890123456789012345678901234567890123456789012345678901234567890', 0x8313bb],
    //MISC: https://toolslick.com/programming/hashing/crc-calculator
	['f', 0x6D2804],
	['fo', 0xA2D10D],
	['foo', 0x4FC255],
	['foob', 0x7AAFCA],
	['fooba', 0xC79C46],
	['foobar', 0x7334DE],
	['123456789', 0x21CF02],
	['foo bar baz٪☃🍣', 0xC37AA8],
	['gnablib', 0x9E55B7],
];

for (const [data,crc] of asciiSet) {
	tsts('CRC: ' + data, () => {
		const b = utf8.toBytes(data);
		assert.is(crc24(b), crc);
	});
}

// tsts('Double sum: ab+bc', () => {
// 	const b1 = utf8.toBytes('ab');
// 	const b2 = utf8.toBytes('cd');
// 	const b3 = utf8.toBytes('abcd');
// 	const crc1 = crc32(b1);
// 	const crc2 = crc32(b2, crc1);
// 	assert.is(crc2, crc32(b3));
// });

tsts.run();
