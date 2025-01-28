/*! Copyright 2025 the gnablib contributors MPL-1.1 */

export interface IWriter {
	/**
	 * Write a byte, will be truncated to 8bits
	 * @throws Error if there's not enough space
	 */
	//writeByte(b: number): void;
	/**
	 * Write a series of bytes
	 * @throws Error if there's not enough space
	 */
	write(data: Uint8Array): void;
}
