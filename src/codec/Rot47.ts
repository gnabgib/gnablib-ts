/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { sNum } from '../safe/safe.js';

const ord_low = 33; //!
const ord_high = 126; //~

/**
 * # ROT47
 *
 * *Rotate by 47 places*, a simple letter substitution cipher, a form of the
 * [caesar cipher](https://en.wikipedia.org/wiki/Caesar_cipher) shifts all
 * printable characters by `$diff` places. Range includes [`!` - `~`].  Extended
 * UTF8 chars are untouched.
 *
 * @param input Source data (in bytes, use {@link codec.utf8.toBytes utf8.toBytes} to convert)
 * @param diff Amount to shift by, integer=47 [-93, 93]
 * @returns Encoded data
 */
export function shift(input: Uint8Array, diff = 47): Uint8Array {
	sNum('diff',diff).atLeast(-93).atMost(93).throwNot();
	const ret = new Uint8Array(input.length);
	//1000001 = x41 = 65 = A
	//1100001 = x61 = 97 = a
	for (let i = 0; i < input.length; i++) {
		//Case fold up->low
		const byte = input[i];
		let shift = 0;
		if (byte >= ord_low && byte <= ord_high) {
			const base = byte - ord_low;
			shift = ((94 + base + diff) % 94) - base;
		}
		ret[i] = input[i] + shift;
	}
	return ret;
}
