/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { ContentError } from '../primitive/error/ContentError.js';
import { superSafe as safe } from '../safe/index.js';
import { IRandInt } from './interfaces/IRandInt.js';

/**
 * Build a [middle-square](https://en.wikipedia.org/wiki/Middle-square_method)
 * random number generator that generates numbers of the same number of digits as $seed
 *
 * *NOT cryptographically secure*
 *
 * You only need to provide n if the seed should be considered larger in magnitude
 * eg. seed(1) is invalid, while seed(1,2) is valid (zero padded 1)
 *
 * @param seed Starting state, subsequent numbers will have the same number of (base 10) digits, must be>0 and have an even number of digits
 * @param n Number of digits, only need be provided if seed should padded, must be >=2 and even
 * @returns function to produce integers in range 0 - (10**n -1)
 */
export function middleSquare(seed: number, n?: number): IRandInt {
	safe.int.is(seed);
	let s = seed >>> 0; //cast to u32
	//If n isn't defined, count from seed.. note you really don't need
	// to provide n unless the seed should be zero padded.
	if (!n) {
		n = (Math.log10(seed) | 0) + 1;
	}
	if ((n & 1) === 1) throw new ContentError('must be even', 'n', n);
	const div = 10 ** (n / 2);
	const mod = 10 ** n;

	/** Return a new number with the same number of digits as seed */
	function rand(): number {
		s = Math.floor((s * s) / div) % mod;
		return s;
	}
	return rand;
}
