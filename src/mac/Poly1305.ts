/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { IHash } from '../hash/IHash.js';
import { safety } from '../primitive/Safety.js';

const blockSize = 16;

/**
 * [Poly1305](https://datatracker.ietf.org/doc/html/rfc8439#autoid-14)
 * ([Wiki](https://en.wikipedia.org/wiki/Poly1305))
 *
 * Poly1305 is a universal hash family designed by Daniel J. Bernstein
 *
 * Block size: *16 bytes*
 * Key size: *32 bytes*
 *
 * Specified in
 * - [RFC8439](https://datatracker.ietf.org/doc/html/rfc8439)
 * - ~[RFC7539](https://datatracker.ietf.org/doc/html/rfc7539)~
 */
export class Poly1305 implements IHash {
	//poly1305-donna https://github.com/floodyberry/poly1305-donna/
	readonly blockSize = blockSize; //128
	readonly size = blockSize; //128

	readonly #r = new Uint16Array(10);
	readonly #s: Uint16Array;
	readonly #a = new Uint16Array(10);

	/** Temp processing block */
	readonly #block = new Uint8Array(blockSize);
	readonly #b16 = new Uint16Array(this.#block.buffer);
	/** Position of data written to block */
	#bPos = 0;

	constructor(key: Uint8Array) {
		safety.lenExactly(key, 32, 'key'); //256

		const r16 = new Uint16Array(key.slice(0, 16).buffer);
		//Make sure data is LE
		const r = new Uint8Array(r16.buffer);
		asLE.i16(r, 0, 8);

		// clamp r: &= 0xffffffc0ffffffc0ffffffc0fffffff
		// prettier-ignore
		{
			this.#r[0] =   r16[0]                           & 0x1fff;
			this.#r[1] = ((r16[0] >>> 13) | (r16[1] <<  3)) & 0x1fff;
			this.#r[2] = ((r16[1] >>> 10) | (r16[2] <<  6)) & 0x1f03;
			this.#r[3] = ((r16[2] >>>  7) | (r16[3] <<  9)) & 0x1fff;
			this.#r[4] = ((r16[3] >>>  4) | (r16[4] << 12)) & 0x00ff;
			this.#r[5] =  (r16[4] >>>  1)                   & 0x1ffe;
			this.#r[6] = ((r16[4] >>> 14) | (r16[5] <<  2)) & 0x1fff;
			this.#r[7] = ((r16[5] >>> 11) | (r16[6] <<  5)) & 0x1f81;
			this.#r[8] = ((r16[6] >>>  8) | (r16[7] <<  8)) & 0x1fff;
			this.#r[9] =  (r16[7] >>>  5)                   & 0x007f;	
		}

		const s = key.slice(16, 32);
		asLE.i16(s, 0, 8);
		this.#s = new Uint16Array(s.buffer);
	}

	private hash(last = false) {
		const highBit = last ? 0 : 1 << 11; //2^128
		asLE.i16(this.#block, 0, 10);
		// prettier-ignore
		{
			// h += m[i]
			this.#a[0] +=   this.#b16[0]                                 & 0x1fff;
    		this.#a[1] += ((this.#b16[0] >>> 13) | (this.#b16[1] <<  3)) & 0x1fff;
    		this.#a[2] += ((this.#b16[1] >>> 10) | (this.#b16[2] <<  6)) & 0x1fff;
    		this.#a[3] += ((this.#b16[2] >>>  7) | (this.#b16[3] <<  9)) & 0x1fff;
    		this.#a[4] += ((this.#b16[3] >>>  4) | (this.#b16[4] << 12)) & 0x1fff;
    		this.#a[5] +=  (this.#b16[4] >>>  1)                         & 0x1fff;
    		this.#a[6] += ((this.#b16[4] >>> 14) | (this.#b16[5] <<  2)) & 0x1fff;
    		this.#a[7] += ((this.#b16[5] >>> 11) | (this.#b16[6] <<  5)) & 0x1fff;
    		this.#a[8] += ((this.#b16[6] >>>  8) | (this.#b16[7] <<  8)) & 0x1fff;
    		this.#a[9] +=  (this.#b16[7] >>>  5)                         | highBit;
		}

		// h *= r, (partial) h %= p
		let c = 0;
		const d = new Uint32Array(10);
		let i = 0,
			j = 0;
		for (; i < 5; i++) {
			d[i] = c;
			for (j = 0; j <= i; j++) d[i] += this.#a[j] * this.#r[i - j];
			for (; j < 5; j++) d[i] += this.#a[j] * 5 * this.#r[i + 10 - j];
			c = d[i] >>> 13;
			d[i] &= 0x1fff;
			d[i] += this.#a[5] * 5 * this.#r[i + 5];
			d[i] += this.#a[6] * 5 * this.#r[i + 4];
			d[i] += this.#a[7] * 5 * this.#r[i + 3];
			d[i] += this.#a[8] * 5 * this.#r[i + 2];
			d[i] += this.#a[9] * 5 * this.#r[i + 1];
			c += d[i] >>> 13;
			d[i] &= 0x1fff;
		}
		for (; i < 10; i++) {
			d[i] = c;
			d[i] += this.#a[0] * this.#r[i - 0];
			d[i] += this.#a[1] * this.#r[i - 1];
			d[i] += this.#a[2] * this.#r[i - 2];
			d[i] += this.#a[3] * this.#r[i - 3];
			d[i] += this.#a[4] * this.#r[i - 4];
			c = d[i] >>> 13;
			d[i] &= 0x1fff;
			for (j = 5; j <= i; j++) d[i] += this.#a[j] * this.#r[i - j];
			for (; j < 10; j++) d[i] += this.#a[j] * 5 * this.#r[i + 10 - j];
			c += d[i] >>> 13;
			d[i] &= 0x1fff;
		}
		c = c * 5 + d[0];
		d[0] = c & 0x1fff;
		c >>>= 13;
		d[1] += c;

		this.#a.set(d);
		this.#bPos = 0;
	}

	write(data: Uint8Array): void {
		let nToWrite = data.length;
		let dPos = 0;
		let space = this.blockSize - this.#bPos;
		while (nToWrite > 0) {
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				this.#block.set(data.subarray(dPos), this.#bPos);
				//Update pos
				this.#bPos += nToWrite;
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + this.blockSize), this.#bPos);
			this.#bPos += space;
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = this.blockSize;
		}
	}

	sum(): Uint8Array {
		return this.clone().sumIn();
	}

	sumIn(): Uint8Array {
		//Process any remainder
		if (this.#bPos > 0) {
			this.#block[this.#bPos++] = 1;
			this.#block.fill(0, this.#bPos);
			this.hash(true);
		}

		//Full carry accumulator
		let c = 0;
		for (let i = 1; i < 10; i++) {
			this.#a[i] += c;
			c = this.#a[i] >>> 13;
			this.#a[i] &= 0x1fff;
		}
		this.#a[0] += c * 5;
		c = this.#a[0] >>> 13;
		this.#a[0] &= 0x1fff;
		this.#a[1] += c;
		c = this.#a[1] >>> 13;
		this.#a[1] &= 0x1fff;
		this.#a[2] += c;

		// compute accumulator -p
		const g = new Uint16Array(10);
		c = 5;
		for (let i = 0; i < 10; i++) {
			g[i] = this.#a[i] + c;
			c = g[i] >>> 13;
			g[i] &= 0x1fff;
		}

		//select a if a<p, or a-p if a >= p
		const mask = (c ^ 1) - 1;
		const iMask = ~mask;
		for (let i = 0; i < 10; i++) {
			this.#a[i] = (this.#a[i] & iMask) | (g[i] & mask);
		}

		//a %= (2^128)
		// prettier-ignore
		{
			this.#a[0] = (this.#a[0]      ) | (this.#a[1] << 13);
			this.#a[1] = (this.#a[1] >>  3) | (this.#a[2] << 10);
			this.#a[2] = (this.#a[2] >>  6) | (this.#a[3] <<  7);
			this.#a[3] = (this.#a[3] >>  9) | (this.#a[4] <<  4);
			this.#a[4] = (this.#a[4] >> 12) | (this.#a[5] <<  1) | (this.#a[6] << 14);
			this.#a[5] = (this.#a[6] >>  2) | (this.#a[7] << 11);
			this.#a[6] = (this.#a[7] >>  5) | (this.#a[8] <<  8);
			this.#a[7] = (this.#a[8] >>  8) | (this.#a[9] <<  5);
		}

		const ret = new Uint8Array(blockSize);
		const r16 = new Uint16Array(ret.buffer);
		let f = 0;
		for (let i = 0; i < 8; i++) {
			f = this.#a[i] + this.#s[i] + f;
			this.#a[i] = f;
			f >>>= 16;
		}
		r16.set(this.#a.subarray(0, 8));
		asLE.i16(ret, 0, 8);
		return ret;
	}

	reset(): void {
		this.#bPos = 0;
		this.#block.fill(0);
		this.#a.fill(0);
	}

	newEmpty(): IHash {
		const ret = new Poly1305(new Uint8Array(32));
		ret.#r.set(this.#r);
		ret.#s.set(this.#s);
		return ret;
	}

	clone(): IHash {
		const ret = new Poly1305(new Uint8Array(32));
		ret.#r.set(this.#r);
		ret.#s.set(this.#s);
		ret.#block.set(this.#block);
		ret.#bPos = this.#bPos;
		ret.#a.set(this.#a);
		return ret;
	}
}
