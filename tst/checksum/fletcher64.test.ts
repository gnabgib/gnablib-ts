import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Fletcher64 } from '../../src/checksum/Fletcher64';
import { hex, utf8 } from '../../src/codec';
import { ascii_abcd, ascii_efgh, b1K } from './_include.test';

const tsts = suite('Fletcher64');

const sum_abcd = '6463626164636261';
const sum_abcdefgh = '312E2B28CCCAC8C6';

const sum_tests: [string, string][] = [
	//Wiki
	['abcde', 'C8C6C527646362C6'],
	['abcdef', 'C8C72B276463C8C6'],
	['abcdefgh', sum_abcdefgh],
	// Others
	['', '0000000000000000'],
	['\x00', '0000000000000000'],
	['\x00\x00', '0000000000000000'],
	['\x00\x00\x00', '0000000000000000'],
	['\x00\x00\x00\x00', '0000000000000000'],
	['\x01', '0000000100000001'],
	['\x01\x02', '0000020100000201'],
	['\x01\x02\x03', '0003020100030201'],
	['a', '0000006100000061'],
	['a\x00', '0000006100000061'],
	['a\x00\x00', '0000006100000061'],
	['a\x00\x00\x00', '0000006100000061'],
	['ab', '0000626100006261'],
	['abc', '0063626100636261'],
	['abcd', sum_abcd],
	['f', '0000006600000066'],
	['fo', '00006F6600006F66'],
	['foo', '006F6F66006F6F66'],
	['foob', '626F6F66626F6F66'],
	['fooba', 'C4DEDF2D626F6FC7'], //626F6F66+00000061=  626F6FC7 | 626F6FC7 + 626F6F66 = C4DE DF2D
	['foobar', 'C4DF512D626FE1C7'], //626F6F66+00007261=  626F E1C7 | 626FE1C7 + 626F6F66 = C4DF 512D
	['123456789', '0D0803376C6A689F'],
	['foo bar baz٪☃🍣', '5B253BF54182B4C6'],
	['gnabgib', 'C525463562C3D7CE'],
	['message digest', 'F9CD1314F940AAA5'],
];

for (const [src, expectHex] of sum_tests) {
	tsts(`Fletcher64(${src})`, () => {
		const s = new Fletcher64();
		s.write(utf8.toBytes(src));
		assert.is(hex.fromBytes(s.sum()), expectHex);
	});
}

tsts(`sum`, () => {
	const s = new Fletcher64();
	s.write(Uint8Array.of(97));
	const sum = s.sum();
	assert.is(sum.length, s.size);
	assert.is(hex.fromBytes(sum), '0000006100000061');
});

tsts(`sum64`, () => {
	const s = new Fletcher64();
	s.write(Uint8Array.of(97));
	assert.is(s.sum64().toString(),'0000006100000061');
});

tsts(`sum(13 +5K[0] bytes)`, () => {
	//This tests the longer write code, but you'll need to manually decrease maxSpace
	// in order for it to trigger (say 4000)
	const s = new Fletcher64();
	s.write(Uint8Array.of(13));
	for (let i = 0; i < 5; i++) s.write(b1K);
	assert.is(hex.fromBytes(s.sum()), '00003F870000000D');
});

tsts(`reading sum doesn't mutate state`, () => {
	//Note because reads are in byte-pairs, we need to write in more than 1 byte at a time
	// (unlike some other checksums)
	const s = new Fletcher64();
	s.write(ascii_abcd);
	assert.is(hex.fromBytes(s.sum()), sum_abcd, 'sum(abcd)');
	s.write(ascii_efgh);
	assert.is(hex.fromBytes(s.sum()), sum_abcdefgh, 'sum(abcdefgh)');
});

tsts.run();
