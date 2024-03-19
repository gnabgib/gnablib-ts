/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { IBlockCrypt } from "../interfaces/IBlockCrypt.js";
import { IFullCrypt } from "../interfaces/IFullCrypt.js";
import { IPad } from "../interfaces/IPad.js";

/**
 * [Electronic codebook (ECB)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Electronic_codebook_(ECB))
 *
 * **NOT RECOMMENDED**
 *
 * The simplest of the encryption modes is the electronic codebook (ECB) mode.
 * The message is divided into blocks, and each block is encrypted separately. 
 * The disadvantage of this method is a lack of diffusion. 
 * Because ECB encrypts identical plaintext blocks into identical ciphertext blocks,
 * it does not hide data patterns well. ECB is not recommended for use in cryptographic protocols.
 * 
 * Parallelizable encryption: **Yes**  
 * Parallelizable decryption: **Yes**  
 * Random Read Access: **Yes**  
 *
 * Specified in [FIPS-81](https://csrc.nist.gov/csrc/media/publications/fips/81/archive/1980-12-02/documents/fips81.pdf)
 */
export class Ecb implements IFullCrypt {
	private readonly _crypt: IBlockCrypt;
	private readonly _pad: IPad;

	constructor(crypt: IBlockCrypt, pad: IPad) {
		this._crypt = crypt;
		this._pad = pad;
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
		while (ptr < safeLen) {
			this._crypt.decryptBlock(plain, block++);
			ptr += bsb;
		}
		const lastBlock = new Uint8Array(enc.subarray(safeLen));
		this._crypt.decryptBlock(lastBlock);
		plain.set(this._pad.unpad(lastBlock), safeLen);
	}

	encryptInto(enc: Uint8Array, plain: Uint8Array): void {
		const bsb = this._crypt.blockSize;
		const rem = plain.length % bsb;
		const safeLen = plain.length - rem;
		const padBlock = this._pad.padSize(rem === 0 ? bsb : rem, bsb) > 0;
		const need = safeLen + (padBlock ? bsb : 0);

		//While this exception is better, we'll get one later when we try and set out of range
		//if (enc.length<need) throw new NotEnoughSpaceError('enc',need,enc.length);

		enc.set(plain.subarray(0, safeLen));

		let ptr = 0;
		let block = 0;
		while (ptr < safeLen) {
			this._crypt.encryptBlock(enc, block++);
			ptr += bsb;
		}
		if (need > safeLen) {
			const pad = this._pad.pad(plain.subarray(safeLen), bsb);
			enc.set(pad, ptr);
			this._crypt.encryptBlock(enc, block);
		}
	}

	/** 
     * {@inheritDoc IFullCrypt.encryptSize}
	 *
	 * @example
	 * ```
     * import { Ecb } from 'gnablib/crypt/block/Ecb.js';
	 * import { Pkcs7 } from 'gnablib/crypt/padding/Pkcs7.js';
     * 
     * const crypt=new Blowfish(/*key*\/); // blockSize=8
     * const block=new Ecb(crypt,Pkcs7);
	 * const size=block.encryptSize(8);
	 * // Size =  16 padding must be appended, so a second block is required
	 * ```
	 */
	encryptSize(plainLen: number): number {
		const bsb = this._crypt.blockSize;
		const rem = plainLen % bsb;
		return this._pad.padSize(rem === 0 ? bsb : rem, bsb) - rem + plainLen;
	}
}
