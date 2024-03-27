/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { sNum } from '../safe/safe.js';
import { fpb32 } from './ieee754-fpb.js';

/**
 * # [bfloat16](https://en.wikipedia.org/wiki/Bfloat16_floating-point_format)
 *
 * A 16 bit floating point number, this format is a truncated version of the
 * {@link codec.fpb32 | 32-bit IEEE 754 binary floating point}, using the
 * same number of exponent bits (8) but only an 8 bit precision.
 *
 * **Note** This format is unsuitable for integer calculations, but it's intended
 * to be used in machine learning.
 *
 * @namespace
 */
export const bfloat16 = {
	/**
	 * Encode a binary floating point number to 16 bit precision bfloat
	 * @param bfloat16
	 * @returns
	 */
	toBytes: function (bfloat16: number): Uint8Array {
		return fpb32.toBytes(bfloat16).subarray(0, 2);
	},

	/**
	 * Decode 16 bit bfloat (big endian) data into a floating point number
	 * @param bytes
	 * @param pos
	 * @returns
	 */
	fromBytes: function (bytes: Uint8Array, pos = 0): number {
		sNum('pos',pos).unsigned().atMost(bytes.length - 2).throwNot();
		const expand = new Uint8Array(4);
		expand.set(bytes.subarray(pos, pos + 2));
		return fpb32.fromBytes(expand, 0);
	},
};
