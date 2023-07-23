/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { safety } from '../primitive/Safety.js';

const ord_low = 33; //!
const ord_high = 126; //~

/**
 * Rotates a-zA-Z by @see distA (default 13) and 0-9 by @see distD (default 5),
 *  extended UTF8 chars are untouched (ROT13.5, ROT13+5)
 * @param bytes
 * @param distA number=13, -25 <= distA <= -25 (Positive distance 13 a->n, 11 a->l)
 * @param distD number=5, -9 <= distD <=9 (Positive distance 5 1->6, 3 1->4)
 * @returns
 */
export function shift(bytes: Uint8Array, dist = 47): Uint8Array {
	safety.intInRangeInc(dist, -93, 93,'dist');
	const ret = new Uint8Array(bytes.length);
	//1000001 = x41 = 65 = A
	//1100001 = x61 = 97 = a
	for (let i = 0; i < bytes.length; i++) {
		//Case fold up->low
		const byte = bytes[i];
		let shift = 0;
		if (byte >= ord_low && byte <= ord_high) {
			const diff = byte - ord_low;
			shift = ((94 + diff + dist) % 94) - diff;
		}
		ret[i] = bytes[i] + shift;
	}
	return ret;
}
