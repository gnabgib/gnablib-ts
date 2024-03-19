/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { LengthError } from '../../error/LengthError.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';
import { IFullCrypt } from '../interfaces/IFullCrypt.js';

/**
 * [Cipher feedback (CFB)](https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation#Cipher_feedback_(CFB))
 *
 * Cipher FeedBack (CFB), uses the entire output of the block cipher.
 * In this variation, it is very similar to CBC, makes a block cipher into a
 * self-synchronizing stream cipher.
 * CFB decryption in this variation is almost identical to CBC encryption performed in reverse:
 *
 * Parallelizable encryption: **No**
 * Parallelizable decryption: **Yes**
 * Random Read Access: **Yes**
 *
 * Specified in
 * [FIPS-81](https://csrc.nist.gov/csrc/media/publications/fips/81/archive/1980-12-02/documents/fips81.pdf)
 * [NIST 800-38A](http://csrc.nist.gov/publications/nistpubs/800-38a/sp800-38a.pdf)
 */
export class Cfb implements IFullCrypt {
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
			//Update the eBlock to this encrypted block
			eBlock.set(enc.subarray(ptr, ptr + bsb));
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
			//Update the eBlock to the last encrypted block
			eBlock.set(enc.subarray(ptr, ptr + bsb));
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
