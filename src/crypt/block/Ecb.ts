/*! Copyright 2023 gnabgib MPL-2.0 */

import { IPad } from "../padding/IPad.js";
import { ICrypt } from "../sym/ICrypt.js";

interface IBlockMode {
    /** Block size in bytes */
    get blockSize():number;
    decryptInto(plain:Uint8Array,enc:Uint8Array):void;
    encryptInto(enc:Uint8Array,plain:Uint8Array):void;
}

/**
 * Electronic codebook (ECB)
 * @deprecated ECB lacks diffusion, which can leak data patterns
 */
export class Ecb implements IBlockMode {
    private readonly _crypt:ICrypt;
    private readonly _padder:IPad;

    constructor(crypt:ICrypt,padder:IPad) {
        this._crypt=crypt;
        this._padder=padder;
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
}

/**
 * Cipher block chaining (CBC)
 */
export class Cbc implements IBlockMode {
    private readonly _crypt:ICrypt;
    private readonly _padder:IPad;
    private readonly _iv:Uint8Array;

    constructor(crypt:ICrypt,padder:IPad,iv:Uint8Array) {
        this._crypt=crypt;
        this._padder=padder;
        this._iv=iv;
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
}