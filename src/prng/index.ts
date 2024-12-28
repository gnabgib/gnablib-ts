/*! Copyright 2024 the gnablib contributors MPL-1.1 */
/**
 * # [Pseudorandom number generator (PRNG)](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)
 *
 * A pseudorandom number generator (PRNG), is an algorithm for generating a sequence of numbers
 * that approximate a sequence of random numbers. The PRNG-generated sequence is not truly
 * random, because it can be controlled by the initial value (`seed`).
 *
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
 * - {@link prng.randu randu} generate numbers using the _RANDU_ PRNG
 * in the range [0 - 2147483647]
 * - {@link prng.splitMix64 splitMix64} generate numbers using the _SplitMix_ PRNG
 * in the range [0 - 18446744073709551615]
 * - {@link prng.xorShift32 xorShift32} generate numbers using the _XorShift_ PRNG
 * in the range [0 - 4294967295],
 * {@link prng.xorShift64 xorShift64} generate numbers in the range [0 - 18446744073709551615],
 * {@link prng.xorShift128 xorShift128} generate numbers in the range [0 - 18446744073709551615]
 * - {@link prng.xorShift128plus xorShift128+} generate numbers using the _XorShift+_ PRNG
 * in the range [0 - 18446744073709551615],
 * {@link prng.xorShift128plusV8 xorShift128+V8} generate numbers using the same parameters as
 * [V8](https://v8.dev/), which differ from Vigna's default
 * - {@link prng.xoshiro128plus xoshiro128plus}, 
 * {@link prng.xoshiro128plusPlus xoshiro128plusPlus}, 
 * {@link prng.xoshiro128starStar xoshiro128starStar}
 * generate numbers using the _XoShiRo128_ PRNG in the range [0 - 4294967295]
 * @module
 */
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
export { splitMix64 } from './splitMix.js';
export { xorShift32 } from './xorShift32.js';
export { xorShift64 } from './xorShift64.js';
export { xorShift128 } from './xorShift128.js';
export { xorShift128plus, xorShift128plusV8 } from './xorShift128plus.js';
export {
	xoshiro128plus,
	xoshiro128plusPlus,
	xoshiro128starStar,
} from './xoshiro128.js';
//export { xorShift32, xorShift64, xorShift128, xorShift128plus, xorShift128plusV8 } from './xorShift128plus.js';
//Interfaces: see src/interfaces/index.ts
