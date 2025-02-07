/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { asBE, asLE } from '../endian/platform.js';
import { U32 } from '../primitive/number/U32Static.js';
import { AHashsum32 } from './_AHashsum.js';

//https://www.pelock.com/products/hash-calculator

const blockSizeEls = 4;
const p32_1 = 2654435761;
const p32_2 = 2246822519;
const p32_3 = 3266489917;
const p32_4 = 668265263;
const p32_5 = 374761393;

/**
 * XxHash32 generates a 32bit hashsum of a stream of data.  Described in
 * [xxHash](https://cyan4973.github.io/xxHash/)
 * 
 * Related:
 * - Also available as a {@link XxHash64 |64bit} checksum
 * 
 * @example
 * ```js
 * import { XxHash32 } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new XxHash32();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0xCC46C57C
 * console.log(sum.sum32()); //3427190140
 * ```
 */
export class XxHash32 extends AHashsum32 {
	/** Runtime state of the hash */
	private readonly _state = new Uint32Array(blockSizeEls);
	/** Temp processing block */
	private readonly _b32 = new Uint32Array(this._b8.buffer);
	/** Starting seed */
	private readonly _seed: number;

	constructor(seed = 0) {
		super(4, 16);
		this._seed = seed;
		this._state[0] = this._seed + p32_1 + p32_2;
		this._state[1] = this._seed + p32_2;
		this._state[2] = this._seed;
		this._state[3] = this._seed - p32_1;
	}

	protected hash() {
		asLE.i32(this._b8, 0, 4);
		this._state[0] = Math.imul(
			U32.lRot(this._state[0] + Math.imul(this._b32[0], p32_2), 13),
			p32_1
		);
		this._state[1] = Math.imul(
			U32.lRot(this._state[1] + Math.imul(this._b32[1], p32_2), 13),
			p32_1
		);
		this._state[2] = Math.imul(
			U32.lRot(this._state[2] + Math.imul(this._b32[2], p32_2), 13),
			p32_1
		);
		this._state[3] = Math.imul(
			U32.lRot(this._state[3] + Math.imul(this._b32[3], p32_2), 13),
			p32_1
		);

		this._bPos = 0;
	}

	clone() {
		const ret = new XxHash32(this._seed);
		ret._state.set(this._state);
		ret._b32.set(this._b32);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}

	_sum(): number {
		//This just compiles a result /except/ the call to asLE.i32
		let result = this._ingestBytes;
		if (this._ingestBytes >= this._b8.length) {
			result +=
				U32.lRot(this._state[0], 1) +
				U32.lRot(this._state[1], 7) +
				U32.lRot(this._state[2], 12) +
				U32.lRot(this._state[3], 18);
		} else {
			result += this._seed + p32_5;
		}
		let nToAdd = this._bPos;
		//i is el-pos
		let i = 0;
		for (; nToAdd >= 4; i++) {
			asLE.i32(this._b8, i * 4);
			result = Math.imul(
				U32.lRot(result + Math.imul(this._b32[i], p32_3), 17),
				p32_4
			);
			nToAdd -= 4;
		}
		//Switch i to byte-pos
		i *= 4;
		for (; i < this._bPos; i++) {
			result = Math.imul(U32.lRot(result + this._b8[i] * p32_5, 11), p32_1);
		}
		result ^= result >>> 15;
		result = Math.imul(result, p32_2);
		result ^= result >>> 13;
		result = Math.imul(result, p32_3);
		result ^= result >>> 16;
		return result;
	}

	sumIn(): Uint8Array {
		const r32 = Uint32Array.of(this._sum());
		//Copy the first element and convert to bytes
		const r8 = new Uint8Array(r32.slice(0, 1).buffer);
		asBE.i32(r8);
		return r8;
	}

	/** Sum the hash and generate a uint32 (does not mutate state) */
	sum32(): number {
		return this.clone()._sum() >>> 0;
	}
}

