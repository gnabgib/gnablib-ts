/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { IRandUInt } from './interfaces/IRandInt.js';

function mt(seed: number): IRandUInt {
	const umask = 0x80000000; //0xFFFFFFFF << r
	const lmask = 0x7fffffff; //0xFFFFFFFF >> (w-r=1)
	const a = 0x9908b0df;
	const state = new Uint32Array(624);
	let idx = 0;
	//Init
	state[0] = seed;
	//console.log(`s[0]=${seed}`);
	for (let i = 1; i < state.length; i++) {
		const l = state[i - 1] ^ (state[i - 1] >>> 30);
		state[i]=Math.imul(0x6C078965,l)+i;
		//f=1812433253=x6C078965, but we only have 53 bits.. and this is 31bits long, so let's split into 12+20 bits,
		// and do each multiply separately so we don't loose resolution (although the first may go FP, it'll be zeros
        // low)
		// Note the last 0 is hard to spot, it's x6C0<<20
		//state[i] = ((0x6c000000 * l) >>> 0) + 0x78965 * l + i;
	}
	twist();

	function twist() {
		let i = 0;
		let y;
		for (; i < 227; i++) {
			y = (state[i] & umask) | (state[i + 1] & lmask);
			state[i] = state[i + 397] ^ (y >>> 1);
            if (y&1) state[i] ^= a;
		}
		for (; i < 623; i++) {
			y = (state[i] & umask) | (state[i + 1] & lmask);
			state[i] = state[i - 227] ^ (y >>> 1);
            if (y&1) state[i] ^= a;
		}
		y = (state[i] & umask) | (state[0] & lmask);
		state[i] = state[396] ^ (y >>> 1);
        if (y&1) state[i] ^= a;
		idx = 0;
	}

	/** Get the next random number uint32 [0 - 4294967295] */
	return () => {
		if (idx >= 624) twist();
		let y = state[idx++];
		y ^= y >>> 11; //TEMPERING_SHIFT_U
		y ^= (y << 7) & 0x9d2c5680; //TEMPERING_SHIFT_S & B
		y ^= (y << 15) & 0xefc60000; //TEMPERING_SHIFT_T & C
		y ^= y >>> 18; //TEMPERING_SHIFT_L
		return y >>> 0;
	};
}

/**
 * [Mersenne Twister](https://en.wikipedia.org/wiki/Mersenne_Twister)
 * defined in
 * [doi 10.1145/272991.272995 (1998)](https://dl.acm.org/doi/10.1145/272991.272995)
 * with
 * [2002](http://www.math.sci.hiroshima-u.ac.jp/m-mat/MT/MT2002/CODES/readme-mt.txt)
 * updates.
 *
 * Related links:
 * [It is high time we let go of the Mersenne Twister](https://arxiv.org/abs/1910.06437)
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * *NOT cryptographically secure*
 *
 * @param seed
 * @returns Generator
 */
export function mt19937(seed = 19650218): IRandUInt {
	return mt(seed);
}

/**
 * [Mersenne Twister](https://en.wikipedia.org/wiki/Mersenne_Twister)
 * as implemented in  C++ with
 * [2002](http://www.math.sci.hiroshima-u.ac.jp/m-mat/MT/MT2002/CODES/readme-mt.txt)
 * updates.
 *
 * Related links:
 * [It is high time we let go of the Mersenne Twister](https://arxiv.org/abs/1910.06437)
 *
 * Note the only difference is the seed, which is irrelevant if you seed yourself.
 *
 * Generates numbers in the range [0 - 4294967295]
 *
 * https://oeis.org/A221557
 *
 * *NOT cryptographically secure*
 *
 * @param seed
 * @returns Generator
 */
export function mt19937c(seed = 5489): IRandUInt {
	return mt(seed);
}
