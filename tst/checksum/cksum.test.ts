import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { cksum } from '../../src/checksum/cksum';
import { utf8 } from '../../src/encoding/Utf8';

const tsts = suite('CKSUM');

//Testing sources:
// - https://crccalc.com/
// - http://zorc.breitbandkatze.de/crc.html
const asciiNumberSet = [
	['', 0xffffffff],
	['a', 0x48c279fe],
	['ab', 2072780115],
	['abc', 1219131554],
	['abcd', 1278160200],
	['abcde', 996742021],
	['123\n', 2330645186],
	['\n', 3515105045],
	['CRC helps with bit rot\n', 3193580682],
	['I do not want to work\n', 17471322],
];

for (const pair of asciiNumberSet) {
	tsts('Cksum: ' + pair[0], () => {
		const b = utf8.toBytes(pair[0] as string);
		assert.is(cksum(b), pair[1]);
	});
}

tsts.run();
