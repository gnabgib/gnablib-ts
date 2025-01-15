/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

const fib_hash_const = 0x9e3779b9; //2654435769

/**
 * SplitMix32 as described in paper
 * [Fast splittable pseudorandom number generators](https://doi.org/10.1145/2660193.2660195)
 *
 * *NOT cryptographically secure*
 */
export class SplitMix32 extends APrng32 {
	protected readonly _state: Uint32Array;
	readonly saveable: boolean;
	readonly bitGen = 32;

	protected constructor(state: Uint32Array, saveable: boolean) {
		super();
		this._state = state;
		this.saveable = saveable;
	}

	rawNext(): number {
		this._state[0] += fib_hash_const;
		let r = this._state[0];
		r ^= r >>> 16;
		r = Math.imul(r, 0x85ebca6b);
		r ^= r >>> 13;
		r = Math.imul(r, 0xc2b2ae35);
		r ^= r >>> 16;
		return r >>> 0;
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
		asLE.i32(ret, 0, 1);
		return ret;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'splitmix32';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		return new SplitMix32(Uint32Array.of(0), saveable);
	}

	/**
	 * Build by providing a seed
	 *
	 * @param seed
	 * @param saveable Whether the generator's state can be saved
	 * @returns
	 */
	static seed(seed: number, saveable = false) {
		return new SplitMix32(Uint32Array.of(seed), saveable);
	}

	/**
	 * Restore from state extracted via SplitMix32.save().
	 * Will throw if state is incorrect length
	 * @param state Saved state, must be exactly 16 bytes long
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(4).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 1);
		const s32 = new Uint32Array(s2.buffer);
		return new SplitMix32(s32, saveable);
	}
}
