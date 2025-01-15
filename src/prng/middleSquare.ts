/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { leadingZeros } from '../algo/leadingZeros.js';
import { ContentError } from '../error/ContentError.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * [Middle-square](https://en.wikipedia.org/wiki/Middle-square_method)
 * random number generator that generates numbers of the same number of digits as $seed
 *
 * *NOT cryptographically secure*
 *
 * You only need to provide n if the seed should be considered larger in magnitude
 * eg. seed(1) is invalid, while seed(1,2) is valid (zero padded 1)
 */
export class MiddleSquare extends APrng32 {
	protected _state: number;
	private readonly _n: number;
	private readonly _div: number;
	private readonly _mod: number;
	readonly saveable: boolean;
	readonly bitGen: number;

	protected constructor(state: number, n: number, saveable: boolean) {
		super();
		this._state = state;
		this._n = n;
		this._div = 10 ** (n / 2);
		this._mod = 10 ** n;
		this.bitGen = 32 - leadingZeros(this._mod - 1);
		this.saveable = saveable;
	}

	rawNext(): number {
		this._state =
			Math.floor((this._state * this._state) / this._div) % this._mod;
		return this._state;
	}

	/**
	 * Export a copy of the internal state as a byte array (can be used with restore methods).
	 * Note the generator must have been built with `saveable=true` (default false)
	 * for this to work, an empty array is returned when the generator isn't saveable.
	 * @returns
	 */
	save(): Uint8Array {
		if (!this.saveable) return new Uint8Array(0);
		const ret = Uint8Array.of(
			this._state,
			this._state >>> 8,
			this._state >>> 16,
			this._state >>> 24,
			this._n
		);
		return ret;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'middlesquare';
	}

	/**
	 * Build by providing a seed, and optionally the number of digits.  You only need to provide n if the seed
	 * should be considered larger in magnitude (ie. zero pad)
	 * @param seed Starting state, subsequent numbers will have the same number of (base 10) digits, must be>0 and have an even number of digits
	 * @param n Number of digits, only need be provided if seed should padded, must be >0 and even
	 * @param saveable Whether the generator's state can be saved
	 * @returns
	 */
	static seed(seed: number, n?: number, saveable = false) {
		const state = seed >>> 0;
		//If n isn't defined, count from seed.. note you really don't need
		// to provide n unless the seed should be zero padded.
		if (!n) {
			n = (Math.log10(state) | 0) + 1;
		}
		if ((n & 1) == 1)
			throw new ContentError('Must have an even number of digits');
		return new MiddleSquare(state, n, saveable);
	}

	/**
	 * Restore from state extracted via MiddleSquare.save().
	 * Will throw if state is incorrect length
	 * @param state Saved state, must be exactly 16 bytes long
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(5).throwNot();
		const s = state[0] | (state[1] << 8) | (state[2] << 16) | (state[3] << 24);
		const n = state[4];
		return new MiddleSquare(s, n, saveable);
	}
}
