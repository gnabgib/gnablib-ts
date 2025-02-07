/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { IWriter } from '../../primitive/interfaces/IWriter.js';

export interface IChecksum extends IWriter {
	/**
	 * Generate the checksum with the all content written so far (does not mutate state).
	 * You can call `write(a), sum(), write(b), sum()` to get `checksum(a)` and `checksum(ab)`
	 */
	sum(): Uint8Array;

	/** Sum size in bytes */
	get size(): number;

    /** Write a series of bytes */
	write(data: Uint8Array): void;
}

export interface IHashsum extends IChecksum {
	/** Block size in bytes */
	get blockSize(): number;
    
	/**
	 * Generate the checksum by mutating the internal state, avoids memory alloc.
	 * Use if you won't need the obj again (for performance)
	 */
	sumIn(): Uint8Array;

	/** Create a copy of this hashsum (uses different memory) */
	clone(): IHashsum;
}
