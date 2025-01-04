/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { U128 } from '../primitive/number/U128.js';
import { U64MutArray } from '../primitive/number/U64.js';
import { IRandU64 } from './interfaces/IRandU64.js';

function xorShift128plus_(
	seed: U128 | undefined,
	a: number,
	b: number,
	c: number
): IRandU64 {
	//splitMix64(0) = E220A8397B1DCDAF 6E789E6AA1B965F4
	const s =
		seed != undefined
			? seed.mut64()
			: U64MutArray.fromBytes(
					Uint32Array.of(0x7b1dcdaf, 0xe220a839, 0xa1b965f4, 0x6e789e6a)
			  );
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
 * *NOT cryptographically secure*
 *
 * Related:
 * - [The Xorshift128+ random number generator fails BigCrush](https://lemire.me/blog/2017/09/08/the-xorshift128-random-number-generator-fails-bigcrush/)
 *
 * @param seed Must be non-zero
 * @returns Generator of uint64 [0 - 18446744073709551615]
 */
export function xorShift128plus(seed?: U128): IRandU64 {
	return xorShift128plus_(seed, 23, 18, 5);
}

/**
 * XorShift with 128bit state, 64bit return as described in
 * [Vigna XorShift128plus](http://vigna.di.unimi.it/ftp/papers/xorshiftplus.pdf)
 * using the same tuning parameters as the v8 implementation
 *
 * `a=23`, `b=17`, `c=27`
 *
 * *NOT cryptographically secure*
 *
 * Related:
 * - [The Xorshift128+ random number generator fails BigCrush](https://lemire.me/blog/2017/09/08/the-xorshift128-random-number-generator-fails-bigcrush/)
 *
 * @param seed Must be non-zero
 * @returns Generator of uint64 [0 - 18446744073709551615]
 */
export function xorShift128plusV8(seed?: U128): IRandU64 {
	return xorShift128plus_(seed, 23, 17, 26);
}
