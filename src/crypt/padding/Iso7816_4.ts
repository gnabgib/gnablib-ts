/*! Copyright 2023 gnabgib MPL-2.0 */

import { ContentError, InvalidLengthError } from '../../primitive/ErrorExt.js';

const Iso7816_4_marker = 0x80;
export class Iso7816_4 {
	/** Even if a block is the right size we should pad after */
	static shouldPad(inputSize: number, len: number): boolean {
		return inputSize <= len;
	}
	/**
	 * Add 0x80 followed by zero-bytes to the input until the given length
	 * Padding MUST be added (so it can removed)
	 * @param input
	 * @param len
	 * @param pos
	 * @returns A copy with the added padding
	 * @throws {@link InvalidLengthError} If `input` is too long
	 */
	static pad(input: Uint8Array, len: number, pos = 0): Uint8Array {
		const ret = new Uint8Array(len);
		const need = len - (input.length - pos);
		if (need <= 0) {
			throw new InvalidLengthError('input.length', '<' + len, `${len - need}`);
		}
		ret.set(input.subarray(pos));
		ret[len - need] = Iso7816_4_marker;
		return ret;
	}

	/**
	 * Remove padding from input
	 * @param input
	 * @param pos
	 * @returns Original input (shared memory)
	 * @throws If padding marker isn't found
	 */
	static unpad(input: Uint8Array, pos = 0): Uint8Array {
		if (pos === 0) pos = input.length - 1;
		while (pos >= 0 && input[pos] === 0) pos--;
		if (pos < 0 || input[pos] !== Iso7816_4_marker)
			throw new ContentError(
				'input',
				`expecting end-marker ${Iso7816_4_marker}`,
				input[pos]
			);
		return input.subarray(0, pos);
	}
}
