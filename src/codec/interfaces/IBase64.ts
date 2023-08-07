/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IBase64 {
	/**
	 * Convert an array of bytes into encoded text
	 * @remarks 24=6bits*4 = 8bits*3
	 * @param bytes Bytes to encode
	 * @param addPad Whether to include padding (default @see reqPad)
	 * @returns encoded string
	 */
	fromBytes(bytes: Uint8Array, addPad?: boolean): string;
	/**
	 * Convert encoded text into an array of bytes
	 * @param base64 encoded data
	 * @param requirePad Whether padding is required (default @see reqPad) - if required and missing, may throw
	 * @throws {ContentError} Bad character|Content after padding|padding missing
	 */
	toBytes(base64: string, requirePad?: boolean): Uint8Array;
}
