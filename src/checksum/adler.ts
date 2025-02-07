/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IChecksum } from './interfaces/IChecksum.js';

const maxSpace = 4294967295;
//const maxSpace = 4000;

/**
 * [Adler32](https://en.wikipedia.org/wiki/Adler-32)
 * generates a 32bit checksum of a stream of data.  Described in
 * [RFC-1950](https://datatracker.ietf.org/doc/html/rfc1950)
 *
 * Related:
 * - [Revisiting Fletcher and Adler Checksums (2006)](http://www.zlib.net/maxino06_fletcher-adler.pdf)
 * - ⚠ In most cases the {@link Fletcher32 |Fletcher} checksum should be used instead of this
 * 
 * @example
 * ```js
 * import { Adler32 } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Adler32();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0x29750586
 * console.log(sum.sum32());// 695534982
 * ```
 */
export class Adler32 implements IChecksum {
	private _modSpace = maxSpace; //0xffffffff * 0xfff1 (max sum value) still fits in 2^48 bits
	private _s1 = 1;
	private _s2 = 0;
	readonly size = 4;

	private mod() {
		this._s1 %= 65521; //0xfff1
		this._s2 %= 65521;
		this._modSpace = maxSpace;
	}

	write(data: Uint8Array) {
		let i = 0;
		/* c8 ignore start*/
		//Writing >4B bytes takes a long time.
		//During dev we used a smaller max-space (4k) to test/cover this
		while (data.length > this._modSpace) {
			for (; i < this._modSpace; i++) {
				this._s1 += data[i];
				this._s2 += this._s1;
			}
			this.mod();
		}
		/* c8 ignore stop */
		this._modSpace -= data.length - i;
		for (; i < data.length; i++) {
			this._s1 += data[i];
			this._s2 += this._s1;
		}
	}

	/** Get the checksum as a 32bit unsigned integer */
	sum32() {
		if (this._modSpace < maxSpace) this.mod();
		return ((this._s2 << 16) | this._s1) >>> 0;
	}

	sum() {
		if (this._modSpace < maxSpace) this.mod();
		//Big endian
		return Uint8Array.of(this._s2 >>> 8, this._s2, this._s1 >>> 8, this._s1);
	}
}
