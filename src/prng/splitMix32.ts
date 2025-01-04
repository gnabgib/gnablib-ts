/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { IRandU32 } from './interfaces/IRandInt.js';

/**
 * SplitMix32 as described in paper
 * [Fast splittable pseudorandom number generators](https://doi.org/10.1145/2660193.2660195)
 *
 * *NOT cryptographically secure*
 *
 * @param seed
 * @returns Generator of uint32 [0 - 4294967295]
 */
export function splitMix32(seed = 0): IRandU32 {
	const fib_hash_const = 0x9e3779b9; //2654435769

	return () => {
		seed += fib_hash_const;
		let r = seed;
		r ^= r >>> 16;
		r = Math.imul(r,0x85ebca6b);
		//Mul in two stages (12+20) to avoid conversion to floating point
		//r = ((r*0x85e00000)>>>0)+(r*0xbca6b);//*=0x85ebca6b
		r ^= r >>> 13;
		r = Math.imul(r,0xc2b2ae35);
		r ^= r >>> 16;
		return r >>> 0;
	};
}
