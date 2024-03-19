/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { ContentError } from '../../error/ContentError.js';
import { LengthError } from '../../error/LengthError.js';

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
	/** {@inheritDoc crypto.IPad.padSize} */
	static padSize(inputSize: number, len: number): number {
		return inputSize <= len ? len : 0;
	}

	/**
	 * {@inheritDoc crypto.IPad.pad}
	 *
	 * @throws {@link error.LengthError}
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
		if (need < 0) throw LengthError.atMost(len, 'input.length', len - need);
		ret.fill(need, len - need);
		ret.set(input.subarray(pos));
		return ret;
	}

	/**
	 * {@inheritDoc crypto.IPad.unpad}
	 *
	 * @throws {@link error.ContentError}
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
			throw new ContentError('count too large', 'last byte', count);
		for (let i = count - 1; i > 0; i--) {
			if (input[--pos] !== count)
				throw new ContentError(`expecting ${count}`, `byte:${pos}`, input[pos]);
		}
		return input.subarray(0, pos);
	}
}

/** {@inheritDoc Pkcs7}*/
export const Pkcs5 = Pkcs7;
