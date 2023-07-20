/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { Grievous } from '../primitive/ErrorExt.js';
import { safety } from '../primitive/Safety.js';
import type { randSrc } from './Prng.js';
import prng from './Prng.js';

/*
 * Weighted Randomness
 */

function wtRnd(cWeights: number[], rs: randSrc): number {
	const n = prng.floatBetween(rs, 0, cWeights[cWeights.length - 1]);
	for (let i = 0; i < cWeights.length; i++) {
		if (n < cWeights[i]) return i;
	}
	/* c8 ignore next 2 */
	throw new Grievous('Generated a spurious random number');
}

/**
 * Return an index from [0..@see weights.length) using the provided cumulative weights
 *
 * @param weights Array of numbers representing the weight of each choice
 * @param rs Random source, Math.Random if not specified
 * @returns Integer 0..`weights.length`
 */
function cumulative(weights: number[], rs: randSrc = Math.random): number {
	let last = 0;
	for (let i = 0; i < weights.length; i++) {
		safety.numGte(weights[i],last,`weights[${i}]`);
		last = weights[i];
	}
	//Todo make sure weights are logical (w[n]>=0, w[n]>=w[n-1])
	return wtRnd(weights, rs);
}

/**
 * Return an index from [0..@see weights.length) using the provided relative weights
 * (two entries with the same weight are equally likely to be chosen)
 *
 * Example:
 * `relative([1,1,2])`
 * -Is twice as likely to chose the third value as either the first or second
 * -In a perfect distribution with 4 attempts would return 0,1,2,2 (in any order)
 *
 * Example:
 * `relative([0,1,2])`
 * -Is never going to chose the first item
 * -Is twice as likely to chose the third value as the second
 * -In a perfect distribution with 3 attempts would return 1,2,2 (in any order)
 *
 * @param weights Array of numbers representing the weight of each choice
 * @param rs Random source, `Math.Random` if not specified
 * @returns Integer 0..`weights.length`
 */
function relative(weights: number[], rs: randSrc = Math.random): number {
	//Convert to cumulative
	const cWeights: number[] = [];
	let last = 0;
	for (let i = 0; i < weights.length; i++) {
		cWeights[i] = weights[i] + last;
		last = cWeights[i];
	}
	return wtRnd(cWeights, rs);
}

export default { cumulative, relative };
