import { InvalidLengthError } from "../../primitive/ErrorExt.js";
import { IPad } from "../pad/IPad.js";
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
        if (iv.length!=crypt.blockSize)
            throw new InvalidLengthError('iv.length',`to be ${crypt.blockSize}`,''+iv.length);
        this._crypt = crypt;
        this._pad = pad;
        this._iv = iv;
    }

    get blockSize(): number {
        return this._crypt.blockSize;
    }

    decryptInto(plain: Uint8Array, enc: Uint8Array): void {
		const bsb = this._crypt.blockSize;
		const safeLen = enc.length - bsb;
		let ptr = 0;
		let block = 0;
		plain.set(enc.subarray(0, safeLen));
        let prev=this._iv;
		while (ptr < safeLen) {
            const startByte=block*bsb;
			this._crypt.decryptBlock(plain, block++);
            for (let i=0;i<bsb;i++) plain[startByte+i] ^=prev[i];
            prev=enc.subarray(startByte,startByte+bsb);
			ptr += bsb;
		}
		const lastBlock = new Uint8Array(enc.subarray(safeLen));
		this._crypt.decryptBlock(lastBlock);
        for (let i=0;i<bsb;i++) lastBlock[i] ^=prev[i];
		plain.set(this._pad.unpad(lastBlock), safeLen);
    }

    encryptInto(enc: Uint8Array, plain: Uint8Array): void {
        const bsb = this._crypt.blockSize;
		const rem = plain.length % bsb;
		const safeLen = plain.length - rem;
		const padBlock = this._pad.padSize(rem === 0 ? bsb : rem, bsb) > 0;
		const need = safeLen + (padBlock ? bsb : 0);

		enc.set(plain.subarray(0, safeLen));

		let ptr = 0;
		let block = 0;
        let prev=this._iv;
		while (ptr < safeLen) {
            const startByte=block*bsb;
            for (let i=0;i<bsb;i++) enc[startByte+i] ^=prev[i];
			this._crypt.encryptBlock(enc, block++);
            prev=enc.subarray(startByte,startByte+bsb);
			ptr += bsb;
		}
		if (need > safeLen) {
			const pad = this._pad.pad(plain.subarray(safeLen), bsb);
			enc.set(pad, ptr);
            for (let i=0;i<bsb;i++) enc[ptr+i] ^=prev[i];
            this._crypt.encryptBlock(enc, block);
		}
    }

    encryptSize(plainLen: number): number {
        const bsb = this._crypt.blockSize;
        const rem = plainLen % bsb;
        return this._pad.padSize(rem === 0 ? bsb : rem, bsb) - rem + plainLen;
    }
}
