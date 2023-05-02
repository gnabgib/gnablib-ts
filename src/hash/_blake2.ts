/*! Copyright 2023 gnabgib MPL-2.0 */

import { Uint64 } from '../primitive/Uint64.js';

//Same as Sha2-512
export const iv = [
	//(first 64 bits of the fractional parts of the square roots of the first 8 primes 2..19):
	//These are 64bit numbers.. split into 2*32bit pieces.. there's 4 a line *2 lines=8 numbers
	0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
	0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179
];
export { sigmas } from './_blake.js';

export const fanOutUnlimited = 0;
export const fanOutSequential = 1;
export const maxDepthUnlimited = 255;
export const maxDepthSequential = 1;
export const leafMaxLenUnlimited = 0;
export const leafMaxLenSequential = 0;
export const nodeOffsetSequential = new Uint64(0);
export const nodeDepthIsLeaf = 0;
export const nodeDepthSequential = 0;
export const innerLenSequential = 0;
