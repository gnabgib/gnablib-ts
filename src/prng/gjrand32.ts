/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

/**
 * GJrand random numbers using 128bit state, 32bit return.
 * This isn't an official version (no KAT), it's mostly sourced from
 * https://gist.github.com/imneme/7a783e20f71259cc13e219829bcea4ac which was apparently
 * [provided by David Blackman](https://www.pcg-random.org/posts/some-prng-implementations.html#gjrand-david-blackmans-chaotic-prng)
 * but doesn't quite init correctly (with one u32 c should be 1000001, with two 2000001)
 * and has a default seed found nowhere in official source.  *Note* gjrand used to be 32bit (only) in versions <1
 * but there are known issues with those versions, so those versions/KAT aren't terribly useful.
 *
 * The benefit of this version over official `gjrand32` is it doesn't need 64bit (U64) support so should be slightly more performant
 *
 * *NOT cryptographically secure*
 */
export class Gjrand32b extends APrng32<Uint32Array> {
	readonly bitGen = 32;

	protected trueSave() {
		const exp = this._state.slice();
		const ret = new Uint8Array(exp.buffer);
		asLE.i32(ret, 0, 4);
		return ret;
	}

	rawNext(): number {
		this._state[1] += this._state[2];
		this._state[0] = (this._state[0] << 16) | (this._state[0] >>> 16); //lRot p=16
		this._state[2] ^= this._state[1];
		this._state[3] += 0x96a5; //d_inc=0x96a5
		this._state[0] += this._state[1];
		this._state[2] = (this._state[2] << 11) | (this._state[2] >>> 21); //lRot q=11
		this._state[1] ^= this._state[0];
		this._state[0] += this._state[2];
		this._state[1] = (this._state[2] << 19) | (this._state[2] >>> 13); //lRot r=19
		this._state[2] += this._state[0];
		this._state[1] += this._state[3];
		return this._state[0];
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'gjrand32b';
	}

	/** Build using a reasonable default seed */
	static new(saveable = false) {
		//gjrand_init(0) - we've precalculated this state (seed with 0 and 14*next());
		return new Gjrand32b(
			Uint32Array.of(2341650679, 368028163, 2033345459, 539910),
			saveable
		);
	}

	/**
	 * Build by providing 1 or 2 seeds.
	 * Includes robust seeding procedure.
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed0: number, seed1?: number, saveable = false) {
		const state = Uint32Array.of(seed0, 0, 0, 0);
		if (seed1 != undefined) {
			//gjrand_init64
			state[1] = seed1;
			state[2] = 2000001;
		} else {
			//gjrand_init
			state[2] = 1000001;
		}
		const ret = new Gjrand32b(state, saveable);
		for (let i = 0; i < 14; i++) ret.rawNext();
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
		return new Gjrand32b(s32, saveable);
	}
}
