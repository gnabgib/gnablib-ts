/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64MutArray } from '../primitive/number/U64.js';
import { IRandU64 } from './interfaces/IRandU64.js';

/**
 * [Small Fast Counting (SFC)](https://pracrand.sourceforge.net/RNG_engines.txt)
 * random generator using 256bit state, 64bit return as described in
 * [PractRand](https://pracrand.sourceforge.net/)
 *
 * *NOT cryptographically secure*
 *
 * @param seed An array of 2 or 6 elements 
 * @returns Generator of uint64 [0 - 18446744073709551615]
 */
export function sfc64(seed?: Uint32Array): IRandU64 {
	//Super inconsistent:
	// 16 seeds 3&4 parts with the same number of rounds (10)
	// 32 seeds 2&3 parts with 12 rounds for 2, 15 rounds for 3 (why would you need more rounds for more random data?.. it can't be worse than leading 0)
	// 64 seeds 2&6 parts with 12 rounds for 2, 18 rounds for 6 (why would you need more rounds for more random data?.. it can't be worse than 3* the same data)
	// Only 16 allows seeding the counter.

	//Default is the first 3 results of SplitMix64(0)
	// NOTE: note the fourth value is called "counter" and starts at 1 in the original source.
	// prettier-ignore
	const s = U64MutArray.fromU32s(
		0x7b1dcdaf,0xe220a839,//e220a8397b1dcdaf
		0xa1b965f4,0x6e789e6a,//6e789e6aa1b965f4
		0x8009454f,0x06c45d18,//06c45d188009454f
		1,0//0000000000000001
	);

	function raw64(): U64 {
		const t = s.at(0).mut().addEq(s.at(1)).addEq(s.at(3));
		s.at(3).addEq(U64.fromUint32Pair(1, 0));
		s.at(0).set(s.at(1).xorEq(s.at(1).rShiftEq(11))); //rshift=11
		s.at(1).set(s.at(2).add(s.at(2).lShift(3))); //lshift=3
		s.at(2).lRotEq(24).addEq(t); //barrel_shift=24
		return t;
	}

	function init() {
		//No seed, nothing to do
		if (seed == undefined) return;
		let u64: U64;
		switch (seed.length) {
			case 2:
				//seed(U64)
				u64 = U64.fromArray(seed, 0);
				s.at(0).set(u64);
				s.at(1).set(u64);
				s.at(2).set(u64);
				for (let i = 0; i < 12; i++) raw64();
				break;
			case 6:
				//seed(s1,s2,s3)
				s.at(0).set(U64.fromArray(seed, 0));
				s.at(1).set(U64.fromArray(seed, 2));
				s.at(2).set(U64.fromArray(seed, 4));
				for (let i = 0; i < 18; i++) raw64();
				break;
			default:
				throw new Error('Seed should be 2 or 6 elements long');
		}
	}
	init();
	return raw64;
}
