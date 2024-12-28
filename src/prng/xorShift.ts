/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U128 } from '../primitive/number/U128.js';
import { U64 } from '../primitive/number/U64.js';
import { IRandUInt } from './interfaces/IRandInt.js';
import { IRandU64 } from './interfaces/IRandU64.js';

/**
 * XorShift with 32bit state, 32bit return as described in
 * [XorShift RNGs](https://www.jstatsoft.org/article/view/v008i14) section 3
 * 
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * @param seed Must be non-zero
 * @returns Generator
 */
export function xorShift32(seed = 2463534242): IRandUInt {
	let s = seed;
	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		return s >>> 0;
	};
}

/**
 * XorShift with 64bit state, 64bit return as described in
 * [XorShift RNGs](https://www.jstatsoft.org/article/view/v008i14) section 3
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * @param seed Must be non-zero
 * @returns Generator
 */
export function xorShift64(seed?: U64): IRandU64 {
	if (seed == undefined) seed = U64.fromUint32Pair(0xcbbf7a44, 0x139408d);
	const s = seed.mut();
	/** Get the next random number uint64 [0 - 18446744073709551615] */
	return () => {
		s.xorEq(s.lShift(13));
		s.xorEq(s.rShift(7));
		s.xorEq(s.lShift(17));
		return s.clone();
	};
}

/**
 * XorShift with 128bit state, 32bit return as described in 
 * [XorShift RNGs](https://www.jstatsoft.org/article/view/v008i14) section 4
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * @param seed Must be non-zero, default value from the paper
 * @returns Generator
 */
export function xorShift128(seed?: U128): IRandUInt {
    const s = seed!=undefined ? seed.mut32() : Uint32Array.of(123456789, 362436069, 521288629, 88675123);
	/** Get the next random number uint64 [0 - 18446744073709551615] */
	return () => {
		let t = s[0] ^ (s[0] << 11);
		s[0] = s[1];
		s[1] = s[2];
		s[2] = s[3];
		s[3] = s[3] ^ (s[3] >>> 19) ^ (t ^ (t >>> 8));
		return s[3] >>> 0;
	};
}

function xorShift128plus_(
	seed: U128,
	a: number,
	b: number,
	c: number
): IRandU64 {
	const s = seed.mut64();
	/** Get the next random number uint64 [0 - 18446744073709551615] */
	return () => {
		const s1 = s.at(0).mut();
		const s0 = s.at(1);
		const ret = s0.add(s1);
		//good

		s.at(0).set(s0);
		s1.xorEq(s1.lShift(a));

		s.at(1).set(s1.xor(s0).xor(s1.rShift(b)).xor(s0.rShift(c)));
		return ret;
	};
}

/**
 * XorShift with 128bit state, 64bit return as described in
 * [Vigna XorShift128plus](http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf)
 *
 * `a=23`, `b=18`, `c=5`
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 * 
 * Related:
 * [The Xorshift128+ random number generator fails BigCrush](https://lemire.me/blog/2017/09/08/the-xorshift128-random-number-generator-fails-bigcrush/)
 *
 * @param seed Must be non-zero
 * @returns Generator
 */
export function xorShift128plus(seed: U128): IRandU64 {
	return xorShift128plus_(seed, 23, 18, 5);
}

/**
 * XorShift with 128bit state, 64bit return as described in
 * [Vigna XorShift128plus](http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf)
 * using the same tuning parameters as the v8 implementation
 * 
 * `a=23`, `b=17`, `c=27`
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 * 
 * Related:
 * [The Xorshift128+ random number generator fails BigCrush](https://lemire.me/blog/2017/09/08/the-xorshift128-random-number-generator-fails-bigcrush/)
 *
 * @param seed Must be non-zero
 * @returns Generator
 */
export function xorShift128plusV8(seed: U128): IRandU64 {
	return xorShift128plus_(seed, 23, 17, 26);
}

// export function xoshiro128PlusPlus(seed:U128):IRandUInt {

// }
