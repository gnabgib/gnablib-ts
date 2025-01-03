/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U512 } from '../primitive/number/U512.js';
import { IRandUInt } from './interfaces/IRandInt.js';

//Default state, while not recommended, was found in one of the C source code versions
// which gives reasonably good test results
const defaultState = Uint32Array.of(
	3141592653,
	589793238,
	462643383,
	2795028841,
	971693993,
	751058209,
	749445923,
	781640628,
	620899862,
	803482534,
	2117067982,
	1480865132,
	823066470,
	938446095,
	505822317,
	2535940812
);

/**
 * [Well equidistributed long-period linear (WELL)](https://en.wikipedia.org/wiki/Well_equidistributed_long-period_linear)
 * random generator using 512bit state, 32bit return as described in
 * [Improved Long-Period Generators Based on Linear Recurrences Modulo 2](http://www.iro.umontreal.ca/~lecuyer/myftp/papers/wellrng.pdf)
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [Random Number Generation](http://lomont.org/papers/2008/Lomont_PRNG_2008.pdf)] Section: *WELL Algorithm*
 * - [well512.c](https://github.com/Bill-Gray/prngs/blob/master/well512.c)
 *
 * @param seed
 * @returns Generator
 */
export function well512(seed?: U512): IRandUInt {
	let ptr = 0;
    const s = seed!=undefined?seed.mut32():defaultState;

	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		let a = s[ptr];
		let c = s[(ptr + 13) & 0xf];
		let b = a ^ (a << 16) ^ c ^ (c << 15);
		c = s[(ptr + 9) & 15];
		c ^= c >>> 11;
		a = s[ptr] = b ^ c;
		let d = a ^ ((a << 5) & 0xda442d24);
		ptr = (ptr + 15) & 15;
		a = s[ptr];
		s[ptr] = a ^ b ^ d ^ (a << 2) ^ (b << 18) ^ (c << 28);
		return s[ptr];
	};
}
