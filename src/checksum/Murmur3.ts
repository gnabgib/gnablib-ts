/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import type { IHash } from '../crypto/interfaces/IHash.js';
import { U32 } from '../primitive/number/U32.js';
import { asBE, asLE } from '../endian/platform.js';

const blockSize = 4;
const stateSize = 4;
const c1 = 0xcc9e2d51;
const c2 = 0x1b873593;
const c3 = 0x85ebca6b;
const c4 = 0xc2b2ae35;
const r1 = 15;
const r2 = 13;
const m = 5;
const n = 0xe6546b64;

/**
 * NOT Cryptographic
 */
export class Murmur3_32 implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size = stateSize;
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSize;
	/**
	 * Runtime state of the hash
	 */
	private _state: number;
	/**
	 * Starting seed
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
	 * Build a new Murmur3 32bit (non-crypto) hash generator
	 */
	constructor(seed = 0) {
		this._seed = seed;
		this._state = seed;
	}

	hash(): void {
		//#block=k1, #state=h1
		asLE.i32(this._block);
		this._state ^= Math.imul(U32.rol(Math.imul(this._block32[0], c1), r1), c2);
		this._state = Math.imul(U32.rol(this._state, r2), m) + n;

		this._bPos = 0;
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		//It would be more accurately to update these on each cycle (below) but since we cannot
		// fail.. or if we do, we cannot recover, it seems ok to do it all at once
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
			this._block.set(data.subarray(dPos, dPos + stateSize), this._bPos);
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = stateSize;
		}
	}

	private static _sum(alt: Murmur3_32) {
		if (alt._bPos > 0) {
			alt._block.fill(0, alt._bPos);
			asLE.i32(alt._block);
			alt._state ^= Math.imul(U32.rol(Math.imul(alt._block32[0], c1), r1), c2);
		}

		alt._state ^= alt._ingestBytes;

		//fmix
		alt._state ^= alt._state >>> 16;
		alt._state = Math.imul(alt._state, c3);
		alt._state ^= alt._state >>> 13;
		alt._state = Math.imul(alt._state, c4);
		alt._state ^= alt._state >>> 16;
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
		Murmur3_32._sum(this);
		const r32 = Uint32Array.of(this._state);
		const r8 = new Uint8Array(r32.buffer);
		asBE.i32(r8);
		return r8;
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum32(): number {
		const alt = this.clone();
		Murmur3_32._sum(alt);
		return alt._state >>> 0;
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this._state = this._seed;
		//Reset ingest count
		this._ingestBytes = 0;
		//Reset block (which is just pointing to the start)
		this._bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Murmur3_32(this._seed);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): Murmur3_32 {
		const ret = new Murmur3_32(this._seed);
		ret._state = this._state;
		ret._block.set(this._block);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}
}
