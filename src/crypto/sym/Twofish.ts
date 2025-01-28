/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../../endian/platform.js';
import { ContentError } from '../../error/ContentError.js';
import { NotEnoughSpaceError } from '../../error/NotEnoughSpaceError.js';
import { U32 } from '../../primitive/number/U32Static.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

const blockSize = 16;
const mdsPolynomial = 0x169; // x^8 + x^6 + x^5 + x^3 + 1, Section 4.2
const rsPolynomial = 0x14d; // x^8 + x^6 + x^3 + x^2 + 1, Section 4.3

/** rs (Section 4.3) */
const rs = [
	Uint8Array.of(0x01, 0xa4, 0x55, 0x87, 0x5a, 0x58, 0xdb, 0x9e),
	Uint8Array.of(0xa4, 0x56, 0x82, 0xf3, 0x1e, 0xc6, 0x68, 0xe5),
	Uint8Array.of(0x02, 0xa1, 0xfc, 0xc1, 0x47, 0xae, 0x3d, 0x19),
	Uint8Array.of(0xa4, 0x55, 0x87, 0x5a, 0x58, 0xdb, 0x9e, 0x03),
];
// prettier-ignore
const sBox0 = Uint8Array.of(
    0xa9, 0x67, 0xb3, 0xe8, 0x04, 0xfd, 0xa3, 0x76, 0x9a, 0x92, 0x80, 0x78, 0xe4, 0xdd, 0xd1, 0x38,
    0x0d, 0xc6, 0x35, 0x98, 0x18, 0xf7, 0xec, 0x6c, 0x43, 0x75, 0x37, 0x26, 0xfa, 0x13, 0x94, 0x48,
    0xf2, 0xd0, 0x8b, 0x30, 0x84, 0x54, 0xdf, 0x23, 0x19, 0x5b, 0x3d, 0x59, 0xf3, 0xae, 0xa2, 0x82,
    0x63, 0x01, 0x83, 0x2e, 0xd9, 0x51, 0x9b, 0x7c, 0xa6, 0xeb, 0xa5, 0xbe, 0x16, 0x0c, 0xe3, 0x61,
    0xc0, 0x8c, 0x3a, 0xf5, 0x73, 0x2c, 0x25, 0x0b, 0xbb, 0x4e, 0x89, 0x6b, 0x53, 0x6a, 0xb4, 0xf1,
    0xe1, 0xe6, 0xbd, 0x45, 0xe2, 0xf4, 0xb6, 0x66, 0xcc, 0x95, 0x03, 0x56, 0xd4, 0x1c, 0x1e, 0xd7,
    0xfb, 0xc3, 0x8e, 0xb5, 0xe9, 0xcf, 0xbf, 0xba, 0xea, 0x77, 0x39, 0xaf, 0x33, 0xc9, 0x62, 0x71,
    0x81, 0x79, 0x09, 0xad, 0x24, 0xcd, 0xf9, 0xd8, 0xe5, 0xc5, 0xb9, 0x4d, 0x44, 0x08, 0x86, 0xe7,
    0xa1, 0x1d, 0xaa, 0xed, 0x06, 0x70, 0xb2, 0xd2, 0x41, 0x7b, 0xa0, 0x11, 0x31, 0xc2, 0x27, 0x90,
    0x20, 0xf6, 0x60, 0xff, 0x96, 0x5c, 0xb1, 0xab, 0x9e, 0x9c, 0x52, 0x1b, 0x5f, 0x93, 0x0a, 0xef,
    0x91, 0x85, 0x49, 0xee, 0x2d, 0x4f, 0x8f, 0x3b, 0x47, 0x87, 0x6d, 0x46, 0xd6, 0x3e, 0x69, 0x64,
    0x2a, 0xce, 0xcb, 0x2f, 0xfc, 0x97, 0x05, 0x7a, 0xac, 0x7f, 0xd5, 0x1a, 0x4b, 0x0e, 0xa7, 0x5a,
    0x28, 0x14, 0x3f, 0x29, 0x88, 0x3c, 0x4c, 0x02, 0xb8, 0xda, 0xb0, 0x17, 0x55, 0x1f, 0x8a, 0x7d,
    0x57, 0xc7, 0x8d, 0x74, 0xb7, 0xc4, 0x9f, 0x72, 0x7e, 0x15, 0x22, 0x12, 0x58, 0x07, 0x99, 0x34,
    0x6e, 0x50, 0xde, 0x68, 0x65, 0xbc, 0xdb, 0xf8, 0xc8, 0xa8, 0x2b, 0x40, 0xdc, 0xfe, 0x32, 0xa4,
    0xca, 0x10, 0x21, 0xf0, 0xd3, 0x5d, 0x0f, 0x00, 0x6f, 0x9d, 0x36, 0x42, 0x4a, 0x5e, 0xc1, 0xe0,
);
// prettier-ignore
const sBox1 = Uint8Array.of(
    0x75, 0xf3, 0xc6, 0xf4, 0xdb, 0x7b, 0xfb, 0xc8, 0x4a, 0xd3, 0xe6, 0x6b, 0x45, 0x7d, 0xe8, 0x4b,
    0xd6, 0x32, 0xd8, 0xfd, 0x37, 0x71, 0xf1, 0xe1, 0x30, 0x0f, 0xf8, 0x1b, 0x87, 0xfa, 0x06, 0x3f,
    0x5e, 0xba, 0xae, 0x5b, 0x8a, 0x00, 0xbc, 0x9d, 0x6d, 0xc1, 0xb1, 0x0e, 0x80, 0x5d, 0xd2, 0xd5,
    0xa0, 0x84, 0x07, 0x14, 0xb5, 0x90, 0x2c, 0xa3, 0xb2, 0x73, 0x4c, 0x54, 0x92, 0x74, 0x36, 0x51,
    0x38, 0xb0, 0xbd, 0x5a, 0xfc, 0x60, 0x62, 0x96, 0x6c, 0x42, 0xf7, 0x10, 0x7c, 0x28, 0x27, 0x8c,
    0x13, 0x95, 0x9c, 0xc7, 0x24, 0x46, 0x3b, 0x70, 0xca, 0xe3, 0x85, 0xcb, 0x11, 0xd0, 0x93, 0xb8,
    0xa6, 0x83, 0x20, 0xff, 0x9f, 0x77, 0xc3, 0xcc, 0x03, 0x6f, 0x08, 0xbf, 0x40, 0xe7, 0x2b, 0xe2,
    0x79, 0x0c, 0xaa, 0x82, 0x41, 0x3a, 0xea, 0xb9, 0xe4, 0x9a, 0xa4, 0x97, 0x7e, 0xda, 0x7a, 0x17,
    0x66, 0x94, 0xa1, 0x1d, 0x3d, 0xf0, 0xde, 0xb3, 0x0b, 0x72, 0xa7, 0x1c, 0xef, 0xd1, 0x53, 0x3e,
    0x8f, 0x33, 0x26, 0x5f, 0xec, 0x76, 0x2a, 0x49, 0x81, 0x88, 0xee, 0x21, 0xc4, 0x1a, 0xeb, 0xd9,
    0xc5, 0x39, 0x99, 0xcd, 0xad, 0x31, 0x8b, 0x01, 0x18, 0x23, 0xdd, 0x1f, 0x4e, 0x2d, 0xf9, 0x48,
    0x4f, 0xf2, 0x65, 0x8e, 0x78, 0x5c, 0x58, 0x19, 0x8d, 0xe5, 0x98, 0x57, 0x67, 0x7f, 0x05, 0x64,
    0xaf, 0x63, 0xb6, 0xfe, 0xf5, 0xb7, 0x3c, 0xa5, 0xce, 0xe9, 0x68, 0x44, 0xe0, 0x4d, 0x43, 0x69,
    0x29, 0x2e, 0xac, 0x15, 0x59, 0xa8, 0x0a, 0x9e, 0x6e, 0x47, 0xdf, 0x34, 0x35, 0x6a, 0xcf, 0xdc,
    0x22, 0xc9, 0xc0, 0x9b, 0x89, 0xd4, 0xed, 0xab, 0x12, 0xa2, 0x0d, 0x52, 0xbb, 0x02, 0x2f, 0xa9,
    0xd7, 0x61, 0x1e, 0xb4, 0x50, 0x04, 0xf6, 0xc2, 0x16, 0x25, 0x86, 0x56, 0x55, 0x09, 0xbe, 0x91,
);

/** A*B in GF(2**8)/p */
function gfMul(a: number, b8: number, p32: number): number {
	const b = Uint32Array.of(0, b8);
	const p = Uint32Array.of(0, p32);
	let ret = 0;

	for (let i = 0; i < 7; i++) {
		ret ^= b[a & 1];
		a >>>= 1;
		b[1] = p[b[1] >>> 7] ^ (b[1] << 1);
	}
	ret ^= b[a & 1];
	return ret;
}

/** Calculate y(col) */
function mdsColumnMul(b: number, col: number): number {
	const mul01 = b;
	const mul5B = gfMul(b, 0x5b, mdsPolynomial);
	const mulEF = gfMul(b, 0xef, mdsPolynomial);

	switch (col) {
		case 0:
			return mul01 | (mul5B << 8) | (mulEF << 16) | (mulEF << 24);
		case 1:
			return mulEF | (mulEF << 8) | (mul5B << 16) | (mul01 << 24);
		case 2:
			return mul5B | (mulEF << 8) | (mul01 << 16) | (mulEF << 24);
		//case 3:
		default:
			return mul5B | (mul01 << 8) | (mulEF << 16) | (mul5B << 24);
	}
	//throw new Error(`col needed to be 0-3, got ${col}`);
}

/** s-box generation function (Section 4.3.5) */
function sBoxGen(b: Uint8Array, key: Uint8Array, offset: number): number {
	const y = new Uint8Array(4);
	y.set(b.subarray(0, 4));

	// prettier-ignore
	switch (key.length) {
		case 8 * 4: //32
			y[0] = sBox1[y[0]] ^ key[4 * (6 + offset) + 0];
			y[1] = sBox0[y[1]] ^ key[4 * (6 + offset) + 1];
			y[2] = sBox0[y[2]] ^ key[4 * (6 + offset) + 2];
			y[3] = sBox1[y[3]] ^ key[4 * (6 + offset) + 3];
		/* falls through */

		case 8 * 3: //24
			y[0] = sBox1[y[0]] ^ key[4 * (4 + offset) + 0];
			y[1] = sBox1[y[1]] ^ key[4 * (4 + offset) + 1];
			y[2] = sBox0[y[2]] ^ key[4 * (4 + offset) + 2];
			y[3] = sBox0[y[3]] ^ key[4 * (4 + offset) + 3];
		/* falls through */

		case 8 * 2: //16
			y[0] = sBox1[sBox0[sBox0[y[0]] ^ key[4 * (2 + offset) + 0]] ^ key[4 * offset + 0]];
			y[1] = sBox0[sBox0[sBox1[y[1]] ^ key[4 * (2 + offset) + 1]] ^ key[4 * offset + 1]];
			y[2] = sBox1[sBox1[sBox0[y[2]] ^ key[4 * (2 + offset) + 2]] ^ key[4 * offset + 2]];
			y[3] = sBox0[sBox1[sBox1[y[3]] ^ key[4 * (2 + offset) + 3]] ^ key[4 * offset + 3]];
	}
	return (
		mdsColumnMul(y[0], 0) ^
		mdsColumnMul(y[1], 1) ^
		mdsColumnMul(y[2], 2) ^
		mdsColumnMul(y[3], 3)
	);
	//return mdsMul;
}

/**
 * [Twofish block cipher](https://www.schneier.com/academic/twofish/)
 * ([Wiki](https://en.wikipedia.org/wiki/Twofish))
 *
 * Twofish is a symmetric key block cipher with a block size of 128 bits and key sizes up to 256 bits.
 * It was one of the five finalists of the Advanced Encryption Standard contest, but it was not
 * selected for standardization. Twofish is related to the earlier block cipher
 * {@link crypto.Blowfish | Blowfish}.
 *
 * First Published: *1998*
 * Block size: *16 bytes*
 * Key size: *16, 24, 32 bytes*
 * Nonce size: *0 bytes*
 * Rounds: *16*
 *
 * [Spec](https://www.schneier.com/wp-content/uploads/2016/02/paper-twofish-paper.pdf)
 */
export class Twofish implements IBlockCrypt {
	readonly blockSize = blockSize;
	private readonly _s0 = new Uint32Array(256);
	private readonly _s1 = new Uint32Array(256);
	private readonly _s2 = new Uint32Array(256);
	private readonly _s3 = new Uint32Array(256);
	readonly #k = new Uint32Array(40);

	constructor(key: Uint8Array) {
		const k8 = key.length >> 3;
		if (/*multiple of 8*/ (key.length & 7) != 0 || k8 < 2 || k8 > 4) {
			//Make sure key is a multiple of 8 and either 2 (16), 3(24) or 4(32)
			throw new ContentError(
				'should be 16, 24, or 32',
				'key.length',
				key.length
			);
		}

		/**Number of u64 */
		const k64 = key.length / 8;

		// Create the s[] words
		const s = new Uint8Array(4 * 4);
		for (let i = 0; i < k64; i++) {
			for (let j = 0; j < rs.length; j++) {
				const row = rs[j];
				for (let k = 0; k < row.length; k++) {
					s[4 * i + j] ^= gfMul(key[8 * i + k], row[k], rsPolynomial);
				}
			}
		}

		//Create Subkeys
		const tmp = new Uint8Array(4);
		for (let i = 0; i < 20; i++) {
			// A = h(p * 2x, Me)
			tmp.fill(2 * i);
			const a = sBoxGen(tmp, key, 0);

			// B = rol(h(p * (2x + 1), Mo), 8)
			tmp.fill(2 * i + 1);
			let b = sBoxGen(tmp, key, 1);
			b = U32.lRot(b, 8);

			this.#k[2 * i] = a + b;

			// K[2i+1] = (A + 2B) <<< 9
			this.#k[2 * i + 1] = U32.lRot(2 * b + a, 9);
		}

		// prettier-ignore
		// Calculate sboxes
		switch (k64) {
			case 2:
				for (let i = 0; i < this._s0.length; i++) {
					this._s0[i] = mdsColumnMul(sBox1[sBox0[sBox0[i] ^ s[0]] ^ s[4]], 0);
					this._s1[i] = mdsColumnMul(sBox0[sBox0[sBox1[i] ^ s[1]] ^ s[5]], 1);
					this._s2[i] = mdsColumnMul(sBox1[sBox1[sBox0[i] ^ s[2]] ^ s[6]], 2);
					this._s3[i] = mdsColumnMul(sBox0[sBox1[sBox1[i] ^ s[3]] ^ s[7]], 3);
				}
				break;
			case 3:
				for (let i = 0; i < this._s0.length; i++) {
					this._s0[i] = mdsColumnMul(sBox1[sBox0[sBox0[sBox1[i] ^ s[0]] ^ s[4]] ^ s[8]], 0);
					this._s1[i] = mdsColumnMul(sBox0[sBox0[sBox1[sBox1[i] ^ s[1]] ^ s[5]] ^ s[9]], 1);
					this._s2[i] = mdsColumnMul(sBox1[sBox1[sBox0[sBox0[i] ^ s[2]] ^ s[6]] ^ s[10]], 2);
					this._s3[i] = mdsColumnMul(sBox0[sBox1[sBox1[sBox0[i] ^ s[3]] ^ s[7]] ^ s[11]], 3);
				}
				break;
			default:
				for (let i = 0; i < this._s0.length; i++) {
					this._s0[i] = mdsColumnMul(sBox1[sBox0[sBox0[sBox1[sBox1[i] ^ s[0]] ^ s[4]] ^ s[8]] ^ s[12]], 0);
					this._s1[i] = mdsColumnMul(sBox0[sBox0[sBox1[sBox1[sBox0[i] ^ s[1]] ^ s[5]] ^ s[9]] ^ s[13]], 1);
					this._s2[i] = mdsColumnMul(sBox1[sBox1[sBox0[sBox0[sBox0[i] ^ s[2]] ^ s[6]] ^ s[10]] ^ s[14]], 2);
					this._s3[i] = mdsColumnMul(sBox0[sBox1[sBox1[sBox0[sBox1[i] ^ s[3]] ^ s[7]] ^ s[11]] ^ s[15]], 3);
				}
		}
	}

	private _decBlock(data: Uint8Array) {
		//Make sure data is LE
		asLE.i32(data, 0, 4);
		const d32 = new Uint32Array(data.buffer);
		// Undo undo final swap
		let a = d32[2] ^ this.#k[6];
		let b = d32[3] ^ this.#k[7];
		let c = d32[0] ^ this.#k[4];
		let d = d32[1] ^ this.#k[5];

		let kPos = 39;
		// prettier-ignore
		for (let i = 8; i > 0; i--) {
			let t0 = this._s0[c & 0xff] ^ this._s1[(c >>> 8) & 0xff] ^ this._s2[(c >>> 16) & 0xff] ^ this._s3[c >>> 24];
			let t1 = this._s1[d & 0xff] ^ this._s2[(d >>> 8) & 0xff] ^ this._s3[(d >>> 16) & 0xff] ^ this._s0[d >>> 24];
            b = U32.lRot(b ^ (t1 + t1 + t0 + this.#k[kPos--]), -1);
            a = U32.lRot(a, 1) ^ (t1 + t0 + this.#k[kPos--]);

			t0 = this._s0[a & 0xff] ^ this._s1[(a >>> 8) & 0xff] ^ this._s2[(a >>> 16) & 0xff] ^ this._s3[a >>> 24];
			t1 = this._s1[b & 0xff] ^ this._s2[(b >>> 8) & 0xff] ^ this._s3[(b >>> 16) & 0xff] ^ this._s0[b >>> 24];
            d = U32.rRot(d ^ (t1 + t1 + t0 + this.#k[kPos--]), 1);
            c = U32.lRot(c, 1) ^ (t0 + t1 + this.#k[kPos--]);
		}

		// Undo pre-whitening
		a ^= this.#k[0];
		b ^= this.#k[1];
		c ^= this.#k[2];
		d ^= this.#k[3];

		d32[0] = a;
		d32[1] = b;
		d32[2] = c;
		d32[3] = d;
		//Undo any LE changes
		asLE.i32(data, 0, 4);
	}

	private _encBlock(data: Uint8Array) {
		//Make sure data is LE
		asLE.i32(data, 0, 4);
		const d32 = new Uint32Array(data.buffer);
		// Load input & pre-whiten
		let a = d32[0] ^ this.#k[0];
		let b = d32[1] ^ this.#k[1];
		let c = d32[2] ^ this.#k[2];
		let d = d32[3] ^ this.#k[3];

		let kPos = 8;
		// prettier-ignore
		for (let i = 0; i < 8; i++) {
			let t0 = this._s0[a & 0xff] ^ this._s1[(a >>> 8) & 0xff] ^ this._s2[(a >>> 16) & 0xff] ^ this._s3[a >>> 24];
			let t1 = this._s1[b & 0xff] ^ this._s2[(b >>> 8) & 0xff] ^ this._s3[(b >>> 16) & 0xff] ^ this._s0[b >>> 24];
			c = U32.rRot(c ^ (t0 + t1 + this.#k[kPos++]), 1);
			d = U32.lRot(d, 1) ^ (t1 + t1 + t0 + this.#k[kPos++]);

			t0 = this._s0[c & 0xff] ^ this._s1[(c >>> 8) & 0xff] ^ this._s2[(c >>> 16) & 0xff] ^ this._s3[c >>> 24];
			t1 = this._s1[d & 0xff] ^ this._s2[(d >>> 8) & 0xff] ^ this._s3[(d >>> 16) & 0xff] ^ this._s0[d >>> 24];
			a = U32.rRot(a ^ (t0 + t1 + this.#k[kPos++]), 1);
			b = U32.lRot(b, 1) ^ (t1 + t1 + t0 + this.#k[kPos++]);
		}

		d32[0] = c ^ this.#k[4];
		d32[1] = d ^ this.#k[5];
		d32[2] = a ^ this.#k[6];
		d32[3] = b ^ this.#k[7];
		//Undo any LE changes
		asLE.i32(data, 0, 4);
	}

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#decryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError | NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	decryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * blockSize;
		if (block.length < byteStart + blockSize)
			throw new NotEnoughSpaceError(
				'block.length',
				byteStart + blockSize,
				block.length
			);
		this._decBlock(block.subarray(byteStart, byteStart + blockSize));
	}

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#encryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError | NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	encryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * blockSize;
		if (block.length < byteStart + blockSize)
			throw new NotEnoughSpaceError(
				'block.length',
				byteStart + blockSize,
				block.length
			);
		this._encBlock(block.subarray(byteStart, byteStart + blockSize));
	}
}
