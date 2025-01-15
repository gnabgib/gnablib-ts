/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * XorShift with 32bit state, 32bit return as described in
 * [XorShift RNGs](https://www.jstatsoft.org/article/view/v008i14) section 3
 *
 * *NOT cryptographically secure*
 *
 * @param seed Must be non-zero
 * @returns Generator of uint32 [0 - 4294967295]
 */
export class XorShift32 extends APrng32 {
	protected readonly _state: Uint32Array;
	readonly saveable: boolean;
	readonly bitGen = 32;

	protected constructor(state: Uint32Array, saveable: boolean) {
		super();
		this._state = state;
		this.saveable = saveable;
	}

	rawNext(): number {
		this._state[0] ^= this._state[0] << 13;
		this._state[0] ^= this._state[0] >>> 17;
		this._state[0] ^= this._state[0] << 5;
		return this._state[0];
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
		asLE.i32(ret, 0, 1);
		return ret;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xorshift32';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//This default seed comes from the paper
		return new XorShift32(Uint32Array.of(2463534242), saveable);
	}

	/**
	 * Build by providing a seed
	 *
	 * @param seed Must be non-zero
	 * @param saveable Whether the generator's state can be saved
	 * @returns
	 */
	static seed(seed: number, saveable = false) {
		return new XorShift32(Uint32Array.of(seed), saveable);
	}

	/**
	 * Restore from state extracted via XorShift32.save().
	 * Will throw if state is incorrect length
	 * @param state Saved state, must be exactly 4 bytes long
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(4).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 1);
		const s32 = new Uint32Array(s2.buffer);
		return new XorShift32(s32, saveable);
	}
}
