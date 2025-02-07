/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IChecksum } from './interfaces/IChecksum.js';

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

/**
 * crc32 generates a 32bit checksum of a stream of data.  Described in 
 * [IEEE 80802](https://www.iso.org/standard/78299.html), using the generator polynomial `0x04C11DB7`.
 * Also found in SATA, MPEG-2, PKZIP, Gzip, Bzip2, PNG and ZMODEM specs.
 * 
 * @example
 * ```js
 * import { Crc32 } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Crc32();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0x20159D7F
 * console.log(sum.sum32());// 538287487
 * ```
 */
export class Crc32 implements IChecksum {
	private _crc = 0xffffffff;
	readonly size = 4;

	write(data: Uint8Array) {
		for (const b of data) {
			this._crc = (this._crc >>> 8) ^ tblRp[(this._crc ^ b) & 0xff];
		}
	}

	/** Get the checksum as a 32bit unsigned integer */
	sum32() {
		return ~this._crc >>> 0;
	}

	sum() {
		const crc = ~this._crc;
		return Uint8Array.of(crc >>> 24, crc >>> 16, crc >>> 8, crc);
	}
}
