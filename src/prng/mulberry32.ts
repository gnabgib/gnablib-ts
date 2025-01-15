/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * Mulberry32 RNG
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [Original mulberry32.c](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c)
 */
export class Mulberry32 extends APrng32 {
	protected readonly _state: Uint32Array;
	readonly saveable: boolean;
	readonly bitGen = 32;

	protected constructor(state: Uint32Array, saveable: boolean) {
		super();
		this._state = state;
		this.saveable = saveable;
	}

	rawNext(): number {
		this._state[0] += 0x6d2b79f5;
		let r = this._state[0];
		r = Math.imul(r ^ (r >>> 15), r | 1);
		r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
		return (r ^ (r >>> 14)) >>> 0;
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
		return 'mulberry32';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		return new Mulberry32(Uint32Array.of(0), saveable);
	}

	/**
	 * Build by providing a seed, treated as uint32.
	 * @param seed Only the lower 32bits will be used
	 * @param saveable Whether the generator's state can be saved
	 * @returns
	 */
	static seed(seed: number, saveable = false) {
		const state = Uint32Array.of(seed);
		return new Mulberry32(state, saveable);
	}

	/**
	 * Restore from state extracted via Mulberry32.save().
	 * Will throw if state is incorrect length
	 * @param state Saved state, must be exactly 16 bytes long
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(4).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 1);
		const s32 = new Uint32Array(s2.buffer);
		return new Mulberry32(s32, saveable);
	}
}
