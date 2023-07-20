/*! Copyright 2023 the gnablib contributors MPL-1.1 */

const reversedPoly = 0xedb88320;

function makeTable(poly: number): Uint32Array {
	const ret = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let x = i;
		//Unroll the common 8 part loop, and avoid the ternary if with some bit logic
		x = (x >>> 1) ^ ((x & 1) * poly);
		x = (x >>> 1) ^ ((x & 1) * poly);
		x = (x >>> 1) ^ ((x & 1) * poly);
		x = (x >>> 1) ^ ((x & 1) * poly);
		x = (x >>> 1) ^ ((x & 1) * poly);
		x = (x >>> 1) ^ ((x & 1) * poly);
		x = (x >>> 1) ^ ((x & 1) * poly);
		x = (x >>> 1) ^ ((x & 1) * poly);
		ret[i] = x;

		// table[index]=index;
		//         for(z=8;z;z--) table[index]=(table[index]&1)?(table[index]>>1)^0xEDB88320:table[index]>>1;
	}
	return ret;
}
const tblRp = makeTable(reversedPoly);

export function crc32(bytes: Uint8Array, crc = 0): number {
	//This is subject to CRC of more than 32bits being injected, but the following
	// line prevents it messing up the algo
	crc = ~crc & 0xffffffff;
	for (const byte of bytes) {
		crc = (crc >>> 8) ^ tblRp[(crc ^ byte) & 0xff];
	}
	return ~crc >>> 0; //(crc ^ (-1)) >>> 0;
}
