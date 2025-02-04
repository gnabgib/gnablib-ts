/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IHash } from '../interfaces/index.js';

const mod = 65521; //0xfff1
const maxSpace = 4294967296;

/**
 * Adler-32 checksum, specified in
 * [RFC-1950](https://datatracker.ietf.org/doc/html/rfc1950),
 * generates a 32bit checksum of a series of bytes
 */
export class Adler32 implements IHash {
	private s1 = 1;
	private s2 = 0;
	private _unModCount = 0;
	readonly size = 4;
	readonly blockSize = 0;

	private mod() {
		this.s1 %= mod;
		this.s2 %= mod;
		this._unModCount = 0;
	}

	write(data: Uint8Array) {
		let i = 0;
		//JS doesn't overflow until 53 bits we we've got lots of space here
		// (0xffffffff * 0xfff1 (max sum value) still fits in 2^48 bits)
		let space = maxSpace - this._unModCount;
		if (data.length < space) {
			for (; i < data.length; i++) {
				this.s1 += data[i];
				this.s2 += this.s1;
			}
			this._unModCount += data.length;
			return;
			/* c8 ignore next */
		}
		/* c8 ignore start*/
		//Writing >4B bytes takes a long time.
		//During dev we used a smaller max-space to test/cover this (rare) eventuality
		do {
			for (; i < space; i++) {
				this.s1 += data[i];
				this.s2 += this.s1;
			}
			this.mod();
			space = maxSpace;
		} while (i < data.length);
		/* c8 ignore stop */
	}

	sum() {
		return this.sumIn();
	}

	sumIn() {
		if (this._unModCount > 0) this.mod();
		return Uint8Array.of(this.s2 >>> 8, this.s2, this.s1 >>> 8, this.s1);
	}

	/** Get the checksum as a 32bit unsigned integer */
	sum32(): number {
		if (this._unModCount > 0) this.mod();
		return ((this.s2 << 16) | this.s1) >>> 0;
	}

	reset() {
		this.s1 = 1;
		this.s2 = 0;
		this._unModCount = 0;
	}

	newEmpty() {
		return new Adler32();
	}

	clone() {
		const ret = new Adler32();
		ret.s1 = this.s1;
		ret.s2 = this.s2;
		ret._unModCount = this._unModCount;
		return ret;
	}
}
