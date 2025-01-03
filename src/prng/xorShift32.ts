/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { IRandUInt } from './interfaces/IRandInt.js';

/**
 * XorShift with 32bit state, 32bit return as described in
 * [XorShift RNGs](https://www.jstatsoft.org/article/view/v008i14) section 3
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * @param seed Must be non-zero
 * @returns Generator
 */
export function xorShift32(seed = 2463534242): IRandUInt {
	let s = seed;
	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		return s >>> 0;
	};
}
