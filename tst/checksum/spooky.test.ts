import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../src/codec';
import { Spooky } from '../../src/checksum/Spooky';
import { U64 } from '../../src/primitive/number/U64';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Spooky');

const sum_abcd = '5C6DB4E0725121B4ED4D2A6BF05F6D02';
const sum_abcdefgh = '101C8730A539EB6EA8F6B7FCF2CDF12E';
const fox =
	'The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog The quick brown fox jumps over the lazy dog';

const string_tests: [string, string][] = [
	['a', '1A108191A0BBC9BD754258F061412A92'],
	['ab', 'F9DBB6AD202A090F9C7059B0DAD5AE93'],
	['abc', '8AAB15F77537C967C61367F8CA7811B0'],
	['abcd', sum_abcd],
	['abcdefgh', sum_abcdefgh],
	['message digest', 'A087095CA5C2309692A1679D4F4344DB'],
	//wikipedia: 219 bytes
	[fox, 'F1B71C6AC5AF39E7B69363A60DD29C49'],
];
for (const [src, expect] of string_tests) {
	tsts(`Spooky(${src})`, () => {
		const hash = new Spooky();
		hash.write(utf8.toBytes(src));
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

const altSeed: [U64, U64] = [U64.fromInt(1), U64.zero];
const alt_seed_tests: [Uint8Array, string][] = [
	[new Uint8Array(0), '0D6ADB776D017E08E0AC00827873FA3D'],
	[utf8.toBytes(fox), '5D8F2D77F7DB556F262BB3771A0E70AF'],
];
for (const [data, expect] of alt_seed_tests) {
	tsts(`Spooky([${data.length}],altSeed)`, () => {
		const hash = new Spooky(...altSeed);
		hash.write(data);
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts(`sumIn`, () => {
	const h = new Spooky(U64.fromInt(1));
	h.write(Uint8Array.of(1));
	assert.is(hex.fromBytes(h.sum()), '83338970848071B904F5D3E8DC066A5A');
	//No change (although it mutated internal)
	assert.is(hex.fromBytes(h.sumIn()), '83338970848071B904F5D3E8DC066A5A');
	//Change because of previous SumIn
	assert.is(hex.fromBytes(h.sumIn()), '9C960CF81E5BACA432253BB02BFDA57A');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	const s = new Spooky();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(hex.fromBytes(s.sum()), '5873CBD39D508B83F3F9B0532C891DE1');
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new Spooky();
	s.write(ascii_abcd);
	assert.is(hex.fromBytes(s.sum()), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(hex.fromBytes(s.sum()), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts(`double-long`, () => {
	//Once we've turned Spooky into long, further rights are more expedient
	const h = new Spooky(U64.fromInt(1));
	h.write(utf8.toBytes(fox));
	h.write(utf8.toBytes(fox));
	assert.is(hex.fromBytes(h.sumIn()), 'BA977C991ABD02AC8CB35BAA8565F4F8');
});

tsts.run();
