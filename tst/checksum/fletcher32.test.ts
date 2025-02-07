import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Fletcher32 } from '../../src/checksum/fletcher';
import { hex, utf8 } from '../../src/codec';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Fletcher32');

const sum_abcd = 0x2926c6c4;
const sum_abcdefgh = 0xebe19591;

const sum_tests: [string, number][] = [
	//Wiki
	['abcde', 0xf04fc729],
	['abcdef', 0x56502d2a],
	['abcdefgh', sum_abcdefgh],
	// Others
	['', 0],
	['\x00', 0],
	['\x00\x00', 0],
	['\x00\x00\x00', 0],
	['\x00\x00\x00\x00', 0],
	['\x01', 0x010001],
	['\x01\x02', 0x02010201],
	['\x01\x02\x03', 0x04050204], //0201+0003 = 0204 | 0201+0204=0405
	['a', 0x00610061],
	['a\x00', 0x00610061],
	['a\x00\x00', 0x00c20061], //0061+0000 = 0061 | 0061+0061 = 00C2
	['a\x00\x00\x00', 0x00c20061],
	['ab', 0x62616261],
	['abc', 0xc52562c4], //6261+0063 = 62C4 | 6261+62C4 = C525
	['abcd', sum_abcd], //6261+6463 = C6C4 | 6261+C6C4 = 2926 (mod)
	['f', 0x660066],
	['fo', 0x6f666f66], //6f66
	['foo', 0xdf3b6fd5], //6f66+006f = 6FD5 | 6f66+6FD5 = DF3B
	['foob', 0x413cd1d5], //6F66+626F = D1D5 | 6F66 + D1D5 = 413C (mod)
	['fooba', 0x1373d236], //6F66+626F = D1D5 +0061=D236 | 6F66+D1D5= 413C +D236=1373(mod)
	['foobar', 0x85734437], //6F66+626F = D1D5 +7261=4437 | 6F66+D1D5= 413C +4437=8573
	['123456789', 0xdf09d509],
	['foo bar baz٪☃🍣', 0xecb2f648],
	['gnabgib', 0xb3f23a92],
    ['message digest', 0x7C9DA3E6],
];

for (const [src, expect] of sum_tests) {
	tsts(`Fletcher32(${src})`, () => {
		const s = new Fletcher32();
		s.write(utf8.toBytes(src));
		assert.is(s.sum32(), expect);
	});
}

tsts(`sum`, () => {
	const s = new Fletcher32();
	s.write(Uint8Array.of(97));
	const sum = s.sum();
	assert.is(sum.length, s.size);
	assert.is(hex.fromBytes(sum), '00610061');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	//This tests the longer write code, but you'll need to manually decrease maxSpace
	// in order for it to trigger (say 4000)
	const s = new Fletcher32();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(s.sum32(), 2130771981);
});

tsts(`reading sum doesn't mutate state`, () => {
	//Note because reads are in byte-pairs, we need to write in more than 1 byte at a time
	// (unlike some other checksums)
	const s = new Fletcher32();
	s.write(ascii_abcd);
	assert.is(s.sum32(), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(s.sum32(), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
