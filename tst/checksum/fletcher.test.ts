import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {
	fletcher16,
	fletcher32,
	fletcher64,
} from '../../src/checksum/fletcher';
import { utf8 } from '../../src/encoding/Utf8';
import { hex } from '../../src/encoding/Hex';

const tsts = suite('Fletcher/RFC 1146');

//Testing sources:
// - https://ozeki.hu/index.php
const fletcher16Set = [
	//Wiki
	['abcde', 0xc8f0],
	['abcdef', 0x2057],
	['abcdefgh', 0x0627],
	// Others
	['', 0],
	['\x00', 0],
	['\x00\x00', 0],
	['\x00\x00\x00', 0],
	['\x00\x00\x00\x00', 0],
	['\x01', 0x0101],
	['\x01\x02', 0x0403],
	['\x01\x02\x03', 0xa06],
	['a', 0x6161],
	['ab', 0x25c3],
	['abc', 0x4c27],
	['abcd', 0xd78b],
	['f', 0x6666],
	['fo', 0x3cd5],
	['foo', 0x8145],
	['foob', 0x29a7],
	['fooba', 0x3209],
	['foobar', 0xad7b],
	['123456789', 0x1ede],
	['foo bar baz٪☃🍣', 0x493f],
	['gnabgib', 0x46cc],
	['Z', 0x5a5a],
];

for (const pair of fletcher16Set) {
	tsts('fletcher16: ' + pair[0], () => {
		const b = utf8.toBytes(pair[0] as string);
		assert.is(fletcher16(b), pair[1]);
	});
}

const fletcher32Set = [
	//Wiki
	['abcde', 0xf04fc729],
	['abcdef', 0x56502d2a],
	['abcdefgh', 0xebe19591],
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
	['abcd', 0x2926c6c4], //6261+6463 = C6C4 | 6261+C6C4 = 2926 (mod)
	['f', 0x660066],
	['fo', 0x6f666f66], //6f66
	['foo', 0xdf3b6fd5], //6f66+006f = 6FD5 | 6f66+6FD5 = DF3B
	['foob', 0x413cd1d5], //6F66+626F = D1D5 | 6F66 + D1D5 = 413C (mod)
	['fooba', 0x1373d236], //6F66+626F = D1D5 +0061=D236 | 6F66+D1D5= 413C +D236=1373(mod)
	['foobar', 0x85734437], //6F66+626F = D1D5 +7261=4437 | 6F66+D1D5= 413C +4437=8573
	['123456789', 0xdf09d509],
	['foo bar baz٪☃🍣', 0xecb2f648],
	['gnabgib', 0xb3f23a92],
];

for (const pair of fletcher32Set) {
	tsts('fletcher32: ' + pair[0], () => {
		const b = utf8.toBytes(pair[0] as string);
		assert.is(fletcher32(b), pair[1]);
	});
}

const fletcher64Set = [
	//Wiki
	['abcde', 'C8C6C527646362C6'],
	['abcdef', 'C8C72B276463C8C6'],
	['abcdefgh', '312E2B28CCCAC8C6'],
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
	['abcd', '6463626164636261'],
	['f', '0000006600000066'],
	['fo', '00006F6600006F66'],
	['foo', '006F6F66006F6F66'],
	['foob', '626F6F66626F6F66'],
	['fooba', 'C4DEDF2D626F6FC7'], //626F6F66+00000061=  626F6FC7 | 626F6FC7 + 626F6F66 = C4DE DF2D
	['foobar', 'C4DF512D626FE1C7'], //626F6F66+00007261=  626F E1C7 | 626FE1C7 + 626F6F66 = C4DF 512D
	['123456789', '0D0803376C6A689F'],
	['foo bar baz٪☃🍣', '5B253BF54182B4C6'],
	['gnabgib', 'C525463562C3D7CE'],
];

for (const pair of fletcher64Set) {
	tsts('fletcher64: ' + pair[0], () => {
		const b = utf8.toBytes(pair[0] as string);
		const f = fletcher64(b);
		assert.is(hex.fromBytes(f), pair[1]);
	});
}

tsts.run();
