/*! Copyright 2023 gnabgib MPL-2.0 */

import { ContentError, InvalidLengthError } from '../../primitive/ErrorExt.js';

export class Pkcs7 {
	/** Pad only a block shorter than length */
	static shouldPad(inputSize: number, len: number): boolean {
		return inputSize < len;
	}
	/**
	 * Repeat the number of padding bytes required at the end of the input until the given length
	 * Padding MUST be added (so it can be removed)
	 * PKCS5 requires len=8, while PKCS7 allows up to 256, we consider them interchangeable
	 * @param input
	 * @param len Size to pad to (pos+len)
	 * @param pos Optional position to start in input (default 0)
	 * @returns A copy with the added padding
	 * @throws {@link InvalidLengthError} If `input` is too long
	 */
	static pad(input: Uint8Array, len: number, pos = 0): Uint8Array {
		const ret = new Uint8Array(len);
		const need = len - (input.length - pos);
		if (need < 0)
			throw new InvalidLengthError('input', 'at most ' + len, `${len - need}`);
		ret.fill(need, len - need);
		ret.set(input.subarray(pos));
		return ret;
	}
	/**
	 * Remove padding from input
	 * @param input
	 * @param pos
	 * @returns Attempt at original input (shared memory)
	 * @throws {@link ContentError} If padding length is bad
	 */
	static unpad(input: Uint8Array, pos = 0): Uint8Array {
		if (pos == 0) pos = input.length - 1;
		const count = input[pos];
		if (pos - count < -1)
			throw new ContentError('last byte', 'count too large', count);
		for (let i = count - 1; i > 0; i--) {
			if (input[--pos] !== count)
				throw new ContentError(`byte:${pos}`, `expecting ${count}`, input[pos]);
		}
		return input.subarray(0, pos);
	}
}

/** {@inheritdoc Pkcs7}*/
export const Pkcs5=Pkcs7;