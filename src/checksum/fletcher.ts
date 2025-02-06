/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IChecksum } from './interfaces/IChecksum.js';

const maxSpace = 0xffff;
//const maxSpace = 4000;

/**
 * [Fletcher16](https://en.wikipedia.org/wiki/Fletcher%27s_checksum#Fletcher-16)
 * generates a 16bit checksum of a stream of data. Described in
 * [RFC-1146](https://datatracker.ietf.org/doc/html/rfc1146) (Appendix I)
 *
 * ## Weaknesses:
 *
 * The Fletcher checksum cannot distinguish between blocks of all 0 bits and blocks of
 * all 1 bits. For example, if a 16-bit block in the data word changes from 0x0000 to
 * 0xFFFF, the Fletcher-32 checksum remains the same. This also means a sequence of
 * all 00 bytes has the same checksum as a sequence (of the same size) of all FF bytes.
 *
 * Related:
 *
 * - [Revisiting Fletcher and Adler Checksums (2006)](http://www.zlib.net/maxino06_fletcher-adler.pdf)
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
 * ## Weaknesses:
 *
 * The Fletcher checksum cannot distinguish between blocks of all 0 bits and blocks of
 * all 1 bits. For example, if a 16-bit block in the data word changes from 0x0000 to
 * 0xFFFF, the Fletcher-32 checksum remains the same. This also means a sequence of
 * all 00 bytes has the same checksum as a sequence (of the same size) of all FF bytes.
 *
 * Related:
 * - [Revisiting Fletcher and Adler Checksums (2006)](http://www.zlib.net/maxino06_fletcher-adler.pdf)
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

/**
 * [Fletcher64](https://en.wikipedia.org/wiki/Fletcher%27s_checksum#Fletcher-64)
 * generates a 64bit checksum of a stream of data.
 *
 * ## Weaknesses:
 *
 * The Fletcher checksum cannot distinguish between blocks of all 0 bits and blocks of
 * all 1 bits. For example, if a 16-bit block in the data word changes from 0x0000 to
 * 0xFFFF, the Fletcher-32 checksum remains the same. This also means a sequence of
 * all 00 bytes has the same checksum as a sequence (of the same size) of all FF bytes.
 *
 * Related:
 *
 * - [Revisiting Fletcher and Adler Checksums (2006)](http://www.zlib.net/maxino06_fletcher-adler.pdf)
 */
export class Fletcher64 implements IChecksum {
	private _modSpace = maxSpace; //0xffff * 0xffffffff fits in 2^48 bits
	private _c0 = 0;
	private _c1 = 0;
	readonly size = 8;

	private mod() {
		this._c0 %= 4294967295;
		this._c1 %= 4294967295;
		this._modSpace = maxSpace;
	}

	write(data: Uint8Array) {
		//We should technically handle data.length%4!=0, but JS allows us to
		// step off the end of the array (and get zeros) so nbd
		let i = 0;
		/* c8 ignore start*/
		//Writing >64K bytes takes a long time.
		//During dev we used a smaller max-space (4k) to test/cover this
		while (data.length > this._modSpace) {
			for (; i < this._modSpace; i++) {
				//LE read
				this._c0 +=
					(data[i++] |
						(data[i++] << 8) |
						(data[i++] << 16) |
						(data[i] << 24)) >>>
					0;
				this._c1 += this._c0;
			}
			this.mod();
		}
		/* c8 ignore stop */
		this._modSpace -= data.length - i;
		for (; i < data.length; i++) {
			this._c0 +=
				(data[i++] | (data[i++] << 8) | (data[i++] << 16) | (data[i] << 24)) >>>
				0;
			this._c1 += this._c0;
		}
	}

	sum() {
		if (this._modSpace < maxSpace) this.mod();
		//Big endian
		return Uint8Array.of(
			this._c1 >>> 24,
			this._c1 >>> 16,
			this._c1 >>> 8,
			this._c1,
			this._c0 >>> 24,
			this._c0 >>> 16,
			this._c0 >>> 8,
			this._c0
		);
	}
}
