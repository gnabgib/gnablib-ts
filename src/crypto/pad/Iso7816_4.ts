/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { ContentError } from '../../error/ContentError.js';
import { LengthError } from '../../error/LengthError.js';
//import { somewhatSafe } from '../../safe/index.js';

const Iso7816_4_marker = 0x80;

/**
 * [ISO 7816-4:2005 padding](https://en.wikipedia.org/wiki/ISO/IEC_7816)
 * 
 * The first byte is 0x80 followed, if needed, by 0 to N − 1 bytes set to 0x00,
 * until the end of the block is reached. ISO/IEC 7816-4 itself is a communication 
 * standard for smart cards containing a file system, and in itself does not 
 * contain any cryptographic specifications. 
 * 
 * [ISO 9797-1](https://en.wikipedia.org/wiki/ISO/IEC_9797-1) padding method 2
 */
export class Iso7816_4 {
    /** {@inheritDoc crypto.IPad.padSize} */
	static padSize(inputSize: number, len: number): number {
        return (inputSize<=len)?len:0;
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
	 * const pad = Iso7816_4.pad(original, 8);
	 * // = DD DD DD DD 80 00 00 00
	 * ```
	 */
	static pad(input: Uint8Array, len: number, pos = 0): Uint8Array {
		const ret = new Uint8Array(len);
		//somewhatSafe.lengthAtLeast(input,len+pos);
		const need = len - (input.length - pos);
		if (need <= 0) throw LengthError.atMost(len,'input.length',len-need);
		ret.set(input.subarray(pos));
		ret[len - need] = Iso7816_4_marker;
		return ret;
	}

    /** 
     * {@inheritDoc crypto.IPad.unpad} 
	 * 
	 * @throws {@link ../primitive/ContentError}
	 * If padding marker isn't found
	 * 
	 * @example
	 * ```
	 * const pad = Uint8Array.of(0xDD, 0xDD, 0xDD, 0xDD, 0x80, 0, 0, 0);
	 * // = DD DD DD DD 80 00 00 00
     * const unpad = Iso7816_4.unpad(pad);
     * // = DD DD DD DD
	 * ```
	 */
	static unpad(input: Uint8Array, pos = 0): Uint8Array {
		if (pos === 0) pos = input.length - 1;
		while (pos >= 0 && input[pos] === 0) pos--;
		if (pos < 0 || input[pos] !== Iso7816_4_marker)
			throw new ContentError(
				`expecting end-marker ${Iso7816_4_marker}`,
				'input',
				input[pos]
			);
		return input.subarray(0, pos);
	}
}

/** @inheritDoc Iso7816_4*/
export const Iso9797_1 = Iso7816_4;