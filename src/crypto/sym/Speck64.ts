/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U32 } from '../../primitive/number/U32Static.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

class Speck32bit {
	/** Block size in bytes */
	readonly blockSize = 8;
	readonly #rk: Uint32Array;
	/** Number of rounds */
	readonly rounds: number;
	constructor(rounds: number, rk: Uint32Array) {
		this.rounds = rounds;
		this.#rk = rk;
	}

	private _encBlock(data: Uint8Array) {
		const d32 = new Uint32Array(data.buffer, data.byteOffset, 2);
		for (let r = 0; r < this.rounds; ) {
			d32[1] = (U32.rRot(d32[1], 8) + d32[0]) ^ this.#rk[r++];
			d32[0] = U32.lRot(d32[0], 3) ^ d32[1];
			// console.log(`Pt_${r}=(${hex.fromI32(d32[0]).toLowerCase()},${hex.fromI32(d32[1]).toLowerCase()})`);
		}
	}

	private _decBlock(data: Uint8Array) {
		const d32 = new Uint32Array(data.buffer, data.byteOffset, 2);
		for (let r = this.rounds - 1; r >= 0; ) {
			d32[0] = U32.rRot(d32[0] ^ d32[1], 3);
			d32[1] = U32.lRot((d32[1] ^ this.#rk[r--]) - d32[0], 8);
		}
	}

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#encryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	encryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * 8;
		sLen('block', block)
			.atLeast(byteStart + 8)
			.throwNot();
		this._encBlock(block.subarray(byteStart, byteStart + 8));
	}

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#decryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	decryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * 8;
		sLen('block', block)
			.atLeast(byteStart + 8)
			.throwNot();
		this._decBlock(block.subarray(byteStart, byteStart + 8));
	}
}

/**
 * [Speck64/96](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Speck_(cipher)) )
 *
 * First Published: *2013*  
 * Block Size: *8 bytes*  
 * Key size: *12 bytes*  
 * Rounds: *26*
 *
 * Specified in
 * - [ISO/29167-22](https://www.iso.org/standard/70389.html)
 */
export class Speck64_96 extends Speck32bit implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k32 = new Uint32Array(
			key.buffer,
			key.byteOffset,
			key.length / 4
		).slice();
		const rounds = 26;
		const rk = new Uint32Array(rounds);
		let A = k32[0];
		let B = k32[1];
		let C = k32[2];
		for (let i = 0; i < rounds; ) {
			rk[i] = A;
			B = (U32.rRot(B, 8) + A) ^ i;
			A = U32.lRot(A, 3) ^ B;
			i++;

			rk[i] = A;
			C = (U32.rRot(C, 8) + A) ^ i;
			A = U32.lRot(A, 3) ^ C;
			i++;
		}
		super(rounds, rk);
		//for (let i = 0; i < rounds; i++) console.log(`rk[${i}]=${hex.fromI32(rk[i]).toLowerCase()}`);
	}
}

/**
 * [Speck64/128](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Speck_(cipher)) )
 *
 * First Published: *2013*  
 * Block Size: *8 bytes*  
 * Key size: *16 bytes*  
 * Rounds: *27*
 *
 * Specified in
 * - [ISO/29167-22](https://www.iso.org/standard/70389.html)
 */
export class Speck64_128 extends Speck32bit implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k32 = new Uint32Array(
			key.buffer,
			key.byteOffset,
			key.length / 4
		).slice();
		const rounds = 27;
		const rk = new Uint32Array(rounds);
		let A = k32[0];
		let B = k32[1];
		let C = k32[2];
        let D=k32[3];
		for (let i = 0; i < rounds; ) {
			rk[i] = A;
			B = (U32.rRot(B, 8) + A) ^ i;
			A = U32.lRot(A, 3) ^ B;
			i++;

			rk[i] = A;
			C = (U32.rRot(C, 8) + A) ^ i;
			A = U32.lRot(A, 3) ^ C;
			i++;

			rk[i] = A;
			D = (U32.rRot(D, 8) + A) ^ i;
			A = U32.lRot(A, 3) ^ D;
			i++;
        }
		super(rounds, rk);
		//for (let i = 0; i < rounds; i++) console.log(`rk[${i}]=${hex.fromI32(rk[i]).toLowerCase()}`);
	}
}
