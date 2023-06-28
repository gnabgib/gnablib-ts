import { IPad } from "../padding/IPad.js";
import { ICrypt } from "../sym/ICrypt.js";
import { IBlockMode } from "./IBlockMode.js";

/**
 * [Cipher block chaining (CBC)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher_block_chaining_(CBC))
 * 
 * In Cipher block chaining (CBC) mode, each block of plaintext is XORed with the previous 
 * ciphertext block before being encrypted. This way, each ciphertext block depends on all 
 * plaintext blocks processed up to that point. To make each message unique, an 
 * initialization vector *must* be used in the first block. 
 * 
 * Specified in [FIPS-81](https://csrc.nist.gov/csrc/media/publications/fips/81/archive/1980-12-02/documents/fips81.pdf)
 */
export class Cbc implements IBlockMode {
    private readonly _crypt: ICrypt;
    private readonly _pad: IPad;
    private readonly _iv: Uint8Array;

    constructor(crypt: ICrypt, pad: IPad, iv: Uint8Array) {
        this._crypt = crypt;
        this._pad = pad;
        this._iv = iv;
    }

    get blockSize(): number {
        return this._crypt.blockSize;
    }

    decryptInto(plain: Uint8Array, enc: Uint8Array): void {

        throw new Error("Method not implemented.");
    }
    encryptInto(enc: Uint8Array, plain: Uint8Array): void {
        throw new Error("Method not implemented.");
    }


    /**
     * Size required (in bytes) for encrypted form (due to padding, may be larger)
     * @param plainLen
     */
    encryptSize(plainLen: number): number {
        const bsb = this._crypt.blockSize;
        const rem = plainLen % bsb;
        return this._pad.padSize(rem === 0 ? bsb : rem, bsb) - rem + plainLen;
    }
}
