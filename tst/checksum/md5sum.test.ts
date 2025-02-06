import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';
import { Md5Sum } from '../../src/checksum/md5sum';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Md5Sum');

const sum_abcd = 'E2FC714C4727EE9395F324CD2E7F331F';
const sum_abcdefgh = 'E8DC4081B13434B45189A720B77B6818';

const string_tests = [
	['a', '0CC175B9C0F1B6A831C399E269772661'],
	['ab', '187EF4436122D1CC2F40DC2B92F0EBA0'],
	['abc', '900150983CD24FB0D6963F7D28E17F72'],
	['abcd', sum_abcd],
	['efgh', '1F7690EBDD9B4CAF8FAB49CA1757BF27'],
	['abcdefgh', sum_abcdefgh],
];

//If you want to test on *nix: `echo -n 'a' | md5sum`
for (const [src, expect] of string_tests) {
	tsts(`Md5Sum(${src})`, () => {
		const s = new Md5Sum();
		s.write(utf8.toBytes(src));
		assert.is(hex.fromBytes(s.sum()), expect);
	});
}

tsts(`sum`, () => {
	const s = new Md5Sum();
	s.write(Uint8Array.of(97));
	const sum = s.sum();
	assert.is(sum.length, s.size);
	assert.is(hex.fromBytes(sum), '0CC175B9C0F1B6A831C399E269772661');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	//This tests the longer write code, but you'll need to manually decrease maxSpace
	// in order for it to trigger (say 4000)
	const s = new Md5Sum();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(hex.fromBytes(s.sum()), '7FDFE73E6A85BE90A23CF628B847EFD3');
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Md5Sum();
	s.write(ascii_abcd);
	assert.is(hex.fromBytes(s.sum()), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(hex.fromBytes(s.sum()), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
