import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Lrc } from '../../src/checksum/lrc';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Lrc');

const sum_abcd = 0x76;
const sum_abcdefgh = 0xdc;

//https://en.metools.info/encoding/ecod127.html
const sum_tests: [Uint8Array, number][] = [
	[Uint8Array.of(0), 0],
	[Uint8Array.of(101, 170, 204, 227), 66],
	[Uint8Array.of(0x65, 0xaa, 0xcc, 0xe3), 0x42],
	//[[0x46,0x72,0x65,0x64,0x64,0x79],0x28],
	[Uint8Array.of(0x02, 0x30, 0x30, 0x31, 0x23, 0x03), 71],
	[Uint8Array.of(0xff, 0xee, 0xdd), 0x36],
	[Uint8Array.of(51, 55, 49), 101],
	[ascii_abcd, sum_abcd],
];

for (const [data, expect] of sum_tests) {
	tsts(`Lrc(${data})`, () => {
		const s = new Lrc();
		s.write(data);
		assert.is(s.sum()[0], expect);
	});
}

tsts(`sum(13 +5K[0] bytes)`, () => {
	//This tests the longer write code, but you'll need to manually decrease maxSpace
	// in order for it to trigger (say 4000)
	const s = new Lrc();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(s.sum()[0], 243);
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Lrc();
	s.write(ascii_abcd);
	assert.is(s.sum()[0], sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(s.sum()[0], sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
