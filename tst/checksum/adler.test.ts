import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {adler32} from '../../src/checksum';
import { utf8 } from '../../src/codec';


const tsts = suite('Adler/RFC 1950');

//https://md5calc.com/hash/adler32
const adler32Set = [
	//Wiki
    ['Wikipedia',0x11E60398],
    //Others
    ['abcde', 0x05C801F0],
	['abcdef', 0x081E0256],
	['abcdefgh', 0x0E000325],
	['', 1],
	['\x00', 0x10001],
	['\x00\x00', 0x20001],
	['\x00\x00\x00', 0x30001],
	['\x00\x00\x00\x00', 0x40001],
	['\x01', 0x20002],
	['\x01\x02', 0x60004],
	['\x01\x02\x03', 0xD0007],
	['a', 0x00620062],
	['a\x00', 0xC40062],
	['a\x00\x00', 0x01260062],
	['a\x00\x00\x00', 0x01880062],
	['ab', 0x012600C4],
	['abc', 0x024D0127],
	['abcd', 0x03D8018B],
	['f', 0x00670067],
	['fo', 0x013D00D6],
	['foo', 0x02820145],
	['foob', 0x042901A7],
	['fooba', 0x06310208],
	['foobar', 0x08AB027A],
    ['123456789', 0x091E01DE],
	['foo bar baz٪☃🍣', 0x5c010a36],
	['gnabgib', 0x0B4202CB]
];

for (const pair of adler32Set) {
	tsts('adler32: ' + pair[0], () => {
		const b = utf8.toBytes(pair[0] as string);
		assert.is(adler32(b), pair[1]);
	});
}

tsts.run();
