/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { U64, U64Mut } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { APrng64 } from './APrng64.js';

export class XorShift64 extends APrng64<U64Mut> {
	readonly bitGen = 64;
	readonly safeBits = 64;

	rawNext(): U64 {
		this._state.xorEq(this._state.lShift(13));
		this._state.xorEq(this._state.rShift(7));
		this._state.xorEq(this._state.lShift(17));
		return this._state.clone();
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'xorshift64';
	}

	/** Build using a reasonable default seed and increment */
	static new(saveable = false) {
		const state = U64Mut.fromUint32Pair(0xcbbf7a44, 0x139408d);
		return new XorShift64(state, saveable);
	}

	/**
	 * Build by providing a seed.  It must not be zero.
	 * It's recommended this is the product of {@link prng.SplitMix64 | SplitMix64}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed: U64, saveable = false) {
		return new XorShift64(seed.mut(), saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(8).throwNot();
		return new XorShift64(U64Mut.fromBytesLE(state), saveable);
	}
}
