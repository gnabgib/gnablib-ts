/*! Copyright 2023 gnabgib MPL-2.0 */

import { InvalidLengthError } from '../../primitive/ErrorExt.js';

export class Zero {
    /** Pad only a block shorter than length */
    static shouldPad(inputSize:number,len:number):boolean {
        return inputSize<len;
    }
    /**
     * Add trailing zero-bytes to input until given length
     * If the last input-byte could be zero this COULD be ambiguous
     * (use another padding or specify the size within the message)
     * @param input
     * @param len Size to pad to (pos+len)
     * @param pos Optional position to start in input (default 0)
     * @returns A copy with the added padding
     * @throws {@link InvalidLengthError} If `input` is too long
     */
    static pad(input: Uint8Array, len: number, pos = 0): Uint8Array {
        const ret = new Uint8Array(len);
        const need = len - (input.length - pos);
        if (need < 0) {
            throw new InvalidLengthError('input', 'at most ' + len, `${len - need}`);
        }
        ret.set(input.subarray(pos));
        return ret;
    }
    /**
     * Remove padding from input
     * NOTE: If the input ended with any zeros, they will be consumed
     * @param input
     * @param pos
     * @returns Attempt at original input (shared memory)
     */
    static unpad(input: Uint8Array, pos = 0): Uint8Array {
        if (pos == 0) pos = input.length - 1;
        while (pos >= 0 && input[pos] === 0) {
            pos--;
        }
        return input.subarray(0, pos + 1);
    }
}
