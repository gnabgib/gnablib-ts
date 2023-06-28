
export interface IBlockMode {
    /** Block size in bytes */
    get blockSize(): number;
    /**
     * Decrypt data from `enc` into `plain`.
     * @param plain Target array for decryption, note it should be close to `enc` in length (may be shorter due to padding)
     * @param enc Source encrypted data
     * 
     * @throws
     * If `plain` is not large enough for decrypted content
     */
    decryptInto(plain: Uint8Array, enc: Uint8Array): void;
    /**
     * Encrypt data from `plain` into `enc`
     * @param enc Target array for encryption, note it must be at least {@link encryptSize | `encryptSize(plain.length)`} in length
     * @param plain Source plain data
     * 
     * @throws
     * If `enc` is not large enough for encrypted content
     */
    encryptInto(enc: Uint8Array, plain: Uint8Array): void;
    /**
     * Calculate the size required (in bytes) for the encrypted form.  
     * Block size, block mode, and padding can effect this.
     * @param plainLen Length of the plain data (in bytes)
     */
    encryptSize(plainLen: number): number;
}
