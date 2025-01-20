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
export class Mulberry32 extends APrng32<Uint32Array> {
	readonly bitGen = 32;
	readonly safeBits = 32;

	protected trueSave() {
		const exp = this._state.slice();
		const ret = new Uint8Array(exp.buffer);
		asLE.i32(ret, 0, 1);
		return ret;
	}

	rawNext(): number {
		this._state[0] += 0x6d2b79f5;
		let r = this._state[0];
		r = Math.imul(r ^ (r >>> 15), r | 1);
		r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
		return (r ^ (r >>> 14)) >>> 0;
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
	 * Build by providing a seed
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed: number, saveable = false) {
		const state = Uint32Array.of(seed);
		return new Mulberry32(state, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(4).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 1);
		const s32 = new Uint32Array(s2.buffer);
		return new Mulberry32(s32, saveable);
	}
}
