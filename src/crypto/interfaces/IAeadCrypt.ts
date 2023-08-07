/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { IFullCrypt } from "./IFullCrypt.js";

/**
 * [Authenticated Encryption with authenticated data (AEAD)](https://en.wikipedia.org/wiki/Authenticated_encryption)
 */
export interface IAeadCrypt extends IFullCrypt {
    /** Tag size in bytes */
    get tagSize():number;
    /**
     * Add associated data
     * @param data
     */
    writeAD(data: Uint8Array): void;
    /**
     * Finalize encryption and generate the tag (authentication), frequently
     * the tag is appended to the encrypted stream.
     * @returns Tag
     */
    finalize(): Uint8Array;
    /**
     * Finalize decryption and verify tag (authentication)
     *
     * *NOTE* If you don't call verify you don't get authenticated encryption,
     * some implementations embed this in encrypt/decrypt calls, but that prevents
     * multi-stage data addition (which aligns with {@link IFullCrypt})
     *
     * @param tag
     * @returns Whether stream is valid or not
     */
    verify(tag: Uint8Array): boolean;
}
