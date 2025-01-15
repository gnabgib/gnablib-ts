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
export class Well512 extends APrng32 {
	protected readonly _state: Uint32Array;
	private _ptr = 0;
	readonly saveable: boolean;
	readonly bitGen = 32;

	protected constructor(state: Uint32Array, saveable: boolean) {
		super();
		this._state = state;
		this.saveable = saveable;
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

	/**
	 * Export a copy of the internal state as a byte array (can be used with restore methods).
	 * Note the generator must have been built with `saveable=true` (default false)
	 * for this to work, an empty array is returned when the generator isn't saveable.
	 * @returns
	 */
	save(): Uint8Array {
		if (!this.saveable) return new Uint8Array(0);
		const ret = new Uint8Array(4 * 16 + 1);
		//Create a byte projection into state
		const s8 = new Uint8Array(this._state.buffer);
		//Copy state by bytes into save
		ret.set(s8);
		asLE.i32(ret, 0, 16);
		//Put the ptr in the last byte
		ret[64] = this._ptr;
		return ret;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'well512';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//This default state comes from teh C source code versions
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
	 * Build by providing 2 seeds, each treated as uint32
	 * @param seed0 Only the lower 32bits will be used
	 * @param seed1 Only the lower 32bits will be used
	 * @param seed2 Only the lower 32bits will be used
	 * @param seed3 Only the lower 32bits will be used
	 * @param seed4 Only the lower 32bits will be used
	 * @param seed5 Only the lower 32bits will be used
	 * @param seed6 Only the lower 32bits will be used
	 * @param seed7 Only the lower 32bits will be used
	 * @param seed8 Only the lower 32bits will be used
	 * @param seed9 Only the lower 32bits will be used
	 * @param seed10 Only the lower 32bits will be used
	 * @param seed11 Only the lower 32bits will be used
	 * @param seed12 Only the lower 32bits will be used
	 * @param seed13 Only the lower 32bits will be used
	 * @param seed14 Only the lower 32bits will be used
	 * @param seed15 Only the lower 32bits will be used
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
	 * Restore from state extracted via Well512.save().
	 * Will throw if state is incorrect length
	 * @param state Saved state, must be exactly 65 bytes long
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
