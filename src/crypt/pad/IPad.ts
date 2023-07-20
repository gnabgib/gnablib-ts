/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IPad {
	/**
	 * How much padding to add for a given size.  The size is expected
	 * to be only the remainder of content (ie. `% blockSize`)
	 * @param inputSize Size that might require padding
	 * @param len Length if padded, or 0
	 */
	padSize(inputSize: number, len: number): number;
	/**
	 * Using new memory, concatenate `input` (starting at `pos`) and a number
	 * of padding bytes until the length matches `len`.
	 * @param input Source data
	 * @param len Required output length
	 * @param pos Optional starting position in input
	 * @returns A copy if `input` with added padding
	 */
	pad(input: Uint8Array, len: number, 
		/**
		 * @defaultValue 0/first byte
		 */
		pos?: number): Uint8Array;
	/**
	 * Remove padding from the input
	 * @param input Padded data
	 * @param pos Optional stating position in input
	 * @returns Source data
	 */
	unpad(input: Uint8Array, 
		/**
		 * @defaultValue input.length-1/last byte
		 */
		pos?: number): Uint8Array;
}
//https://www.di-mgt.com.au/cryptopad.html
//https://en.wikipedia.org/wiki/Padding_(cryptography)