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
export class XorShift32 extends APrng32<Uint32Array> {
	readonly bitGen = 32;
	readonly safeBits = 32;

	protected trueSave() {
		const ret = new Uint8Array(this._state.slice().buffer);
		asLE.i32(ret, 0, 1);
		return ret;
	}

	rawNext(): number {
		this._state[0] ^= this._state[0] << 13;
		this._state[0] ^= this._state[0] >>> 17;
		this._state[0] ^= this._state[0] << 5;
		return this._state[0];
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
	 * Build by providing a seed.  It must not be zero.
	 * It's recommended this is the product of {@link prng.SplitMix32 | SplitMix32}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed: number, saveable = false) {
		return new XorShift32(Uint32Array.of(seed), saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(4).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 1);
		const s32 = new Uint32Array(s2.buffer);
		return new XorShift32(s32, saveable);
	}
}
