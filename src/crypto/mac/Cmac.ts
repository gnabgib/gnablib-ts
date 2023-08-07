/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { Aes } from '../sym/Aes.js';
import type { IHash } from '../interfaces/IHash.js';
import { uint8ArrayExt } from '../../primitive/UInt8ArrayExt.js';

const blockSize = 16;

function generateSubKey(a: Aes): [Uint8Array, Uint8Array] {
	//From section 2.3.  Subkey Generation Algorithm
	const k1 = new Uint8Array(blockSize);
	const k2 = new Uint8Array(blockSize);
	const msb = 0x80;
	const rb = 0x87;

	const l = new Uint8Array(blockSize);
	a.encryptBlock(l);

	let msbIs1 = (l[0] & msb) === msb;
	uint8ArrayExt.lShiftEq(l, 1);
	if (msbIs1) l[l.length - 1] ^= rb;
	k1.set(l);

	msbIs1 = (l[0] & msb) === msb;
	uint8ArrayExt.lShiftEq(l, 1);
	if (msbIs1) l[l.length - 1] ^= rb;
	k2.set(l);

	return [k1, k2];
}

/**
 * [The AES-CMAC Algorithm](https://datatracker.ietf.org/doc/rfc4493/)
 * ([wiki](https://en.wikipedia.org/wiki/One-key_MAC))
 *
 * The Cipher-based Message Authentication Code (CMAC), which is equivalent to the
 * One-Key CBC MAC1 (OMAC1) submitted by Iwata and Kurosawa
 *
 * First Published: *2003*
 * Block size: *16 bytes*
 *
 * Specified in:
 * - [RFC 4493](https://datatracker.ietf.org/doc/rfc4493/)
 * - [OMAC: One-Key CBC MAC](https://link.springer.com/chapter/10.1007/978-3-540-39887-5_11#rightslink)
 */
export class Cmac implements IHash {
	readonly blockSize = blockSize;
	readonly size = blockSize;

	readonly #aes: Aes;
	readonly #k1: Uint8Array;
	readonly #k2: Uint8Array;
	/** Temp processing block */
	readonly #block = new Uint8Array(blockSize);
	/** Position of data written to block */
	#bPos = 0;

	/**
	 * Build a new CMAC generator with key
	 * **Do not** inject a built AES object - internal use only (will not setup k1/k2 keys properly)
	 * @param keyOrCrypt Uint8Array of bytes to be used as a key
	 */
	constructor(keyOrCrypt: Uint8Array | Aes) {
		if (keyOrCrypt instanceof Aes) {
			this.#aes = keyOrCrypt;
			this.#k1 = new Uint8Array(blockSize);
			this.#k2 = new Uint8Array(blockSize);
		} else {
			this.#aes = new Aes(keyOrCrypt);
			[this.#k1, this.#k2] = generateSubKey(this.#aes);
		}
	}

	write(data: Uint8Array): void {
		let nToWrite = data.length;
		let dPos = 0;
		//Xor in full blocks and crypt
		while (nToWrite > blockSize) {
			for (let i = 0; i < blockSize; i++)
				this.#block[this.#bPos++] ^= data[dPos++];
			this.#aes.encryptBlock(this.#block);
			this.#bPos = 0;
			nToWrite -= blockSize;
		}
		//Xor in any remainder
		while(dPos<data.length)
			this.#block[this.#bPos++] ^= data[dPos++];
	}

	sum(): Uint8Array {
		return this.clone().sumIn();
	}

	sumIn(): Uint8Array {
		if (this.#bPos === 16) {
			//When the size is exactly a block xor k1, crypt and we're done
			uint8ArrayExt.xorEq(this.#block, this.#k1);
		} else {
			//Otherwise add the end marker, xor k2, crypt and.. we're done
			this.#block[this.#bPos++] ^= 0x80;
			uint8ArrayExt.xorEq(this.#block, this.#k2);
		}
		this.#aes.encryptBlock(this.#block);
		this.#bPos = 0;
		return this.#block;
	}

	reset(): void {
		this.#bPos = 0;
		this.#block.fill(0);
	}

	newEmpty(): IHash {
		const ret = new Cmac(this.#aes);
		ret.#k1.set(this.#k1);
		ret.#k2.set(this.#k2);
		return ret;
	}

	clone(): IHash {
		const ret = new Cmac(this.#aes);
		ret.#k1.set(this.#k1);
		ret.#k2.set(this.#k2);
		ret.#block.set(this.#block);
		ret.#bPos = this.#bPos;
		return ret;
	}
}
