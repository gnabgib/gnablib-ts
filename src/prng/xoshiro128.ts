/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U128 } from '../primitive/number/U128.js';
import { IRandUInt } from './interfaces/IRandInt.js';

function xoshiro128(
	ret: (s: Uint32Array) => number,
	seed: U128 | undefined
): IRandUInt {
	//This default seed comes from [umontreal-simul code](https://github.com/umontreal-simul/TestU01-2009/)
	const s =
		seed != undefined ? seed.mut32() : Uint32Array.of(53, 30301, 71423, 49323);

	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		const r = ret(s);

		const t = s[1] << 9;
		s[2] ^= s[0];
		s[3] ^= s[1];
		s[1] ^= s[2];
		s[0] ^= s[3];
		s[2] ^= t;
		s[3] = (s[3] << 11) | (s[3] >>> 21); //ROL 11
		return r >>> 0;
	};
}

/**
 * XoShiRo128+ using xor-shift-rotate, with 128bit state, 32bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoshiro128plus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoshiro128plus(seed?: U128): IRandUInt {
	return xoshiro128((s) => s[0] + s[3], seed);
}

/**
 * XoShiRo128++ using xor-shift-rotate, with 128bit state, 32bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoshiro128plusplus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoshiro128plusPlus(seed?: U128): IRandUInt {
	return xoshiro128(function (s) {
		let r = s[0] + s[3];
		r = (r << 7) | (r >>> 25); //ROL 7
		return r + s[0];
	}, seed);
}

/**
 * XoShiRo128** using xor-shift-rotate, with 128bit state, 32bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoshiro128starstar.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoshiro128starStar(seed?: U128): IRandUInt {
	return xoshiro128(function (s) {
		let r = s[1] * 5;
		r = (r << 7) | (r >>> 25); //ROL 7
		r *= 9;
		return r >>> 0;
	}, seed);
}

//https://prng.di.unimi.it/xoroshiro128plus.c
