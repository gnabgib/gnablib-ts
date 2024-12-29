/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { IRandUInt } from './interfaces/IRandInt.js';

/**
 * Mulberry32 RNG
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * @param seed
 * @returns Generator
 */
export function mulberry32(seed = 0): IRandUInt {
	let s = seed;
	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		s += 0x6d2b79f5;
		let r = s;
		r = Math.imul(r ^ (r >>> 15), r | 1);
		r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
		return (r ^ (r >>> 14)) >>> 0;
	};
}
