/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { AHashsum32 } from './_AHashsum.js';

const A = 0,
	B = 1,
	C = 2;

/**
 * [Lookup3](https://en.wikipedia.org/wiki/Jenkins_hash_function#lookup3)
 * generates 2*32bit (or optionally a 32bit) hashsum of a stream of data.
 *
 * Note: This requires the length to be known at the start, so you can only call .write ONCE (after that you'll get an exception)
 *
 * Related:
 * - [lookup3.c](http://www.burtleburtle.net/bob/c/lookup3.c) (2006)
 * - ⚠ Use {@link Spooky} instead of this
 * 
 * @example
 * ```js
 * import { Lookup3 } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Lookup3();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0x64A33A3E3555C495
 * console.log(sum.sum32());// 2512672053
 * console.log(sum.sum32pair());// [2512672053,1044030308]
 * ```
 */
export class Lookup3 extends AHashsum32 {
	/** Runtime state of the hash */
	private readonly _state = Uint32Array.of(0xdeadbeef, 0xdeadbeef, 0xdeadbeef);
	/** Starting seed, uint32 0-0xffffffff */
	private readonly _seed: number;
	/** Starting seed2, uint32 0-0xffffffff */
	private readonly _seed2: number;
	/** Temp processing block */
	private readonly _b32 = new Uint32Array(this._b8.buffer);

	constructor(seed = 0, seed2 = 0) {
		super(8, 12);
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
		if (data.length > 0 && data.length % 12 == 0) {
			super.write(data.subarray(0, data.length - 1));
			this._ingestBytes += 1;
			this._b8[this._bPos++] = data[data.length - 1];
		} else super.write(data);
	}

	clone() {
		const ret = new Lookup3(this._seed, this._seed2);
		ret._state.set(this._state);
		ret._b32.set(this._b32);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}

	sumIn(): Uint8Array {
		//We only finalize if there's >0 bits
		if (this._ingestBytes > 0) {
			this._b8.fill(0, this._bPos);
			this.final();
		}

		const ret = new Uint8Array(this._state.slice(1).buffer);
		//Wiki implies big-endian (since that's how we write numbers)
		//asBE.i32(ret);
		return ret;
	}

	/** Sum the hash and generate a pair of uint32 values (aka hashlittle2) */
	sum32pair(): [number, number] {
		this.sumIn();
		return [this._state[2], this._state[1]];
	}

	/** Sum the hash and generate a uint32 (aka hashlittle) */
	sum32(): number {
		this.sumIn();
		return this._state[2];
	}
}
