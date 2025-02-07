import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { XxHash32 } from '../../src/checksum/XxHash32';
import { hex, utf8 } from '../../src/codec';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('XxHash32');

const sum_abcd = 0xa3643705;
const sum_abcdefgh = 196331195;

const string_tests: [string, number][] = [
	['\0', 0xcf65b03e],
	['', 0x2cc5d05],
	['a', 0x550d7456],
	['abcdefgh', sum_abcdefgh],
	['heiå', 0xdb5abccc],
	['123456789112345', 0x674ae941],
	['1234567891123456', 0xd71fe957], //temp block size
	['12345678911234567', 0x333e44df], //block+1
	['12345678911234567892', 0x0ea19043], //block+4
	['123456789112345678921', 0xd369d77d], //block+4+1
	['message hash', 0xCC46C57C],
	// Computed with xxHash C version
	['abc', 0x32d153ff],
	['abcd', sum_abcd],
];
for (const [src, expect] of string_tests) {
	tsts(`XxHash32(${src})`, () => {
		const hash = new XxHash32();
		hash.write(utf8.toBytes(src));
		assert.is(hash.sum32(), expect);
	});
}

const tests: [Uint8Array, number, number][] = [
	[ascii_abcd, 1, 0xbe6e299f],
	[ascii_abcd, 0xcafe, 0x4c838027],
	[Uint8Array.of(0, 0), 1, 0xe465d197],
	[Uint8Array.of(0), 1, 0x02db596b],
];
for (const [data, seed, expect] of tests) {
	tsts(`XxHash32([${data.length}],${seed})`, () => {
		const hash = new XxHash32(seed);
		hash.write(data);
		const md = hash.sum32();
		assert.is(md, expect);
	});
}

tsts(`sum()`, () => {
	const hash = new XxHash32(0);
	hash.write(Uint8Array.of(0));
	const sum = hash.sum();
	assert.is(sum.length, hash.size);
	assert.is(hash.blockSize > 0, true);
	assert.is(hex.fromBytes(sum), 'CF65B03E');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	const s = new XxHash32();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(s.sum32(), 1324115271);
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new XxHash32();
	s.write(ascii_abcd);
	assert.is(s.sum32(), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(s.sum32(), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
