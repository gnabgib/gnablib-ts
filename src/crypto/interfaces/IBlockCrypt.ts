/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IBlockCrypt {
    /** Block size in bytes */
    get blockSize():number;
    /**
     * Decrypt a block in place
     * @param block Encrypted data
     * @param offset Block-offset. Note 1 is the second block (not byte)
     */
    decryptBlock(block:Uint8Array,offset?:number):void
    /**
     * Encrypt a block in place
     * @param block Plain data
     * @param offset Block-offset. Note 1 is the second block (not byte)
     */
    encryptBlock(block:Uint8Array,offset?:number):void
    // /**
    //  * Decrypt `enc` bytes into `plain`
    //  * @param plain Destination memory (must be at least `enc` + padding consideration)
    //  * @param enc Encrypted data
    //  */
    // decryptInto(plain:Uint8Array,enc:Uint8Array):void;
    // /**
    //  * Encrypt `plain` bytes into `enc`
    //  * @param enc Destination memory (must be at least `plain` + padding consideration)
    //  * @param plain Unencrypted source content
    //  */
    // encryptInto(enc:Uint8Array,plain:Uint8Array):void;
}