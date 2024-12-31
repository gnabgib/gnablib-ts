/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U256 } from '../primitive/number/U256.js';
import { U64, U64MutArray } from '../primitive/number/U64.js';
import { IRandU64 } from './interfaces/IRandU64.js';

/**
 * XoShiRo256++/XoShiRo256** are all-purpose 64bit generators (not **cryptographically secure**).  If you're
 * only looking to generate float64, XoShiRo256+, which is slightly faster (~15%) can be used by using
 * only the top 53 bits - the lower bits have low linear complexity.
 */

/**
 * 
 * @param ret 
 * @param seed 
 * @returns 
 */
function xoshiro256(
	ret: (s: U64MutArray) => U64,
	seed: U256 | undefined
): IRandU64 {
	//SplitMix64(0) = E220A8397B1DCDAF, 6E789E6AA1B965F4, 06C45D188009454F, F88BB8A8724C81EC
	// Which in U32 little-endian follows
	const s =
		seed != undefined
			? seed.mut64()
			: U64MutArray.fromBytes(
					Uint32Array.of(
						0x7b1dcdaf,
						0xe220a839,
						0xa1b965f4,
						0x6e789e6a,
						0x8009454f,
						0x06c45d18,
						0x724c81ec,
						0xf88bb8a8
					)
			  );

	/** Get the next random number uint64 [0 - 18446744073709551615] */
	return () => {
		const r = ret(s);

		const t = s.at(1).lShift(17);
		s.at(2).xorEq(s.at(0));
		s.at(3).xorEq(s.at(1));
		s.at(1).xorEq(s.at(2));
		s.at(0).xorEq(s.at(3));
		s.at(2).xorEq(t);
		s.at(3).lRotEq(45);
		return r;
	};
}

/**
 * [XoShiRo256+](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 * using xor-shift-rotate, has 256bit state, and 64bit return
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoshiro256plus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoshiro256p(seed?: U256): IRandU64 {
	return xoshiro256((s) => s.at(0).add(s.at(3)), seed);
}

/**
 * [XoShiRo256++](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 * using xor-shift-rotate, has 256bit state, and 64bit return
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoshiro256plusplus.c)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoshiro256pp(seed?: U256): IRandU64 {
	return xoshiro256(function (s) {
		const r = s.at(0).add(s.at(3)).mut();
		r.lRotEq(23).addEq(s.at(0));
		return r;
	}, seed);
}

/**
 * [XoShiRo256**](https://vigna.di.unimi.it/ftp/papers/ScrambledLinear.pdf)
 * using xor-shift-rotate, has 256bit state, and 64bit return
 *
 * Generates numbers in the range [0 - 18446744073709551615]
 *
 * *NOT cryptographically secure*
 *
 * Related:
 *
 * - [C source](https://prng.di.unimi.it/xoshiro256starstar.c)
 * - [A Quick Look at Xoshiro256** (2018)](https://www.pcg-random.org/posts/a-quick-look-at-xoshiro256.html)
 * - [xoshiro / xoroshiro generators and the PRNG shootout](https://prng.di.unimi.it/#intro)
 *
 * @param seed Must be non-zero, it's recommended you use {@link prng.splitMix32 splitMix32},
 * {@link prng.splitMix64 splitMix64} on a numeric seed.
 * @returns Generator
 */
export function xoshiro256ss(seed?: U256): IRandU64 {
	const u64_5 = U64.fromInt(5);
	const u64_9 = U64.fromInt(9);
	return xoshiro256(function (s) {
		const r = s.at(1).mul(u64_5).mut();
		r.lRotEq(7).mulEq(u64_9);
		return r;
	}, seed);
}
