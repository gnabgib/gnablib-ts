/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { ContentError } from '../error/ContentError.js';
import { countLeadZeros } from '../primitive/xtBit.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

const N = 1;
/**
 * [Middle-square](https://en.wikipedia.org/wiki/Middle-square_method)
 * random number generator that generates numbers of the same number of digits as $seed
 *
 * *NOT cryptographically secure*
 */
export class MiddleSquare extends APrng32<Uint32Array> {
	private readonly _div: number;
	private readonly _mod: number;
	readonly bitGen: number;
	readonly safeBits = this.bitGen;

	protected constructor(state: Uint32Array, saveable: boolean) {
		super(state, saveable);
		this._div = 10 ** (state[N] / 2);
		this._mod = 10 ** state[N];
		this.bitGen = 32 - countLeadZeros(this._mod - 1);
	}

	protected trueSave() {
		const ret = new Uint8Array(this._state.slice().buffer, 0, 5);
		asLE.i32(ret, 0, 1);
		return ret;
	}

	rawNext(): number {
		this._state[0] =
			Math.floor((this._state[0] * this._state[0]) / this._div) % this._mod;
		return this._state[0];
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'middlesquare';
	}

	/**
	 * Build by providing a seed, and optionally the number of digits.
	 * You only need to provide n if the seed should be considered larger in magnitude (ie. zero pad)
	 * @param seed Starting state, subsequent numbers will have the same number of (base 10) digits, must be>0 and have an even number of digits
	 * @param n Number of digits, only need be provided if seed should padded, must be >0 and even
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed: number, n?: number, saveable = false) {
		const state = Uint32Array.of(seed, 0);
		//If n isn't defined, count from seed.. note you really don't need
		// to provide n unless the seed should be zero padded.
		if (!n) {
			n = (Math.log10(state[0]) | 0) + 1;
		}
		if ((n & 1) == 1)
			throw new ContentError('Must have an even number of digits');
		state[N] = n;
		return new MiddleSquare(state, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(5).throwNot();
		const s = Uint32Array.of(
			state[0] | (state[1] << 8) | (state[2] << 16) | (state[3] << 24),
			state[4]
		);
		return new MiddleSquare(s, saveable);
	}
}
