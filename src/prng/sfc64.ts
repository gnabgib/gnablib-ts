/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { U64, U64MutArray } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { APrng64 } from './APrng64.js';

/**
 * [Small Fast Counting (SFC)](https://pracrand.sourceforge.net/RNG_engines.txt)
 * random generator using 256bit state, 64bit return as described in
 * [PractRand](https://pracrand.sourceforge.net/)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - {@link prng.Sfc16 | Sfc16}
 * - {@link prng.Sfc32 | Sfc32}
 */
export class Sfc64 extends APrng64<U64MutArray> {
	readonly bitGen = 64;
	readonly safeBits = 64;

	rawNext(): U64 {
		const t = this._state
			.at(0)
			.mut()
			.addEq(this._state.at(1))
			.addEq(this._state.at(3));
		this._state.at(3).addEq(U64.fromI32s(1, 0));
		this._state
			.at(0)
			.set(this._state.at(1).xorEq(this._state.at(1).rShiftEq(11))); //rshift=11
		this._state.at(1).set(this._state.at(2).add(this._state.at(2).lShift(3))); //lshift=3
		this._state.at(2).lRotEq(24).addEq(t); //barrel_shift=24
		return t;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'sfc64';
	}

	/** Build using a reasonable default seed and increment */
	static new(saveable = false) {
		// prettier-ignore
		const s32=Uint32Array.of(
			0x7b1dcdaf, 0xe220a839, //e220a8397b1dcdaf
			0xa1b965f4, 0x6e789e6a, //6e789e6aa1b965f4
			0x8009454f, 0x06c45d18, //06c45d188009454f
			1, 0 //0000000000000001
		);
		const state = U64MutArray.mount(s32);
		// const state = U64MutArray.fromU32s(
		// 	0x7b1dcdaf, 0xe220a839, //e220a8397b1dcdaf
		// 	0xa1b965f4, 0x6e789e6a, //6e789e6aa1b965f4
		// 	0x8009454f, 0x06c45d18, //06c45d188009454f
		// 	1, 0 //0000000000000001
		// );
		//This default seed comes from the paper
		return new Sfc64(state, saveable);
	}

	/**
	 * Build by providing 1 or 3 seeds (if 2 are provided the second will be ignored)
	 * Includes robust seeding procedure.
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: U64, seed1?: U64, seed2?: U64, saveable = false) {
		//Super inconsistent:
		// 16 seeds 3&4 parts with the same number of rounds (10)
		// 32 seeds 2&3 parts with 12 rounds for 2, 15 rounds for 3 (why would you need more rounds for more random data?.. it can't be worse than leading 0)
		// 64 seeds 2&6 parts with 12 rounds for 2, 18 rounds for 6 (why would you need more rounds for more random data?.. it can't be worse than 3* the same data)
		// Only 16 allows seeding the counter.
		const state = U64MutArray.fromLen(8);
		state.at(0).set(seed0);
		let drop: number;
		if (seed1 && seed2) {
			//Todo, throw when once isn't set?
			state.at(1).set(seed1);
			state.at(2).set(seed2);
			drop = 18;
		} else {
			state.at(1).set(seed0);
			state.at(2).set(seed0);
			drop = 12;
		}
		state.at(3).set(U64.fromI32s(1, 0));
		const ret = new Sfc64(state, saveable);
		for (let i = 0; i < drop; i++) ret.rawNext();
		return ret;
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(32).throwNot();
		const s2 = state.slice();
		asLE.i32(s2, 0, 8);
		return new Sfc64(U64MutArray.fromBytes(s2.buffer), saveable);
	}
}
