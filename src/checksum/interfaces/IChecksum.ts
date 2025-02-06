/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { IWriter } from "../../primitive/interfaces/IWriter.js";

export interface IChecksum extends IWriter {
    /**
     * Generate the checksum with the all content written so far (does not mutate state).
     * You can call `write(a), sum(), write(b), sum()` to get `checksum(a)` and `checksum(ab)`
     */
    sum():Uint8Array;
    // /**
    //  * Generate the checksum - mutates internal state, but avoids memory alloc.
    //  * Use if you won't need the obj again (for performance)
    //  */
    // sumIn():Uint8Array;
    // /**
    //  * Set hash to initial state. Any past writes will be forgotten (used in crypto)
    //  */
    // reset():void;
    // /**
    //  * 
    //  * Create an empty IHash using the same algorithm
    //  */
    // newEmpty():IHash;
    // /**
    //  * Create a copy of the current context (uses different memory)
    //  */
    // clone():IHash;
    /**
     * Sum size in bytes
     */
    get size():number;
    // /**
    //  * Block size in bytes
    //  */
    // get blockSize():number;
}

