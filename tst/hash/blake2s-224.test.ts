import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utf8 from '../../src/encoding/Utf8';
import * as hex from '../../src/encoding/Hex';
import { Blake2s_224 } from '../../src/hash/Blake2';

const tsts = suite('Blake2/RFC 7693 (s224)');


const ascii2sHexPairs = [
	//Source: https://en.wikipedia.org/wiki/BLAKE_(hash_function)
	['', '1FA1291E65248B37B3433475B2A0DD63D54A11ECC4E3E034E7BC1EF4'], //224
];

for (const [source,expect] of ascii2sHexPairs) {
    const b = utf8.toBytes(source);
	tsts('Blake2s:' + source, () => {
        const hash=new Blake2s_224();
        hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
