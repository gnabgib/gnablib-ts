/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { hex } from '../../codec/Hex.js';
import { NotEnoughSpaceError } from '../../error/NotEnoughSpaceError.js';
import { U32 } from '../../primitive/number/U32Static.js';
import { U64Mut } from '../../primitive/number/U64.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

// https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf
// - has an implementation mistake saying the key has two 06 bytes, when the second should be a 07

//Words32ToBytes=asLE.i32(data, 0, 4);
//BytesToWords32=asLE.i32(data, 0, 4);

const f32 = (x: number) => (U32.lRot(x, 1) & U32.lRot(x, 8)) ^ U32.lRot(x, 2);

/** Confusingly Simon64 is 32 bit.. the 64 is the blocksize */
class Simon32 {
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
 * [Simon](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
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
export class Simon64_96 extends Simon32 implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k32 = new Uint32Array(
			key.buffer,
			key.byteOffset,
			key.length / 4
		).slice();
		const rounds = 42;
		const rk = new Uint32Array(rounds);
		rk.set(k32);
		const c = 0xfffffffc;
		const z = U64Mut.fromI32s(0x192c0ef5, 0x7369f885);
		for (let i = 3; i < rounds; i++) {
			rk[i] =
				c ^
				(z.low & 1) ^
				rk[i - 3] ^
				U32.rRot(rk[i - 1], 3) ^
				U32.rRot(rk[i - 1], 4);
			z.rShiftEq(1);
		}
		super(rounds, rk);
		//for(let i=0;i<rounds;i++) console.log(`rk[${i}]=${hex.fromI32(rk[i]).toLowerCase()}`);
	}
}

/**
 * [Simon](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
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
export class Simon64_128 extends Simon32 implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k32 = new Uint32Array(
			key.buffer,
			key.byteOffset,
			key.length / 4
		).slice();
		const rounds = 44;
		const rk = new Uint32Array(rounds);
		rk.set(k32);
		const c = 0xfffffffc;
		const z = U64Mut.fromI32s(0x07a635db, 0xfc2ce512);
		for (let i = 4; i < rounds; i++) {
			rk[i] =
				c ^
				(z.low & 1) ^
				rk[i - 4] ^
				U32.rRot(rk[i - 1], 3) ^
				rk[i - 3] ^
				U32.rRot(rk[i - 1], 4) ^
				U32.rRot(rk[i - 3], 1);
			z.rShiftEq(1);
		}
		super(rounds, rk);
		//for(let i=0;i<rounds;i++) console.log(`rk[${i}]=${hex.fromI32(rk[i]).toLowerCase()}`);
	}
}

/**
 * [Simon](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Simon_(cipher)))
 *
 * First Published: *2013*
 * Block Size: *4, 6, 8, 12, 16 bytes*
 * Key size: *8, 9, 12, 16, 18, 24, 32*
 * Rounds: *32, 36, 42, 44, 52, 54, 68, 69, 72*
 *
 * Specified in
 * - [ISO/29167-21](https://www.iso.org/standard/70388.html)
 */
// export class Simon32 extends Simon_32bit {
// 	constructor(key: Uint8Array) {
// 		super(32 / 8, 64 / 8, 32, key);
// 	}
// }
// export class Simon48_72 extends Simon_32bit {
// 	constructor(key: Uint8Array) {
// 		super(48 / 8, 72 / 8, 36, key);
// 	}
// }
// export class Simon48_96 extends Simon_32bit {
// 	constructor(key: Uint8Array) {
// 		super(48 / 8, 96 / 8, 36, key);
// 	}
// }
// export class Simon96_96 extends Simon_32bit {
// 	constructor(key: Uint8Array) {
// 		super(96 / 8, 96 / 8, 52, key);
// 	}
// }
// export class Simon96_144 extends Simon_32bit {
// 	constructor(key: Uint8Array) {
// 		super(96 / 8, 144 / 8, 54, key);
// 	}
// }
// //u64:
// export class Simon128_128 extends Simon_32bit {
// 	constructor(key: Uint8Array) {
// 		super(128 / 8, 128 / 8, 68, key);
// 	}
// }
// export class Simon128_192 extends Simon_32bit {
// 	constructor(key: Uint8Array) {
// 		super(128 / 8, 192 / 8, 69, key);
// 	}
// }
// export class Simon128_256 extends Simon_32bit {
// 	constructor(key: Uint8Array) {
// 		super(128 / 8, 256 / 8, 72, key);
// 	}
// }
/**
 * [Speckn](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Speck_(cipher)))
 *
 * Specified in:
 * - [ISO/29167-22](https://www.iso.org/standard/70389.html)
 */
export class Speck {}
