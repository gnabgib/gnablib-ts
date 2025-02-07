/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IChecksum } from './interfaces/IChecksum.js';

const POLY = 0x1864cfb;
const BIT24 = 0x1000000;

/**
 * crc24 generates a 24bit checksum of a stream of data.  Described in
 * [RFC-4880](https://datatracker.ietf.org/doc/html/rfc4880#section-6.1)
 *
 * Related:
 * - Used by PGP in [Radix-64](https://en.wikipedia.org/wiki/Base64#OpenPGP)
 * - Used in [RTCM](https://en.wikipedia.org/wiki/Radio_Technical_Commission_for_Maritime_Services) 104v3
 * - Intel CRC24a instruction uses the same polynomial
 *
 * @example
 * ```js
 * import { Crc24 } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Crc24();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0xDBF0B6
 * console.log(sum.sum24());// 14414006
 * ```
 */
export class Crc24 implements IChecksum {
	private _crc = 0xb704ce;
	readonly size = 3;

	write(data: Uint8Array) {
		for (const b of data) {
			this._crc ^= b << 16;
			for (let j = 0; j < 8; j++) {
				this._crc <<= 1;
				if ((this._crc & BIT24) == BIT24) this._crc ^= POLY;
			}
		}
	}

	/** Get the checksum as a 24bit unsigned integer */
	sum24() {
		return this._crc & 0xffffff;
	}

	sum() {
		return Uint8Array.of(this._crc >>> 16, this._crc >>> 8, this._crc);
	}
}
