import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { utf8 } from '../../src/encoding/Utf8';
import { hex } from '../../src/encoding/Hex';
import { Keccak224 } from '../../src/hash/Keccak';

const tsts = suite('Keccak (224)');
const ascii224Pairs = [
	['', 'F71837502BA8E10837BDD8D365ADB85591895602FC552B48B7390ABD'],
	//https://emn178.github.io/online-tools/keccak_224.html
	[
		'The quick brown fox jumps over the lazy dog',
		'310AEE6B30C47350576AC2873FA89FD190CDC488442F3EF654CF23FE',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'C59D4EAEAC728671C635FF645014E2AFA935BEBFFDB5FBD207FFDEAB',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'0B27FF3B732133287F6831E2AF47CF342B7EF1F3FCDEE248811090CD',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'744C1765A53043E186BC30BAB07FA379B421CF0BCA8224CB83E5D45B',
	],
	['gnabgib', '08F80715EA0CA01A7AFE6B069ABF72721431B0A1D1A595702F74537D'],
];
for (const [source,expect] of ascii224Pairs) {
	const b = utf8.toBytes(source);
	tsts('Keccak224:' + source, () => {
		const hash=new Keccak224();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
		assert.is(hash.size,28);
	});
}

tsts.run();
