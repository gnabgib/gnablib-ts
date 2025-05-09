/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64MutArray } from '../../primitive/number/U64.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

//Very well written spec

class Speck64bit {
	/** Block size in bytes */
	readonly blockSize = 16;
	readonly #rk: U64MutArray;
	/** Number of rounds */
	readonly rounds: number;
	constructor(rounds: number, rk: U64MutArray) {
		this.rounds = rounds;
		this.#rk = rk;
	}

	private _encBlock(data: Uint8Array) {
		const d64 = U64MutArray.fromBytes(data.buffer);
		for (let r = 0; r < this.rounds; ) {
			//x=1, y=0
			d64.at(1).rRotEq(8).addEq(d64.at(0)).xorEq(this.#rk.at(r++));
			d64.at(0).lRotEq(3).xorEq(d64.at(1));
			// console.log(`Pt_${r}=(${hex.fromI32(d32[0]).toLowerCase()},${hex.fromI32(d32[1]).toLowerCase()})`);
		}
	}

	private _decBlock(data: Uint8Array) {
		const d64 = U64MutArray.fromBytes(data.buffer);
		for (let r = this.rounds - 1; r >= 0; ) {
			//x=1, y=0
			d64.at(0).xorEq(d64.at(1)).rRotEq(3);
			d64.at(1).xorEq(this.#rk.at(r--)).subEq(d64.at(0)).lRotEq(8);
			// console.log(`Pt_${r}=(${hex.fromI32(d32[0]).toLowerCase()},${hex.fromI32(d32[1]).toLowerCase()})`);
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
 * [Speck128/128](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Speck_(cipher)) )
 *
 * First Published: *2013*  
 * Block Size: *16 bytes*  
 * Key size: *16 bytes*  
 * Rounds: *32*
 *
 * Specified in
 * - [ISO/29167-22](https://www.iso.org/standard/70389.html)
 */
export class Speck128_128 extends Speck64bit implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k64 = U64MutArray.fromBytes(key.buffer);
		const rounds = 32;
		const rk = U64MutArray.fromLen(rounds);
		const A = k64.at(0);
		const B = k64.at(1);
		const n = rounds - 1;
		for (let i = 0; i < n; ) {
			rk.at(i).set(A);
			//x=B, y=A
			B.rRotEq(8).addEq(A).xorEq(U64.fromInt(i++));
			A.lRotEq(3).xorEq(B);
		}
		rk.at(n).set(A);

		super(rounds, rk);
		// for(let i=0;i<rounds;i++) console.log(`rk[${i}]=${rk.at(i).toString().toLowerCase()}`);
	}
}

/**
 * [Speck128/192](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Speck_(cipher)) )
 *
 * First Published: *2013*  
 * Block Size: *16 bytes*  
 * Key size: *24 bytes*  
 * Rounds: *33*
 *
 * Specified in
 * - [ISO/29167-22](https://www.iso.org/standard/70389.html)
 */
export class Speck128_192 extends Speck64bit implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k64 = U64MutArray.fromBytes(key.buffer);
		const rounds = 33;
		const rk = U64MutArray.fromLen(rounds);
		const A = k64.at(0);
		const B = k64.at(1);
		const C = k64.at(2);
		const n = rounds - 1;
		for (let i = 0; i < n; ) {
			//x=B, y=A
			rk.at(i).set(A);
			B.rRotEq(8).addEq(A).xorEq(U64.fromInt(i++));
			A.lRotEq(3).xorEq(B);

			rk.at(i).set(A);
			C.rRotEq(8).addEq(A).xorEq(U64.fromInt(i++));
			A.lRotEq(3).xorEq(C);
		}
		rk.at(n).set(A);

		super(rounds, rk);
		// for(let i=0;i<rounds;i++) console.log(`rk[${i}]=${rk.at(i).toString().toLowerCase()}`);
	}
}

/**
 * [Speck128/256](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Speck_(cipher)) )
 *
 * First Published: *2013*  
 * Block Size: *16 bytes*  
 * Key size: *32 bytes*  
 * Rounds: *34*
 *
 * Specified in
 * - [ISO/29167-22](https://www.iso.org/standard/70389.html)
 */
export class Speck128_256 extends Speck64bit implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k64 = U64MutArray.fromBytes(key.buffer);
		const rounds = 34;
		const rk = U64MutArray.fromLen(rounds);
		const A = k64.at(0);
		const B = k64.at(1);
		const C = k64.at(2);
		const D = k64.at(3);
		const n = rounds - 1;
		for (let i = 0; i < n; ) {
			//x=B, y=A
			rk.at(i).set(A);
			B.rRotEq(8).addEq(A).xorEq(U64.fromInt(i++));
			A.lRotEq(3).xorEq(B);

			rk.at(i).set(A);
			C.rRotEq(8).addEq(A).xorEq(U64.fromInt(i++));
			A.lRotEq(3).xorEq(C);

			rk.at(i).set(A);
			D.rRotEq(8).addEq(A).xorEq(U64.fromInt(i++));
			A.lRotEq(3).xorEq(D);
		}
		rk.at(n).set(A);

		super(rounds, rk);
		// for(let i=0;i<rounds;i++) console.log(`rk[${i}]=${rk.at(i).toString().toLowerCase()}`);
	}
}
