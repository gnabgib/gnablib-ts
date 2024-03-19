/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { LengthError } from '../../error/LengthError.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';
import { IFullCrypt } from '../interfaces/IFullCrypt.js';

/**
 * [Output Feedback (OFB)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher_feedback_(CFB))
 *
 * Output FeedBack (OFB) mode makes a block cipher into a synchronous stream cipher.
 * It generates keystream blocks, which are then XORed with the plaintext blocks to get the ciphertext.
 *
 * Parallelizable encryption: **No**
 * Parallelizable decryption: **No**
 * Random Read Access: **No**
 *
 * Specified in
 * [FIPS-81](https://csrc.nist.gov/csrc/media/publications/fips/81/archive/1980-12-02/documents/fips81.pdf)
 * [NIST 800-38A](http://csrc.nist.gov/publications/nistpubs/800-38a/sp800-38a.pdf)
 */
export class Ofb implements IFullCrypt {
	private readonly _crypt: IBlockCrypt;
	private readonly _iv: Uint8Array;

	constructor(crypt: IBlockCrypt, iv: Uint8Array) {
		if (iv.length != crypt.blockSize)
			throw new LengthError(crypt.blockSize, 'iv.length', iv.length);
		this._crypt = crypt;
		this._iv = iv;
	}

	get blockSize(): number {
		return this._crypt.blockSize;
	}

	decryptInto(plain: Uint8Array, enc: Uint8Array): void {
		const bsb = this._crypt.blockSize;
		const rem = enc.length % bsb;
		const safeLen = enc.length - rem;

		plain.set(enc);

		let ptr = 0;
		//Copy the IV into the enc block
		const eBlock = this._iv.slice();
		while (ptr < safeLen) {
			//NOTE: This uses encryption in the decrypt direction too
			this._crypt.encryptBlock(eBlock);
			for (let i = 0; i < bsb; i++) plain[ptr + i] ^= eBlock[i];
			ptr += bsb;
		}
		if (rem > 0) {
			//Last block is smaller
			this._crypt.encryptBlock(eBlock);
			for (let i = 0; i < rem; i++) plain[ptr + i] ^= eBlock[i];
		}
	}

	encryptInto(enc: Uint8Array, plain: Uint8Array): void {
		const bsb = this._crypt.blockSize;
		const rem = plain.length % bsb;
		const safeLen = plain.length - rem;

		enc.set(plain);

		let ptr = 0;
		//Copy the IV into the enc block
		const eBlock = this._iv.slice();
		while (ptr < safeLen) {
			this._crypt.encryptBlock(eBlock);
			for (let i = 0; i < bsb; i++) enc[ptr + i] ^= eBlock[i];
			ptr += bsb;
		}
		if (rem > 0) {
			//Last block is smaller
			this._crypt.encryptBlock(eBlock);
			for (let i = 0; i < rem; i++) enc[ptr + i] ^= eBlock[i];
		}
	}

	encryptSize(plainLen: number): number {
		//No padding is required
		return plainLen;
	}
}
