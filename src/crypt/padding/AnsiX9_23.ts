/*! Copyright 2023 gnabgib MPL-2.0 */

import { ContentError, InvalidLengthError } from '../../primitive/ErrorExt.js';

//https://www.ibm.com/docs/en/linux-on-systems?topic=processes-ansi-x923-cipher-block-chaining

export class AnsiX9_23 {
    /** Pad only a block shorter than length */
    static shouldPad(inputSize: number, len: number): boolean {
        return inputSize < len;
    }
    /**
     * Add random bytes to the input until given length, with the last byte indicating how
     * many were added.
     * Padding MUST be added (so it can be removed)
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
        const randPad = new Uint8Array(need - 1);
        crypto.getRandomValues(randPad);
        ret.set(input.subarray(pos));
        ret.set(randPad, len - need);
        ret[len - 1] = randPad.length + 1;
        return ret;
    }

    /**
     * Remove padding from input
     * @param input
     * @param pos
     * @returns Attempt at original input (shared memory)
     * @throws {@link ContentError} If padding marker isn't found
     */
    static unpad(input: Uint8Array, pos = 0): Uint8Array {
        if (pos == 0) pos = input.length - 1;
        const count = input[pos];
        if (pos - count < -1)
            throw new ContentError('last byte', 'count too large', count);
        return input.subarray(0, pos - count + 1);
    }
}

/** {@inheritdoc AnsiX9_23}*/
export const Iso10126=AnsiX9_23;