import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { XxHash64 } from '../../src/checksum/XxHash64';
import { hex, utf8 } from '../../src/codec';
import { U64 } from '../../src/primitive/number/U64';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('XxHash64');

const sum_abcd = 'DE0327B0D25D92CC';
const sum_abcdefgh = '3AD351775B4634B7';
const ish='Call me Ishmael. Some years ago--never mind how long precisely-';

const string_tests: [string, string][] = [
	['\0', 'E934A84ADB052768'],
	['abc', '44BC2CF5AD770999'],
	['abcd', sum_abcd],
	['abcdefgh', sum_abcdefgh],
	['heiå', 'B9D3D990D2001A1A'],
	['123456789112345', '3FE21A05D12D6937'],
	['1234567891123456', '2658B09CC412F64B'],
	['12345678911234567', '27EA21DEE5D4E44D'],
	['12345678911234567892', '40A3274A7CD71A84'],
	['123456789112345678921', '00556809F6F92F9F'],
	['12345678911234567892123456789312', '4D2BE36BEEC5C9B1'], //Block size
	['123456789112345678921234567893123', '9C9679E3CA2E9BAA'], //Block size+1
	['123456789112345678921234567893123456', '65EA0593C02478DE'], //Block size+4
	['1234567891123456789212345678931234567', 'ACBD027696F9C7F6'], //Block size+4+!
	['message digest','066ED728FCEEB3BE'],
	//source: https://github.com/cespare/xxhash/blob/main/xxhash_test.go
	['', 'EF46DB3751D8E999'],
	['a', 'D24EC4F1A98C6E5B'],
	['as', '1C330FB2D66BE179'],
	['asd', '631C37CE72A97393'],
	['asdf', '415872F599CEA71E'],
	[ish,'02A2E85470D6FD96'],

];
for (const [src, expect] of string_tests) {
	tsts(`XxHash64(${src})`, () => {
		const hash = new XxHash64();
		hash.write(utf8.toBytes(src));
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

const alt_seed_tests: [Uint8Array, U64, string][] = [
	[ascii_abcd, U64.fromInt(1), 'F5DCBD6DEE3C9553'],
	[ascii_abcd, U64.fromInt(0xcafe), 'DDEF93C6B15A40CB'],
	[Uint8Array.of(0), U64.fromInt(1), '771917C7F6EE2451'],
	[Uint8Array.of(0, 0), U64.fromInt(1), '899FB35F8D5447F1'],
	//source: https://github.com/cespare/xxhash/blob/main/xxhash_test.go
	[new Uint8Array(0),U64.fromInt(123),'E0DB84DE91F3E198'],
	[utf8.toBytes('asdf'),U64.fromI32s(-1,-1),'9A2FD8473BE539B6'],
	[utf8.toBytes(ish),U64.fromInt(54321),'1736D186DAF5D1CD'],
];
for (const [data, seed, expect] of alt_seed_tests) {
	tsts(`XxHash64([${data.length}],${seed})`, () => {
		const hash = new XxHash64(seed);
		hash.write(data);
		const md = hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts(`sum(13 +5K[0] bytes)`, () => {
	const s = new XxHash64();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(hex.fromBytes(s.sum()), '8D01B1E8410D27C1');
});

tsts(`reading sum doesn't mutate state`, () => {
	const s = new XxHash64();
	s.write(ascii_abcd);
	assert.is(hex.fromBytes(s.sum()), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(hex.fromBytes(s.sum()), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
