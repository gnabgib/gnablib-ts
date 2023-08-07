/*! Copyright 2023 the gnablib contributors MPL-1.1 */

/**
 * At build time we expect input: ArrayBuffer/offset/length, and to know how many bytes is required for storage
 * You can fool this by adhering to this interface
 */
export interface IBuildable<T> {
	new (buffer: ArrayBuffer, offset: number, length: number): T;
	get BYTES_PER_ELEMENT(): number;
}
