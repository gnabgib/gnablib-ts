/*! Copyright 2025 the gnablib contributors MPL-1.1 */

/**
 * Count the number of leading zeros in a 32bit number (signed or unsigned)
 * @param n32 Number to count leading zeros, limited to 32bits in length
 * @returns
 */
export function leadingZeros(n32: number): number {
	//de bruijn method
	if (n32 == 0) return 32;
    // prettier-ignore
	const debruijn_clz32 = [
		0, 31, 9, 30, 3, 8, 13, 29, 2, 5, 7, 21, 12, 24, 28, 19,
        1, 10, 4, 14, 6, 22, 25, 20, 11, 15, 23, 26, 16, 27, 17, 18,
	];
	n32 |= n32 >> 1;
	n32 |= n32 >> 2;
	n32 |= n32 >> 4;
	n32 |= n32 >> 8;
	n32 |= n32 >> 16;
	n32++;
	return debruijn_clz32[(n32 * 0x076be629) >>> 27];
}
