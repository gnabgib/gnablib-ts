/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { IRandU32 } from './interfaces/IRandInt.js';

/**
 * GJrand random numbers using 128bit state, 32bit return.
 * This isn't an official version (no KAT), it's mostly sourced from
 * https://gist.github.com/imneme/7a783e20f71259cc13e219829bcea4ac which was apparently
 * [provided by David Blackman](https://www.pcg-random.org/posts/some-prng-implementations.html#gjrand-david-blackmans-chaotic-prng)
 * but doesn't quite init correctly (with one u32 c should be 1000001, with two 2000001)
 * and has a default seed found nowhere in official source.  *Note* gjrand used to be 32bit (only) in versions <1
 * but there are known issues with those versions, so those versions/KAT aren't terribly useful.
 *
 * The benefit of this version over official `gjrand32` is it doesn't need 64bit (U64) support so should be slightly more performant
 *
 * *NOT cryptographically secure*
 *
 * @param seeds 1, 2, or 4 numbers, which will be treated as U32 to seed the PRNG
 * @returns Generator of uint32 [0 - 4294967295]
 */
export function gjrand32_32(...seeds: number[]): IRandU32 {
	//This is the resulting state of calling gjrand32_32(0) after the 14 next()
	const s = new Uint32Array(4);

	function next() {
		s[1] += s[2];
		s[0] = (s[0] << 16) | (s[0] >>> 16); //lRot p=16
		s[2] ^= s[1];
		s[3] += 0x96a5; //d_inc=0x96a5
		s[0] += s[1];
		s[2] = (s[2] << 11) | (s[2] >>> 21); //lRot q=11
		s[1] ^= s[0];
		s[0] += s[2];
		s[1] = (s[2] << 19) | (s[2] >>> 13); //lRot r=19
		s[2] += s[0];
		s[1] += s[3];
		return s[0];
	}

	// prettier-ignore
	switch (seeds.length) {
        case 0:
            //gjrand_init(0) - we've precalculated this state (seed with 0 and 14*next());
            s[0]=2341650679;
            s[1]=368028163;
            s[2]=2033345459;
            s[3]=539910;
            //No need to next because of precompute
            break;
        case 1:
            //gjrand_init
            s[0]=seeds[0];
            s[2]=1000001;
            for (let i = 0; i < 14; i++) next();
            break;
        case 2:
            //gjrand_init64
            s[0]=seeds[0];
            s[1]=seeds[1];
            s[2]=2000001;
            for (let i = 0; i < 14; i++) next();
            break;
        default:
            throw new Error('There should be 1 or 2 seeds provided');
        }
	return next;
}
