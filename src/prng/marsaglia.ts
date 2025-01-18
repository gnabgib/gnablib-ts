/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { sLen, sNum } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * Build a [Marsaglia](https://groups.google.com/g/sci.math/c/6BIYd0cafQo/m/Ucipn_5T_TMJ?hl=en)
 * random number generator (suitable for brain calculation)
 *
 * *NOT cryptographically secure*
 */
export class Marsaglia extends APrng32<Uint8Array> {
	readonly bitGen = 4;

	protected trueSave() {
		return this._state.slice();
	}

	rawNext(): number {
		const units = this._state[0] % 10;
		const tens = (this._state[0] / 10) | 0;
		this._state[0] = tens + 6 * units;
		return this._state[0] % 10;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'marsaglia';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//This default seed comes from the email thread
		return new Marsaglia(Uint8Array.of(23), saveable);
	}

	/**
	 * Build by providing a 2 digit seed
	 * @param seed Number 1-99
	 * @param saveable Whether the generator's state can be saved
	 * @throws Error If seed<1|| seed>99
	 */
	static seed(seed: number, saveable = false) {
		sNum('seed', seed).natural().atMost(99).throwNot();
		return new Marsaglia(Uint8Array.of(seed), saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(1).throwNot();
		return new Marsaglia(state.slice(), saveable);
	}
}
