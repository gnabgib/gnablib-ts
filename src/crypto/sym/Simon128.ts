/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64Mut, U64MutArray } from '../../primitive/number/U64.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

//Very well written spec

const f64 = (x: U64) =>
	x
		.mut()
		.lRotEq(2)
		.xorEq(x.mut().lRotEq(1).andEq(x.lRot(8)));
const c = U64.fromI32s(0xfffffffc, 0xffffffff);
const u64_1 = U64.fromInt(1);

class Simon64bit {
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
		let r = 0;
		//This loop only works on even-rounds (because of the internal increments)
		const n = this.rounds & 0xfe;
		for (; r < n; ) {
			d64.at(0).xorEq(f64(d64.at(1)).xorEq(this.#rk.at(r++)));
			// console.log(`Pt_${r}=(${d64.at(0).toString().toLowerCase()},${d64.at(1).toString().toLowerCase()})`);
			d64.at(1).xorEq(f64(d64.at(0)).xorEq(this.#rk.at(r++)));
			// console.log(`Pt_${r}=(${d64.at(0).toString().toLowerCase()},${d64.at(1).toString().toLowerCase()})`);
		}
		if (this.rounds == 69) {
			const t = d64.at(1).mut();
			d64.at(1).set(
				d64
					.at(0)
					.mut()
					.xorEq(f64(d64.at(1)).xorEq(this.#rk.at(r++)))
			);
			d64.at(0).set(t);
		}
	}

	private _decBlock(data: Uint8Array) {
		const d64 = U64MutArray.fromBytes(data.buffer);
        let n=this.rounds;
		if (this.rounds == 69) {
            n--;
			const t = d64.at(0).mut();
			d64.at(0).set(
				d64
					.at(1)
					.mut()
					.xorEq(f64(d64.at(0)).xorEq(this.#rk.at(68)))
			);
			d64.at(1).set(t);
		}
		for (let r = n-1; r >= 0; ) {
			d64.at(1).xorEq(f64(d64.at(0)).xorEq(this.#rk.at(r--)));
			d64.at(0).xorEq(f64(d64.at(1)).xorEq(this.#rk.at(r--)));
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
 * [Simon128/128](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Simon_(cipher)))
 *
 * First Published: *2013*  
 * Block Size: *16 bytes*  
 * Key size: *16 bytes*  
 * Rounds: *68*
 *
 * Specified in
 * - [ISO/29167-21](https://www.iso.org/standard/70388.html)
 */
export class Simon128_128 extends Simon64bit implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k64 = U64MutArray.fromBytes(key.buffer);
		const rounds = 68;
		const rk = U64MutArray.fromLen(rounds);
		const z = U64Mut.fromI32s(0x192c0ef5, 0x7369f885);
		const A = k64.at(0);
		const B = k64.at(1);
		let i = 0;
		for (; i < 64; ) {
			rk.at(i++).set(A);
			A.xorEq(c.mut().xorEq(z.and(u64_1)).xorEq(B.rRot(3)).xorEq(B.rRot(4)));
			z.rShiftEq(1);

			rk.at(i++).set(B);
			B.xorEq(c.mut().xorEq(z.and(u64_1)).xorEq(A.rRot(3)).xorEq(A.rRot(4)));
			z.rShiftEq(1);
		}
		rk.at(i++).set(A);
		A.xorEq(c.mut().xorEq(u64_1).xorEq(B.rRot(3)).xorEq(B.rRot(4)));

		rk.at(i++).set(B);
		//dropped: xorEq(U64.zero). which is a nop
		B.xorEq(c.mut().xorEq(A.rRot(3)).xorEq(A.rRot(4)));

		rk.at(i++).set(A);
		rk.at(i++).set(B);
		super(rounds, rk);
		// for(let i=0;i<rounds;i++) console.log(`rk[${i}]=${rk.at(i).toString().toLowerCase()}`);
	}
}

/**
 * [Simon128/192](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Simon_(cipher)))
 *
 * First Published: *2013*  
 * Block Size: *16 bytes*  
 * Key size: *24 bytes*  
 * Rounds: *69*
 *
 * Specified in
 * - [ISO/29167-21](https://www.iso.org/standard/70388.html)
 */
export class Simon128_192 extends Simon64bit implements IBlockCrypt {
    //There's a mistake in the paper on 192-decode
	constructor(key: Uint8Array) {
		const k64 = U64MutArray.fromBytes(key.buffer);
		const rounds = 69;
		const rk = U64MutArray.fromLen(rounds);
		const z = U64Mut.fromI32s(0x07a635db, 0xfc2ce512);
		const A = k64.at(0);
		const B = k64.at(1);
		const C = k64.at(2);
		let i = 0;
		for (; i < 63; ) {
			rk.at(i++).set(A);
			A.xorEq(c.mut().xorEq(z.and(u64_1)).xorEq(C.rRot(3)).xorEq(C.rRot(4)));
			z.rShiftEq(1);

			rk.at(i++).set(B);
			B.xorEq(c.mut().xorEq(z.and(u64_1)).xorEq(A.rRot(3)).xorEq(A.rRot(4)));
			z.rShiftEq(1);

			rk.at(i++).set(C);
			C.xorEq(c.mut().xorEq(z.and(u64_1)).xorEq(B.rRot(3)).xorEq(B.rRot(4)));
			z.rShiftEq(1);
		}
		rk.at(i++).set(A);
		A.xorEq(c.mut().xorEq(u64_1).xorEq(C.rRot(3)).xorEq(C.rRot(4)));

		rk.at(i++).set(B);
		B.xorEq(c.mut().xorEq(A.rRot(3)).xorEq(A.rRot(4)));

		rk.at(i++).set(C);
		C.xorEq(c.mut().xorEq(u64_1).xorEq(B.rRot(3)).xorEq(B.rRot(4)));

		rk.at(i++).set(A);
		rk.at(i++).set(B);
		rk.at(i++).set(C);
		super(rounds, rk);
		// for(let i=0;i<rounds;i++) console.log(`rk[${i}]=${rk.at(i).toString().toLowerCase()}`);
	}
}

/**
 * [Simon128/256](https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf)
 * ([Wiki](https://en.wikipedia.org/wiki/Simon_(cipher)))
 *
 * First Published: *2013*  
 * Block Size: *16 bytes*  
 * Key size: *32 bytes*  
 * Rounds: *72*
 *
 * Specified in
 * - [ISO/29167-21](https://www.iso.org/standard/70388.html)
 */
export class Simon128_256 extends Simon64bit implements IBlockCrypt {
	constructor(key: Uint8Array) {
		const k64 = U64MutArray.fromBytes(key.buffer);
		const rounds = 72;
		const rk = U64MutArray.fromLen(rounds);
		const z = U64Mut.fromI32s(0x046d678b,0xfdc94c3a);
		const A = k64.at(0);
		const B = k64.at(1);
        const C = k64.at(2);
        const D = k64.at(3);
		let i = 0;
		for (; i < 64; ) {
			rk.at(i++).set(A);
			A.xorEq(c.mut().xorEq(z.and(u64_1)).xorEq(D.rRot(3)).xorEq(D.rRot(4)).xorEq(B).xorEq(B.rRot(1)));
			z.rShiftEq(1);

			rk.at(i++).set(B);
			B.xorEq(c.mut().xorEq(z.and(u64_1)).xorEq(A.rRot(3)).xorEq(A.rRot(4)).xorEq(C).xorEq(C.rRot(1)));
			z.rShiftEq(1);

			rk.at(i++).set(C);
			C.xorEq(c.mut().xorEq(z.and(u64_1)).xorEq(B.rRot(3)).xorEq(B.rRot(4)).xorEq(D).xorEq(D.rRot(1)));
			z.rShiftEq(1);

			rk.at(i++).set(D);
			D.xorEq(c.mut().xorEq(z.and(u64_1)).xorEq(C.rRot(3)).xorEq(C.rRot(4)).xorEq(A).xorEq(A.rRot(1)));
			z.rShiftEq(1);
        }
        rk.at(i++).set(A);
        A.xorEq(c.mut().xorEq(D.rRot(3)).xorEq(D.rRot(4)).xorEq(B).xorEq(B.rRot(1)));

        rk.at(i++).set(B);
        B.xorEq(c.mut().xorEq(u64_1).xorEq(A.rRot(3)).xorEq(A.rRot(4)).xorEq(C).xorEq(C.rRot(1)));

        rk.at(i++).set(C);
        C.xorEq(c.mut().xorEq(B.rRot(3)).xorEq(B.rRot(4)).xorEq(D).xorEq(D.rRot(1)));

        rk.at(i++).set(D);
        D.xorEq(c.mut().xorEq(C.rRot(3)).xorEq(C.rRot(4)).xorEq(A).xorEq(A.rRot(1)));

        rk.at(i++).set(A);
		rk.at(i++).set(B);
        rk.at(i++).set(C);
        rk.at(i++).set(D);
		super(rounds, rk);
		// for(let i=0;i<rounds;i++) console.log(`rk[${i}]=${rk.at(i).toString().toLowerCase()}`);
	}
}
