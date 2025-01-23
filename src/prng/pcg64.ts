/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U128, U128Mut } from '../primitive/number/U128.js';
import { U64 } from '../primitive/number/U64.js';
import { sLen } from '../safe/safe.js';
import { APrng64 } from './APrng64.js';

const u128_1 = U128.fromI32s(1);

//Mul defined in source: https://github.com/imneme/pcg-c
//PCG_DEFAULT_MULTIPLIER_128 | h,l=2549297995355413924ULL,4865540595714422341ULL
// x2360ED051FC65DA44385DF649FCCF645 | 47026247687942121848144207491837523525
const mul = U128.fromI32s(0x9fccf645, 0x4385df64, 0x1fc65da4, 0x2360ed05);

/**
 * Permuted Congruential Generator (PCG) using 128bit state, 64bit return as described in
 * [PCG: A Family of Simple Fast Space-Efficient Statistically Good Algorithms for Random Number Generation](https://www.pcg-random.org/pdf/hmc-cs-2014-0905.pdf)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [PCG, A Family of Better Random Number Generators](https://www.pcg-random.org/)
 * - {@link prng.Pcg32 | Pcg32}
 */
export class Pcg64 extends APrng64<U128Mut> {
	private readonly _inc: U128;
	private readonly _u64_0: U64;
	private readonly _u64_1: U64;
	readonly bitGen = 64;
	readonly safeBits = 64;

	protected constructor(state: U128Mut, inc: U128, saveable: boolean) {
		super(state, saveable);
		this._inc = inc;
		this._u64_0 = state.u64at(0);
		this._u64_1 = state.u64at(1);
	}

	rawNext(): U64 {
		//pcg_setseq_128_srandom_r
		this._state.mulEq(mul).addEq(this._inc); //pcg_setseq_128_step_r
		//state>>>122, which is the same as >>>58 on the high (which is second because LE)
		const rot = this._u64_1.rShift(58).low;
		//xor low and high, then rotr
		return this._u64_0.mut().xorEq(this._u64_1).rRotEq(rot);
	}

	save(): Uint8Array {
		if (!this.saveable) return new Uint8Array(0);
		const ret = new Uint8Array(32);
		ret.set(this._state.toBytesLE());
		ret.set(this._inc.toBytesLE(), 16);
		return ret;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'pcg64';
	}

	/** Build using a reasonable default seed and increment */
	static new(saveable = false) {
		//Default add provided in demo source: https://github.com/imneme/pcg-c
		//0x0000000000000001da3e39cb94b95bdb | 34172814569070222299
		const inc = U128.fromI32s(0x94b95bdb, 0xda3e39cb, 0x00000001, 0x00000000);
		//Default seed provided in demo source: https://github.com/imneme/pcg-c
		//0x979c9a98d84620057d3e9cb6cfe0549b | 201526561274146932589719779721328219291
		const state = U128Mut.fromI32s(
			0xcfe0549b,
			0x7d3e9cb6,
			0xd8462005,
			0x979c9a98
		);
		//This default seed comes from the paper
		return new Pcg64(state, inc, saveable);
	}

	/**
	 * Build by providing a seed, and optionally an increment amount
	 * Includes robust seeding procedure.
	 * @param inc Defaults to 15726070495360670683
	 * @param saveable Whether the generator's state can be saved
	 */
	static seed(seed: U128, inc?: U128, saveable = false) {
		//Default add provided in demo source: https://github.com/imneme/pcg-c
		//0x0000000000000001da3e39cb94b95bdb | 34172814569070222299
		const inc128 =
			inc != undefined
				? inc.mut().lShiftEq(1).xorEq(u128_1)
				: U128.fromI32s(0x94b95bdb, 0xda3e39cb, 0x00000001, 0x00000000);

		const state = U128Mut.fromI32s(0, 0, 0, 0);
		state.mulEq(mul).addEq(inc128); //pcg_setseq_128_step_r
		state.addEq(seed);
		state.mulEq(mul).addEq(inc128); //pcg_setseq_128_step_r
		return new Pcg64(state, inc128, saveable);
	}

	/**
	 * Restore from state extracted via {@link save}.
	 * @param state Saved state
	 * @throws Error if `state` length is incorrect
	 */
	static restore(state: Uint8Array, saveable = false) {
		sLen('state', state).exactly(32).throwNot();
		const s2 = state.slice();
		const state64 = U128Mut.fromBytesLE(s2);
		const inc64 = U128.fromBytesLE(s2, 16);
		return new Pcg64(state64, inc64, saveable);
	}
}
