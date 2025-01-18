/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * [Mersenne Twister](https://en.wikipedia.org/wiki/Mersenne_Twister)
 * defined in
 * [doi 10.1145/272991.272995 (1998)](https://dl.acm.org/doi/10.1145/272991.272995)
 * with
 * [2002](http://www.math.sci.hiroshima-u.ac.jp/m-mat/MT/MT2002/CODES/readme-mt.txt)
 * updates.
 *
 * *NOT cryptographically secure*
 *
 * Related links:
 * - [It is high time we let go of the Mersenne Twister](https://arxiv.org/abs/1910.06437)
 */
export class Mt19937 extends APrng32 {
	protected readonly _state: Uint32Array;
	private _ptr = 0;
	readonly saveable: boolean;
	readonly bitGen = 32;

	protected constructor(state: Uint32Array, saveable: boolean) {
		super();
		this._state = state;
		this.saveable = saveable;
	}

	private twist() {
		const a = 0x9908b0df;
		let i = 0;
		let y;
		for (; i < 227; i++) {
			y = (this._state[i] & 0x80000000) | (this._state[i + 1] & 0x7fffffff);
			this._state[i] = this._state[i + 397] ^ (y >>> 1);
			if (y & 1) this._state[i] ^= a;
		}
		for (; i < 623; i++) {
			y = (this._state[i] & 0x80000000) | (this._state[i + 1] & 0x7fffffff);
			this._state[i] = this._state[i - 227] ^ (y >>> 1);
			if (y & 1) this._state[i] ^= a;
		}
		y = (this._state[i] & 0x80000000) | (this._state[0] & 0x7fffffff);
		this._state[i] = this._state[396] ^ (y >>> 1);
		if (y & 1) this._state[i] ^= a;
		this._ptr = 0;
	}

	private init() {
		for (let i = 1; i < this._state.length; i++) {
			const l = this._state[i - 1] ^ (this._state[i - 1] >>> 30);
			this._state[i] = Math.imul(0x6c078965, l) + i;
		}
		this.twist();
	}

	rawNext(): number {
		if (this._ptr >= 624) this.twist();
		let y = this._state[this._ptr++];
		y ^= y >>> 11; //TEMPERING_SHIFT_U
		y ^= (y << 7) & 0x9d2c5680; //TEMPERING_SHIFT_S & B
		y ^= (y << 15) & 0xefc60000; //TEMPERING_SHIFT_T & C
		y ^= y >>> 18; //TEMPERING_SHIFT_L
		return y >>> 0;
	}

	/**
	 * Export a copy of the internal state as a byte array (can be used with restore methods).
	 * Note the generator must have been built with `saveable=true` (default false)
	 * for this to work, an empty array is returned when the generator isn't saveable.
	 * @returns
	 */
	save(): Uint8Array {
		if (!this.saveable) return new Uint8Array(0);
		const exp = this._state.slice();
		const e8 = new Uint8Array(exp.buffer);
		asLE.i32(e8, 0, 624);
		const ret = new Uint8Array(2498);
		ret.set(e8);
		ret[2496] = this._ptr;
		ret[2497] = this._ptr >>> 8;
		return ret;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'mt19937';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		const ret = new Mt19937(new Uint32Array(624), saveable);
		//This default seed comes from the paper
		ret._state[0] = 19650218;
		ret.init();
		return ret;
	}

	/**
	 * Build by providing a seed.
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed: number, saveable = false) {
		const ret = new Mt19937(new Uint32Array(624), saveable);
		ret._state[0] = seed;
		ret.init();
		return ret;
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(2498).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 624);
		const s32 = new Uint32Array(s2.buffer, 0, 624);
		const ret = new Mt19937(s32, saveable);
		ret._ptr = s2[2496] | (s2[2497] << 8);
		return ret;
	}
}
