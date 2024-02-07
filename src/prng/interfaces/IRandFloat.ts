/** Note: Because JS doesn't distinguish between int/float this signature matches IRandInt */
export interface IRandFloat {
	/**
	 * Generate a random float [0-1)
	 * Matches: [Math.random](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random)
	 */
	(): number;
}
