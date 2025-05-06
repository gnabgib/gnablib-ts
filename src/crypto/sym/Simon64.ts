/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { U32 } from '../../primitive/number/U32Static.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

// https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf
//https://eprint.iacr.org/2013/404.pdf
// - has an implementation mistake saying the key has two 06 bytes, when the second should be a 07

const f32 = (x: number) => (U32.lRot(x, 1) & U32.lRot(x, 8)) ^ U32.lRot(x, 2);
const c = 0xfffffffc;

/** Confusingly Simon64 is 32 bit.. the 64 is the blocksize */
class Simon32bit {
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
			d32[0] ^= f32(d32[1]) ^ this.#rk[r++];
			// console.log(`Pt_${r}=(${hex.fromI32(d32[0]).toLowerCase()},${hex.fromI32(d32[1]).toLowerCase()})`);
			d32[1] ^= f32(d32[0]) ^ this.#rk[r++];
			// console.log(`Pt_${r}=(${hex.fromI32(d32[0]).toLowerCase()},${hex.fromI32(d32[1]).toLowerCase()})`);
		}
	}

	private _decBlock(data: Uint8Array) {
		const d32 = new Uint32Array(data.buffer, data.byteOffset, 2);
		for (let r = this.rounds - 1; r >= 0; ) {
			d32[1] ^= f32(d32[0]) ^ this.#rk[r--];
			d32[0] ^= f32(d32[1]) ^ this.#rk[r--];
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
 * [Simon64/96](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Simon_(cipher)))
 *
 * First Published: *2013*  
 * Block Size: *8 bytes*  
 * Key size: *12 bytes*  
 * Rounds: *42*
 *
 * Specified in
 * - [ISO/29167-21](https://www.iso.org/standard/70388.html)
 */
export class Simon64_96 extends Simon32bit implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k32 = new Uint32Array(
			key.buffer,
			key.byteOffset,
			key.length / 4
		).slice();
		const rounds = 42;
		const rk = new Uint32Array(rounds);
		rk.set(k32);
		//z = 0x7369f885192c0ef5, we set in two stages to avoid u64 operations
		let z=0x192c0ef5;
		let i=3;
		for (; i < 35; i++) {
			rk[i] =
				c ^
				(z & 1) ^
				rk[i - 3] ^
				U32.rRot(rk[i - 1], 3) ^
				U32.rRot(rk[i - 1], 4);
			z>>>=1;
		}
		z=0x7369f885;
		for (; i < rounds; i++) {
			rk[i] =
				c ^
				(z & 1) ^
				rk[i - 3] ^
				U32.rRot(rk[i - 1], 3) ^
				U32.rRot(rk[i - 1], 4);
			z>>>=1;
		}
		super(rounds, rk);
		//for(let i=0;i<rounds;i++) console.log(`rk[${i}]=${hex.fromI32(rk[i]).toLowerCase()}`);
	}
}

/**
 * [Simon64/128](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Simon_(cipher)))
 *
 * First Published: *2013*  
 * Block Size: *8 bytes*  
 * Key size: *16 bytes*  
 * Rounds: *44*
 *
 * Specified in
 * - [ISO/29167-21](https://www.iso.org/standard/70388.html)
 */
export class Simon64_128 extends Simon32bit implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k32 = new Uint32Array(
			key.buffer,
			key.byteOffset,
			key.length / 4
		).slice();
		const rounds = 44;
		const rk = new Uint32Array(rounds);
		rk.set(k32);
		// z = 0xfc2ce51207a635db, two stages
		let z=0x07a635db;
		let i=4;
		for (; i < 36; i++) {
			rk[i] =
			c ^
			(z & 1) ^
			rk[i - 4] ^
			U32.rRot(rk[i - 1], 3) ^
			rk[i - 3] ^
			U32.rRot(rk[i - 1], 4) ^
			U32.rRot(rk[i - 3], 1);			
			z>>>=1;
		}
		z=0xfc2ce512;
		for (; i < rounds; i++) {
			rk[i] =
			c ^
			(z & 1) ^
			rk[i - 4] ^
			U32.rRot(rk[i - 1], 3) ^
			rk[i - 3] ^
			U32.rRot(rk[i - 1], 4) ^
			U32.rRot(rk[i - 3], 1);			
			z>>>=1;
		}
		super(rounds, rk);
		//for(let i=0;i<rounds;i++) console.log(`rk[${i}]=${hex.fromI32(rk[i]).toLowerCase()}`);
	}
}

/**
 * [Speckn](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Speck_(cipher)))
 *
 * Specified in:
 * - [ISO/29167-22](https://www.iso.org/standard/70389.html)
 */
// export class Speck {}
