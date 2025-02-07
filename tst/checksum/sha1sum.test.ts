import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';
import { Sha1Sum } from '../../src/checksum/sha1sum';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Sha1Sum');

const sum_abcd = '81FE8BFE87576C3ECB22426F8E57847382917ACF';
const sum_abcdefgh = '425AF12A0743502B322E93A015BCF868E324D56A';

const string_tests = [
	['a', '86F7E437FAA5A7FCE15D1DDCB9EAEAEA377667B8'],
	['ab', 'DA23614E02469A0D7C7BD1BDAB5C9C474B1904DC'],
	['abc', 'A9993E364706816ABA3E25717850C26C9CD0D89D'],
	['abcd', sum_abcd],
	['efgh', '2AED8AA9F826C21EF07D5EE15B48EEA06E9C8A62'],
	['abcdefgh', sum_abcdefgh],
	['message digest', 'C12252CEDA8BE8994D5FA0290A47231C1D16AAE3'],
];

//If you want to test on *nix: `echo -n '<test>' | sha1sum`
for (const [src, expect] of string_tests) {
	tsts(`Sha1Sum(${src})`, () => {
			const s = new Sha1Sum();
			s.write(utf8.toBytes(src));
			assert.is(hex.fromBytes(s.sum()), expect);
		});
}

tsts(`sum`, () => {
	const s = new Sha1Sum();
	s.write(Uint8Array.of(97));
	const sum = s.sum();
	assert.is(sum.length, s.size);
	assert.is(hex.fromBytes(sum), '86F7E437FAA5A7FCE15D1DDCB9EAEAEA377667B8');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	//This tests the longer write code, but you'll need to manually decrease maxSpace
	// in order for it to trigger (say 4000)
	const s = new Sha1Sum();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(hex.fromBytes(s.sum()), '53B4023F0065B44C8E00D0D5C0D91AE91E1B83EC');
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Sha1Sum();
	s.write(ascii_abcd);
	assert.is(hex.fromBytes(s.sum()), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(hex.fromBytes(s.sum()), sum_abcdefgh, 'sum(abcdefgh)');
});


tsts.run();
