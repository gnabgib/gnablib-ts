import { suite } from 'uvu';
import * as assert from 'uvu/assert'
import { Bcc } from '../../src/checksum/bcc';
import { utf8 } from '../../src/codec';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Bcc');

const sum_abcd = 4;
const sum_abcdefgh = 8;

const sum_tests: [Uint8Array, number][] = [
	[new Uint8Array(0), 0],
	[Uint8Array.of(101, 170, 204, 227), 224],
	[Uint8Array.of(164, 55, 246, 248, 205), 80],
	[Uint8Array.of(1, 2), 3],
	[Uint8Array.of(1, 2, 3), 0],
	[Uint8Array.of(0xff, 0xee, 0xdd), 0xcc],
	[Uint8Array.of(0x37, 0x10, 0x03), 0x24],
	[Uint8Array.of(1, 2, 4, 8, 16, 32, 64, 128), 0xff],
	[Uint8Array.of(1, 3, 7, 15, 31, 63, 127), 85],
	[Uint8Array.of(127, 63, 31, 15, 7, 3, 1), 85],
	[Uint8Array.of(0x46, 0x72, 0x65, 0x64, 0x64, 0x79), 0x28],
	[Uint8Array.of(0x65, 0xaa, 0xcc, 0xe3), 0xe0],
	[Uint8Array.of(0x42, 0x43, 0x43, 0x58, 0x4f, 0x52), 0x07],
	[ascii_abcd,sum_abcd],
	[utf8.toBytes('abcdefgh'),sum_abcdefgh],
];
for (const [data, expect] of sum_tests) {
	tsts(`Sum([${data.length}])`, () => {
		const s = new Bcc();
		s.write(data);
		const sum = s.sum();
		assert.is(sum[0], expect);
	});
}

tsts(`sum(13 +5K[0] bytes)`, () => {
	const s = new Bcc();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(s.sum()[0],13);
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Bcc();
	s.write(ascii_abcd);
	assert.is(s.sum()[0], sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(s.sum()[0], sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
