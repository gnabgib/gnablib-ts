import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Sha3_224 } from '../../../src/crypto/hash';


const tsts = suite('SHA3/FIPS-202 (224)');

const ascii224Pairs = [
	['', '6B4E03423667DBB73B6E15454F0EB1ABD4597F9A1B078E3F5B5A6BC7'],
	//https://emn178.github.io/online-tools/sha3_224.html
	[
		'The quick brown fox jumps over the lazy dog',
		'D15DADCEAA4D5D7BB3B48F446421D542E08AD8887305E28D58335795',
	],
	[
		'The quick brown fox jumps over the lazy dog.',
		'2D0708903833AFABDD232A20201176E8B58C5BE8A6FE74265AC54DB0',
	],
	[
		'The quick brown fox jumps over the lazy cog',
		'B770EB6AC3AC52BD2F9E8DC186D6B604E7C3B7FFC8BD9220B0078CED',
	],
	[
		'12345678901234567890123456789012345678901234567890123456789012345678901234567890',
		'0526898E185869F91B3E2A76DD72A15DC6940A67C8164A044CD25CC8',
	],
	['gnabgib', 'E26FA59CBE1D34AC5AB8292030DC0791E805BF6AC48269E4D1023C79'],
];
for (const [source,expect] of ascii224Pairs) {
	const b = utf8.toBytes(source);
	tsts('SHA3-224:' + source, () => {
		const hash=new Sha3_224();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
		assert.is(hash.size,28);
		assert.is(hash.blockSize,1152/8);
	});
}

tsts.run();
