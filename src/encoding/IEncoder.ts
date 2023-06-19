/*! Copyright 2023 gnabgib MPL-2.0 */

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