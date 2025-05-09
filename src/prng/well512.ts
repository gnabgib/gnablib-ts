/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * [Well equidistributed long-period linear (WELL)](https://en.wikipedia.org/wiki/Well_equidistributed_long-period_linear)
 * random generator using 512bit state, 32bit return as described in
 * [Improved Long-Period Generators Based on Linear Recurrences Modulo 2](http://www.iro.umontreal.ca/~lecuyer/myftp/papers/wellrng.pdf)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [Random Number Generation](http://lomont.org/papers/2008/Lomont_PRNG_2008.pdf)] Section: *WELL Algorithm*
 * - [well512.c](https://github.com/Bill-Gray/prngs/blob/master/well512.c)
 */
export class Well512 extends APrng32<Uint32Array> {
	private _ptr = 0;
	readonly bitGen = 32;
	readonly safeBits = 32;

	protected trueSave() {
		const ret = new Uint8Array(65);
		//Create a byte projection into state
		const s8 = new Uint8Array(this._state.buffer);
		//Copy state by bytes into save
		ret.set(s8);
		asLE.i32(ret, 0, 16);
		//Put the ptr in the last byte
		ret[64] = this._ptr;
		return ret;
	}

	rawNext(): number {
		let a = this._state[this._ptr];
		let c = this._state[(this._ptr + 13) & 0xf];
		const b = a ^ (a << 16) ^ c ^ (c << 15);
		c = this._state[(this._ptr + 9) & 15];
		c ^= c >>> 11;
		a = this._state[this._ptr] = b ^ c;
		const d = a ^ ((a << 5) & 0xda442d24);
		this._ptr = (this._ptr + 15) & 15;
		a = this._state[this._ptr];
		this._state[this._ptr] = a ^ b ^ d ^ (a << 2) ^ (b << 18) ^ (c << 28);
		return this._state[this._ptr];
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'well512';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//This default state comes from the C source code versions
		return new Well512(
			// prettier-ignore
			Uint32Array.of(
						3141592653, 589793238, 462643383, 2795028841,
						971693993, 751058209, 749445923, 781640628,
						620899862, 803482534, 2117067982, 1480865132,
						823066470, 938446095, 505822317, 2535940812
					),
			saveable
		);
	}

	/**
	 * Build by providing 16 seeds.  They must not be all zero.
	 * It's recommended these are the product of {@link prng.SplitMix32 | SplitMix32}
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(
		seed0: number,
		seed1: number,
		seed2: number,
		seed3: number,
		seed4: number,
		seed5: number,
		seed6: number,
		seed7: number,
		seed8: number,
		seed9: number,
		seed10: number,
		seed11: number,
		seed12: number,
		seed13: number,
		seed14: number,
		seed15: number,
		saveable = false
	) {
		return new Well512(
			Uint32Array.of(
				seed0,
				seed1,
				seed2,
				seed3,
				seed4,
				seed5,
				seed6,
				seed7,
				seed8,
				seed9,
				seed10,
				seed11,
				seed12,
				seed13,
				seed14,
				seed15
			),
			saveable
		);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(65).throwNot();
		const s2 = state.slice(0, 64);
		asLE.i32(s2, 0, 16);
		const s32 = new Uint32Array(s2.buffer);
		const ret = new Well512(s32, saveable);
		ret._ptr = state[64];
		return ret;
	}
}
