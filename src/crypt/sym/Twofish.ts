/*! Copyright 2023 gnabgib MPL-2.0 */

import { ICrypt } from "./ICrypt.js";

/**
 * [Twofish block cipher](https://www.schneier.com/wp-content/uploads/2016/02/paper-twofish-paper.pdf) 
 * ([Wiki](https://en.wikipedia.org/wiki/Twofish))
 * 
 * Twofish is a symmetric key block cipher with a block size of 128 bits and key sizes up to 256 bits. 
 * It was one of the five finalists of the Advanced Encryption Standard contest, but it was not 
 * selected for standardization. Twofish is related to the earlier block cipher Blowfish. 
 * 
 * First Published: *1998*  
 * Block size: *16 bytes*  
 * Key size: *16, 24, 32 bytes*  
 * Rounds: *16*  
 * 
 * @alpha
 */
export class Twofish implements ICrypt {
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