/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * [Small Fast Counting (SFC)](https://pracrand.sourceforge.net/RNG_engines.txt)
 * random generator using 64bit state, 16bit return as described in
 * [PractRand](https://pracrand.sourceforge.net/)
 *
 * *NOT cryptographically secure*
 */
export class Sfc16 extends APrng32<Uint16Array> {
	readonly bitGen = 16;
	readonly safeBits = 16;

	protected trueSave() {
		const ret = new Uint8Array(this._state.slice().buffer);
		asLE.i16(ret, 0, 4);
		return ret;
	}

	rawNext(): number {
		const t = this._state[0] + this._state[1] + this._state[3];
		this._state[3] += 1;
		this._state[0] = this._state[1] ^ (this._state[1] >>> 5); //rshift=5
		this._state[1] = this._state[2] + (this._state[2] << 3); //lshift=3
		this._state[2] = ((this._state[2] << 5) | (this._state[2] >>> 11)) + t; //barrel_shift=5
		return t & 0xffff;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'sfc16';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		// //Default is the upper 16 bits of first 3 results of SplitMix32(0)
		// // NOTE: note the fourth value is called "counter" and starts at 1 in the original source.
		// const ret= new Sfc16(Uint16Array.of(0x92ca, 0x3cd6, 0x1b14, 1), saveable);
		// for (let i = 0; i < 10; i++) ret.rawNext();

		//This state comes from the above seed-process
		return new Sfc16(Uint16Array.of(13030, 58465, 13184, 11), saveable);
	}

	/**
	 * Build by providing 3 or 4 seeds, each treated as uint16
	 * Includes robust seeding procedure.
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(
		seed0: number,
		seed1: number,
		seed2: number,
		seed3?: number,
		saveable = false
	) {
		const u16 = Uint16Array.of(seed0, seed1, seed2, 1);
		if (seed3 != undefined) u16[3] = seed3;
		const ret = new Sfc16(u16, saveable);

		for (let i = 0; i < 10; i++) ret.rawNext();
		return ret;
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(8).throwNot();
		const s2 = state.slice();
		asLE.i16(s2, 0, 3);
		const s16 = new Uint16Array(s2.buffer);
		return new Sfc16(s16, saveable);
	}
}
