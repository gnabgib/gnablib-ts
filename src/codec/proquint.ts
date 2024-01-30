/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { ContentError } from '../primitive/error/ContentError.js';
import { LengthError } from '../primitive/error/LengthError.js';

const tbl_con = 'bdfghjklmnprstvz';
const tbl_con_byte = [
	66, 68, 70, 71, 72, 74, 75, 76, 77, 78, 80, 82, 83, 84, 86, 90,
];
const tbl_vow = 'aiou';
const tbl_vow_byte = [65, 73, 79, 85];
const last4Bits = 0b1111;
const last2Bits = 0b11;

/**
 * Convert an array of bytes into proquint encoded data
 *
 * @param src Bytes to encode, `length` must be a multiple of 2
 * @returns Encoded string - `5*src.length/2` in length
 *
 * @example
 * ```js
 * import { proquint } from 'gnablib/codec';
 *
 * proquint.fromBytes(hex.toBytes('DEADBEEF')); //
 * ```
 */
export function fromBytes(src: Uint8Array): string {
	if ((src.length & 1) != 0)
		throw LengthError.mulOf(2, 'bytes.length', src.length);
	let ret = '';
	for (let i = 0; i < src.length; ) {
		//[ccccvvcc][ccvvcccc]
		ret +=
			tbl_con[(src[i] >> 4) & last4Bits] +
			tbl_vow[(src[i] >> 2) & last2Bits] +
			tbl_con[((src[i++] << 2) | (src[i] >> 6)) & last4Bits] +
			tbl_vow[(src[i] >> 4) & last2Bits] +
			tbl_con[src[i++] & last4Bits] +
			'-';
	}
	return ret.substring(0, ret.length - 1);
}

/**
 * Convert proquint encoded data into bytes
 * @param src
 * @throws If an unknown character is found or if the content is malformed (wrong length, wrong character in place)
 * @returns
 */
export function toBytes(src: string): Uint8Array {
	const arr = new Uint8Array((src.length / 5) * 2);
	let outputPtr = 0;
	let carry = 0;
	let pos = 0;
	let dec = -1;
	for (const char of src) {
		if (char === '-') continue; //Ignore dashes
		if ((pos++ & 1) === 1) {
			dec = tbl_vow_byte.indexOf(char.charCodeAt(0) & 0x5f);
			carry = (carry << 2) | dec;
		} else {
			dec = tbl_con_byte.indexOf(char.charCodeAt(0) & 0x5f);
			carry = (carry << 4) | dec;
			if (pos === 5) {
				arr[outputPtr++] = (carry >> 8) & 0xff;
				arr[outputPtr++] = carry & 0xff;
				pos = 0;
			}
		}
		if (dec < 0) throw new ContentError('unknown', `src[${pos - 1}]`, char);
	}
	if (pos != 0)
		throw new ContentError(
			'Should be a multiple of 5, have leftovers',
			'Size',
			pos
		);
	return arr.subarray(0, outputPtr);
}
