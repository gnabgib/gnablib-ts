/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { IRandU16, IRandU32 } from './interfaces/IRandInt.js';

/**
 * [Small Fast Counting (SFC)](https://pracrand.sourceforge.net/RNG_engines.txt)
 * random generator using 64bit state, 16bit return as described in
 * [PractRand](https://pracrand.sourceforge.net/)
 *
 * *NOT cryptographically secure*
 *
 * @param seed An array of 3-4 elements
 * @returns Generator of uint32 [0 - 32767]
 */
export function sfc16(seed?:Uint16Array):IRandU16 {
	//Default is the upper 16 bits of first 3 results of SplitMix32(0)
	// NOTE: note the fourth value is called "counter" and starts at 1 in the original source.
	const s = Uint16Array.of(0x92CA,0x3CD6,0x1B14,1);

	function raw16():number {
		const t=s[0]+s[1]+s[3];
		s[3]+=1;
		s[0]=s[1]^(s[1]>>>5);//rshift=5
		s[1]=s[2]+(s[2]<<3);//lshift=3
		s[2]=(((s[2]<<5)|(s[2]>>>11)))+t;//barrel_shift=5
		return t&0xffff;
	}

	function init() {
		//No seed, nothing to do
		if (seed == undefined) return;
		switch (seed.length) {
			case 3:
			case 4:
				//seed(s1,s2,s3) or seed(U64)
				s.set(seed);
				for (let i = 0; i < 10; i++) raw16();
				break;
			default:
			//case 0: //Let's assume a user sending an empty error is a mistake.
			//case 1: case 2://The original source has no code for a <3 U16 seed so throw
				throw new Error('Seed should be 3-4 elements long');
		}
	}
	init();

	return raw16;
}

/**
 * [Small Fast Counting (SFC)](https://pracrand.sourceforge.net/RNG_engines.txt)
 * random generator using 128bit state, 32bit return as described in
 * [PractRand](https://pracrand.sourceforge.net/)
 *
 * *NOT cryptographically secure*
 *
 * @param seed An array of 2-3 elements
 * @returns Generator of uint32 [0 - 4294967295]
 */
export function sfc32(seed?: Uint32Array): IRandU32 {
	//Default is the first 3 results of SplitMix32(0)
	// NOTE: note the fourth value is called "counter" and starts at 1 in the original source.
	const s = Uint32Array.of(2462723854, 1020716019, 454327756, 1);

	function raw32(): number {
		const t = s[0] + s[1] + s[3];
		s[3] += 1;
		s[0] = s[1] ^ (s[1] >>> 9); //rshift=9
		s[1] = s[2] + (s[2] << 3); //lshift=3
		s[2] = ((s[2] << 21) | (s[2] >>> 11)) + t; //barrel_shift/p=21
		return t >>> 0;
	}

	function init() {
		//No seed, nothing to do
		if (seed == undefined) return;
		switch (seed.length) {
			case 2:
				//seed(U64)
				s[0] = 0;
				s[1] = seed[0];
				s[2] = seed[1];
				for (let i = 0; i < 12; i++) raw32();
				break;
			case 3:				
				//seed(s1,s2,s3)
				s[0] = seed[0];
				s[1] = seed[1];
				s[2] = seed[2];
				for (let i = 0; i < 15; i++) raw32();
				break;
			default:
			//case 0: //Let's assume a user sending an empty error is a mistake.
			//case 1: //The original source has no code for a 1 U32 seed so throw
				throw new Error('Seed should be 2-3 elements long');
		}
	}
	init();
	return raw32;
}
