/*! Copyright 2023 gnabgib MPL-2.0 */

import { ContentError, InvalidLengthError } from '../../primitive/ErrorExt.js';

/**
 * [PKCS#7 padding](https://tools.ietf.org/html/rfc5652#section-6.3)
 * 
 * Padding is in whole bytes. The value of each added byte is the number of bytes 
 * that are added, i.e. N bytes, each of value N are added. The number of bytes 
 * added will depend on the block boundary to which the message needs to be extended. 
 * 
 * Padding **must** be added (so it can be detected/removed by {@link Pkcs7.unpad})
 * 
 * PKCS#5 padding is identical to PKCS#7 padding, except that it has only been 
 * defined for block ciphers that use a 64-bit (8-byte) block size. In practice, 
 * the two can be used interchangeably. 
 */
export class Pkcs7 {
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor(){}

	/** {@inheritDoc crypt/pad/IPad.IPad.padSize} */
	static padSize(inputSize: number, len: number): number {
        return (inputSize<=len)?len:0;
    }

	/** 
     * {@inheritDoc crypt/pad/IPad.IPad.pad} 
	 * 
	 * @throws {@link primitive/ErrorExt.InvalidLengthError} 
	 * If `input` is too long
	 * 
	 * @example
	 * ```
	 * const original = Uint8Array.of(0xDD, 0xDD, 0xDD, 0xDD);
	 * // = DD DD DD DD
	 * const pad = Pkcs7.pad(original, 8);
	 * // = DD DD DD DD 04 04 04 04
	 * ```
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
     * {@inheritDoc crypt/pad/IPad.IPad.unpad} 
	 * 
	 * @throws {@link primitive/ErrorExt.ContentError} 
	 * If padding length is too large, or one byte doesn't match
	 * 
	 * @example
	 * ```
	 * const pad = Uint8Array.of(0xDD, 0xDD, 0xDD, 0xDD, 0x04, 0x04, 0x04, 0x04);
	 * // = DD DD DD DD 04 04 04 04
     * const unpad = Pkcs7.unpad(pad);
	 * // = DD DD DD DD
	 * ```
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

/** {@inheritDoc Pkcs7}*/
export const Pkcs5=Pkcs7;