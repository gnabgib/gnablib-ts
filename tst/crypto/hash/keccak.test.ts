import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Keccak } from '../../../src/crypto';

const tsts = suite('Keccak (var)');
const tests:[string,number,string][] = [
	['', 11, 'CDA466F46383E967CB88C5'],
	['gnabgib',13, '98DA6D9FCC1EA36ADEFDC25D35'],
];
// Test variable length Keccak (not very often used?)
for (const [source,size,expect] of tests) {
	const b = utf8.toBytes(source);
	tsts('Keccak:' + source, () => {
        const hash=new Keccak(size);
		hash.write(b);
		const md=hash.sum();
		assert.is(hex.fromBytes(md), expect);
	});
}

tsts.run();
