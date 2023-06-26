import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { utf8 } from '../../src/encoding/Utf8';
import { hex } from '../../src/encoding/Hex';
import { Blake64 } from '../../src/hash/Blake1';
import { U64MutArray } from '../../src/primitive/U64';

const tsts = suite('Blake1-64');

/* Blake32/64 wre submitted with 10/14 rounds, but then tweaked in the SHA3 competition to 14/16 rounds
 *  which makes testing problematic.. The original test vectors can't be used for testing.
 * Helpfully the finally SHA3 submissions were renamed Blake256/512, but then Blake2(s|b) was released on
 *  top and Blake1 is hard to find (looks like the original website was taken down)
 */

const ascii64HexPairs= [
	//Blake.pdf test vectors (14 rounds)
	[
		'\0',
		'765F7084548226C3E6F4779B954661DF49A272E2BA16635F17A3093756AA93642A92E5BDDB21A3218F72B7FD44E9FA19F86A86334EBEDA0F4D4204BF3B6BED68'],
	[
		'\0'.repeat(144),
		'EAB730280428210571F3F8DEE678A9B1BBEF58DF55471265B71E262B8EFFBA2533C15317C3E9F897B269ED4146AED0F3A29827060055CA14652753EFE20A913E'],
];
for (const [source,expect] of ascii64HexPairs) {
	const b = utf8.toBytes(source);
	tsts('Blake64:' + source, () => {
		const hash=new Blake64();
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts(`newEmpty`,()=>{
	const salt=U64MutArray.fromBytes(hex.toBytes('0000000000000001000000000000000200000000000000030000000000000004').buffer);
	const sumEmpty='987590D0FF66B4D7FCE4386861CD0ABB745C8A0DC62A4C938DB9C273CA9A92D259D224E6778E067B871AE410C6AA4E60903EA867BFFB69A08FFB5BEB62DE04AD';
	const sum0123='3AC9C95E85823762E644FAF3071400E5F867115C370790D76E52CF6C76C1A3C5439C7693ED8B9A8C43CCCEDB68A92D24FEBD9DF7E1DECE2BB1CA78EDF7C33FB5';

	const hash=new Blake64(salt);
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
