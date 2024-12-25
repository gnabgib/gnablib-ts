/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U64 } from '../primitive/number/U64.js';
import { IRandU64 } from './interfaces/IRandU64.js';

/**
 * SplitMix64 as described in paper
 * [Fast splittable pseudorandom number generators](https://doi.org/10.1145/2660193.2660195)
 * 
 * Generates numbers in the range [0 - 18446744073709551615]
 * 
 * *NOT cryptographically secure*
 * 
 * @param seed
 * @returns Generator
 */
export function splitMix64(seed = U64.zero): IRandU64 {
	// floor( ( (1+sqrt(5))/2 ) * 2**64 MOD 2**64)
	const golden_gamma = U64.fromUint32Pair(0x7f4a7c15, 0x9e3779b9);
	const bMul = U64.fromUint32Pair(0x1ce4e5b9, 0xbf58476d);
	const cMul = U64.fromUint32Pair(0x133111eb, 0x94d049bb);
    //We can const this because it changes internal state (being a Mut)
	const s = seed.mut();

	return () => {
		const z = s.addEq(golden_gamma).clone();
		z.xorEq(z.rShift(30)).mulEq(bMul);
		z.xorEq(z.rShift(27)).mulEq(cMul);
		return z.xorEq(z.rShift(31));
	};
}
