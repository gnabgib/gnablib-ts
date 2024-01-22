import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Blake32 } from '../../../src/crypto/hash';

const tsts = suite('Blake1-32');

/* Blake32/64 wre submitted with 10/14 rounds, but then tweaked in the SHA3 competition to 14/16 rounds
 *  which makes testing problematic.. The original test vectors can't be used for testing.
 * Helpfully the finally SHA3 submissions were renamed Blake256/512, but then Blake2(s|b) was released on
 *  top and Blake1 is hard to find (looks like the original website was taken down)
 */

const ascii32HexPairs= [
	//Blake.pdf test vectors (10 round, 32bit)
	['\0','D1E39B457D2250B4F5B152E74157FBA4C1B423B87549106B07FD3A3E7F4AEB28'],
	['\0'.repeat(72),'8A638488C318C5A8222A1813174C36B4BB66E45B09AFDDFD7F2B2FE3161B7A6D'],
	//['\0'.repeat(512),'8A638488C318C5A8222A1813174C36B4BB66E45B09AFDDFD7F2B2FE3161B7A6D'],
];
for (const [source,expect] of ascii32HexPairs) {
	const b = utf8.toBytes(source);
	tsts('Blake32:' + source, () => {
		const hash=new Blake32();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts(`newEmpty`,()=>{
	const hash=new Blake32(Uint32Array.of(5,6,7,8));
	const sumEmpty='8ADE178EB05A97E397619C8AF465E37787A0C1AE5061A74539D1CC34C5288A09';
	const sum0123='E3FA9270A34427889BE47B59185D098D4734EC676021856249012BBC1C388E21';

	assert.is(hex.fromBytes(hash.sum()),sumEmpty);
	hash.write(Uint8Array.of(0,1,2,3));
	assert.is(hex.fromBytes(hash.sum()),sum0123);
	const hash2=hash.newEmpty();
	assert.is(hex.fromBytes(hash.sum()),sum0123);
	assert.is(hex.fromBytes(hash2.sum()),sumEmpty);
	hash2.write(Uint8Array.of(0,1,2,3));
	assert.is(hex.fromBytes(hash2.sum()),sum0123);
})

tsts.run();
