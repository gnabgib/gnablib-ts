import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import { Blake64 } from '../../src/hash/Blake1';

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

tsts.run();
