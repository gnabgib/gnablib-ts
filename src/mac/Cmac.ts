/*! Copyright 2023 the gnablib contributors MPL-2.0 */

import { Aes } from '../crypt/sym/Aes.js';
import type { IHash } from '../hash/IHash.js';
import { uint8ArrayExt } from '../primitive/UInt8ArrayExt.js';

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
	/** Runtime AES(k) from last block */
	readonly #state = new Uint8Array(blockSize);

	constructor(keyOrCrypt: Uint8Array | Aes) {
		if (keyOrCrypt instanceof Aes) {
			this.#aes = keyOrCrypt;
		} else {
			this.#aes = new Aes(keyOrCrypt);
		}
		[this.#k1, this.#k2] = generateSubKey(this.#aes);
	}

	private crypt(): void {
		uint8ArrayExt.xorEq(this.#block, this.#state);
		this.#aes.encryptBlock(this.#block);
		this.#state.set(this.#block);
		this.#bPos = 0;
	}

	write(data: Uint8Array): void {
		let nToWrite = data.length;
		let dPos = 0;
		let space = this.blockSize - this.#bPos;
		while (nToWrite > 0) {
			if (space >= nToWrite) {
				//More space than data, copy in verbatim
				this.#block.set(data.subarray(dPos), this.#bPos);
				//Update pos
				this.#bPos += nToWrite;
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + this.blockSize), this.#bPos);
			this.#bPos += space;
			this.crypt();
			dPos += space;
			nToWrite -= space;
			space = this.blockSize;
		}
	}

	sum(): Uint8Array {
		return this.clone().sumIn();
	}

	sumIn(): Uint8Array {
		if (this.#bPos === 16) {
			//When the size is exactly a block xor k1, crypt and we're done
			uint8ArrayExt.xorEq(this.#block, this.#k1);
		} else {
			//Otherwise xor k2, crypt and.. we're done
			this.#block[this.#bPos++] = 0x80;
			this.#block.fill(0, this.#bPos);
			uint8ArrayExt.xorEq(this.#block, this.#k2);
		}
		this.crypt();
		return this.#state;
	}

	reset(): void {
		this.#bPos = 0;
		this.#state.fill(0);
	}

	newEmpty(): IHash {
		return new Cmac(this.#aes);
	}

	clone(): IHash {
		const ret = new Cmac(this.#aes);
		ret.#block.set(this.#block);
		ret.#bPos = this.#bPos;
		ret.#state.set(this.#state);
		return ret;
	}
}
