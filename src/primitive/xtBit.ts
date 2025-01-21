/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

/**
 * Count how many bits are set in a 32bit number (signed or unsigned)
 * @param n32 Number to count bits set to 1, limited to 32bits in length
 * @returns
 */
export function countBitsSet(n32: number): number {
	//Parallel count.. costs 9 ops, but is o(1)
	n32 -= (n32 >>> 1) & 0x55555555;
	n32 = (n32 & 0x33333333) + ((n32 >>> 2) & 0x33333333);
	n32 = (n32 + (n32 >>> 4)) & 0x0f0f0f0f;
	n32 += n32 >>> 8;
	n32 += n32 >>> 16;
	return n32 & 0x3f;
	// //Brian Kernighan's method
	// //http://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetKernighan
	// //As many iterations as bits.. so it can be quite costly 2n (where n is bits)
	// let c = 0;
	// for (; n32; c++) n32 &= n32 - 1;
	// return c;
}

/**
 * Compose a least significant mask of `bits` width
 * @param bits number of bits to mask [0 - 32]
 */
export function lsbMask(bits: number): number {
	return bits == 0 ? 0 : 0xffffffff >>> (32 - bits);
}

/**
 * Invert the significance of the bits in a number, which can be sized per bitsPow2
 *
 * 1 = 2^1 =  2 bits
 * 2 = 2^2 =  4 bits
 * 3 = 2^3 =  8 bits
 * 4 = 2^4 = 16 bits
 * 5 = 2^5 = 32 bits
 *
 * Note the results are unpredictable if n uses more bits than 2^bitsPow2
 *
 * @param n Number to reverse
 * @param bitsPow2 How many bits to reverse, treated as a power of two [1 - 5]
 * @returns Reversed number
 */
export function reverse(n: number, bitsPow2: number): number {
	switch (bitsPow2) {
		case 5: //2^5=32
			n = ((n & 0xffff0000) >>> 16) | ((n & 0x0000ffff) << 16); //Swap word
		// eslint-disable-next-line no-fallthrough
		case 4: //2^4=16
			n = ((n & 0xff00ff00) >>> 8) | ((n & 0x00ff00ff) << 8); //Swap byte
		// eslint-disable-next-line no-fallthrough
		case 3: //2^3=8
			n = ((n & 0xf0f0f0f0) >>> 4) | ((n & 0x0f0f0f0f) << 4); //Swap nibble
		// eslint-disable-next-line no-fallthrough
		case 2: //2^2=4
			n = ((n & 0xcccccccc) >>> 2) | ((n & 0x33333333) << 2); //Swap pairs
		// eslint-disable-next-line no-fallthrough
		case 1: //2^1=2
			n = ((n & 0xaaaaaaaa) >>> 1) | ((n & 0x55555555) << 1); //Swap bits
			break;
		default:
			throw Error('bitsPow2 must be [1 - 5]');
	}
	return n;
}

/**
 * Count the number of leading zeros in a 32bit number (signed or unsigned)
 */
export function countLeadZeros(n32: number): number {
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

/**
 * Find the next power of 2 that's at least `n32` in magnitude
 */
export function nextPow2(n32: number): number {
	//http://graphics.stanford.edu/%7Eseander/bithacks.html#RoundUpPowerOf2
	if (n32 === 0) return 0;
	n32--;
	n32 |= n32 >> 1;
	n32 |= n32 >> 2;
	n32 |= n32 >> 4;
	n32 |= n32 >> 8;
	n32 |= n32 >> 16;
	return n32 + 1;
}
