/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { U64, U64MutArray } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { APrng64 } from './APrng64.js';

/**
 * GJrand random generator using 256bit state, 64bit return
 * as described in
 * [gjrand random numbers](https://gjrand.sourceforge.net/) 4.3.0 release
 *
 * *NOT cryptographically secure*
 */
export class Gjrand64 extends APrng64 {
	protected readonly _state: U64MutArray;
	readonly saveable: boolean;
	readonly bitGen = 64;

	protected constructor(state: U64MutArray, saveable: boolean) {
		super();
		this._state = state;
		this.saveable = saveable;
	}

	rawNext(): U64 {
		this._state.at(1).addEq(this._state.at(2));
		this._state.at(0).lRotEq(32);
		this._state.at(2).xorEq(this._state.at(1));
		this._state.at(3).addEq(U64.fromInt(0x55aa96a5));
		this._state.at(0).addEq(this._state.at(1));
		this._state.at(2).lRotEq(23);
		this._state.at(1).xorEq(this._state.at(0));
		this._state.at(0).addEq(this._state.at(2));
		this._state.at(1).lRotEq(19);
		this._state.at(2).addEq(this._state.at(0));
		this._state.at(1).addEq(this._state.at(3));
		return this._state.at(0).mut();
	}

	/**
	 * Export a copy of the internal state as a byte array (can be used with restore methods).
	 * Note the generator must have been built with `saveable=true` (default false)
	 * for this to work, an empty array is returned when the generator isn't saveable.
	 * @returns
	 */
	save(): Uint8Array {
		if (!this.saveable) return new Uint8Array(0);
		return this._state.toBytesLE();
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'gjrand64';
	}

	/** Build using a reasonable default seed and increment */
	static new(saveable = false) {
		//Pre computed state from gjrand32(0) + 14*crank
		// prettier-ignore
		const state = U64MutArray.fromU32s(
			2361955991, 2308445249,
			4286249029, 4038403806,
			403824257, 4256023257,
			2941533446, 4
		);
		return new Gjrand64(state, saveable);
	}

    /**
	 * Build by providing 1 or 2 seeds, totalling 64bits or 128bits.
     * Note: a 32bit seed is also supported, but not recommended.
	 * Includes robust seeding procedure.
     * @param seed0 32bit or 64bit seed.  Must be U64 if seed1 is provided
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: number | U64, seed1?: U64, saveable = false) {
		const state = U64MutArray.fromLen(8);
		if (typeof seed0 == 'number') {
			//32bit build (note seed1 isn't even tested to avoid 96bit seed, which
			// also means a developer won't get feedback with the invalid combo
			state.at(0).set(U64.fromInt(seed0));
			state.at(2).set(U64.fromUint32Pair(1000001, 0));
		} else if (seed1) {
			//128bit build
			state.at(0).set(seed1);
			state.at(1).set(seed0);
			state.at(2).set(U64.fromIntUnsafe(5000001));
		} else {
			//64bit build
			state.at(0).set(seed0);
			state.at(2).set(U64.fromUint32Pair(2000001, 0));
		}
		const ret = new Gjrand64(state, saveable);
		for (let i = 0; i < 14; i++) ret.rawNext();
		return ret;
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(32).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 8);
		return new Gjrand64(U64MutArray.fromBytes(s2.buffer), saveable);
	}
}
