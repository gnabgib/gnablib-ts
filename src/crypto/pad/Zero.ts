/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { LengthError } from '../../primitive/error/LengthError.js';

/**
 * [Zero padding](https://en.wikipedia.org/wiki/Padding_(cryptography)#Zero_padding)
 * 
 * All the bytes that are required to be padded are padded with zero.  
 * ISO 10118-1 and ISO 9797-1 refer to this as *Padding Method 1*
 * 
 * Zero padding may not be reversible if the original file ends with one or more zero
 * bytes.  Out-of-bound message length may need to be required.
 */
export class Zero {
	/** {@inheritDoc crypto.IPad.padSize} */
	static padSize(inputSize: number, len: number): number {
        return (inputSize<len && inputSize>0)?len:0;
    }

	/** 
     * {@inheritDoc crypto.IPad.pad} 
	 * 
	 * @throws {@link ../primitive/InvalidLengthError} 
	 * If `input` is too long
	 * 
	 * @example
	 * ```
	 * const original = Uint8Array.of(0xDD, 0xDD, 0xDD, 0xDD);
	 * // = DD DD DD DD
	 * const pad = Zero.pad(original, 8);
	 * // = DD DD DD DD 00 00 00 00
	 * ```
	 */
	static pad(input: Uint8Array, len: number, pos = 0): Uint8Array {
		const ret = new Uint8Array(len);
		const need = len - (input.length - pos);
		if (need < 0) throw LengthError.atMost(len,'input.length',len-need);
		ret.set(input.subarray(pos));
		return ret;
	}

    /** 
     * {@inheritDoc crypto.IPad.unpad} 
	 * 
	 * @example
	 * ```
	 * const pad = Uint8Array.of(0xDD, 0xDD, 0xDD, 0xDD, 0, 0, 0, 0);
	 * // = DD DD DD DD 00 00 00 00
     * const unpad = Zero.unpad(pad);
	 * // = DD DD DD DD
	 * ```
	 * 
	 * @example
	 * Ambiguous padding will alter message
	 * ```
	 * const original = Uint8Array.of(1,0);
	 * // = 01 00
	 * const pad = Zero.pad(original, 8);
	 * // = 01 00 00 00 00 00 00 00
	 * const unpad = Zero.unpad(pad);
	 * // = 01 - Trailing zero lost
	 */
	static unpad(input: Uint8Array, pos = 0): Uint8Array {
		if (pos == 0) pos = input.length - 1;
		while (pos >= 0 && input[pos] === 0) {
			pos--;
		}
		return input.subarray(0, pos + 1);
	}
}
