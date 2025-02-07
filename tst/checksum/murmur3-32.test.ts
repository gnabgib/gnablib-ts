import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Murmur3_32 } from '../../src/checksum/Murmur3';
import { hex, utf8 } from '../../src/codec';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Murmur3 (32)');

const sum_abcd = 1139631978;
const sum_abcdefgh = 1239272644;

const string_tests: [string, number][] = [
	['', 0],
	['a', 1009084850],
	['ab', 2613040991],
	['abc', 3017643002],
	['abcd', sum_abcd],
	['abcdefgh', sum_abcdefgh],
	//https://github.com/spaolacci/murmur3/blob/master/murmur_test.go
	['hello', 0x248bfa47],
	['hello, world', 0x149bbb7f],
	['The quick brown fox jumps over the lazy dog.', 0xd5c48bfc],
	//Amazing test vectors https://github.com/pid/murmurHash3js/blob/master/test/test-server.js
	['I will not buy this record, it is scratched.', 0xa8d02b9a],
	['My hovercraft is full of eels.', 0xb00ac145],
	['message digest', 0x638f4169],
];
for (const [src, expect] of string_tests) {
	tsts(`Murmur3-32(${src})`, () => {
		const hash = new Murmur3_32();
		hash.write(utf8.toBytes(src));
		const sum = hash.sum32();
		assert.is(sum, expect);
	});
}

const byte_tests: [Uint8Array, number][] = [
	//https://stackoverflow.com/questions/14747343/murmurhash3-test-vectors
	[new Uint8Array(1), 0x514e28b7],
	[new Uint8Array(2), 0x30f4c306],
	[new Uint8Array(3), 0x85f0b427],
	[new Uint8Array(4), 0x2362f9de],
	[Uint8Array.of(0x21), 0x72661cf4],
	[Uint8Array.of(0x21, 0x43), 0xa0f7b07a],
	[Uint8Array.of(0x21, 0x43, 0x65), 0x7e4a8634],
	[Uint8Array.of(0x21, 0x43, 0x65, 0x87), 0xf55b516b],
    [Uint8Array.of(0xff, 0xff, 0xff, 0xff), 0x76293b50],
];
for (const [bytes, expect] of byte_tests) {
	tsts(`Murmur3-32[${bytes.length}]`, () => {
		const hash = new Murmur3_32();
		hash.write(bytes);
		const sum = hash.sum32();
		assert.is(sum, expect);
	});
}

const alt_seed_tests: [Uint8Array, number, number][] = [
	//https://www.pelock.com/products/hash-calculator
	[new Uint8Array(), 1, 0x514e28b7],
	[new Uint8Array(), 0xffffffff, 0x81f16f39],
	[new Uint8Array(), 0x2a, 0x087fcd5c],
	//https://stackoverflow.com/questions/14747343/murmurhash3-test-vectors
	[Uint8Array.of(0x21, 0x43, 0x65, 0x87), 0x5082edee, 0x2362f9de],
	//https://github.com/spaolacci/murmur3/blob/master/murmur_test.go
	[utf8.toBytes('hello'), 1, 0xbb4abcad],
	[utf8.toBytes('hello, world'), 1, 0x6f5cb2e9],
	[utf8.toBytes('The quick brown fox jumps over the lazy dog.'), 1, 0x846f6a36],
	[utf8.toBytes('hello'), 0x2a, 0xe2dbd2e1],
	[utf8.toBytes('hello, world'), 0x2a, 0x7ec7c6c2],
	[
		utf8.toBytes('The quick brown fox jumps over the lazy dog.'),
		0x2a,
		0xc02d1434,
	],

	[Uint8Array.of(0), 2, 0x85f0b427],
	[Uint8Array.of(0, 0, 0), 2, 0x514e28b7],
];

let count = 0;
for (const [data, seed, expect] of alt_seed_tests) {
	tsts(`Murmur3-32[${count++}]`, () => {
		const hash = new Murmur3_32(seed);
		hash.write(data);
		const sum = hash.sum32();
		assert.is(sum, expect);
	});
}

tsts(`sum()`, () => {
	const hash = new Murmur3_32(0);
	hash.write(Uint8Array.of(0));
	const sum = hash.sum();
	assert.is(sum.length, hash.size);
	assert.is(hash.blockSize > 0, true);
	assert.is(hex.fromBytes(sum), '514E28B7');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	const s = new Murmur3_32();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(s.sum32(), 3969006135);
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Murmur3_32();
	s.write(ascii_abcd);
	assert.is(s.sum32(), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(s.sum32(), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
