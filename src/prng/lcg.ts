/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { IRandInt } from './interfaces/IRandInt.js';

function lcg32(seed: number, mul: number, add: number, mod: number): IRandInt {
	let s = seed;
	/** Get the next random number */
	return () => {
		s = (s * mul + add) % mod; //2147483647
		return s;
	};
}
// Lehmer generator where mul-bits<=21 (Max safe int=2**53-1), and mod is base2 aligned,
// so we can mask instead
function lcg32b2(seed: number, mul: number, add: number, mask: number,shift:number): IRandInt {
	let s = seed;
	/** Get the next random number */
	return () => {
		s = (s * mul + add) &mask;
		return s>>>shift;
	};
}

/**
 * Build a [Lehmer](https://en.wikipedia.org/wiki/Lehmer_random_number_generator)
 * random generator, known as [MINSTD_RAND0](https://oeis.org/A096550) or MCG16807 from 1988.
 * Used in Apple CarbonLib, C++11
 *
 * multiplier = 16807 = 7^5 : an odd composite
 *
 * minstd_rand0 in C++11
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
export function MCG16807(seed = 1): IRandInt {
	return lcg32(seed, 16807, 0, 0x7fffffff);
}

/**
 * Build a [Lehmer](https://en.wikipedia.org/wiki/Lehmer_random_number_generator)
 * random generator, known as (MINSTD_RAND)[https://oeis.org/A221556] or MCG48271 from 1990.
 * Used in C+11
 *
 * multiplier = 48271 : prime
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
export function MCG48271(seed = 1): IRandInt {
	return lcg32(seed, 48271, 0, 0x7fffffff);
}

/**
 * Build a [Lehmer](https://en.wikipedia.org/wiki/Lehmer_random_number_generator)
 * random generator, known as (MINSTD3) or MCG69621
 *
 * multiplier = 69621 = 3 × 23 × 1009 : an odd composite
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
export function MCG69621(seed = 1): IRandInt {
	return lcg32(seed, 69621, 0, 0x7fffffff);
}

function lcg64(seed:number,mul:number,add:number,mod:number): IRandInt {
    //Schrage's method
    const q=(mod/mul)>>>0;//2147483647/62089911 = 34
    const r=mod%mul;//2147483647%62089911 = 36426673 |26b
    let s = seed;
    /** Get the next random number */
	return () => {
        const div=(s/q)>>>0;
        const rem=s%q;
        // const s1=(rem*mul)>>0;
        // const t1=(div*r)>>0;
        const s1=rem*mul;
        const t1=(div*r)>>0;//doesn't work

        //t1=66521406712429 | 953231981 dword
        s=s1-t1;
        //console.log(div,rem,s1,t1,s,'div/rem/s/t/result')
        //while(s<0)s+=mod;
        if (s<0) s+=mod;
        //console.log(s,'result final')
        return s;
	};
}
function lcg64b(seed:number,mul:number,add:number,mod:number): IRandInt {
    let s = seed;
    /** Get the next random number */
	return () => {
        const l=(s&0x7fff)*mul;
        const h=(s>>>15)*mul;
        s=l+((h&0xffff)<<15)+(h>>16);
        s=(s&0x7fffffff)+(s>>31);
        return s;
	};
}
//++847344462
//--847375438 (lcg64)
//--845594501 )16
//--845574200 15
/**
 * Build a [Lehmer](https://en.wikipedia.org/wiki/Lehmer_random_number_generator)
 * random generator, known as MCG62089911
 *
 * multiplier = 62089911 (26b storage)
 * This is large enough (x3B36AB7) you have to use u64 space, which
 *
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
//export function MCG62089911(seed=1):IRandInt { return lcg64(seed,62089911,0,0x7fffffff); }

/**
 * Build a [MSVC](https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use)
 * [Linear congruential generator](https://en.wikipedia.org/wiki/Linear_congruential_generator)
 * rand()
 *
 * Mul=214013
 * Add=2531011 
 * Mod=0x7fffffff
 * 
 * *NOT cryptographically secure*
 * 
 * @param seed Starting state - valid integer
 * @returns function to produce integers in range 0 - 32767
 */
export function msvc(seed = 1): IRandInt { return lcg32b2(seed,214013,2531011,0x7fffffff,16); }

/**
 * Build a [RANDU](https://en.wikipedia.org/wiki/RANDU)
 * [Linear congruential generator](https://en.wikipedia.org/wiki/Linear_congruential_generator)
 * random number generator.  Widely considered to be one of the most ill-conceived random number generators ever designed
 *
 * Mul=65539
 * Add=0
 * Mod=0x7fffffff
 * 
 * *NOT cryptographically secure*
 *
 * @param seed Starting state - valid integer
 * @returns function to produce integers in the range 0 - 2147483647
 */
export function randu(seed = 1): IRandInt { return lcg32b2(seed,65539,0,0x7fffffff,0); }