/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { safety } from '../primitive/Safety.js';
import { IRandSrc } from './interfaces/IRandSrc.js';

/**
 * Random number toolkit, taking a random source, and providing various features
 */
export class RandTk {
	/**
	 * Build a new random toolkit
	 * @param rs
	 */
	constructor(private readonly rs: IRandSrc) {}

	/**
	 * Generate a random float [lowInc-highExc)
	 *
	 * @param lowInc Lowest returnable value (inclusive)
	 * @param highExc Highest value (exclusive - up to but not including)
	 * @returns float64
	 */
	floatBetween(lowInc: number, highExc: number): number {
		return this.rs() * (highExc - lowInc) - lowInc;
	}

	/**
	 * Generate a random integer [lowInc-highExc)
	 *
	 * @param lowInc Lowest returnable value (inclusive, rounded up to int if float)
	 * @param highExc Highest returnable value (exclusive, rounded down to int if float)
	 */
	intBetween(lowInc: number, highExc: number): number {
		//Quantize low/high to int
		lowInc = Math.ceil(lowInc);
		highExc = Math.floor(highExc);
		return Math.floor(this.rs() * (highExc - lowInc) + lowInc);
	}

	/**
	 * Generate a weighted random number
	 *
	 * @param cWeights
	 * @returns
	 */
	private wtRnd(cWeights: number[]): number {
		const r = this.floatBetween(0, cWeights[cWeights.length - 1]);
		//We only need to test up to the second last value, returning the last
		// value without check.  (as long as there are no bugs)
		const n = cWeights.length - 1;
		for (let i = 0; i < n; i++) {
			if (r < cWeights[i]) return i;
		}
		return n;
	}

	/**
	 * Return an index from [0..`weights.length`) using the provided cumulative weights
	 *
	 * @param weights Array of numbers representing the weight of each choice
	 * @returns Integer 0..`weights.length`
	 */
	weightedCumulative(weights: number[]): number {
		let last = 0;
		for (let i = 0; i < weights.length; i++) {
			safety.numGte(weights[i], last, `weights[${i}]`);
			last = weights[i];
		}
		//Todo make sure weights are logical (w[n]>=0, w[n]>=w[n-1])
		return this.wtRnd(weights);
	}

	/**
	 * Return an index from [0..`weights.length`) using the provided relative weights
	 * (two entries with the same weight are equally likely to be chosen)
	 *
	 * @param weights Array of numbers representing the weight of each choice
	 * @returns Integer 0..`weights.length`
	 *
	 * @example
	 * `relative([1,1,2])`
	 * - Is twice as likely to chose the third value as either the first or second
	 * - In a perfect distribution with 4 attempts would return 0,1,2,2 (in any order)
	 *
	 * @example
	 * `relative([0,1,2])`
	 * - Is never going to chose the first item
	 * - Is twice as likely to chose the third value as the second
	 * - In a perfect distribution with 3 attempts would return 1,2,2 (in any order)
	 */
	weightedRelative(weights: number[]): number {
		//Convert to cumulative
		const cWeights: number[] = [];
		let last = 0;
		for (let i = 0; i < weights.length; i++) {
			cWeights[i] = weights[i] + last;
			last = cWeights[i];
		}
		return this.wtRnd(cWeights);
	}
}
