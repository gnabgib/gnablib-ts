/*! Copyright 2023 gnabgib MPL-2.0 */

import { ContentError, InvalidLengthError } from '../../primitive/ErrorExt.js';
import * as crypto from 'crypto';

/**
 * [ANSI X9.23 padding](https://www.ibm.com/docs/en/linux-on-systems?topic=processes-ansi-x923-cipher-block-chaining)
 *
 * In ANSI X9.23, between 1 and 8 bytes are always added as padding. The block is padded with
 * random bytes and the last byte of the block is set to the number of bytes added.
 *
 * [ISO 10126-2](http://www.iso.org/iso/iso_catalogue/catalogue_tc/catalogue_detail.htm?csnumber=18114) (withdrawn 2007 for low-security encryption recommendation) has the same spec
 */
export class AnsiX9_23 {
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	/** {@inheritDoc crypt/padding/IPad.IPad.padSize} */
	static padSize(inputSize: number, len: number): number {
		return inputSize <= len ? len : 0;
	}

	/** 
     * {@inheritDoc crypt/padding/IPad.IPad.pad} 
     * 
     * @throws {@link primitive/ErrorExt.InvalidLengthError} 
     * If `input` is too long
     * 
     * @example
     * ```
	 * const original = Uint8Array.of(0xDD, 0xDD, 0xDD, 0xDD);
	 * // = DD DD DD DD
     * const pad = AnsiX9_23.pad(original, 8);
     * // = DD DD DD DD ?? ?? ?? 04 - Where ?? are random bytes
     * ```
     */
	static pad(input: Uint8Array, len: number, pos = 0): Uint8Array {
		const ret = new Uint8Array(len);
		const need = len - (input.length - pos);
		if (need < 0)
			throw new InvalidLengthError('input', 'at most ' + len, `${len - need}`);
		const randPad = new Uint8Array(need - 1);
		crypto.getRandomValues(randPad);
		ret.set(input.subarray(pos));
		ret.set(randPad, len - need);
		ret[len - 1] = randPad.length + 1;
		return ret;
	}

    /** 
     * {@inheritDoc crypt/padding/IPad.IPad.unpad} 
     * 
	 * @throws {@link primitive/ErrorExt.ContentError}
	 * If padding marker isn't found
     * 
	 * @example
	 * ```
     * const pad = Uint8Array.of(0xDD, 0xDD, 0xDD, 0xDD, 0x81, 0xA6, 0x23, 0x04);
     * // = DD DD DD DD 81 A6 23 04
	 * const unpad = AnsiX9_23.unpad(pad);
	 * // = DD DD DD DD
	 */
	static unpad(input: Uint8Array, pos = 0): Uint8Array {
		if (pos == 0) pos = input.length - 1;
		const count = input[pos];
		if (pos - count < -1)
			throw new ContentError('last byte', 'count too large', count);
		return input.subarray(0, pos - count + 1);
	}
}

/** @inheritDoc AnsiX9_23*/
export const Iso10126 = AnsiX9_23;
