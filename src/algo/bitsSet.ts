/*! Copyright 2025 the gnablib contributors MPL-1.1 */

/**
 * Count how many bits are set in a 32bit number (signed or unsigned)
 * @param n32 Number to count bits set to 1, limited to 32bits in length
 * @returns
 */
export function bitsSet(n32: number): number {
	//Brian Kernighan's method
	//http://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetKernighan
	let c = 0;
	for (; n32; c++) n32 &= n32 - 1;
	return c;
}
