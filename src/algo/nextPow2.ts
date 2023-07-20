/*! Copyright 2023 the gnablib contributors MPL-1.1 */

/**
 * Find the next power of 2 that's at least `v` in magnitude
 * @param v
 * @returns
 */
export function nextPow2(v: number): number {
	//http://graphics.stanford.edu/%7Eseander/bithacks.html#RoundUpPowerOf2
	if (v === 0) return 0;
	v--;
	v |= v >> 1;
	v |= v >> 2;
	v |= v >> 4;
	v |= v >> 8;
	v |= v >> 16;
	return v + 1;
}