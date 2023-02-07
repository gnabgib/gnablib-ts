import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as bigEndian from '../../src/endian/big';
import * as hex from '../../src/encoding/Hex';

const tsts = suite('Big endian encoding');

//We write in big endian
const u32Pairs = [
	//big order - little order
	[[0x01, 0x23, 0x45, 0x67], 0x01234567],
	[[0x67, 0x45, 0x23, 0x01], 0x67452301],
	//big order - little order
	[[0x89, 0xab, 0xcd, 0xef], 0x89abcdef],
	[[0xef, 0xcd, 0xab, 0x89], 0xefcdab89],
	//big order - little order
	[[0xff, 0xee, 0xdd, 0xcc], 0xffeeddcc],
	[[0xcc, 0xdd, 0xee, 0xff], 0xccddeeff],
	//big order - little order
	[[0x00, 0x11, 0x22, 0x33], 0x00112233],
	[[0x33, 0x22, 0x11, 0x00], 0x33221100],
];

for (const pair of u32Pairs) {
	const h = hex.fromBytes(new Uint8Array(pair[0] as number[]));

	tsts('Bytes as u32:' + h, () => {
		assert.is(
			bigEndian.u32FromBytes(new Uint8Array(pair[0] as number[])),
			pair[1]
		);
	});

	tsts('u32 as bytes:' + h, () => {
		const b = bigEndian.u32ToBytes(pair[1] as number);
		assert.is(hex.fromBytes(b), h);
	});
}

const u32IntoArrFromBytes = [
	[[1, 2, 3, 4, 5, 6, 7, 8], 1, 2, '000000000102030405060708'],
	[[1, 2, 3, 4, 5, 6, 7, 8], 1, 1, '000000000102030400000000'],
	[[1, 2, 3, 4, 5, 6, 7, 8], 0, 2, '010203040506070800000000'],
];

for (const pair of u32IntoArrFromBytes) {
	const u32s = new Uint32Array(3);
	const u8 = new Uint8Array(pair[0]);
	tsts('u32IntoArrFromBytes:', () => {
		bigEndian.u32IntoArrFromBytes(u32s, pair[1], pair[2], u8, 0);
		assert.is(hex.fromU32s(u32s), pair[3]);
	});
}

tsts.run();
