/*! Copyright 2023 the gnablib contributors MPL-1.1 */

/**
 * Pseudo-random number generation
 */

/**
 * Generate a random number [0-1) (inclusive of zero, exclusive of 1)
 * Matches: [Math.random](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random)
 */
export type randSrc = () => number;

/**
 * Generate a random float [lowInc-highExc)
 * @param rs Random source
 * @param lowInc Lowest returnable value (inclusive)
 * @param highExc Highest value (exclusive - up to but not including)
 * @returns float64
 */
function floatBetween(rs: randSrc, lowInc: number, highExc: number): number {
	return rs() * (highExc - lowInc) - lowInc;
}

/**
 * Generate a random integer [lowInc-highExc)
 * @param rs Random source
 * @param lowInc Lowest returnable value (inclusive, rounded up to int if float)
 * @param highExc Highest returnable value (exclusive, rounded down to int if float)
 * @returns int32
 */
function intBetween(rs: randSrc, lowInc: number, highExc: number): number {
	//Quantize low/high to int
	lowInc = Math.ceil(lowInc);
	highExc = Math.floor(highExc);
	return Math.floor(rs() * (highExc - lowInc) + lowInc);
}

export default { floatBetween, intBetween };
