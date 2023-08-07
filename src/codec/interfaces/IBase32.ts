/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { IEncoder } from './IEncoder.js';

/**
 * Base 32 encoder/decoder
 */
export interface IBase32 extends IEncoder {
	/**
	 * Convert an array of bytes into encoded text
	 * @remarks 40=5bits*8=8bits*5
	 * @param b Bytes to encode
	 * @param addPad Whether to includ padding (default @see reqPad)
	 * @returns encoded string
	 */
	fromBytes(b: Uint8Array, addPad?: boolean): string;
	/**
	 * Convert encoded text into an array of bytes
	 * @param base32 encoded data
	 * @param requirePad Whether padding is required (default @see reqPad) - if required and missing, may throw
	 * @throws {ContentError} Bad character|Content after padding|padding missing
	 */
	toBytes(base32: string, requirePad?: boolean): Uint8Array;
}
