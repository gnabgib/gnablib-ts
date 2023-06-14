import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { crc32 } from '../../src/checksum/crc32';
import { utf8 } from '../../src/encoding/Utf8';

const tsts = suite('CRC32');

//Testing sources:
// - https://crccalc.com/
// - http://zorc.breitbandkatze.de/crc.html
const asciiSet = [
	['', 0],
	['a', 0xe8b7be43],
	['f', 0x76d32be0],
	['fo', 0xaf73a217],
	['foo', 0x8c736521],
	['foob', 0x3d5b8cc2],
	['fooba', 0x9de04653],
	['foobar', 0x9ef61f95],
	['abcde', 0x8587d865],
	['123456789', 0xcbf43926],
	['foo bar baz٪☃🍣', 0x5b4b18f3],
	['gnabgib', 0x8ee5af75],
];

for (const pair of asciiSet) {
	tsts('Sum: ' + pair[0], () => {
		const b = utf8.toBytes(pair[0] as string);
		assert.is(crc32(b), pair[1]);
	});
}

tsts('Double sum: ab+bc', () => {
	const b1 = utf8.toBytes('ab');
	const b2 = utf8.toBytes('cd');
	const b3 = utf8.toBytes('abcd');
	const crc1 = crc32(b1);
	const crc2 = crc32(b2, crc1);
	assert.is(crc2, crc32(b3));
});

tsts.run();
