/*! Copyright 2025 the gnablib contributors MPL-1.1 */

export interface IWriter {
	/**
	 * Write a series of bytes
	 * @throws Error if there's not enough space
	 */
	write(data: Uint8Array): void;
}
