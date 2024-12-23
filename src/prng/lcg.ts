/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U64, U64Mut } from '../primitive/number/U64.js';
import { IRandInt } from './interfaces/IRandInt.js';

function lcg32(seed: number, mul: number, add: number, mod: number): IRandInt {
	let s = seed;
	/** Get the next random number */
	return () => {
		s = (s * mul + add) % mod; //2147483647
		return s;
	};
}
// Lehmer generator where mul-bits<=21 (Max safe int=2**53-1), and mod is base2 aligned,
// so we can mask instead
function lcg32b2(
	seed: number,
	mul: number,
	add: number,
	mask: number,
	shift: number
): IRandInt {
	let s = seed;
	/** Get the next random number */
	return () => {
		s = (s * mul + add) & mask;
		return s >>> shift;
	};
}

function lcg64(seed: number, mul: number, add: number): IRandInt {
	//Note `mod` is here, because the shift-31 below is related to the mod size,
	// so this would only work with mod=0x7fffffff, maybe we should instead accept a
	// power of 2 size (eg 2^31) which is used as the shift, and creates the mod.
	// But for now there's only one algo that uses this.
	const mod = 0x7fffffff;
	const a64 = U64.fromInt(add);
	let s = seed;
	/** Get the next random number */
	return () => {
		const prod = U64Mut.fromInt(s).mulEq32(mul).addEq(a64);
		let x = (prod.low & mod) + prod.rShiftEq(31).low;
		x = (x & mod) + (x >>> 31);
		return (s = x);
	};
}

/**
 * Build a [Lehmer](https://en.wikipedia.org/wiki/Lehmer_random_number_generator)
 * random generator, known as [MINSTD_RAND0](https://oeis.org/A096550) or MCG16807 from 1988.
 * Used in Apple CarbonLib, C++11, IBM SIMPL/I, IBM APL, PRIMOS, IMSL Scientific library
 *
 * multiplier = 16807 = 7^5 : an odd composite
 *
 * minstd_rand0 in C++11
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
export function MCG16807(seed = 1): IRandInt {
	return lcg32(seed, 16807, 0, 0x7fffffff);
}

/**
 * Build a [Lehmer](https://en.wikipedia.org/wiki/Lehmer_random_number_generator)
 * random generator, known as (MINSTD_RAND)[https://oeis.org/A221556] or MCG48271 from 1990.
 * Used in C+11
 *
 * multiplier = 48271 : prime
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
export function MCG48271(seed = 1): IRandInt {
	return lcg32(seed, 48271, 0, 0x7fffffff);
}

/**
 * Build a [Lehmer](https://en.wikipedia.org/wiki/Lehmer_random_number_generator)
 * random generator, known as (MINSTD3) or MCG69621
 *
 * multiplier = 69621 = 3 × 23 × 1009 : an odd composite
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
export function MCG69621(seed = 1): IRandInt {
	return lcg32(seed, 69621, 0, 0x7fffffff);
}

/**
 * Build a [Lehmer](https://en.wikipedia.org/wiki/Lehmer_random_number_generator)
 * random generator, known as MCG62089911
 *
 * multiplier = 62089911 (26b storage)
 * This is large enough (x3B36AB7) you have to use u64 space, which
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
export function MCG62089911(seed = 1): IRandInt {
	return lcg64(seed, 62089911, 0);
}

/**
 * Build a [MSVC](https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use)
 * [Linear congruential generator](https://en.wikipedia.org/wiki/Linear_congruential_generator)
 * rand()
 *
 * Mul=214013
 * Add=2531011
 * Mod=0x7fffffff
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in range 0 - 32767
 */
export function msvc(seed = 1): IRandInt {
	return lcg32b2(seed, 214013, 2531011, 0x7fffffff, 16);
}

/**
 * Build a [RANDU](https://en.wikipedia.org/wiki/RANDU)
 * [Linear congruential generator](https://en.wikipedia.org/wiki/Linear_congruential_generator)
 * random number generator.  Widely considered to be one of the most ill-conceived random number generators ever designed
 *
 * Mul=65539
 * Add=0
 * Mod=0x7fffffff
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
export function randu(seed = 1): IRandInt {
	return lcg32b2(seed, 65539, 0, 0x7fffffff, 0);
}
