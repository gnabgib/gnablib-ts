/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import type { IHash } from '../crypto/interfaces/IHash.js';
import { asBE, asLE } from '../endian/platform.js';
import { AChecksum32 } from './_AChecksum.js';

//[Wikipedia: Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function)
//["My Hash"](http://burtleburtle.net/bob/hash/doobs.html)
//[lookup2.c](http://www.burtleburtle.net/bob/c/lookup2.c) (1996)

const A = 0,
	B = 1,
	C = 2;

/**
 * NOT Cryptographic
 */
export class Lookup2 extends AChecksum32 implements IHash {
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
	private readonly _block32 = new Uint32Array(this._b8.buffer);

	/**
	 * Build a new Lookup2 (non-crypto) hash generator
	 * @param seed
	 */
	constructor(seed = 0) {
		super(4,12);
		this._state[2] = seed;
		this._seed = this._state[2];
	}

	/**
	 * aka Mix
	 */
	protected hash() {
		//Make sure block is little-endian
		asLE.i32(this._b8, 0, 3);
		//Add in data
		this._state[A] += this._block32[0];
		this._state[B] += this._block32[1];
		this._state[C] += this._block32[2];

		///MIX
		//a=this.#state[0], b=this.#state[1], c=this.#state[2]
		this._state[A] -= this._state[B] + this._state[C];
		this._state[A] ^= this._state[C] >>> 13;
		this._state[B] -= this._state[C] + this._state[A];
		this._state[B] ^= this._state[A] << 8;
		this._state[C] -= this._state[A] + this._state[B];
		this._state[C] ^= this._state[B] >>> 13;

		this._state[A] -= this._state[B] + this._state[C];
		this._state[A] ^= this._state[C] >>> 12;
		this._state[B] -= this._state[C] + this._state[A];
		this._state[B] ^= this._state[A] << 16;
		this._state[C] -= this._state[A] + this._state[B];
		this._state[C] ^= this._state[B] >>> 5;

		this._state[A] -= this._state[B] + this._state[C];
		this._state[A] ^= this._state[C] >>> 3;
		this._state[B] -= this._state[C] + this._state[A];
		this._state[B] ^= this._state[A] << 10;
		this._state[C] -= this._state[A] + this._state[B];
		this._state[C] ^= this._state[B] >>> 15;

		this._bPos = 0;
	}
	
	private static _sum(alt:Lookup2):void {
		alt._state[2] += alt._ingestBytes;
		alt.fillBlock();
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
		//Wiki implies big-endian (since that's how we write numbers)
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
	reset() {
		this._state[A] = 0x9e3779b9;
		this._state[B] = 0x9e3779b9;
		this._state[C] = this._seed;
		super._reset();
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty() {
		return new Lookup2(this._seed);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): Lookup2 {
		const ret = new Lookup2(this._seed);
		ret._state.set(this._state);
		super._clone(ret);
		return ret;
	}
}
