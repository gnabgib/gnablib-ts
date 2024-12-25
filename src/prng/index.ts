/*! Copyright 2024 the gnablib contributors MPL-1.1 */
/**
 * # [Pseudorandom number generator (PRNG)](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)
 *
 * A pseudorandom number generator (PRNG), is an algorithm for generating a sequence of numbers
 * that approximate a sequence of random numbers. The PRNG-generated sequence is not truly
 * random, because it can be controlled by the initial value (`seed`).
 *
 * - {@link prng.marsaglia marsaglia} Generate numbers using the _Marsaglia_ PRNG 
 * in the range [0 - 9]
 * - {@link prng.mcg16807 mcg16807}, {@link prng.mcg48271 mcg48271}, {@link prng.mcg69621 mcg69621}, {@link prng.mcg62089911 mcg62089911}  Generate numbers using the _Lehmer_ PRNG 
 * in the range [0 - 2147483647]
 * - {@link prng.middleSquare middleSquare} Generate numbers using the _Middle Square_ PRNG 
 * in the range [0 - (10**`n` -1)] where `n` is the number of digits of the `seed`
 * - {@link prng.msvc msvc} Generate numbers using the _Microsoft Visual C_ PRNG 
 * in the range [0 - 32767]
 * - {@link prng.mt19937 mt19937} {@link prng.mt19937c mt19937c} Generate numbers using the _Mersenne Twister_ PRNG 
 * in the range [0 - 4294967295]
 * - {@link prng.randu randu} Generate numbers using the _RANDU_ PRNG 
 * in the range [0 - 2147483647]
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
//Interfaces: see src/interfaces/index.ts
