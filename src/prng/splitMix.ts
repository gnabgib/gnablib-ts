/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U64 } from '../primitive/number/U64.js';
import { IRandUInt } from './interfaces/IRandInt.js';
import { IRandU64 } from './interfaces/IRandU64.js';

/**
 * SplitMix64 as described in paper
 * [Fast splittable pseudorandom number generators](https://doi.org/10.1145/2660193.2660195)
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * @param seed
 * @returns Generator
 */
export function splitMix64(seed = U64.zero): IRandU64 {
	// floor( ( (1+sqrt(5))/2 ) * 2**64 MOD 2**64)
	const golden_gamma = U64.fromUint32Pair(0x7f4a7c15, 0x9e3779b9);
	const bMul = U64.fromUint32Pair(0x1ce4e5b9, 0xbf58476d);
	const cMul = U64.fromUint32Pair(0x133111eb, 0x94d049bb);
	//We can const this because it changes internal state (being a Mut)
	const s = seed.mut();

	/** Get the next random number uint64 [0 - 18446744073709551615] */
	return () => {
		const z = s.addEq(golden_gamma).clone();
		z.xorEq(z.rShift(30)).mulEq(bMul);
		z.xorEq(z.rShift(27)).mulEq(cMul);
		return z.xorEq(z.rShift(31));
	};
}

/**
 * SplitMix32 as described in paper
 * [Fast splittable pseudorandom number generators](https://doi.org/10.1145/2660193.2660195)
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * @param seed
 * @returns Generator
 */
export function splitMix32(seed = 0): IRandUInt {
	const fib_hash_const = 0x9e3779b9; //2654435769

	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		seed += fib_hash_const;
		let r = seed;
		r ^= r >>> 16;
		r = Math.imul(r,0x85ebca6b);
		//Mul in two stages (12+20) to avoid conversion to floating point
		//r = ((r*0x85e00000)>>>0)+(r*0xbca6b);//*=0x85ebca6b
		r ^= r >>> 13;
		r = Math.imul(r,0xc2b2ae35);
		//r = ((r*0xc2b00000)>>>0)+(r*0x2ae35);//*=0xc2b2ae35
		r ^= r >>> 16;
		return r >>> 0;
	};
}
