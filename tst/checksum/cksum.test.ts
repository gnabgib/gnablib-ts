import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Cksum } from '../../src/checksum/cksum';
import { hex, utf8 } from '../../src/codec';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Cksum');

const sum_abcd = 1278160200;
const sum_abcdefgh = 1095960684;

const sum_tests: [string, number][] = [
	['', 0xffffffff],
	['a', 0x48c279fe],
	['ab', 2072780115],
	['abc', 1219131554],
	['abcd', sum_abcd],
	['abcde', 996742021],
	['abcdefgh', sum_abcdefgh],
	['123\n', 2330645186],
	['\n', 3515105045],
	['CRC helps with bit rot\n', 3193580682],
	['I do not want to work\n', 17471322],
];
for (const [src, expect] of sum_tests) {
	tsts(`cksum(${src})`, () => {
		const s = new Cksum();
		s.write(utf8.toBytes(src));
		assert.is(s.sum32(), expect);
	});
}

tsts(`sum`, () => {
	const s = new Cksum();
	s.write(Uint8Array.of(97));
	const sum = s.sum();
	assert.is(sum.length, s.size);
	assert.is(hex.fromBytes(sum), '48C279FE');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	const s = new Cksum();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(s.sum()[0], 210);
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Cksum();
	s.write(ascii_abcd);
	assert.is(s.sum32(), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(s.sum32(), sum_abcdefgh, 'sum(abcdefgh)');
});

//Testing sources:
// - https://crccalc.com/
// - http://zorc.breitbandkatze.de/crc.html

tsts.run();
