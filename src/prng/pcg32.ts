/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64Mut } from '../primitive/number/U64.js';
import { IRandUInt } from './interfaces/IRandInt.js';

/**
 * Permuted Congruential Generator (PCG) using 64bit state, 32bit return as described in
 * [PCG: A Family of Simple Fast Space-Efficient Statistically Good Algorithms for Random Number Generation](https://www.pcg-random.org/pdf/hmc-cs-2014-0905.pdf)
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [PCG, A Family of Better Random Number Generators](https://www.pcg-random.org/)
 *
 * @param seed
 * @returns Generator
 */
export function pcg32(seed?: U64, inc?: U64): IRandUInt {
	const u64_1 = U64.fromUint32Pair(1, 0);

	//Mul defined in source: https://github.com/imneme/pcg-c
	const mul = U64.fromUint32Pair(0x4c957f2d, 0x5851f42d); //6364136223846793005

	//Default add provided in demo source: https://github.com/imneme/pcg-c
	//0xda3e39cb94b95bdb | 15726070495360670683
	const add =
		inc != undefined
			? inc.mut().lShiftEq(1).xorEq(u64_1)
			: U64.fromUint32Pair(0x94b95bdb, 0xda3e39cb);

	//Default seed provided in demo source: https://github.com/imneme/pcg-c
	//0x853c49e6748fea9bULL | 9600629759793949339
	const s = U64Mut.fromUint32Pair(0x748fea9b, 0x853c49e6);

	/** Get the next random number uint32 [0 - 4294967295] */
	function pcg32_xsh_rr(): number {
		//XSH-RR
		const oldState = s.mut();
		const rot = s.high >>> 27; ///same as: s.rShift(59).low;
		const r = oldState.xorEq(oldState.rShift(18)).rShiftEq(27).low;
		s.mulEq(mul).addEq(add);
		return ((r >>> rot) | (r << (32 - rot))) >>> 0;
	}

	//If a seed was provided, run the state-setup process
	if (seed != undefined) {
		s.set(U64.zero);
		s.mulEq(mul).addEq(add);
		s.addEq(seed);
		s.mulEq(mul).addEq(add);
	}

	return pcg32_xsh_rr;
}
