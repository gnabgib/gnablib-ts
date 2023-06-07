import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import { Hex } from '../../src/encoding/Hex';
import { Blake2b_256 } from '../../src/hash/Blake2';

const tsts = suite('Blake2/RFC 7693 (b256)');

const ascii2bTests = [
	//https://www.toolkitbay.com/tkb/tool/BLAKE2b_256
	[
		'The quick brown fox jumps over the lazy dog',
		'01718CEC35CD3D796DD00020E0BFECB473AD23457D063B75EFF29C0FFA2E58A9',
    ],
	[
		'The quick brown fox jumps over the lazy cog',
		'036C13096926B3DFCCFE3F233BD1B2F583B818B8B15C01BE65AF69238E900B2C',
    ],
	[
		'The quick brown fox jumps over the lazy dof',
		'4F2ABD883017E2BFC5B56ABB87D5B19915AEE76A5E51BF1659B6853A2D3A3EBA',
    ],
	[
		'BLAKE',
		'7C28CC8AD9601E556DBBF421C1B385FC7E7D34F1AE614899B21491B8C1F67B19',
    ],
];
for (const [source,expect] of ascii2bTests) {
	const b = utf8.toBytes(source);
	tsts(`Blake2b (${source}):`, () => {
		const hash=new Blake2b_256();
		hash.write(b);
		const md=hash.sum();
		assert.is(Hex.fromBytes(md), expect);
	});
}

tsts.run();
