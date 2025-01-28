/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { IWriter } from "../../primitive/interfaces/IWriter.js";

export interface IHash extends IWriter {
	/**
	 * Sum the hash with the all content written so far (does not mutate state)
     * - You can call write(a)-sum-write(b)-sum to get hash(a) and hash(ab)
	 */
    sum():Uint8Array;
    /**
     * Sum the hash - mutates internal state, but avoids memory alloc.
     * Use if you won't need the obj again (for performance)
     */
    sumIn():Uint8Array;
    /**
     * Set hash to initial state. Any past writes will be forgotten (used in crypto)
     */
    reset():void;
    /**
     * Create an empty IHash using the same algorithm
     */
    newEmpty():IHash;
    /**
     * Create a copy of the current context (uses different memory)
     */
    clone():IHash;
    /**
     * Digest size in bytes
     */
    get size():number;
    /**
     * Block size in bytes
     */
    get blockSize():number;
}

