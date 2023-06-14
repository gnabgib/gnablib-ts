import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { bcc } from '../../src/checksum/bcc';

const tsts = suite('BCC/RFC 914');

//[Block Check Character Calculator]
const sum = [
	[[0], 0],
	[[101, 170, 204, 227], 224],
	//[[101,170,204,227],79],
	[[164, 55, 246, 248, 205], 80],
	[[1, 2], 3],
	[[1, 2, 3], 0],
	[[0xff, 0xee, 0xdd], 0xcc],
	[[0x37, 0x10, 0x03], 0x24],
	[[1, 2, 4, 8, 16, 32, 64, 128], 0xff],
	[[1, 3, 7, 15, 31, 63, 127], 85],
	[[127, 63, 31, 15, 7, 3, 1], 85],
	[[0x46, 0x72, 0x65, 0x64, 0x64, 0x79], 0x28],
	[[0x65, 0xaa, 0xcc, 0xe3], 0xe0],
	[[0x42, 0x43, 0x43, 0x58, 0x4f, 0x52], 0x07],
];

for (const pair of sum) {
	tsts('Sum: ' + pair[0], () => {
		assert.is(bcc(new Uint8Array(pair[0] as number[])), pair[1]);
	});
}

tsts.run();
