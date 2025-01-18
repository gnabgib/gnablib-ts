/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */
/**
 * # [Pseudorandom number generator (PRNG)](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)
 *
 * A pseudorandom number generator (PRNG), is an algorithm for generating a sequence of numbers
 * that approximate a sequence of random numbers. The PRNG-generated sequence is not truly
 * random, because it can be controlled by the initial value (`seed`).
 *
 * - {@link prng.Arc4 Arc4} generate numbers in the range [0 - 256]
 * - {@link prng.Gjrand32b Gjrand32b} generate numbers in the range [0 - 4294967295],
 * {@link prng.Gjrand64 Gjrand64} generate numbers in the range [0 - 18446744073709551615]
 * - {@link prng.Marsaglia Marsaglia} generate numbers using the _Marsaglia_ PRNG
 * in the range [0 - 9]
 * - {@link prng.Mcg Mcg}  Generate numbers using the _Lehmer_ PRNG
 * in the range [0 - 2147483647] (+Randu), MSVC in the range [0 - 32767]
 * - {@link prng.MiddleSquare MiddleSquare} generate numbers using the _Middle Square_ PRNG
 * in the range [0 - (10**`n` -1)] where `n` is the number of digits of the `seed`
 * - {@link prng.Mt19937 Mt19937} generate numbers using the _Mersenne Twister_ PRNG
 * in the range [0 - 4294967295]
 * - {@link prng.Mulberry32 Mulberry32} generate numbers in the range [0 - 4294967295],
 * - {@link prng.Pcg32 Pcg32} generate numbers in the range [0 - 4294967295]
 * - {@link prng.Pcg64 Pcg64} generate numbers in the range [0 - 18446744073709551615]
 * - {@link prng.Sfc16 Sfc16} generate in the range [0 - 32767],
 * {@link prng.Sfc32 Sfc32} generate in the range [0 - 4294967295]
 * {@link prng.Sfc64 Sfc64} generate in the range [0 - 18446744073709551615]
 * - {@link prng.SplitMix32 SplitMix32} generate in the range [0 - 4294967295],
 * {@link prng.SplitMix64 SplitMix64} generate in the range [0 - 18446744073709551615]
 * - {@link prng.Well512 Well512} generate numbers in the range [0 - 4294967295]
 * - {@link prng.XorShift32 XorShift32} generate numbers using the _XorShift_ PRNG
 * in the range [0 - 4294967295],
 * {@link prng.XorShift64 XorShift64} generate numbers in the range [0 - 18446744073709551615],
 * {@link prng.XorShift128 XorShift128} generate numbers in the range [0 - 4294967295]
 * - {@link prng.XorShift128p XorShift128+} generate numbers using the _XorShift+_ PRNG
 * in the range [0 - 18446744073709551615],
 * {@link prng.XorShift128pV8 XorShift128+V8} generate numbers using the same parameters as
 * [V8](https://v8.dev/), which differ from Vigna's default
 * - {@link prng.Xoshiro128p Xoshiro128+},
 * {@link prng.Xoshiro128pp Xoshiro128++},
 * {@link prng.Xoshiro128ss Xoshiro128**}
 * generate numbers using the _XoShiRo128_ PRNG in the range [0 - 4294967295]
 * - {@link prng.Xoshiro256p Xoshiro256+},
 * {@link prng.Xoshiro256pp Xoshiro256++},
 * {@link prng.Xoshiro256ss Xoshiro256**}
 * generate numbers using the _XoShiRo256_ PRNG in the range [0 - 18446744073709551615]
 * - {@link prng.Xoroshiro64s Xoroshiro64*},
 * {@link prng.Xoroshiro64ss Xoroshiro64**}
 * generate numbers using the _XoRoShiRo64_ PRNG in the range [0 - 4294967295]
 * - {@link prng.Xoroshiro128p Xoroshiro128+},
 * {@link prng.Xoroshiro128pp Xoroshiro128++},
 * {@link prng.Xoroshiro128ss Xoroshiro128**}
 * generate numbers using the _XoRoShiRo128_ PRNG in the range [0 - 18446744073709551615]
 *
 * 		arc4(u8a) key1-256B, throws OOR
 * 		Gjrand32b(number,number?)
 * 		-gjrand64(number|U64|U128)
 * 		marsaglia(number)
 * 		mcg*(number)
 * 		mt19937(number)
 * 		middleSquare(number,n=number)
 * 		mulberry32(number)
 * 		pcg32(U64,inc=u64) - stay use U64 since they're needed by the algo
 * 		-Pcg64(U128,inc=u128) - stay use U128 since they're needed by the algo
 * 		sfc16(number,number,number,number?)
 * 		sfc32(number,number,number?)
 * 		-Sfc64(u32a) key0,2,6 throws other
 * 		SplitMix32(number)
 * 		-SplitMix64(u64)
 * 		tychei(number,number)
 * 		well512(number,number..number15)
 * 		xoroshiro64s(number,number)
 * 		xoroshiro64ss(number,number)
 * 		-Xoroshiro128p(u64,u64)
 * 		-Xoroshiro128p_2016(u64,u64)
 * 		-Xoroshiro128pp(u64,u64)
 * 		-Xoroshiro128ss(u64,u64)
 * 		xorShift32(number)
 * 		-XorShift64(u64)
 * 		XorShift128(number,number,number,number)
 * 		-XorShift128p(u64,u64)
 * 		-XorShift128pV8(u64,u64)
 * 		xoshiro128p(number,number,number,number)
 * 		xoshiro128pp(number,number,number,number)
 * 		xoshiro128ss(number,number,number,number)
 * 		-Xoshiro256p(u64,u64,u64,u64)
 * 		-Xoshiro256pp(u64,u64,u64,u64)
 * 		-Xoshiro256ss(u64,u64,u64,u64)
 *
 * @module
 */
//32bit & less:
export { Arc4 } from './arc4.js';
export { Gjrand32b } from './gjrand32.js';
export { Marsaglia } from './marsaglia.js';
export { Mcg } from './mcg.js';
export { MiddleSquare } from './middleSquare.js';
export { Mt19937 } from './mersenneTwister.js';
export { Mulberry32 } from './mulberry32.js';
export { Pcg32 } from './pcg32.js';
export { Sfc16 } from './sfc16.js';
export { Sfc32 } from './sfc32.js';
export { SplitMix32 } from './splitMix32.js';
export { Well512 } from './well512.js';
export { XorShift32 } from './xorShift32.js';
export { XorShift128 } from './xorShift128.js';
export { Xoshiro128p, Xoshiro128pp, Xoshiro128ss } from './xoshiro128.js';
export { Xoroshiro64s, Xoroshiro64ss } from './xoroshiro64.js';

//64bit:
export { Gjrand64 } from './gjrand64.js';
export { Pcg64 } from './pcg64.js';
export { Sfc64 } from './sfc64.js';
export { SplitMix64 } from './splitMix64.js';
export { XorShift64 } from './xorShift64.js';
export { XorShift128p, XorShift128pV8 } from './xorShift128p.js';
export { Xoshiro256p, Xoshiro256pp, Xoshiro256ss } from './xoshiro256.js';
export {
	Xoroshiro128p,
	Xoroshiro128pp,
	Xoroshiro128ss,
} from './xoroshiro128.js';
//Interfaces: see src/interfaces/index.ts
