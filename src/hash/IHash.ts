/*! Copyright 2023 gnabgib MPL-2.0 */

export interface IHash {
    /**
     * Write data to the hash (can be called multiple times)
     * @param data 
     */
    write(data:Uint8Array):void;
    /**
     * Clone the running context, close out the hash, and return the sum (does not change running hash)
     * - You can call write(a)-sum-write(b)-sum to get hash(a) and hash(ab)
     */
    sum():Uint8Array;
    /**
     * Set hash to initial state. Any past writes will be forgotten
     */
    reset():void;
    /**
     * Digest size in bytes
     */
    get size():number;
    /**
     * Block size in bytes
     */
    get blockSize():number;
}