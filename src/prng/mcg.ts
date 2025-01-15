/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

const SEED = 0;
const MUL = 1;
const ADD = 2;
const MOD = 3;

/**
 * [Lehmer](https://en.wikipedia.org/wiki/Lehmer_random_number_generator)
 * random generator, also known as a MCG generator
 *
 * *NOT cryptographically secure*
 */
export class Mcg extends APrng32 {
	protected readonly _state: Uint32Array;
	protected readonly _shift: number;
	readonly saveable: boolean;
	readonly bitGen: number;

	protected constructor(state: Uint32Array, shift: number, saveable: boolean) {
		super();
		this._state = state;
		this._shift = shift;
		this.bitGen = 31 - shift;
		this.saveable = saveable;
	}

	rawNext(): number {
		this._state[SEED] =
			(this._state[SEED] * this._state[MUL] + this._state[ADD]) %
			this._state[MOD];
		return this._state[SEED] >>> this._shift;
	}

	/**
	 * Export a copy of the internal state as a byte array (can be used with restore methods).
	 * Note the generator must have been built with `saveable=true` (default false)
	 * for this to work, an empty array is returned when the generator isn't saveable.
	 * @returns
	 */
	save(): Uint8Array {
		if (!this.saveable) return new Uint8Array(0);
		const ret = new Uint8Array(17);
		ret.set(new Uint8Array(this._state.slice().buffer));
		asLE.i32(ret, 0, 4);
		ret[16] = this._shift;
		return ret;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'mcg';
	}

	/** Build MCG16807 using a reasonable default seed */
	static new16807(saveable = false) {
		return new Mcg(Uint32Array.of(1, 16807, 0, 0x7fffffff), 0, saveable);
	}
	/** Build MCG48271 using a reasonable default seed */
	static new48271(saveable = false) {
		return new Mcg(Uint32Array.of(1, 48271, 0, 0x7fffffff), 0, saveable);
	}
	/** Build MCG69621 using a reasonable default seed */
	static new69621(saveable = false) {
		return new Mcg(Uint32Array.of(1, 69621, 0, 0x7fffffff), 0, saveable);
	}
	/** Build Randu using a reasonable default seed */
	static newRandu(saveable = false) {
		return new Mcg(Uint32Array.of(1, 65539, 0, 0x80000000), 0, saveable);
	}
	/** Build MSVC using a reasonable default seed */
	static newMsvc(saveable = false) {
		return new Mcg(Uint32Array.of(1, 214013, 2531011, 0x80000000), 0, saveable);
	}

	/**
	 * Build MCG16807 with a seed, treated as uint32.
	 * Used in Apple CarbonLib, (MINSTD_RAND0) in C++11, IBM SIMPL/I, IBM APL, PRIMOS, IMSL Scientific library
	 *
	 * multiplier = 16807 = 7^5 : an odd composite
	 *
	 * @param seed Only the lower 32bits will be used
	 * @param saveable Whether the generator's state can be saved
	 * @returns
	 */
	static seed16807(seed: number, saveable = false) {
		//bits=31 (2^32-1)
		return new Mcg(Uint32Array.of(seed, 16807, 0, 0x7fffffff), 0, saveable);
	}

	/**
	 * Build MCG48271 with a seed, treated as uint32.
	 * Used in (MINSTD_RAND) in C++11
	 *
	 * multiplier = 48271 : prime
	 *
	 * @param seed Only the lower 32bits will be used
	 * @param saveable Whether the generator's state can be saved
	 * @returns
	 */
	static seed48271(seed: number, saveable = false) {
		//bits=31 (2^32-1)
		return new Mcg(Uint32Array.of(seed, 48271, 0, 0x7fffffff), 0, saveable);
	}

	/**
	 * Build MCG69621 with a seed, treated as uint32.
	 * Used in (MINSTD3) in C++11
	 *
	 * multiplier = 69621 = 3 × 23 × 1009 : an odd composite
	 *
	 * @param seed Only the lower 32bits will be used
	 * @param saveable Whether the generator's state can be saved
	 * @returns
	 */
	static seed69621(seed: number, saveable = false) {
		//bits=31 (2^32-1)
		return new Mcg(Uint32Array.of(seed, 69621, 0, 0x7fffffff), 0, saveable);
	}

	/**
	 * Build [RANDU](https://en.wikipedia.org/wiki/RANDU) with seed.
	 * Widely considered to be one of the most ill-conceived random number generators ever designed
	 *
	 * multiplier = 65539
	 *
	 * @param seed Only the lower 32bits will be used
	 * @param saveable Whether the generator's state can be saved
	 * @returns
	 */
	static seedRandu(seed: number, saveable = false) {
		//bits=31 (2^32-1)
		return new Mcg(Uint32Array.of(seed, 65539, 0, 0x80000000), 0, saveable);
	}

	/**
	 * Build [MSVC PRNG](https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use)
	 * with seed.
	 *
	 * multiplier = 214013
	 * add = 2531011
	 *
	 * @param seed Only the lower 32bits will be used
	 * @param saveable Whether the generator's state can be saved
	 * @returns
	 */
	static seedMsvc(seed: number, saveable = false) {
		return new Mcg(
			Uint32Array.of(seed, 214013, 2531011, 0x80000000),
			16,
			saveable
		);
	}

	/**
	 * Restore from state extracted via Mcg.save().
	 * Will throw if state is incorrect length
	 * @param state Saved state, must be exactly 16 bytes long
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(17).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 4);
		const s32 = new Uint32Array(s2.buffer, 0, 4);
		return new Mcg(s32, s2[16], saveable);
	}
}
