/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { U64, U64Mut } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { APrng64 } from './APrng64.js';

// floor( ( (1+sqrt(5))/2 ) * 2**64 MOD 2**64)
const golden_gamma = U64.fromI32s(0x7f4a7c15, 0x9e3779b9);
const bMul = U64.fromI32s(0x1ce4e5b9, 0xbf58476d);
const cMul = U64.fromI32s(0x133111eb, 0x94d049bb);

/**
 * SplitMix64 as described in paper
 * [Fast splittable pseudorandom number generators](https://doi.org/10.1145/2660193.2660195)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - {@link prng.SplitMix32 | SplitMix32}
 */
export class SplitMix64 extends APrng64<U64Mut> {
	readonly bitGen = 64;
	readonly safeBits = 64;

	rawNext(): U64 {
		const z = this._state.addEq(golden_gamma).mut();
		z.xorEq(z.rShift(30)).mulEq(bMul);
		z.xorEq(z.rShift(27)).mulEq(cMul);
		return z.xorEq(z.rShift(31));
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'splitmix64';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		return new SplitMix64(U64Mut.fromI32s(0, 0), saveable);
	}

	/**
	 * Build by providing a seed.
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed: U64, saveable = false) {
		return new SplitMix64(seed.mut(), saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(8).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 2);
		const s32 = new Uint32Array(s2.buffer);
		return new SplitMix64(U64Mut.mount(s32), saveable);
	}
}
