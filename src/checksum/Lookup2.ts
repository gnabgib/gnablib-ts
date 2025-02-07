/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { asBE, asLE } from '../endian/platform.js';
import { AHashsum32 } from './_AHashsum.js';

const A = 0,
	B = 1,
	C = 2;

/**
 * [Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function#lookup2)
 * generates a 32bit hashsum of a stream of data.  Described in
 * ["My hash"](http://burtleburtle.net/bob/hash/doobs.html)
 *
 * Related:
 * - [lookup2.c](http://www.burtleburtle.net/bob/c/lookup2.c) (1996)
 * - ⚠ Use {@link Spooky} instead of this
 * 
 * @example
 * ```js
 * import { Lookup2 } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Lookup2();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0x4687CE02
 * console.log(sum.sum32());// 1183305218
 * ```
 */
export class Lookup2 extends AHashsum32 {
	/** Runtime state of the hash */
	private readonly _state = Uint32Array.of(0x9e3779b9, 0x9e3779b9, 0);
	/** Starting seed, uint32 `[0 - 0xffffffff]` */
	private readonly _seed: number;
	/** Temp processing block */
	private readonly _b32 = new Uint32Array(this._b8.buffer);

	constructor(seed = 0) {
		super(4, 12);
		this._state[2] = seed;
		this._seed = this._state[2];
	}

	protected hash(): void {
		//Make sure block is little-endian
		asLE.i32(this._b8, 0, 3);
		//Add in data
		this._state[A] += this._b32[0];
		this._state[B] += this._b32[1];
		this._state[C] += this._b32[2];

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

	clone() {
		const ret = new Lookup2(this._seed);
		ret._state.set(this._state);
		ret._b32.set(this._b32);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}

	sumIn(): Uint8Array {
		this._state[2] += this._ingestBytes;
		this._b8.fill(0, this._bPos);
		this.hash();

		const ret = new Uint8Array(this._state.slice(2).buffer);
		//Wiki implies big-endian (since that's how we write numbers)
		asBE.i32(ret);
		return ret;
	}

	/** Sum the hashsum with the all content written so far (does not mutate state) */
	sum32(): number {
		const c = this.clone();
		c.sumIn();
		return c._state[2];
	}
}
