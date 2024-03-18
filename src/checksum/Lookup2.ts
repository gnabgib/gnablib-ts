/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import type { IHash } from '../crypto/interfaces/IHash.js';
import { asBE, asLE } from '../endian/platform.js';

//[Wikipedia: Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function)
//["My Hash"](http://burtleburtle.net/bob/hash/doobs.html)
//[lookup2.c](http://www.burtleburtle.net/bob/c/lookup2.c) (1996)

const blockSize = 12;
const digestSize = 4;
const A = 0,
	B = 1,
	C = 2;

/**
 * NOT Cryptographic
 */
export class Lookup2 implements IHash {
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
	private readonly _state = Uint32Array.of(0x9e3779b9, 0x9e3779b9, 0);
	/**
	 * Starting seed, uint32 0-0xffffffff
	 */
	private readonly _seed: number;
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
	 * Build a new Lookup2 (non-crypto) hash generator
	 * @param seed
	 */
	constructor(seed = 0) {
		this._state[2] = seed;
		this._seed = this._state[2];
	}

	/**
	 * aka Mix
	 */
	hash(): void {
		//Make sure block is little-endian
		asLE.i32(this._block, 0, 3);
		//Add in data
		this._state[A] += this._block32[0];
		this._state[B] += this._block32[1];
		this._state[C] += this._block32[2];

		///MIX
		//a=this.#state[0], b=this.#state[1], c=this.#state[2]
		this._state[A] -= this._state[B];
		this._state[A] -= this._state[C];
		this._state[A] ^= this._state[C] >>> 13;
		this._state[B] -= this._state[C];
		this._state[B] -= this._state[A];
		this._state[B] ^= this._state[A] << 8;
		this._state[C] -= this._state[A];
		this._state[C] -= this._state[B];
		this._state[C] ^= this._state[B] >>> 13;

		this._state[A] -= this._state[B];
		this._state[A] -= this._state[C];
		this._state[A] ^= this._state[C] >>> 12;
		this._state[B] -= this._state[C];
		this._state[B] -= this._state[A];
		this._state[B] ^= this._state[A] << 16;
		this._state[C] -= this._state[A];
		this._state[C] -= this._state[B];
		this._state[C] ^= this._state[B] >>> 5;

		this._state[A] -= this._state[B];
		this._state[A] -= this._state[C];
		this._state[A] ^= this._state[C] >>> 3;
		this._state[B] -= this._state[C];
		this._state[B] -= this._state[A];
		this._state[B] ^= this._state[A] << 10;
		this._state[C] -= this._state[A];
		this._state[C] -= this._state[B];
		this._state[C] ^= this._state[B] >>> 15;

		this._bPos = 0;
	}

	write(data: Uint8Array): void {
		this._ingestBytes += data.length;
		let nToWrite = data.length;
		let dPos = 0;
		let space = blockSize - this._bPos;
		while (nToWrite > 0) {
			//Note this is >, so if there's exactly space this won't trigger
			// (ie bPos will always be some distance away from max allowing at least 1 byte write)
			if (space > nToWrite) {
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

	private static _sum(alt:Lookup2):void {
		alt._state[2] += alt._ingestBytes;
		alt._block.fill(0, alt._bPos);
		alt.hash();
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
	sumIn():Uint8Array {
		Lookup2._sum(this);
		const ret = new Uint8Array(this._state.slice(2).buffer);
		//Wiki implies big-endian (since that's how we right numbers)
		asBE.i32(ret);
		return ret;
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum32(): number {
		Lookup2._sum(this);
		return this._state[2];
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this._state[A] = 0x9e3779b9;
		this._state[B] = 0x9e3779b9;
		this._state[C] = this._seed;
		this._ingestBytes = 0;
		this._bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Lookup2(this._seed);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): Lookup2 {
		const ret = new Lookup2(this._seed);
		ret._state.set(this._state);
		ret._block.set(this._block);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}
}
