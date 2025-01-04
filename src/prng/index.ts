/*! Copyright 2024 the gnablib contributors MPL-1.1 */
/**
 * # [Pseudorandom number generator (PRNG)](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)
 *
 * A pseudorandom number generator (PRNG), is an algorithm for generating a sequence of numbers
 * that approximate a sequence of random numbers. The PRNG-generated sequence is not truly
 * random, because it can be controlled by the initial value (`seed`).
 *
 * - {@link prng.arc4_32 arc4_32} generate numbers in the range [0 - 4294967295]
 * - {@link prng.arc4_32 arc4_64} generate numbers in the range [0 - 18446744073709551615]
 * - {@link prng.marsaglia marsaglia} generate numbers using the _Marsaglia_ PRNG
 * in the range [0 - 9]
 * - {@link prng.mcg16807 mcg16807}, {@link prng.mcg48271 mcg48271}, {@link prng.mcg69621 mcg69621}, {@link prng.mcg62089911 mcg62089911}  Generate numbers using the _Lehmer_ PRNG
 * in the range [0 - 2147483647]
 * - {@link prng.middleSquare middleSquare} generate numbers using the _Middle Square_ PRNG
 * in the range [0 - (10**`n` -1)] where `n` is the number of digits of the `seed`
 * - {@link prng.msvc msvc} generate numbers using the _Microsoft Visual C_ PRNG
 * in the range [0 - 32767]
 * - {@link prng.mt19937 mt19937} {@link prng.mt19937c mt19937c} generate numbers using the _Mersenne Twister_ PRNG
 * in the range [0 - 4294967295]
 * - {@link prng.mulberry32 mulberry32} generate numbers in the range [0 - 4294967295],
 * - {@link prng.pcg32 pcg32} generate numbers in the range [0 - 4294967295]
 * - {@link prng.pcg64 pcg64} generate numbers in the range [0 - 18446744073709551615]
 * - {@link prng.randu randu} generate numbers using the _RANDU_ PRNG
 * in the range [0 - 2147483647]
 * - {@link prng.splitMix64 splitMix64} generate numbers using the _SplitMix_ PRNG
 * in the range [0 - 18446744073709551615]
 * - {@link prng.well512 well512} generate numbers in the range [0 - 4294967295]
 * - {@link prng.xorShift32 xorShift32} generate numbers using the _XorShift_ PRNG
 * in the range [0 - 4294967295],
 * {@link prng.xorShift64 xorShift64} generate numbers in the range [0 - 18446744073709551615],
 * {@link prng.xorShift128 xorShift128} generate numbers in the range [0 - 18446744073709551615]
 * - {@link prng.xorShift128plus xorShift128+} generate numbers using the _XorShift+_ PRNG
 * in the range [0 - 18446744073709551615],
 * {@link prng.xorShift128plusV8 xorShift128+V8} generate numbers using the same parameters as
 * [V8](https://v8.dev/), which differ from Vigna's default
 * - {@link prng.xoshiro128p xoshiro128+},
 * {@link prng.xoshiro128pp xoshiro128++},
 * {@link prng.xoshiro128ss xoshiro128**}
 * generate numbers using the _XoShiRo128_ PRNG in the range [0 - 4294967295]
 * - {@link prng.xoshiro256p xoshiro256+},
 * {@link prng.xoshiro256pp xoshiro256++},
 * {@link prng.xoshiro256ss xoshiro256**}
 * generate numbers using the _XoShiRo256_ PRNG in the range [0 - 18446744073709551615]
 * - {@link prng.xoroshiro64s xoroshiro64*},
 * {@link prng.xoroshiro64ss xoroshiro64**}
 * generate numbers using the _XoRoShiRo64_ PRNG in the range [0 - 4294967295]
 * - {@link prng.xoroshiro128p xoroshiro128+},
 * {@link prng.xoroshiro128pp xoroshiro128++},
 * {@link prng.xoroshiro128ss xoroshiro128**}
 * generate numbers using the _XoRoShiRo128_ PRNG in the range [0 - 18446744073709551615]
 *
 * @module
 */
export { arc4_32, arc4_64 } from './arc4.js';
export { marsaglia } from './marsaglia.js';
export {
	mcg16807,
	mcg48271,
	mcg69621,
	mcg62089911,
	msvc,
	randu,
} from './lcg.js';
export { middleSquare } from './middleSquare.js';
export { mt19937, mt19937c } from './mersenneTwister.js';
export { mulberry32 } from './mulberry32.js';
export { pcg32 } from './pcg32.js';
export { pcg64 } from './pcg64.js';
export { splitMix32 } from './splitMix32.js';
export { splitMix64 } from './splitMix64.js';
export { well512 } from './well512.js';
export { xorShift32 } from './xorShift32.js';
export { xorShift64 } from './xorShift64.js';
export { xorShift128 } from './xorShift128.js';
export { xorShift128plus, xorShift128plusV8 } from './xorShift128plus.js';
export { xoshiro128p, xoshiro128pp, xoshiro128ss } from './xoshiro128.js';
export { xoshiro256p, xoshiro256pp, xoshiro256ss } from './xoshiro256.js';
export { xoroshiro64s, xoroshiro64ss } from './xoroshiro64.js';
export {
	xoroshiro128p,
	xoroshiro128pp,
	xoroshiro128ss,
} from './xoroshiro128.js';
//Interfaces: see src/interfaces/index.ts
