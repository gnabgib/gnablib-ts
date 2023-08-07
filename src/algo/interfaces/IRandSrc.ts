/*! Copyright 2023 the gnablib contributors MPL-1.1 */

/**
 * Generate a random number [0-1) (inclusive of zero, exclusive of 1)
 * Matches: [Math.random](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random)
 */
export interface IRandSrc {
	(): number;
}