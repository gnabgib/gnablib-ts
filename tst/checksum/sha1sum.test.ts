import { suite } from 'uvu';
//import * as assert from 'uvu/assert';
import { sha1Sum } from '../../src/checksum';
import { utf8 } from '../../src/codec';
import {Assert} from '../../src/test';

const tsts = suite('Sha1sum');

const asciiHexPairs = [
	['a', '86F7E437FAA5A7FCE15D1DDCB9EAEAEA377667B8'],
];

//If you want to test on *nix: `echo -n 'a' | md5sum`
for (const [source,expect] of asciiHexPairs) {
	tsts('sha1Sum: ' + source, () => {
		const b = utf8.toBytes(source as string);
		Assert.bytesMatchHex(sha1Sum(b), expect);
	});
}

tsts.run();
