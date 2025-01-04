/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { sNum } from '../safe/safe.js';

/**
 * Build a [Marsaglia](https://groups.google.com/g/sci.math/c/6BIYd0cafQo/m/Ucipn_5T_TMJ?hl=en)
 * random number generator (suitable for brain calculation)
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting two digit number (1-99)
 * @returns Generator of [0 - 9]
 */
export function marsaglia(seed: number) {
	sNum('seed', seed).natural().atMost(99).throwNot();
	seed |= 0;
	/** Return a new number [0-9] */
	function rand(): number {
		const units = seed % 10;
		const tens = (seed / 10) | 0;
		seed = tens + 6 * units;
		return seed % 10;
	}
	return rand;
}
