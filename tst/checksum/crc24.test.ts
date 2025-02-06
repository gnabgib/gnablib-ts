import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Crc24 } from '../../src/checksum/crc24';
import { hex, utf8 } from '../../src/codec';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Crc24');

const sum_abcd = 4940586;
const sum_abcdefgh = 15232193;

const sum_tests: [string, number][] = [
	//https://github.com/froydnj/ironclad/blob/master/testing/test-vectors/crc24.testvec
	['', 0xb704ce],
	['a', 0xf25713],
	['ab', 0xa11a2d],
	['abc', 0xba1c7b],
	['message digest', 0xdbf0b6],
	['abcdefghijklmnopqrstuvwxyz', 0xed3665],
	['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 0x4662cd],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		0x8313bb,
	],
	//MISC: https://toolslick.com/programming/hashing/crc-calculator
	['f', 0x6d2804],
	['fo', 0xa2d10d],
	['foo', 0x4fc255],
	['foob', 0x7aafca],
	['fooba', 0xc79c46],
	['foobar', 0x7334de],
	['abcd', sum_abcd],
	['abcdefgh', sum_abcdefgh],
	['123456789', 0x21cf02],
	['foo bar baz٪☃🍣', 0xc37aa8],
	['gnablib', 0x9e55b7],
];

for (const [src, expect] of sum_tests) {
	tsts(`crc24(${src})`, () => {
		const s = new Crc24();
		s.write(utf8.toBytes(src));
		assert.is(s.sum24(), expect);
	});
}

tsts(`sum`, () => {
	const s = new Crc24();
	s.write(Uint8Array.of(97));
	const sum = s.sum();
	assert.is(sum.length, s.size);
	assert.is(hex.fromBytes(sum), 'F25713');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	const s = new Crc24();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(s.sum()[0], 19);
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Crc24();
	s.write(ascii_abcd);
	assert.is(s.sum24(), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(s.sum24(), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
