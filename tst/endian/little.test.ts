import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as littleEndian from '../../src/endian/little';
import { Hex } from '../../src/encoding/Hex';

const tsts = suite('Little endian encoding');

//We write in big endian
const u32Pairs = [
	//big order - little order
	[[0x01, 0x23, 0x45, 0x67], 0x67452301],
	[[0x67, 0x45, 0x23, 0x01], 0x01234567],
	//big order - little order
	[[0x89, 0xab, 0xcd, 0xef], 0xefcdab89],
	[[0xef, 0xcd, 0xab, 0x89], 0x89abcdef],
	//big order - little order
	[[0xff, 0xee, 0xdd, 0xcc], 0xccddeeff],
	[[0xcc, 0xdd, 0xee, 0xff], 0xffeeddcc],
	//big order - little order
	[[0x00, 0x11, 0x22, 0x33], 0x33221100],
	[[0x33, 0x22, 0x11, 0x00], 0x00112233],
];

for (const pair of u32Pairs) {
	const h = Hex.fromBytes(new Uint8Array(pair[0] as number[]));


	tsts('u32 as bytes:' + h, () => {
		const b = littleEndian.u32ToBytes(pair[1] as number);
		assert.is(Hex.fromBytes(b), h);
	});
}

// const intToMinBytesPairs=[
//     [0,'00'],
//     [1,'01'],
//     [254,'FE'],
//     [255,'FF'],
//     [256,'0001'],
//     [257,'0101'],
// ];

// for(const pair of intToMinBytesPairs) {
//     tsts('intToMinBytes:'+pair[0],()=>{
//         const h=hex.fromBytes(littleEndian.intToMinBytes(pair[0] as number));
//         assert.is(h,pair[1]);
//     });
// }

tsts.run();
