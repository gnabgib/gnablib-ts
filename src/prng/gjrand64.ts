/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U128 } from '../primitive/number/U128.js';
import { U64, U64MutArray } from '../primitive/number/U64.js';
import { IRandU32 } from './interfaces/IRandInt.js';
import { IRandU64 } from './interfaces/IRandU64.js';

function gjrand<T>(
	seed: number | U64 | U128 | undefined,
	ret: (s: U64MutArray) => T
): () => T {
	const s = U64MutArray.fromLen(4);

	function crank() {
		s.at(1).addEq(s.at(2));
		s.at(0).lRotEq(32);
		s.at(2).xorEq(s.at(1));
		s.at(3).addEq(U64.fromInt(0x55aa96a5));
		s.at(0).addEq(s.at(1));
		s.at(2).lRotEq(23);
		s.at(1).xorEq(s.at(0));
		s.at(0).addEq(s.at(2));
		s.at(1).lRotEq(19);
		s.at(2).addEq(s.at(0));
		s.at(1).addEq(s.at(3));
	}

	if (seed == undefined) {
		//Pre computed state from gjrand32(0) + 14*crank
		s.at(0).set(U64.fromUint32Pair(2361955991, 2308445249));
		s.at(1).set(U64.fromUint32Pair(4286249029, 4038403806));
		s.at(2).set(U64.fromUint32Pair(403824257, 4256023257));
		s.at(3).set(U64.fromUint32Pair(2941533446, 4));
	} else if (seed instanceof U64) {
		s.at(0).set(seed);
		s.at(2).set(U64.fromIntUnsafe(2000001));
		for (let i = 0; i < 14; i++) crank();
	} else if (seed instanceof U128) {
		const u64 = seed.mut64();
		s.at(0).set(u64.at(1));
		s.at(1).set(u64.at(0));
		s.at(2).set(U64.fromIntUnsafe(5000001));
		for (let i = 0; i < 14; i++) crank();
	} else {
		s.at(0).set(U64.fromInt(seed));
		s.at(2).set(U64.fromIntUnsafe(1000001));
		for (let i = 0; i < 14; i++) crank();
	}

	return function () {
		crank();
		return ret(s);
	};
}

/**
 * GJrand random generator using 256bit state, 32bit return
 * as described in
 * [gjrand random numbers](https://gjrand.sourceforge.net/) 4.3.0 release
 *
 * *Note* You can call this with zero seeds, which is the same as seeding with a single seed of 0
 *
 * *NOT cryptographically secure*
 *
 * @param seed
 * @returns
 */
export function gjrand32(seed?: number | U64 | U128): IRandU32 {
	return gjrand(seed, (s) => s.at(0).low);
}

/**
 * GJrand random generator using 256bit state, 64bit return
 * as described in
 * [gjrand random numbers](https://gjrand.sourceforge.net/) 4.3.0 release
 *
 * *Note* You can call this with zero seeds, which is the same as seeding with a single seed of 0
 *
 * *NOT cryptographically secure*
 *
 * @param seed
 * @returns
 */
export function gjrand64(seed?: U64 | U128): IRandU64 {
	//Have to clone the element (otherwise it's shared memory)
	return gjrand(seed, (s) => s.at(0).clone());
}
