/*! Copyright 2023 the gnablib contributors MPL-1.1 */

/**
 * Encoder/decoder
 */
export interface IEncoder {
    /**
     * Encode bytes into text
     * @param bytes Source data
     */
    fromBytes(bytes: Uint8Array): string;
    /**
     * Decode encoded text into bytes
     * @param enc Encoded data
     */
    toBytes(enc: string): Uint8Array;
}