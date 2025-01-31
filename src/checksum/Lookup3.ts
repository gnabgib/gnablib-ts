/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import type { IHash } from '../crypto/interfaces/IHash.js';
import { asLE } from '../endian/platform.js';
import { AChecksum32 } from './_AChecksum.js';

//[Wikipedia: Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function)
//[lookup3.c](http://www.burtleburtle.net/bob/c/lookup3.c) (2006)

const A = 0,
	B = 1,
	C = 2;

/**
 * NOT Cryptographic
 * NOTE: This requires the length to be known at the start, so you can only call .write ONCE (after that you'll get an exception)
 */
export class Lookup3 extends AChecksum32 implements IHash {
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
	private readonly _b32 = new Uint32Array(this._b8.buffer);

	/** Build a new Lookup3 (non-crypto) hash generator */
	constructor(seed = 0, seed2 = 0) {
		super(8,12);
		this._state[A] += seed;
		this._state[B] += seed;
		this._state[C] += seed + seed2;
		this._seed = seed;
		this._seed2 = seed2;
	}

	/** aka Mix */
	protected hash() {
		//Make sure block is little-endian
		asLE.i32(this._b8, 0, 3);
		//Add in data
		this._state[A] += this._b32[0];
		this._state[B] += this._b32[1];
		this._state[C] += this._b32[2];

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
	private final() {
		//Make sure block is little-endian
		asLE.i32(this._b8, 0, 3);
		//Add in data
		this._state[A] += this._b32[0];
		this._state[B] += this._b32[1];
		this._state[C] += this._b32[2];

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
	 * Write data to the hash
	 * NOTE: This has requires length to be known at the start, so you can only call .write ONCE (after that you'll get an exception)
	 * @param data
	 */
	write(data: Uint8Array) {
		if (this._ingestBytes > 0)
			throw new Error('Can only write to this hash once');
		this._state[A] += data.length;
		this._state[B] += data.length;
		this._state[C] += data.length;
		//Lookup3 requires dropping the last hash in favour of the final
		// func in the event the input is a multiple of <blockSize>, so we push in all
		// but one character in that event (knowing there's still space for 1) and
		// append the last
		if (data.length>0 && data.length%12==0) {
			super.write(data.subarray(0,data.length-1));
			this._ingestBytes+=1;
			this._b8[this._bPos++]=data[data.length-1];
		} else super.write(data);
	}

	private _sum() {
		//We only finalize if there's >0 bits
		if (this._ingestBytes>0) {
			this.fillBlock();
			this.final();
		}
	}
	
	sumIn() {
		this._sum();
		const ret = new Uint8Array(this._state.slice(1).buffer);
		//Wiki implies big-endian (since that's how we write numbers)
		//asBE.i32(ret);
		return ret;
	}

	/** Sum the hash and generate a pair of uint32 values (aka hashlittle2) */
	sum32pair():[number,number] {
		this._sum();
		return [this._state[2],this._state[1]];
	}

	/** Sum the hash and generate a uint32 (aka hashlittle) */
	sum32(): number {
		this._sum();
		return this._state[2];
	}

	reset() {
		this._state[A] = 0xdeadbeef + this._seed;
		this._state[B] = 0xdeadbeef + this._seed;
		this._state[C] = 0xdeadbeef + this._seed + this._seed2;
		super._reset();
	}

	newEmpty() {
		return new Lookup3(this._seed, this._seed2);
	}

	clone(): Lookup3 {
		const ret = new Lookup3(this._seed, this._seed2);
		ret._state.set(this._state);
		super._clone(ret);
		return ret;
	}
}
