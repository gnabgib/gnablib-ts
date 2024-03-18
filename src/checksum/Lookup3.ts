/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import type { IHash } from '../crypto/interfaces/IHash.js';
import { asLE } from '../endian/platform.js';

//[Wikipedia: Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function)
//[lookup3.c](http://www.burtleburtle.net/bob/c/lookup3.c) (2006)

const blockSize = 12;
const digestSize = 4;
const A = 0,
	B = 1,
	C = 2;

/**
 * NOT Cryptographic
 * NOTE: This has requires length to be known at the start, so you can only call .write ONCE (after that you'll get an exception)
 */
export class Lookup3 implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size = digestSize;
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSize;
	/**
	 * Runtime state of the hash
	 */
	private readonly _state = Uint32Array.of(0xdeadbeef, 0xdeadbeef, 0xdeadbeef);
	/**
	 * Starting seed, uint32 0-0xffffffff
	 */
	private readonly _seed: number;
	private readonly _seed2: number;
	/**
	 * Temp processing block
	 */
	private readonly _block = new Uint8Array(blockSize);
	private readonly _block32 = new Uint32Array(this._block.buffer);
	/**
	 * Number of bytes added to the hash
	 */
	private _ingestBytes = 0;
	/**
	 * Position of data written to block
	 */
	private _bPos = 0;

	/**
	 * Build a new Lookup3 (non-crypto) hash generator
	 * @param seed
	 */
	constructor(seed = 0, seed2 = 0) {
		this._state[A] += seed;
		this._state[B] += seed;
		this._state[C] += seed + seed2;
		this._seed = seed;
		this._seed2 = seed2;
	}

	/**
	 * aka Mix
	 */
	private hash(): void {
		//Make sure block is little-endian
		asLE.i32(this._block, 0, 3);
		//Add in data
		this._state[A] += this._block32[0];
		this._state[B] += this._block32[1];
		this._state[C] += this._block32[2];

		///MIX
		//a=this.#state[0], b=this.#state[1], c=this.#state[2]
		this._state[A] -= this._state[C];
		this._state[A] ^= (this._state[C] << 4) | (this._state[C] >>> 28);
		this._state[C] += this._state[B];
		this._state[B] -= this._state[A];
		this._state[B] ^= (this._state[A] << 6) | (this._state[A] >>> 26);
		this._state[A] += this._state[C];
		this._state[C] -= this._state[B];
		this._state[C] ^= (this._state[B] << 8) | (this._state[B] >>> 24);
		this._state[B] += this._state[A];

		this._state[A] -= this._state[C];
		this._state[A] ^= (this._state[C] << 16) | (this._state[C] >>> 16);
		this._state[C] += this._state[B];
		this._state[B] -= this._state[A];
		this._state[B] ^= (this._state[A] << 19) | (this._state[A] >>> 13);
		this._state[A] += this._state[C];
		this._state[C] -= this._state[B];
		this._state[C] ^= (this._state[B] << 4) | (this._state[B] >>> 28);
		this._state[B] += this._state[A];

		this._bPos = 0;
	}
	private final(): void {
		//Make sure block is little-endian
		asLE.i32(this._block, 0, 3);
		//Add in data
		this._state[A] += this._block32[0];
		this._state[B] += this._block32[1];
		this._state[C] += this._block32[2];

		this._state[C] ^= this._state[B];
		this._state[C] -= (this._state[B] << 14) | (this._state[B] >>> 18);
		this._state[A] ^= this._state[C];
		this._state[A] -= (this._state[C] << 11) | (this._state[C] >>> 21);
		this._state[B] ^= this._state[A];
		this._state[B] -= (this._state[A] << 25) | (this._state[A] >>> 7);

		this._state[C] ^= this._state[B];
		this._state[C] -= (this._state[B] << 16) | (this._state[B] >>> 16);
		this._state[A] ^= this._state[C];
		this._state[A] -= (this._state[C] << 4) | (this._state[C] >>> 28);
		this._state[B] ^= this._state[A];
		this._state[B] -= (this._state[A] << 14) | (this._state[A] >>> 18);

		this._state[C] ^= this._state[B];
		this._state[C] -= (this._state[B] << 24) | (this._state[B] >>> 8);
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * NOTE: This has requires length to be known at the start, so you can only call .write ONCE (after that you'll get an exception)
	 * @param data
	 */
	write(data: Uint8Array): void {
		if (this._ingestBytes > 0)
			throw new Error('Can only write to this hash once');
		this._ingestBytes += data.length;
		this._state[0] += data.length;
		this._state[1] += data.length;
		this._state[2] += data.length;

		let nToWrite = data.length;
		let dPos = 0;
		let space = blockSize - this._bPos;
		while (nToWrite > 0) {
			//We want >= BECAUSE we only to interim hashes if there's more than one block of data
			if (space >= nToWrite) {
				//More space than data, copy in verbatim
				this._block.set(data.subarray(dPos), this._bPos);
				//Update pos
				this._bPos += nToWrite;
				return;
			}
			this._block.set(data.subarray(dPos, dPos + blockSize), this._bPos);
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = blockSize;
		}
	}

	private static _sum(alt: Lookup3): void {
		//We only finalize if there's >0 bits
		if (alt._bPos > 0 || alt._ingestBytes === 12) {
			alt._block.fill(0, alt._bPos);
			alt.final();
		}
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum(): Uint8Array {
		return this.clone().sumIn();
	}
	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 */
	sumIn(): Uint8Array {
		Lookup3._sum(this);
		const ret = new Uint8Array(this._state.slice(1).buffer);
		//Wiki implies big-endian (since that's how we right numbers)
		//asBE.i32(ret);
		return ret;
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum32(): [number, number] {
		Lookup3._sum(this);
		const s8 = new Uint8Array(this._state.buffer);
		asLE.i32(s8, 0, 3);
		const ret = new Uint32Array(s8.buffer);
		return [ret[1], ret[2]];
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this._state[A] = 0xdeadbeef + this._seed;
		this._state[B] = 0xdeadbeef + this._seed;
		this._state[C] = 0xdeadbeef + this._seed + this._seed2;
		this._ingestBytes = 0;
		this._bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Lookup3(this._seed, this._seed2);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): Lookup3 {
		const ret = new Lookup3(this._seed, this._seed2);
		ret._state.set(this._state);
		ret._block.set(this._block);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}
}
