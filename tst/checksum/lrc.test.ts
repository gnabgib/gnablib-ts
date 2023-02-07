import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { lrc } from '../../src/checksum/lrc';

const tsts = suite('LRC/ISO 1155, RFC 935');

//http://www.metools.info/encoding/ecod127.html
const sum = [
	[[0], 0],
	[[101, 170, 204, 227], 66],
	[[0x65, 0xaa, 0xcc, 0xe3], 0x42],
	//[[0x46,0x72,0x65,0x64,0x64,0x79],0x28],
	[[0x02, 0x30, 0x30, 0x31, 0x23, 0x03], 71],
	[[0xff, 0xee, 0xdd], 0x36],
	[[51, 55, 49], 101],
];

for (const pair of sum) {
	tsts('Sum: ' + pair[0], () => {
		assert.is(lrc(new Uint8Array(pair[0] as number[])), pair[1]);
	});
}

tsts.run();
