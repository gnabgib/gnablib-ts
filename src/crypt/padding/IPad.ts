/*! Copyright 2023 gnabgib MPL-2.0 */

export interface IPad {
	/** Whether padding should be applied for the given size */
	shouldPad(inputSize: number, len: number): boolean;
	/** Pad at the end until the given length, pos=input.length must be <=len */
	pad(input: Uint8Array, len: number, pos?: number): Uint8Array;
	unPad(input: Uint8Array, pos?: number): Uint8Array;
}