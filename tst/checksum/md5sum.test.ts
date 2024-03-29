import { suite } from 'uvu';
//import * as assert from 'uvu/assert';
import {md5Sum} from '../../src/checksum';
import { utf8 } from '../../src/codec';
import {Assert} from '../../src/test';

const tsts = suite('MD5sum/RFC 1321');

const asciiHexPairs = [
	['a', '0CC175B9C0F1B6A831C399E269772661'],
];

//If you want to test on *nix: `echo -n 'a' | md5sum`
for (const [source,expect] of asciiHexPairs) {
	tsts('md5sum: ' + source, () => {
		const b = utf8.toBytes(source as string);
		Assert.bytesMatchHex(md5Sum(b), expect);
	});
}

tsts.run();
