import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import { Sha3_256 } from '../../src/hash/Sha3';

const tsts = suite('SHA3/FIPS-202 (256)');

const ascii256Pairs = [
	['', 'A7FFC6F8BF1ED76651C14756A061D662F580FF4DE43B49FA82D80A4B80F8434A'],
	//https://emn178.github.io/online-tools/sha3_256.html
	[
		'The quick brown fox jumps over the lazy dog',
		'69070DDA01975C8C120C3AADA1B282394E7F032FA9CF32F4CB2259A0897DFC04',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'A80F839CD4F83F6C3DAFC87FEAE470045E4EB0D366397D5C6CE34BA1739F734D',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'CC80B0B13BA89613D93F02EE7CCBE72EE26C6EDFE577F22E63A1380221CAEDBC',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'293E5CE4CE54EE71990AB06E511B7CCD62722B1BEB414F5FF65C8274E0F5BE1D',
	],
	[
		'gnabgib',
		'1DBB11C686F835D4EA0D35B00957ED6B60E2442C47BC0A5D1D7D64984917248B',
	],
];



for (const [source,expect] of ascii256Pairs) {
	const b = utf8.toBytes(source);
	tsts('SHA3-256:' + source, () => {
		const hash=new Sha3_256();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
		assert.is(hash.size,32);
		assert.is(hash.blockSize,1088/8);
	});
}

tsts.run();
