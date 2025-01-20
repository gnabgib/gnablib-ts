/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * XorShift with 128bit state, 32bit return as described in
 * [XorShift RNGs](https://www.jstatsoft.org/article/view/v008i14) section 4
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - {@link prng.XorShift32 | XorShift32}
 * - {@link prng.XorShift64 | XorShift64}
 */
export class XorShift128 extends APrng32<Uint32Array> {
	readonly bitGen = 32;
	readonly safeBits = 32;

	protected trueSave() {
		const ret = new Uint8Array(this._state.slice().buffer);
		asLE.i32(ret, 0, 4);
		return ret;
	}

	rawNext(): number {
		const t = this._state[0] ^ (this._state[0] << 11);
		this._state[0] = this._state[1];
		this._state[1] = this._state[2];
		this._state[2] = this._state[3];
		this._state[3] = this._state[3] ^ (this._state[3] >>> 19) ^ (t ^ (t >>> 8));
		return this._state[3] >>> 0;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xorshift128';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//This default seed comes from the paper
		return new XorShift128(
			Uint32Array.of(123456789, 362436069, 521288629, 88675123),
			saveable
		);
	}

	/**
	 * Build by providing 4 seeds.  They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix32 | SplitMix32}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(
		seed0: number,
		seed1: number,
		seed2: number,
		seed3: number,
		saveable = false
	) {
		const state = Uint32Array.of(seed0, seed1, seed2, seed3);
		return new XorShift128(state, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(16).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 4);
		const s32 = new Uint32Array(s2.buffer);
		return new XorShift128(s32, saveable);
	}
}
