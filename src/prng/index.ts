/*! Copyright 2024 the gnablib contributors MPL-1.1 */
/**
 * # [Pseudorandom number generator (PRNG)](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)
 *
 * A pseudorandom number generator (PRNG), is an algorithm for generating a sequence of numbers
 * that approximate a sequence of random numbers. The PRNG-generated sequence is not truly
 * random, because it can be controlled by the initial value (`seed`).
 *
 * - {@link prng.marsaglia marsaglia} Generate numbers in the range [0 - 9]
 * - {@link prng.MCG16807 MCG16807}, {@link prng.MCG48271 MCG48271}, {@link prng.MCG69621 MCG69621}, {@link prng.MCG62089911 MCG62089911}  Generate numbers in the range [0 - 4294967295]
 * - {@link prng.middleSquare middleSquare} Generate numbers in the range [0 - (10**`n` -1)]
 *  where `n` is the number of digits of the `seed`
 * - {@link prng.msvc msvc} Generate numbers in the range [0 - 32767]
 * - {@link prng.randu randu} Generate numbers in the range [0 - 2147483647]
 *
 * @module
 */
export { MCG16807, MCG48271, MCG69621, MCG62089911, msvc, randu } from './lcg.js';
export { marsaglia } from './marsaglia.js';
export { middleSquare } from './middleSquare.js';
//Interfaces: see src/interfaces/index.ts
