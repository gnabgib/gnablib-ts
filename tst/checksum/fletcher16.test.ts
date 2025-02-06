import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Fletcher16 } from '../../src/checksum/fletcher';
import { hex, utf8 } from '../../src/codec';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Fletcher16');

const sum_abcd = 0xd78b;
const sum_abcdefgh = 0x0627;

const sum_tests: [string, number][] = [
	//Wiki
	['\x01\x02', 0x0403],
	['abcde', 0xc8f0],
	['abcdef', 0x2057],
	['abcdefgh', sum_abcdefgh],
	// Others
	['', 0],
	['\x00', 0],
	['\x00\x00', 0],
	['\x00\x00\x00', 0],
	['\x00\x00\x00\x00', 0],
	['\x01', 0x0101],

	['\x01\x02\x03', 0xa06],
	['a', 0x6161],
	['ab', 0x25c3],
	['abc', 0x4c27],
	['abcd', sum_abcd],
	['f', 0x6666],
	['fo', 0x3cd5],
	['foo', 0x8145],
	['foob', 0x29a7],
	['fooba', 0x3209],
	['foobar', 0xad7b],
	['123456789', 0x1ede],
	['foo bar baz٪☃🍣', 0x493f],
	['gnabgib', 0x46cc],
	['Z', 0x5a5a],
];

for (const [src, expect] of sum_tests) {
	tsts(`Fletcher16(${src})`, () => {
		const s = new Fletcher16();
		s.write(utf8.toBytes(src));
		assert.is(s.sum16(), expect);
	});
}

tsts(`sum`, () => {
	const s = new Fletcher16();
	s.write(Uint8Array.of(97));
	const sum = s.sum();
	assert.is(sum.length, s.size);
	assert.is(hex.fromBytes(sum), '6161');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	//This tests the longer write code, but you'll need to manually decrease maxSpace
	// in order for it to trigger (say 4000)
	const s = new Fletcher16();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(s.sum16(), 62221);
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Fletcher16();
	s.write(ascii_abcd);
	assert.is(s.sum16(), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(s.sum16(), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
