/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U128, U128Mut } from '../primitive/number/U128.js';
import { U64 } from '../primitive/number/U64.js';
import { IRandU64 } from './interfaces/IRandU64.js';

/**
 * Permuted Congruential Generator (PCG) using 128bit state, 64bit return as described in
 * [PCG: A Family of Simple Fast Space-Efficient Statistically Good Algorithms for Random Number Generation](https://www.pcg-random.org/pdf/hmc-cs-2014-0905.pdf)
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [PCG, A Family of Better Random Number Generators](https://www.pcg-random.org/)
 *
 * @param seed
 * @returns Generator of uint64 [0 - 18446744073709551615]
 */
export function pcg64(seed?: U128, inc?: U128): IRandU64 {
	const u128_1 = U128.fromUint32Quad(1, 0, 0, 0);

	//Mul defined in source: https://github.com/imneme/pcg-c
	//PCG_DEFAULT_MULTIPLIER_128 | h,l=2549297995355413924ULL,4865540595714422341ULL
	// x2360ED051FC65DA44385DF649FCCF645 | 47026247687942121848144207491837523525
	const mul = U128.fromUint32Quad(
		0x9fccf645,
		0x4385df64,
		0x1fc65da4,
		0x2360ed05
	);

	//Default add provided in demo source: https://github.com/imneme/pcg-c
	//0x0000000000000001da3e39cb94b95bdb | 34172814569070222299
	const add =
		inc != undefined
			? inc.mut().lShiftEq(1).xorEq(u128_1)
			: U128.fromUint32Quad(0x94b95bdb, 0xda3e39cb, 0x00000001, 0x00000000);

	//Default seed provided in demo source: https://github.com/imneme/pcg-c
	//0x979c9a98d84620057d3e9cb6cfe0549b | 201526561274146932589719779721328219291
	const s = U128Mut.fromUint32Quad(
		0xcfe0549b,
		0x7d3e9cb6,
		0xd8462005,
		0x979c9a98
	);

	/** Get the next random number uint64 [0 - 18446744073709551615] */
	function pcg_setseq_128_xsl_rr_64_random_r(): U64 {
		//aka pcg64_random
		s.mulEq(mul).addEq(add); //pcg_setseq_128_step_r
		const u64s = s.mut64();
		//state>>>122, which is the same as >>>58 on the high (which is second because LE)
		const rot = u64s.at(1).rShift(58).low;
		//xor low and high, then rotr
		return u64s.at(0).xorEq(u64s.at(1)).rRotEq(rot);
	}

	//If a seed was provided, run the state-setup process
	//pcg_setseq_128_srandom_r
	if (seed != undefined) {
		s.set(U128.zero);
		s.mulEq(mul).addEq(add); //pcg_setseq_128_step_r
		s.addEq(seed);
		s.mulEq(mul).addEq(add); //pcg_setseq_128_step_r
	}

	return pcg_setseq_128_xsl_rr_64_random_r;
}
