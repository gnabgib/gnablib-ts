import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';

const tsts = suite('Hex/RFC 4648');

const pairs = [
	[0, '00'],
	[1, '01'],
	[2, '02'],
	[3, '03'],
	[4, '04'],
	[5, '05'],
	[10, '0A'],
	[11, '0B'],
	[12, '0C'],
	[13, '0D'],
	[14, '0E'],
	[15, '0F'],
	[20, '14'],
	[21, '15'],
	[22, '16'],
	[23, '17'],
	[24, '18'],
	[25, '19'],
	[31, '1F'],
	[63, '3F'],
	[100, '64'],
	[200, 'C8'],
	[255, 'FF'],
];

for (const pair of pairs) {
	tsts('fromByte: ' + pair[0], () => {
		assert.is(hex.fromByte(pair[0] as number), pair[1]);
	});

	tsts('toByte: ' + pair[1], () => {
		assert.is(hex.toByte(pair[1] as string), pair[0]);
	});
}

tsts.run();
