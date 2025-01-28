/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { BitWriter } from '../BitWriter.js';
import { ByteWriter } from '../ByteWriter.js';

export interface ISerialBit {
    /** Number of bits required to serialize */
	get serialBits(): number;

    /**
	 * Serialize value
	 * @throws Error if not enough space
	 */
	serial(bw: BitWriter): void;
	//static deserial(br:BitReader):T;
}
export interface ISerialByte {
	get serialBytes(): number;
	serial(bw: ByteWriter): void;
	//static deserial(br:ByteReader):T;
}
