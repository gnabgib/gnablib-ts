/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * Inverted Tyche random numbers using 128bit state, 32bit return.  As defined in
 * [Fast and Small Nonlinear Pseudorandom Number Generators for Computer Simulation](https://www.researchgate.net/publication/233997772_Fast_and_Small_Nonlinear_Pseudorandom_Number_Generators_for_Computer_Simulation)
 *
 * *NOT cryptographically secure*
 */
export class Tychei extends APrng32 {
	protected readonly _state: Uint32Array;
	readonly saveable: boolean;
	readonly bitGen = 32;

	protected constructor(state: Uint32Array, saveable: boolean) {
		super();
		this._state = state;
		this.saveable = saveable;
	}

	// prettier-ignore
	rawNext(): number {
		this._state[1] = ((this._state[1] << 25) | (this._state[1] >>> 7)) ^ this._state[2];
		this._state[2] -= this._state[3];
		this._state[3] = ((this._state[3] << 24) | (this._state[3] >>> 8)) ^ this._state[0];
		this._state[0] -= this._state[1];
		this._state[1] = ((this._state[1] << 20) | (this._state[1] >>> 12)) ^ this._state[2];
		this._state[2] -= this._state[3];
		this._state[3] = ((this._state[3] << 16) | (this._state[3] >>> 16)) ^ this._state[0];
		this._state[0] -= this._state[1];
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
		asLE.i32(ret, 0, 4);
		return ret;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'tychei';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		// const ret = new Tychei(
		// 	Uint32Array.of(0, 0, 2654435769, 1367130551),
		// 	saveable
		// );
		// for (let i = 0; i < 20; i++) ret.rawNext();
		//The above code produces the following state
		return new Tychei(
			Uint32Array.of(2248327305, 1386259388, 71442316, 3496167757),
			saveable
		);
	}

	/**
	 * Build by providing 2 seeds.
	 * Includes robust seeding procedure.
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: number, seed1: number, saveable = false) {
		const ret = new Tychei(
			Uint32Array.of(seed1, seed0, 2654435769, 1367130551),
			saveable
		);
		for (let i = 0; i < 20; i++) ret.rawNext();
		return ret;
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(16).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 2);
		const s32 = new Uint32Array(s2.buffer);
		return new Tychei(s32, saveable);
	}
}
