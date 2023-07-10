/*! Copyright 2023 the gnablib contributors MPL-2.0 */

import { ICrypt } from "./ICrypt.js";

/**
 * [Ascon](https://csrc.nist.gov/CSRC/media/Projects/lightweight-cryptography/documents/round-2/spec-doc-rnd2/ascon-spec-round2.pdf)
 * 
 * Ascon is a family of lightweight authenticated ciphers, based on a sponge construction along the lines 
 * of SpongeWrap and MonkeyDuplex. This design makes it easy to reuse Ascon in multiple ways (as a cipher, hash, or a MAC) 
 * 
 * First Published: *2014*  
 * Block size: *8, 16 bytes*  
 * Key size: *16 bytes*  
 * Rounds: *6-8*  
 * 
 * @alpha
 */
export class Ascon implements ICrypt {
    get blockSize(): number {
        throw new Error("Method not implemented.");
    }
    decryptBlock(block: Uint8Array, offset?: number | undefined): void {
        throw new Error("Method not implemented.");
    }
    encryptBlock(block: Uint8Array, offset?: number | undefined): void {
        throw new Error("Method not implemented.");
    }
}