/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { U32 } from '../primitive/number/U32Static.js';
import { asBE, asLE } from '../endian/platform.js';
import { AHashsum32 } from './_AHashsum.js';

const c1 = 0xcc9e2d51;
const c2 = 0x1b873593;
const c3 = 0x85ebca6b;
const c4 = 0xc2b2ae35;
const r1 = 15;
const r2 = 13;
const m = 5;
const n = 0xe6546b64;

/**
 * [MurmurHash3](https://en.wikipedia.org/wiki/MurmurHash#MurmurHash3)
 * generates a 32bit hashsum of a stream of data.
 *
 * @example
 * ```js
 * import { Murmur3_32 } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Murmur3_32();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0x638F4169
 * console.log(sum.sum32());// 1670332777
 * ```
 */
export class Murmur3_32 extends AHashsum32 {
	/** Runtime state of the hash */
	private _state: number;
	/** Starting seed */
	private readonly _seed: number;
	/** Temp processing block */
	private readonly _b32 = new Uint32Array(this._b8.buffer);

	constructor(seed = 0) {
		super(4, 4);
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

	clone() {
		const ret = new Murmur3_32(this._seed);
		ret._state = this._state;
		ret._b32.set(this._b32);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}

	sumIn() {
		if (this._bPos > 0) {
			this._b8.fill(0, this._bPos);
			asLE.i32(this._b8);
			this._state ^= Math.imul(U32.lRot(Math.imul(this._b32[0], c1), r1), c2);
		}

		this._state ^= this._ingestBytes;

		//fmix
		this._state ^= this._state >>> 16;
		this._state = Math.imul(this._state, c3);
		this._state ^= this._state >>> 13;
		this._state = Math.imul(this._state, c4);
		this._state ^= this._state >>> 16;

		const r32 = Uint32Array.of(this._state);
		const r8 = new Uint8Array(r32.buffer);
		asBE.i32(r8);
		return r8;
	}

	/** Sum the hashsum with the all content written so far (does not mutate state) */
	sum32(): number {
		const c = this.clone();
		c.sumIn();
		return c._state >>> 0;
	}
}
