/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * [Small Fast Counting (SFC)](https://pracrand.sourceforge.net/RNG_engines.txt)
 * random generator using 128bit state, 32bit return as described in
 * [PractRand](https://pracrand.sourceforge.net/)
 *
 * *NOT cryptographically secure*
 * 
 * Related:
 * - {@link prng.Sfc16 | Sfc16}
 * - {@link prng.Sfc64 | Sfc64}
 */
export class Sfc32 extends APrng32<Uint32Array> {
	readonly bitGen = 32;
	readonly safeBits = 32;

	protected trueSave() {
		const ret = new Uint8Array(this._state.slice().buffer);
		asLE.i32(ret, 0, 4);
		return ret;
	}

	rawNext(): number {
		const t = this._state[0] + this._state[1] + this._state[3];
		this._state[3] += 1;
		this._state[0] = this._state[1] ^ (this._state[1] >>> 9); //rshift=9
		this._state[1] = this._state[2] + (this._state[2] << 3); //lshift=3
		this._state[2] = ((this._state[2] << 21) | (this._state[2] >>> 11)) + t; //barrel_shift/p=21
		return t >>> 0;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'sfc32';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		// //Default is the first 3 results of SplitMix32(0)
		// const ret=new Sfc32(
		// 	Uint32Array.of(2462723854, 1020716019, 454327756, 1),
		// 	saveable
		// );
		// for (let i = 0; i < 15; i++) ret.rawNext();
		//This state comes from the above seed-process
		return new Sfc32(
			Uint32Array.of(2027658023, 3605857311, 2741163597, 16),
			saveable
		);
	}

	/**
	 * Build by providing 2 or 3 seeds
	 * Includes robust seeding procedure.
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: number, seed1: number, seed2?: number, saveable = false) {
		const u32 = new Uint32Array(4);
		let drop: number;
		if (seed2 != undefined) {
			u32[0] = seed0;
			u32[1] = seed1;
			u32[2] = seed2;
			drop = 15;
		} else {
			u32[1] = seed0;
			u32[2] = seed1;
			drop = 12;
		}
		u32[3] = 1;
		const ret = new Sfc32(u32, saveable);

		for (let i = 0; i < drop; i++) ret.rawNext();
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
		asLE.i32(s2, 0, 4);
		const s32 = new Uint32Array(s2.buffer);
		return new Sfc32(s32, saveable);
	}
}
