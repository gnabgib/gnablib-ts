/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import type { IHash } from '../crypto/interfaces/IHash.js';
import { U32 } from '../primitive/number/U32Static.js';
import { asBE, asLE } from '../endian/platform.js';
import { AChecksum32 } from './_AChecksum.js';

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
export class Murmur3_32 extends AChecksum32 implements IHash {
	/** Runtime state of the hash */
	private _state: number;
	/** Starting seed */
	private readonly _seed: number;
	/**
	 * Temp processing block
	 */
	private readonly _b32 = new Uint32Array(this._b8.buffer);

	/**
	 * Build a new Murmur3 32bit (non-crypto) hash generator
	 */
	constructor(seed = 0) {
		super(4,4);
		this._seed = seed;
		this._state = seed;
	}

	protected hash() {
		//#block=k1, #state=h1
		asLE.i32(this._b8);
		this._state ^= Math.imul(U32.lRot(Math.imul(this._b32[0], c1), r1), c2);
		this._state = Math.imul(U32.lRot(this._state, r2), m) + n;

		this._bPos = 0;
	}

	private static _sum(alt: Murmur3_32) {
		if (alt._bPos > 0) {
			alt.fillBlock();
			asLE.i32(alt._b8);
			alt._state ^= Math.imul(U32.lRot(Math.imul(alt._b32[0], c1), r1), c2);
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
	reset() {
		this._state = this._seed;
		super._reset();
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty() {
		return new Murmur3_32(this._seed);
	}

	/** Create a copy of the current context (uses different memory) */
	clone(): Murmur3_32 {
		const ret = new Murmur3_32(this._seed);
		ret._state = this._state;
		super._clone(ret);
		return ret;
	}
}
