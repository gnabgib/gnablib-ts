/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U128 } from '../primitive/number/U128.js';
import { U64, U64Mut, U64MutArray } from '../primitive/number/U64.js';
import { IRandU64 } from './interfaces/IRandU64.js';

function xoroshiro128(
	ret: (s0: U64Mut, s1: U64Mut) => U64,
	seed: U128 | undefined,
	a: number,
	b: number,
	c: number
): IRandU64 {
	//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4 | 16294208416658607535, 7960286522194355700
	// Which in U32 little-endian follows
	const s =
		seed != undefined
			? seed.mut64()
			: U64MutArray.fromBytes(
					Uint32Array.of(0x7b1dcdaf, 0xe220a839, 0xa1b965f4, 0x6e789e6a)
			  );

	/** Get the next random number uint32 [0 - 18446744073709551615] */
	return () => {
		const s0 = s.at(0);
		const s1 = s.at(1);
		const r = ret(s0, s1);

		s1.xorEq(s0);
		s0.lRotEq(a).xorEq(s1).xorEq(s1.lShift(b));
		s1.lRotEq(c);
		return r;
	};
}

/**
 * XoRoShiRo128+ using xor-rotate-shift-rotate, with 128bit state, 64bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * **Note** these are the updated a/b/c parameters from 2018 (preferred)
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoroshiro128plus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoroshiro128p(seed?: U128): IRandU64 {
	return xoroshiro128(
		function (s0, s1) {
			return s0.add(s1);
		},
		seed,
		24,
		16,
		37
	);
}

/**
 * XoRoShiRo128+ using xor-rotate-shift-rotate, with 128bit state, 64bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * **Note** these are the original a/b/c parameters from 2016, prefer {@link xoroshiro128p xoroshiro128+}
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoroshiro128plus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoroshiro128p_2016(seed?: U128): IRandU64 {
	return xoroshiro128(
		function (s0, s1) {
			return s0.add(s1);
		},
		seed,
		55,
		14,
		36
	);
}

/**
 * XoRoShiRo128++ using xor-rotate-shift-rotate, with 128bit state, 64bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoroshiro128plusplus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoroshiro128pp(seed?: U128): IRandU64 {
	return xoroshiro128(
		function (s0, s1) {
			return s0.mut().addEq(s1).lRotEq(17).addEq(s0);
		},
		seed,
		49,
		21,
		28
	);
}

/**
 * XoRoShiRo128** using xor-rotate-shift-rotate, with 128bit state, 64bit return as described in
 * [Scrambled Linear Pseudorandom Number Generators](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoroshiro128starstar.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoroshiro128ss(seed?: U128): IRandU64 {
	const u64_5 = U64.fromInt(5);
	const u64_9 = U64.fromInt(9);
	return xoroshiro128(
		function (s0, s1) {
			return s0.mut().mulEq(u64_5).lRotEq(7).mulEq(u64_9);
		},
		seed,
		24,
		16,
		37
	);
}
