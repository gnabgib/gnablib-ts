/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */
/**
 * # [Pseudorandom number generator (PRNG)](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)
 *
 * A pseudorandom number generator (PRNG), is an algorithm for generating a sequence of numbers
 * that approximate a sequence of random numbers. The PRNG-generated sequence is not truly
 * random, because it can be controlled by the initial value (`seed`).
 *
 * - {@link prng.Arc4 Arc4} generate numbers in the range [0 - 256]
 * - {@link prng.gjrand32 gjrand32} generate numbers in the range [0 - 4294967295],
 * {@link prng.Gjrand32_32 Gjrand32_32} generate numbers in the range [0 - 4294967295],
 * {@link prng.gjrand64 gjrand64} generate numbers in the range [0 - 18446744073709551615]
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
 * - {@link prng.pcg64 pcg64} generate numbers in the range [0 - 18446744073709551615]
 * - {@link prng.sfc16 sfc16} generate in the range [0 - 32767],
 * {@link prng.sfc32 sfc32} generate in the range [0 - 4294967295]
 * {@link prng.sfc64 sfc64} generate in the range [0 - 18446744073709551615]
 * - {@link prng.SplitMix32 SplitMix32} generate in the range [0 - 4294967295],
 * {@link prng.splitMix64 splitMix64} generate in the range [0 - 18446744073709551615]
 * - {@link prng.Well512 Well512} generate numbers in the range [0 - 4294967295]
 * - {@link prng.XorShift32 XorShift32} generate numbers using the _XorShift_ PRNG
 * in the range [0 - 4294967295],
 * {@link prng.xorShift64 xorShift64} generate numbers in the range [0 - 18446744073709551615],
 * {@link prng.XorShift128 XorShift128} generate numbers in the range [0 - 4294967295]
 * - {@link prng.xorShift128plus xorShift128+} generate numbers using the _XorShift+_ PRNG
 * in the range [0 - 18446744073709551615],
 * {@link prng.xorShift128plusV8 xorShift128+V8} generate numbers using the same parameters as
 * [V8](https://v8.dev/), which differ from Vigna's default
 * - {@link prng.Xoshiro128p Xoshiro128+},
 * {@link prng.Xoshiro128pp Xoshiro128++},
 * {@link prng.Xoshiro128ss Xoshiro128**}
 * generate numbers using the _XoShiRo128_ PRNG in the range [0 - 4294967295]
 * - {@link prng.xoshiro256p xoshiro256+},
 * {@link prng.xoshiro256pp xoshiro256++},
 * {@link prng.xoshiro256ss xoshiro256**}
 * generate numbers using the _XoShiRo256_ PRNG in the range [0 - 18446744073709551615]
 * - {@link prng.Xoroshiro64s Xoroshiro64*},
 * {@link prng.Xoroshiro64ss Xoroshiro64**}
 * generate numbers using the _XoRoShiRo64_ PRNG in the range [0 - 4294967295]
 * - {@link prng.xoroshiro128p xoroshiro128+},
 * {@link prng.xoroshiro128pp xoroshiro128++},
 * {@link prng.xoroshiro128ss xoroshiro128**}
 * generate numbers using the _XoRoShiRo128_ PRNG in the range [0 - 18446744073709551615]
 *
 * 		arc4(u8a) key1-256B, throws OOR
 * 		gjrand32_32(number,number?)
 * gjrand32(number|U64|U128)
 * gjrand64(U64|U128)
 * 		marsaglia(number)
 * 		mcg*(number)
 * 		mt19937(number)
 * 		middleSquare(number,n=number)
 * 		mulberry32(number)
 * 		pcg32(U64,inc=u64) - stay use U64 since they're needed by the algo
 * pcg64(U128,inc=u128)
 * 		sfc16(number,number,number,number?)
 * 		sfc32(number,number,number?)
 * sfc64(u32a) key0,2,6 throws other
 * 		SplitMix32(number)
 * splitMix64(u64)
 * 		tychei(number,number)
 * 		well512(number,number..number15)
 * 		xoroshiro64s(number,number)
 * 		xoroshiro64ss(number,number)
 * xoroshiro128p(u128)
 * xoroshiro128p_2016(u128)
 * xoroshiro128pp(u128)
 * xoroshiro128ss(u128)
 * 		xorShift32(number)
 * xorShift64(u64)
 * 		XorShift128(number,number,number,number)
 * xorShift128plus(u128) -rename
 * xorShift128plusV8(u128) -rename
 * 		xoshiro128p(number,number,number,number)
 * 		xoshiro128pp(number,number,number,number)
 * 		xoshiro128ss(number,number,number,number)
 * xoshiro256p(u256)
 * xoshiro256pp(u256)
 * xoshiro256ss(u256)
 *
 * @module
 */
//32bit & less:
export { Arc4 } from './arc4.js';
export { Gjrand32_32 } from './gjrand32.js';
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
export { gjrand32, gjrand64 } from './gjrand64.js';
export { pcg64 } from './pcg64.js';
export { sfc64 } from './sfc64.js';
export { splitMix64 } from './splitMix64.js';
export { xorShift64 } from './xorShift64.js';
export { xorShift128plus, xorShift128plusV8 } from './xorShift128plus.js';
export { xoshiro256p, xoshiro256pp, xoshiro256ss } from './xoshiro256.js';
export {
	xoroshiro128p,
	xoroshiro128pp,
	xoroshiro128ss,
} from './xoroshiro128.js';
//Interfaces: see src/interfaces/index.ts
