/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { IAeadCrypt, IHash, IFullCrypt } from '../index.js';
import { ChaCha20, Salsa20, XChaCha20, XSalsa20 } from '../sym/index.js';
import { asLE } from '../../endian/platform.js';
import { NotInRangeError } from '../../primitive/ErrorExt.js';
import { safety } from '../../primitive/Safety.js';
import { U64, U64Mut } from '../../primitive/U64.js';

const tagSize = 16;

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
 * - [RFC8439 (2018)](https://datatracker.ietf.org/doc/html/rfc8439)
 * - ~[RFC7539 (2015)](https://datatracker.ietf.org/doc/html/rfc7539)~
 */
export class Poly1305 implements IHash {
	//poly1305-donna https://github.com/floodyberry/poly1305-donna/
	readonly blockSize = tagSize; //128
	readonly size = tagSize; //128

	readonly #r = new Uint16Array(10);
	readonly #s: Uint16Array;
	readonly #a = new Uint16Array(10);

	/** Temp processing block */
	readonly #block = new Uint8Array(tagSize);
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
		/**
		 * Partial deconstruction of the following to avoid some of the 
		 * branches (improving processing speed since hash is likely called several times)
		 * - I agree it's uglier/slightly harder to follow, but; performance.
		for (i = 0, c = 0; i < 10; i++) {
			d[i] = c;
			for (j = 0; j < 10; j++) {
				d[i] += this.#a[j] * ((j <= i) ? this.#r[i - j] : (5 * this.#r[i + 10 - j]));
				if (j == 4) {
					c = (d[i] >> 13);
					d[i] &= 0x1fff;
				}
			}
			c += d[i] >> 13;
			d[i] &= 0x1fff;
		}
		*/
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

		const ret = new Uint8Array(tagSize);
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

	/**
	 * Section 2.6 - generate from key + nonce
	 * - Intended to be used with Salsa/XSalsa/ChaCha/XChaCha
	 * @param key
	 * @param nonce
	 */
	static fromCrypt(c: IFullCrypt): Poly1305 {
		//Make sure the crypt generates at least 32 bits
		//(otherwise we'll have a counter rollover which is out of spec)
		if (c.blockSize < 32)
			throw new NotInRangeError(
				'c.blockSize',
				c.blockSize,
				undefined,
				undefined,
				'>=',
				32
			);
		//While we only need 32 bits, we want to consume a full block so the counter increments
		//(assuming it's a counter based scheme, which it is if it's a Salsa/ChaCha variant)
		const key = new Uint8Array(c.blockSize);
		c.encryptInto(key, key);
		return new Poly1305(key.subarray(0, 32));
	}
}

const stage_init = 0;
const stage_ad = 1;
const stage_data = 2;
const stage_done = 3;

interface IFullCryptBuilder {
	new (key: Uint8Array, nonce: Uint8Array): IFullCrypt;
}

class Poly1305Aead implements IAeadCrypt {
	//Accept Salsa/XSalsa/ChaCha/XChaCha and AEAD and.. make it so
	readonly tagSize = tagSize;
	#hash: Poly1305;
	#crypt: IFullCrypt;
	/** Stage Init=0/AssocData=1/Data=2 */
	#stage = stage_init;
	readonly #adLen = U64Mut.fromUint32Pair(0, 0);
	readonly #cLen = U64Mut.fromUint32Pair(0, 0);

	constructor(key: Uint8Array, nonce: Uint8Array, ctor: IFullCryptBuilder) {
		this.#crypt = new ctor(key, nonce);
		this.#hash = Poly1305.fromCrypt(this.#crypt);
		//Conveniently the protocol wants hash using counter=0, and crypt
		// using counter>=1, so we can the same object for both
	}

	get blockSize(): number {
		return this.#crypt.blockSize;
	}

	/**
	 * Add associated data (can be called multiple times, must be done before {@link encryptInto}/{@link decryptInto})
	 * @param data
	 */
	writeAD(data: Uint8Array): void {
		if (this.#stage > stage_ad)
			throw new Error('Associated data can no longer be written');
		this.#stage = stage_ad;
		this.#adLen.addEq(U64.fromInt(data.length));
		this.#hash.write(data);
	}

	private finalizeAD(): void {
		if (this.#stage === stage_ad) {
			//Add enough zeros to make adLen a multiple of 16
			const padCount = 16 - (this.#adLen.low & 0xf);
			//If padCount is less than 16.. aka needed, add zeros to the hash
			if (padCount < 16) this.#hash.write(new Uint8Array(padCount));
		}
		this.#stage = stage_data;
	}

	encryptInto(enc: Uint8Array, plain: Uint8Array): void {
		if (this.#stage < stage_data) this.finalizeAD();
		else if (this.#stage == stage_done)
			throw new Error('Cannot encrypt data after finalization');
		this.#stage = stage_data;

		this.#crypt.encryptInto(enc, plain);
		this.#hash.write(enc);
		this.#cLen.addEq(U64.fromInt(plain.length));
	}

	decryptInto(plain: Uint8Array, enc: Uint8Array): void {
		if (this.#stage < stage_data) this.finalizeAD();
		else if (this.#stage == stage_done)
			throw new Error('Cannot decrypt data after finalization');
		this.#stage = stage_data;

		this.#crypt.decryptInto(plain, enc);
		this.#hash.write(enc);
		this.#cLen.addEq(U64.fromInt(plain.length));
	}

	verify(tag: Uint8Array): boolean {
		//End assoc writing
		if (this.#stage < stage_data) this.finalizeAD();
		if (this.#stage === stage_data) {
			//Add enough zeros to make adLen a multiple of 16
			const padCount = 16 - (this.#cLen.low & 0xf);
			//If padCount is less than 16.. aka needed, add zeros to the hash
			if (padCount < 16) this.#hash.write(new Uint8Array(padCount));

			//Add AD len in LE
			this.#hash.write(this.#adLen.toBytesLE());
			//Add C len in LE
			this.#hash.write(this.#cLen.toBytesLE());
		}
		this.#stage = stage_done;
		//Make sure the provided tag is the right size
		safety.lenExactly(tag, tagSize, 'tag');

		const foundTag = this.#hash.sumIn();

		let zero = 0;
		for (let i = 0; i < foundTag.length; i++) zero |= tag[i] ^ foundTag[i];
		return zero === 0;
	}

	finalize(): Uint8Array {
		//End assoc writing
		if (this.#stage < stage_data) this.finalizeAD();
		if (this.#stage === stage_data) {
			//Add enough zeros to make adLen a multiple of 16
			const padCount = 16 - (this.#cLen.low & 0xf);
			//If padCount is less than 16.. aka needed, add zeros to the hash
			if (padCount < 16) this.#hash.write(new Uint8Array(padCount));

			//Add AD len in LE
			this.#hash.write(this.#adLen.toBytesLE());
			//Add C len in LE
			this.#hash.write(this.#cLen.toBytesLE());
		}
		this.#stage = stage_done;
		return this.#hash.sumIn();
	}

	encryptSize(plainLen: number): number {
		return plainLen;
	}
}

/**
 * [ChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305)
 *
 * ChaCha20-Poly1305 is an authenticated encryption with additional data (AEAD)
 * algorithm, that combines the {@link ChaCha20} stream cipher with the {@link Poly1305} message
 * authentication code.
 *
 * First Published: *2013*
 * Blocksize: *64 bytes/512 bits*
 * Key size: *32 bytes/256 bits*
 * Nonce size: *12 bytes/96 bits*
 * Rounds: *20*
 *
 * Specified in
 * - [RFC8439 (2018)](https://datatracker.ietf.org/doc/html/rfc8439)
 * - ~[RFC7539 (2015)](https://datatracker.ietf.org/doc/html/rfc7539)~
 *
 * @example
 * To encrypt a message `plainHex`
 * ```js
 * import { hex } from "gnablib/codec";
 * import { ChaCha20_Poly1305 } from "gnablib/crypto";
 *
 * //From RFC7539-Section 2.8.2
 * const keyHex =
 *   "808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9F";
 * const nonceHex = "070000004041424344454647";
 * const aadHex = "50515253C0C1C2C3C4C5C6C7";
 * const plainHex =
 *   "4C616469657320616E642047656E746C656D656E206F662074686520636C6173" +
 *   "73206F66202739393A204966204920636F756C64206F6666657220796F75206F" +
 *   "6E6C79206F6E652074697020666F7220746865206675747572652C2073756E73" +
 *   "637265656E20776F756C642062652069742E";
 *
 * const c = new ChaCha20_Poly1305(hex.toBytes(keyHex), hex.toBytes(nonceHex));
 * //Adding AAD is optional - you can skip this call if there's no data
 * c.writeAD(hex.toBytes(aadHex));
 *
 * const plain = hex.toBytes(plainHex);
 * //You could use c.encryptSize(plain.length), but we know the cipher is
 * // the same size for this algo
 * const enc = new Uint8Array(plain.length);
 *
 * c.encryptInto(enc, plain);
 * const tag = c.finalize();
 *
 * console.log(`enc=${hex.fromBytes(enc)}`); // enc=D31A8D34648E60DB7B86AFBC53EF7E..
 * console.log(`tag=${hex.fromBytes(tag)}`); // tag=1AE10B594F09E26A7E902ECBD0600691
 * ```
 */
export class ChaCha20_Poly1305 extends Poly1305Aead {
	/**
	 * Construct a new ChaCha20-Poly1305 AEAD state
	 * @param key Secret key, in bytes, exactly 32 bytes
	 * @param nonce Nonce, in bytes, exactly 12 bytes
	 */
	constructor(key: Uint8Array, nonce: Uint8Array) {
		super(key, nonce, ChaCha20);
	}
}

/**
 * [Salsa20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305#Salsa20-Poly1305_and_XSalsa20-Poly1305)
 *
 * Salsa20-Poly1305 is an authenticated encryption with additional data (AEAD)
 * algorithm, that combines the {@link Salsa20} stream cipher with the {@link Poly1305} message
 * authentication code.
 *
 * First Published: *2013*
 * Blocksize: *64 bytes/512 bits*
 * Key size: *32 bytes/256 bits*
 * Nonce size: *12 bytes/96 bits*
 * Rounds: *20*
 */
export class Salsa20_Poly1305 extends Poly1305Aead {
	/**
	 * Construct a new Salsa20-Poly1305 AEAD state
	 * @param key Secret key, in bytes, exactly 32 bytes
	 * @param nonce Nonce, in bytes, exactly 8 bytes
	 */
	constructor(key: Uint8Array, nonce: Uint8Array) {
		super(key, nonce, Salsa20);
	}
}

/**
 * [XChaCha20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305#XChaCha20-Poly1305_%E2%80%93_extended_nonce_variant)
 *
 * XChaCha20-Poly1305 is an authenticated encryption with additional data (AEAD)
 * algorithm, that combines the {@link XChaCha20} stream cipher with the {@link Poly1305} message
 * authentication code.
 *
 * First Published: *2013*
 * Blocksize: *64 bytes/512 bits*
 * Key size: *32 bytes/256 bits*
 * Nonce size: *24 bytes/192 bits*
 * Rounds: *20*
 *
 * Specified in:
 * - [IETF Draft (2018)](https://datatracker.ietf.org/doc/html/draft-arciszewski-xchacha)
 *
 *  * @example
 * To encrypt a message `plainHex`
 * ```js
 * import { hex } from 'gnablib/codec';
 * import { XChaCha20_Poly1305 } from 'gnablib/crypto';
 *
 * //From draft-arciszewski-xchacha Section A.1
 * const keyHex =
 *   "808182838485868788898A8B8C8D8E8F909192939495969798999A9B9C9D9E9F";
 * const nonceHex = "404142434445464748494A4B4C4D4E4F5051525354555657";
 * const aadHex = "50515253C0C1C2C3C4C5C6C7";
 * const plainHex =
 *   "4C616469657320616E642047656E746C656D656E206F662074686520636C6173" +
 *   "73206F66202739393A204966204920636F756C64206F6666657220796F75206F" +
 *   "6E6C79206F6E652074697020666F7220746865206675747572652C2073756E73" +
 *   "637265656E20776F756C642062652069742E";
 *
 * const c = new XChaCha20_Poly1305(hex.toBytes(keyHex), hex.toBytes(nonceHex));
 * //Adding AAD is optional - you can skip this call if there's no data
 * c.writeAD(hex.toBytes(aadHex));
 *
 * const plain = hex.toBytes(plainHex);
 * //You could use c.encryptSize(plain.length), but we know the cipher is
 * // the same size for this algo
 * const enc = new Uint8Array(plain.length);
 *
 * c.encryptInto(enc, plain);
 * const tag = c.finalize();
 *
 * console.log(`enc=${hex.fromBytes(enc)}`); // enc=BD6D179D3E83D43B9576579493C0E9..
 * console.log(`tag=${hex.fromBytes(tag)}`); // tag=C0875924C1C7987947DEAFD8780ACF49
 * ```
 */
export class XChaCha20_Poly1305 extends Poly1305Aead {
	/**
	 * Construct a new XChaCha20-Poly1305 AEAD state
	 * @param key Secret key, in bytes, exactly 32 bytes
	 * @param nonce Nonce, in bytes, exactly 24 bytes
	 */
	constructor(key: Uint8Array, nonce: Uint8Array) {
		super(key, nonce, XChaCha20);
	}
}

/**
 * [XSalsa20-Poly1305](https://en.wikipedia.org/wiki/ChaCha20-Poly1305#XChaCha20-Poly1305_%E2%80%93_extended_nonce_variant)
 *
 * XSalsa20-Poly1305 is an authenticated encryption with additional data (AEAD)
 * algorithm, that combines the {@link XSalsa20} stream cipher with the {@link Poly1305} message
 * authentication code.
 *
 * First Published: *2013*
 * Blocksize: *64 bytes/512 bits*
 * Key size: *32 bytes/256 bits*
 * Nonce size: *24 bytes/192 bits*
 * Rounds: *20*
 */
export class XSalsa20_Poly1305 extends Poly1305Aead {
	/**
	 * Construct a new XSalsa20-Poly1305 AEAD state
	 * @param key Secret key, in bytes, exactly 32 bytes
	 * @param nonce Nonce, in bytes, exactly 24 bytes
	 */
	constructor(key: Uint8Array, nonce: Uint8Array) {
		super(key, nonce, XSalsa20);
	}
}
