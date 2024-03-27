/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { sNum } from '../safe/safe.js';

const ord_a = 97;
const ord_z = 122;

/**
 * Rotates a-zA-Z by @see dist (default 13), extended UTF8 chars are untouched (ROT13)
 * @param bytes
 * @param dist number=13, -25-25 (Positive distance 13 a->n, 11 a->l)
 * @throws If dist < -25 || dist > 25
 * @returns
 */
export function shift(bytes: Uint8Array, dist = 13): Uint8Array {
	sNum('dist',dist).atLeast(-25).atMost(25).throwNot();
	const ret = new Uint8Array(bytes.length);
	//1000001 = x41 = 65 = A
	//1100001 = x61 = 97 = a
	for (let i = 0; i < bytes.length; i++) {
		//Case fold up->low
		const ncByte = bytes[i] | 0x20;
		let shift = 0;
		if (ncByte >= ord_a && ncByte <= ord_z) {
			const diff = ncByte - ord_a;
			shift = ((26 + diff + dist) % 26) - diff;
		}
		ret[i] = bytes[i] + shift;
	}
	return ret;
}
