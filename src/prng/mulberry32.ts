/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { IRandU32 } from './interfaces/IRandInt.js';

/**
 * Mulberry32 RNG
 *
 * *NOT cryptographically secure*
 * 
 * Related:
 * - [Original mulberry32.c](https://gist.github.com/tommyettinger/46a874533244883189143505d203312c)
 *
 * @param seed
 * @returns Generator of uint32 [0 - 4294967295]
 */
export function mulberry32(seed = 0): IRandU32 {
	let s = seed;
	return () => {
		s = (s+0x6d2b79f5)|0;
		let r = s;
		r = Math.imul(r ^ (r >>> 15), r | 1);
		r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
		return (r ^ (r >>> 14)) >>> 0;
	};
}
