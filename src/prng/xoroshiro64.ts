/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U64 } from '../primitive/number/U64.js';
import { IRandUInt } from './interfaces/IRandInt.js';

function xoroshiro64(
	ret: (s: Uint32Array) => number,
	seed: U64 | undefined
): IRandUInt {
	//SplitMix64(0) = E220A8397B1DCDAF | 16294208416658607535
	// Which in U32 little-endian follows
	const s =
		seed != undefined ? seed.mut32() : Uint32Array.of(0x7b1dcdaf, 0xe220a839);

	/** Get the next random number uint32 [0 - 18446744073709551615] */
	return () => {
		const r = ret(s);
		s[1] ^= s[0];
		s[0] = ((s[0] << 26) | (s[0] >>> 6)) ^ s[1] ^ (s[1] << 9); //lRot 26 a=26, b=9
		s[1] = (s[1] << 13) | (s[1] >>> 19); //lRot 13 c=13
		return r>>>0;
	};
}

/**
 * XoRoShiRo64* using xor-rotate-shift-rotate, with 64bit state, 32bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoroshiro64star.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoroshiro64s(seed?: U64): IRandUInt {
	return xoroshiro64(function (s) {
		return Math.imul(s[0], 0x9e3779bb);
	}, seed);
}

/**
 * XoRoShiRo64** using xor-rotate-shift-rotate, with 64bit state, 32bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoroshiro64starstar.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoroshiro64ss(seed?: U64): IRandUInt {
	return xoroshiro64(function (s) {
		const r = Math.imul(s[0], 0x9e3779bb);
		return Math.imul((r << 5) | (r >>> 27), 5);
	}, seed);
}
