/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * XorShift with 128bit state, 32bit return as described in
 * [XorShift RNGs](https://www.jstatsoft.org/article/view/v008i14) section 4
 *
 * *NOT cryptographically secure*
 */
export class XorShift128 extends APrng32 {
	protected readonly _state: Uint32Array;
	readonly saveable: boolean;
	readonly bitGen = 32;

	protected constructor(state: Uint32Array, saveable: boolean) {
		super();
		this._state = state;
		this.saveable = saveable;
	}

	rawNext(): number {
		const t = this._state[0] ^ (this._state[0] << 11);
		this._state[0] = this._state[1];
		this._state[1] = this._state[2];
		this._state[2] = this._state[3];
		this._state[3] = this._state[3] ^ (this._state[3] >>> 19) ^ (t ^ (t >>> 8));
		return this._state[3] >>> 0;
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
		const ret = new Uint8Array(exp.buffer);
		asLE.i32(ret, 0, 4);
		return ret;
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
	 * Build by providing 4 seeds, each treated as uint32. They must not be all zero.  It's recommended
	 * this is the product of {@link prng.SplitMix32 SplitMix32}
	 * @param seed0 Only the lower 32bits will be used
	 * @param seed1 Only the lower 32bits will be used
	 * @param seed2 Only the lower 32bits will be used
	 * @param seed3 Only the lower 32bits will be used
	 * @param saveable Whether the generator's state can be saved
	 * @returns
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
	 * Restore from state extracted via XorShift128.save().
	 * Will throw if state is incorrect length
	 * @param state Saved state, must be exactly 16 bytes long
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(16).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 4);
		const s32 = new Uint32Array(s2.buffer);
		return new XorShift128(s32, saveable);
	}
}
