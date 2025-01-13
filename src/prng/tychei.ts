/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64 } from '../primitive/number/U64.js';
import { IRandU32 } from './interfaces/IRandInt.js';

/**
 * Inverted Tyche random numbers using 128bit state, 32bit return.  As defined in
 * [Fast and Small Nonlinear Pseudorandom Number Generators for Computer Simulation](https://www.researchgate.net/publication/233997772_Fast_and_Small_Nonlinear_Pseudorandom_Number_Generators_for_Computer_Simulation)
 *
 * *NOT cryptographically secure*
 *
 * @param seeds 1, 2, or 4 numbers, which will be treated as U32 to seed the PRNG
 * @returns Generator of uint32 [0 - 4294967295]
 */
export function tychei(seed = U64.zero): IRandU32 {
	const s = Uint32Array.of(seed.high, seed.low, 2654435769, 1367130551);

	function next() {
		s[1] = ((s[1] << 25) | (s[1] >>> 7)) ^ s[2];
		s[2] -= s[3];
		s[3] = ((s[3] << 24) | (s[3] >>> 8)) ^ s[0];
		s[0] -= s[1];
		s[1] = ((s[1] << 20) | (s[1] >>> 12)) ^ s[2];
		s[2] -= s[3];
		s[3] = ((s[3] << 16) | (s[3] >>> 16)) ^ s[0];
		s[0] -= s[1];
		return s[0];
	}

	for (let i = 0; i < 20; i++) next();

	return next;
}
