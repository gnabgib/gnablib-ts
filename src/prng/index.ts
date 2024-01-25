/*! Copyright 2024 the gnablib contributors MPL-1.1 */
/**
 * # [Pseudorandom number generator (PRNG)](https://en.wikipedia.org/wiki/Pseudorandom_number_generator)
 *
 * A pseudorandom number generator (PRNG), is an algorithm for generating a sequence of numbers
 * that approximate a sequence of random numbers. The PRNG-generated sequence is not truly
 * random, because it can be controlled by the initial value (`seed`).
 *
 * - {@link prng.marsaglia marsaglia} Generate numbers in the range [0 - 9]
 * - {@link prng.middleSquare middleSquare} Generate numbers in the range [0 - (10**`n` -1)]
 *  where `n` is the number of digits of the `seed`
 * - {@link prng.msvcRand msvcRand} Generate numbers in the range [0 - 32767]
 * - {@link prng.randu randu} Generate numbers in the range [0 - 2147483647]
 *
 * @module
 */
export type { IRandFloat } from './IRandFloat.js';
export type { IRandInt } from './IRandInt.js';
export { marsaglia } from './marsaglia.js';
export { middleSquare } from './middleSquare.js';
export { msvcRand } from './msvcRand.js';
export { randu } from './randu.js';
