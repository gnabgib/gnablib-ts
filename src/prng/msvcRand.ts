/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../safe/index.js';
import { IRandInt } from './IRandInt.js';

/**
 * Build a [MSVC](https://orlp.net/blog/when-random-isnt/)
 * [Linear congruential generator](https://en.wikipedia.org/wiki/Linear_congruential_generator)
 * rand()
 *
 * *NOT cryptographically secure*
 * @param seed Starting state - valid integer
 * @returns function to produce integers in range 0 - 32767
 */
export function msvcRand(seed = 1): IRandInt {
	safe.int.is(seed);
	let s = seed >>> 0; //cast to u32

	/** Returns next random number (0-32767) */
	function rand(): number {
		s = (s * 214013 + 2531011) >>> 0;
		return (s >>> 16) & 0x7fff;
	}
	return rand;
}
