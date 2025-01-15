/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { sLen, sNum } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * Build a [Marsaglia](https://groups.google.com/g/sci.math/c/6BIYd0cafQo/m/Ucipn_5T_TMJ?hl=en)
 * random number generator (suitable for brain calculation)
 *
 * *NOT cryptographically secure*
 */
export class Marsaglia extends APrng32 {
	protected _state: number;
	readonly saveable: boolean;
	readonly bitGen = 4;

	protected constructor(state: number, saveable: boolean) {
		super();
		this._state = state;
		this.saveable = saveable;
	}

	rawNext(): number {
		const units = this._state % 10;
		const tens = (this._state / 10) | 0;
		this._state = tens + 6 * units;
		return this._state % 10;
	}

	/**
	 * Export a copy of the internal state as a byte array (can be used with restore methods).
	 * Note the generator must have been built with `saveable=true` (default false)
	 * for this to work, an empty array is returned when the generator isn't saveable.
	 * @returns
	 */
	save(): Uint8Array {
		if (!this.saveable) return new Uint8Array(0);
		return Uint8Array.of(this._state);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'marsaglia';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//This default seed comes from the email thread
		return new Marsaglia(23, saveable);
	}

	/**
	 * Build by providing a 2 digit seed
	 * @param seed Number 1-99
	 * @param saveable Whether the generator's state can be saved
	 * @returns
	 */
	static seed(seed: number, saveable = false) {
		sNum('seed', seed).natural().atMost(99).throwNot();
		return new Marsaglia(seed, saveable);
	}

	/**
	 * Restore from state extracted via Marsaglia.save().
	 * Will throw if state is incorrect length
	 * @param state Saved state, must be exactly 16 bytes long
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(1).throwNot();
		return new Marsaglia(state[0], saveable);
	}
}