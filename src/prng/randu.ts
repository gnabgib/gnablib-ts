/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { IRandInt } from './interfaces/IRandInt.js';

/**
 * Build a [RANDU](https://en.wikipedia.org/wiki/RANDU)
 * [Linear congruential generator](https://en.wikipedia.org/wiki/Linear_congruential_generator)
 * random number generator.  Widely considered to be one of the most ill-conceived random number generators ever designed
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
export function randu(seed = 1): IRandInt {
	let s = seed;
	//a= 65539 c=0
	/** Get the next random number */
	return () => {
		s = (s * 65539) & 0x7fffffff;
		return s;
	};
}
