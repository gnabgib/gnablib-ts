/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U64, U64Mut } from '../primitive/number/U64.js';
import { IRandU64 } from './interfaces/IRandU64.js';

/**
 * XorShift with 64bit state, 64bit return as described in
 * [XorShift RNGs](https://www.jstatsoft.org/article/view/v008i14) section 3
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * @param seed Must be non-zero
 * @returns Generator
 */
export function xorShift64(seed?: U64): IRandU64 {
	const s =
		seed != undefined
			? seed.mut()
			: U64Mut.fromUint32Pair(0xcbbf7a44, 0x139408d);
	/** Get the next random number uint64 [0 - 18446744073709551615] */
	return () => {
		s.xorEq(s.lShift(13));
		s.xorEq(s.rShift(7));
		s.xorEq(s.lShift(17));
		return s.clone();
	};
}
