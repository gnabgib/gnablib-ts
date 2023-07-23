/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { safety } from '../primitive/Safety.js';

const ord_a = 97;
const ord_z = 122;
const ord_0 = 48;
const ord_9 = 57;

/**
 * Rotates a-zA-Z by @see distA (default 13) and 0-9 by @see distD (default 5),
 *  extended UTF8 chars are untouched (ROT13.5, ROT13+5)
 * @param bytes
 * @param distA number=13, -25 <= distA <= -25 (Positive distance 13 a->n, 11 a->l)
 * @param distD number=5, -9 <= distD <=9 (Positive distance 5 1->6, 3 1->4)
 * @returns
 */
export function shift(bytes: Uint8Array, distA = 13, distD = 5): Uint8Array {
	safety.intInRangeInc(distA,-25,25,'distA');
	safety.intInRangeInc(distD,-9,9,'distD');
	const ret = new Uint8Array(bytes.length);
	//1000001 = x41 = 65 = A
	//1100001 = x61 = 97 = a
	for (let i = 0; i < bytes.length; i++) {
		//Case fold up->low
		const byte = bytes[i];
		const ncByte = byte | 0x20;
		let shift = 0;
		if (ncByte >= ord_a && ncByte <= ord_z) {
			const diff = ncByte - ord_a;
			shift = ((26 + diff + distA) % 26) - diff;
			//console.log('shifting '+bytes[i]+' '+shift+' ='+(bytes[i]+shift));
		} else if (byte >= ord_0 && byte <= ord_9) {
			const diff = byte - ord_0;
			shift = ((10 + diff + distD) % 10) - diff;
		}
		ret[i] = bytes[i] + shift;
	}
	return ret;
}
