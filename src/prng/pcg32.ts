/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64Mut } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { APrng32 } from './APrng32.js';

const u64_1 = U64.fromUint32Pair(1, 0);
//Mul defined in source: https://github.com/imneme/pcg-c
const mul = U64.fromUint32Pair(0x4c957f2d, 0x5851f42d); //6364136223846793005

/**
 * Permuted Congruential Generator (PCG) using 64bit state, 32bit return as described in
 * [PCG: A Family of Simple Fast Space-Efficient Statistically Good Algorithms for Random Number Generation](https://www.pcg-random.org/pdf/hmc-cs-2014-0905.pdf)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [PCG, A Family of Better Random Number Generators](https://www.pcg-random.org/)
 */
export class Pcg32 extends APrng32<U64Mut> {
	private readonly _inc: U64;
	readonly bitGen = 32;

	protected constructor(state: U64Mut, inc: U64, saveable: boolean) {
		super(state, saveable);
		this._inc = inc;
	}

	protected trueSave() {
		const ret = new Uint8Array(16);
		ret.set(this._state.toBytesLE());
		ret.set(this._inc.toBytesLE(), 8);
		return ret;
	}

	rawNext(): number {
		//pcg32_xsh_rr
		const oldState = this._state.mut();
		const rot = this._state.high >>> 27; ///same as: s.rShift(59).low;
		const r = oldState.xorEq(oldState.rShift(18)).rShiftEq(27).low;
		this._state.mulEq(mul).addEq(this._inc);
		return ((r >>> rot) | (r << (32 - rot))) >>> 0;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'pcg32';
	}

	/** Build using a reasonable default seed and increment */
	static new(saveable = false) {
		//Default add provided in demo source: https://github.com/imneme/pcg-c
		//0xda3e39cb94b95bdb | 15726070495360670683
		const inc = U64.fromUint32Pair(0x94b95bdb, 0xda3e39cb);
		//Default seed provided in demo source: https://github.com/imneme/pcg-c
		//0x853c49e6748fea9bULL | 9600629759793949339
		const state = U64Mut.fromUint32Pair(0x748fea9b, 0x853c49e6);
		//This default seed comes from the paper
		return new Pcg32(state, inc, saveable);
	}

	/**
	 * Build by providing a seed, and optionally an increment amount
	 * Includes robust seeding procedure.
	 * @param inc Defaults to 15726070495360670683
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed: U64, inc?: U64, saveable = false) {
		//Default add provided in demo source: https://github.com/imneme/pcg-c
		//0xda3e39cb94b95bdb | 15726070495360670683
		const inc64 =
			inc != undefined
				? inc.mut().lShiftEq(1).xorEq(u64_1)
				: U64.fromUint32Pair(0x94b95bdb, 0xda3e39cb);
		const state = U64Mut.fromUint32Pair(0, 0);
		state.mulEq(mul).addEq(inc64);
		state.addEq(seed);
		state.mulEq(mul).addEq(inc64);
		return new Pcg32(state, inc64, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(16).throwNot();
		const s2 = state.slice();
		const state64 = U64Mut.fromBytesLE(s2);
		const inc64 = U64.fromBytesLE(s2, 8);
		return new Pcg32(state64, inc64, saveable);
	}
}
