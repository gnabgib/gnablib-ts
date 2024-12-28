/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U128 } from '../primitive/number/U128.js';
import { IRandUInt } from './interfaces/IRandInt.js';

/**
 * XorShift with 128bit state, 32bit return as described in
 * [XorShift RNGs](https://www.jstatsoft.org/article/view/v008i14) section 4
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * @param seed Must be non-zero, default value from the paper
 * @returns Generator
 */
export function xorShift128(seed?: U128): IRandUInt {
	const s =
		seed != undefined
			? seed.mut32()
			: Uint32Array.of(123456789, 362436069, 521288629, 88675123);
	/** Get the next random number uint64 [0 - 18446744073709551615] */
	return () => {
		let t = s[0] ^ (s[0] << 11);
		s[0] = s[1];
		s[1] = s[2];
		s[2] = s[3];
		s[3] = s[3] ^ (s[3] >>> 19) ^ (t ^ (t >>> 8));
		return s[3] >>> 0;
	};
}
