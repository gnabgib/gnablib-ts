/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IChecksum } from './interfaces/IChecksum.js';

const maxSpace = 0xffffffff;
//const maxSpace = 4000;

/**
 * [Fletcher16](https://en.wikipedia.org/wiki/Fletcher%27s_checksum#Fletcher-16)
 * generates a 16bit checksum of a stream of data. Described in
 * [RFC-1146](https://datatracker.ietf.org/doc/html/rfc1146) (Appendix I)
 *
 * **Weaknesses:**
 *
 * The Fletcher checksum cannot distinguish between blocks of all 0 bits and blocks of
 * all 1 bits. For example, if a 16-bit block in the data word changes from 0x0000 to
 * 0xFFFF, the Fletcher-32 checksum remains the same. This also means a sequence of
 * all 00 bytes has the same checksum as a sequence (of the same size) of all FF bytes.
 *
 * Related:
 * - [Revisiting Fletcher and Adler Checksums (2006)](http://www.zlib.net/maxino06_fletcher-adler.pdf)
 * - Also available as {@link Fletcher32 |32bit} and {@link Fletcher64 |64bit} checksums
 * 
 * @example
 * ```js
 * import { Fletcher16 } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Fletcher16();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0x908A
 * console.log(sum.sum16());// 37002
 * ```
 */
export class Fletcher16 implements IChecksum {
	private _modSpace = maxSpace; //0xffff * 0xff fits in 2^24 bits
	private _c0 = 0;
	private _c1 = 0;
	readonly size = 2;

	private mod() {
		this._c0 %= 0xff;
		this._c1 %= 0xff;
		this._modSpace = maxSpace;
	}

	write(data: Uint8Array) {
		let i = 0;
		/* c8 ignore start*/
		//Writing >64K bytes takes a long time.
		//During dev we used a smaller max-space (4k) to test/cover this
		while (data.length > this._modSpace) {
			for (; i < this._modSpace; i++) {
				this._c0 += data[i];
				this._c1 += this._c0;
			}
			this.mod();
		}
		/* c8 ignore stop */
		this._modSpace -= data.length - i;
		for (; i < data.length; i++) {
			this._c0 += data[i];
			this._c1 += this._c0;
		}
	}

	/** Get the checksum as a 16bit unsigned integer */
	sum16() {
		if (this._modSpace < maxSpace) this.mod();
		return (this._c1 << 8) | this._c0;
	}

	sum() {
		if (this._modSpace < maxSpace) this.mod();
		//Big endian
		return Uint8Array.of(this._c1, this._c0);
	}
}

/**
 * [Fletcher32](https://en.wikipedia.org/wiki/Fletcher%27s_checksum#Fletcher-32)
 * generates a 32bit checksum of a stream of data. Described in
 * [RFC-1146](https://datatracker.ietf.org/doc/html/rfc1146) (Appendix II)
 *
 * **Weaknesses:**
 *
 * The Fletcher checksum cannot distinguish between blocks of all 0 bits and blocks of
 * all 1 bits. For example, if a 16-bit block in the data word changes from 0x0000 to
 * 0xFFFF, the Fletcher-32 checksum remains the same. This also means a sequence of
 * all 00 bytes has the same checksum as a sequence (of the same size) of all FF bytes.
 *
 * Related:
 * - [Revisiting Fletcher and Adler Checksums (2006)](http://www.zlib.net/maxino06_fletcher-adler.pdf)
 * - Also available as {@link Fletcher16 |16bit} and {@link Fletcher64 |64bit} checksums
 * - If the above weaknesses are of concern, try the {@link Adler32 |Adler} checksum
 * 
 * @example
 * ```js
 * import { Fletcher32 } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Fletcher32();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0x7C9DA3E6
 * console.log(sum.sum32());// 2090705894
 * ```
 */
export class Fletcher32 implements IChecksum {
	private _modSpace = maxSpace; //0xffff * 0xffff fits in 2^32 bits
	private _c0 = 0;
	private _c1 = 0;
	readonly size = 4;

	private mod() {
		this._c0 %= 0xffff;
		this._c1 %= 0xffff;
		this._modSpace = maxSpace;
	}

	write(data: Uint8Array) {
		//We should technically handle data.length%2!=0, but JS allows us to
		// step off the end of the array (and get zeros) so nbd
		let i = 0;
		/* c8 ignore start*/
		//Writing >64K bytes takes a long time.
		//During dev we used a smaller max-space (4k) to test/cover this
		while (data.length > this._modSpace) {
			for (; i < this._modSpace; i++) {
				//LE read
				this._c0 += data[i++] | (data[i] << 8);
				this._c1 += this._c0;
			}
			this.mod();
		}
		/* c8 ignore stop */
		this._modSpace -= data.length - i;
		for (; i < data.length; i++) {
			this._c0 += data[i++] | (data[i] << 8);
			this._c1 += this._c0;
		}
	}

	/** Get the checksum as a 32bit unsigned integer */
	sum32() {
		if (this._modSpace < maxSpace) this.mod();
		return ((this._c1 << 16) | this._c0) >>> 0;
	}

	sum() {
		if (this._modSpace < maxSpace) this.mod();
		//Big endian
		return Uint8Array.of(this._c1 >>> 8, this._c1, this._c0 >>> 8, this._c0);
	}
}