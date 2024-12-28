/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U128 } from '../primitive/number/U128.js';
import { IRandUInt } from './interfaces/IRandInt.js';

/**
 * [XoShiRo128+](https://prng.di.unimi.it/#intro) using xor-shift-rotate, has 128bit state, and 32bit return
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * [C source](https://prng.di.unimi.it/xoshiro128plus.c)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * The default seed comes from [umontreal-simul code](https://github.com/umontreal-simul/TestU01-2009/)
 * @returns Generator
 */
export function xoshiro128plus(seed?: U128): IRandUInt {
	const s =
		seed != undefined ? seed.mut32() : Uint32Array.of(53, 30301, 71423, 49323);
	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		const r = s[0] + s[3];
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
 * [XoShiRo128++](https://prng.di.unimi.it/#intro) using xor-shift-rotate, has 128bit state, and 32bit return
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * [C source](https://prng.di.unimi.it/xoshiro128plusplus.c)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * The default seed comes from [umontreal-simul code](https://github.com/umontreal-simul/TestU01-2009/)
 * @returns Generator
 */
export function xoshiro128plusPlus(seed?: U128): IRandUInt {
	const s =
		seed != undefined ? seed.mut32() : Uint32Array.of(53, 30301, 71423, 49323);
	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		let r = s[0] + s[3];
		r = (r << 7) | (r >>> 25); //ROL 7
		r += s[0];
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
 * [XoShiRo128**](https://prng.di.unimi.it/#intro) using xor-shift-rotate, has 128bit state, and 32bit return
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * [C source](https://prng.di.unimi.it/xoshiro128starstar.c)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * The default seed comes from [umontreal-simul code](https://github.com/umontreal-simul/TestU01-2009/)
 * @returns Generator
 */
export function xoshiro128starStar(seed?: U128): IRandUInt {
	const s =
		seed != undefined ? seed.mut32() : Uint32Array.of(53, 30301, 71423, 49323);
	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		let r = s[1] * 5;
		r = (r << 7) | (r >>> 25); //ROL 7
		r *= 9;

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

//https://prng.di.unimi.it/xoroshiro128plus.c
