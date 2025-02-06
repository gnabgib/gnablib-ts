import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Crc32 } from '../../src/checksum/crc32';
import { hex, utf8 } from '../../src/codec';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Crc32');

const sum_abcd = 3984772369;
const sum_abcdefgh = 2934909520;

const sum_tests: [string, number][] = [
	//https://github.com/froydnj/ironclad/blob/master/testing/test-vectors/crc32.testvec
	['', 0],
	['a', 0xe8b7be43],
	['ab', 2659403885],
	['abc', 0x352441c2],
	['message digest', 0x20159d7f],
	['abcdefghijklmnopqrstuvwxyz', 0x4c2750bd],
	[
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		0x1fc2e6d2,
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		0x7ca94a72,
	],

	//https://crccalc.com/ | http://zorc.breitbandkatze.de/crc.html
	['f', 0x76d32be0],
	['fo', 0xaf73a217],
	['foo', 0x8c736521],
	['foob', 0x3d5b8cc2],
	['fooba', 0x9de04653],
	['foobar', 0x9ef61f95],
	['abcd', sum_abcd],
	['abcde', 0x8587d865],
	['abcdefgh', sum_abcdefgh],
	['123456789', 0xcbf43926],
	['foo bar baz٪☃🍣', 0x5b4b18f3],
	['gnablib', 0x82b04094],
];

for (const [src, expect] of sum_tests) {
	tsts(`Crc32(${src})`, () => {
		const s = new Crc32();
		s.write(utf8.toBytes(src));
		assert.is(s.sum32(), expect);
	});
}

tsts(`sum`, () => {
	const s = new Crc32();
	s.write(Uint8Array.of(97));
	const sum = s.sum();
	assert.is(sum.length, s.size);
	assert.is(hex.fromBytes(sum), 'E8B7BE43');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	const s = new Crc32();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(s.sum()[0], 47);
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Crc32();
	s.write(ascii_abcd);
	assert.is(s.sum32(), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(s.sum32(), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
