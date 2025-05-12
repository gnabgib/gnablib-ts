/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64Mut, U64MutArray } from '../../primitive/number/U64.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

// Seemingly arbitrary constant C
const C = U64.fromI32s(0xa9fc1a22, 0x1bd11bda);
// Used for swapping
const t = U64Mut.fromInt(0);

abstract class AThreefish {
	/** Rounds/4 */
	protected readonly qr: number;
	/** Block size in bytes */
	readonly blockSize: number;
	/** Round Key */
	readonly #rk: U64MutArray[];

	constructor(
		blockSize: number,
		rounds: number,
		key: Uint8Array,
		tweak: Uint8Array
	) {
		this.qr = rounds / 4;
		this.blockSize = blockSize;
		sLen('key', key).exactly(blockSize).throwNot();
		sLen('tweak', tweak).exactly(16).throwNot();

		const k32 = new Uint32Array(key.buffer, key.byteOffset, key.length / 4);
		const k64 = U64MutArray.mount(k32);
		const n = blockSize / 8;
		const k = U64MutArray.fromLen(n + 1);
		k.set(k64);

		const parity = k.at(n);
		for (let i = 0; i < n; i++) parity.xorEq(k.at(i));
		parity.xorEq(C);

		const t32 = new Uint32Array(tweak.buffer, tweak.byteOffset, 4);
		const t64 = U64MutArray.mount(t32);
		const t = U64MutArray.fromLen(3);
		t.set(t64);
		t.at(2).set(t.at(1)).xorEq(t.at(0));

		const rk: U64MutArray[] = [];
		const rkn = this.qr;
		for (let s = 0; s <= rkn; s++) {
			const l = U64MutArray.fromLen(n);
			for (let i = 0; i < n; i++) {
				l.at(i).set(k.at((s + i) % (n + 1)));
				switch (i) {
					case n - 3:
						l.at(i).addEq(t.at(s % 3));
						break;
					case n - 2:
						l.at(i).addEq(t.at((s + 1) % 3));
						break;
					case n - 1:
						l.at(i).addEq(U64.fromInt(s));
						break;
				}
			}
			rk.push(l);
		}
		this.#rk = rk;
		// uLog(k,'k');
		// uLog(t,'t');
		// for(let i=0;i<rk.length;i++) {
		//     uLog(rk[i]);
		// }
	}

	protected addRk(d: U64MutArray, i: number) {
		d.at(0).addEq(this.#rk[i].at(0));
		d.at(1).addEq(this.#rk[i].at(1));
		d.at(2).addEq(this.#rk[i].at(2));
		d.at(3).addEq(this.#rk[i].at(3));
		if (d.length == 4) return;
		d.at(4).addEq(this.#rk[i].at(4));
		d.at(5).addEq(this.#rk[i].at(5));
		d.at(6).addEq(this.#rk[i].at(6));
		d.at(7).addEq(this.#rk[i].at(7));
		if (d.length == 8) return;
		d.at(8).addEq(this.#rk[i].at(8));
		d.at(9).addEq(this.#rk[i].at(9));
		d.at(10).addEq(this.#rk[i].at(10));
		d.at(11).addEq(this.#rk[i].at(11));
		d.at(12).addEq(this.#rk[i].at(12));
		d.at(13).addEq(this.#rk[i].at(13));
		d.at(14).addEq(this.#rk[i].at(14));
		d.at(15).addEq(this.#rk[i].at(15));
	}
	protected subRk(d: U64MutArray, iix: number) {
		d.at(0).subEq(this.#rk[iix].at(0));
		d.at(1).subEq(this.#rk[iix].at(1));
		d.at(2).subEq(this.#rk[iix].at(2));
		d.at(3).subEq(this.#rk[iix].at(3));
		if (d.length == 4) return;
		d.at(4).subEq(this.#rk[iix].at(4));
		d.at(5).subEq(this.#rk[iix].at(5));
		d.at(6).subEq(this.#rk[iix].at(6));
		d.at(7).subEq(this.#rk[iix].at(7));
		if (d.length == 8) return;
		d.at(8).subEq(this.#rk[iix].at(8));
		d.at(9).subEq(this.#rk[iix].at(9));
		d.at(10).subEq(this.#rk[iix].at(10));
		d.at(11).subEq(this.#rk[iix].at(11));
		d.at(12).subEq(this.#rk[iix].at(12));
		d.at(13).subEq(this.#rk[iix].at(13));
		d.at(14).subEq(this.#rk[iix].at(14));
		d.at(15).subEq(this.#rk[iix].at(15));
	}
	protected abstract _encBlock(data: Uint8Array): void;
	protected abstract _decBlock(data: Uint8Array): void;

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#encryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	encryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * this.blockSize;
		sLen('block', block)
			.atLeast(byteStart + this.blockSize)
			.throwNot();
		this._encBlock(block.subarray(byteStart, byteStart + this.blockSize));
	}

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#decryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	decryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * this.blockSize;
		sLen('block', block)
			.atLeast(byteStart + this.blockSize)
			.throwNot();
		this._decBlock(block.subarray(byteStart, byteStart + this.blockSize));
	}
}

/**
 * [Threefish256](https://www.schneier.com/academic/skein/threefish/)
 * ( [Wiki](https://en.wikipedia.org/wiki/Threefish) )
 *
 * Threefish is a symmetric-key tweakable block cipher designed as part of
 * the Skein hash function, an entry in the NIST hash function competition.
 * Threefish uses no S-boxes or other table lookups in order to avoid cache
 * timing attacks;[1] its nonlinearity comes from alternating additions
 * with exclusive ORs. In that respect, it is similar to Salsa20, TEA,
 * and the SHA-3 candidates CubeHash and BLAKE.
 *
 * First Published: *2008*  
 * Block size: *32 bytes*  
 * Key Size: *32 bytes*  
 * Nonce size: ~*16 bytes*†  
 * Rounds: *72*
 * 
 * †Threefish accepts a *16 byte* "tweak" value, which could be considered
 * a nonce, some AEAD, or a hash of metadata.
 *
 * Specified in:
 * - [Skein Hash Function Family](pec paper)
 */
export class Threefish256 extends AThreefish implements IBlockCrypt {
	constructor(key: Uint8Array, tweak: Uint8Array) {
		super(32, 72, key, tweak);
	}

	private swap(d: U64MutArray) {
		//1=3, 3=1
		t.set(d.at(1));
		d.at(1).set(d.at(3));
		d.at(3).set(t);
	}
	private mixPerm(d: U64MutArray, l0: number, l1: number) {
		d.at(0).addEq(d.at(1));
		d.at(1).lRotEq(l0).xorEq(d.at(0));
		d.at(2).addEq(d.at(3));
		d.at(3).lRotEq(l1).xorEq(d.at(2));
		this.swap(d);
		///*DBUG*/ uLog(d);
	}
	private permUnmix(d: U64MutArray, r0: number, r1: number) {
		//No need for unswap (it's symmetric)
		this.swap(d);
		d.at(3).xorEq(d.at(2)).rRotEq(r0);
		d.at(2).subEq(d.at(3));
		d.at(1).xorEq(d.at(0)).rRotEq(r1);
		d.at(0).subEq(d.at(1));
		///*DBUG*/ uLog(d);
	}

	protected _encBlock(data: Uint8Array) {
		const d64 = U64MutArray.mount(
			new Uint32Array(data.buffer, data.byteOffset, data.length / 4)
		);
		let r = 0;
		do {
			//Even round
			this.addRk(d64, r++);
			///*DBUG*/log();

			this.mixPerm(d64, 14, 16);
			this.mixPerm(d64, 52, 57);
			this.mixPerm(d64, 23, 40);
			this.mixPerm(d64, 5, 37);

			//Odd Round
			this.addRk(d64, r++);
			///*DBUG*/ uLog(d64);

			this.mixPerm(d64, 25, 33);
			this.mixPerm(d64, 46, 12);
			this.mixPerm(d64, 58, 22);
			this.mixPerm(d64, 32, 32);
			///*DBUG*/ console.log(" ");
		} while (r < this.qr);
		this.addRk(d64, r);
		///*DBUG*/ uLog(d64);
	}

	protected _decBlock(data: Uint8Array) {
		const d64 = U64MutArray.mount(
			new Uint32Array(data.buffer, data.byteOffset, data.length / 4)
		);
		let r = this.qr;
		this.subRk(d64, r--);
		do {
			//Odd round
			this.permUnmix(d64, 32, 32);
			this.permUnmix(d64, 22, 58);
			this.permUnmix(d64, 12, 46);
			this.permUnmix(d64, 33, 25);

			this.subRk(d64, r--);
			///*DBUG*/ uLog(d64);

			//Even round
			this.permUnmix(d64, 37, 5);
			this.permUnmix(d64, 40, 23);
			this.permUnmix(d64, 57, 52);
			this.permUnmix(d64, 16, 14);

			this.subRk(d64, r--);
			///*DBUG*/ uLog(d64);
			///*DBUG*/console.log('');
		} while (r >= 0);
	}
}

/**
 * [Threefish512](https://www.schneier.com/academic/skein/threefish/)
 * ( [Wiki](https://en.wikipedia.org/wiki/Threefish) )
 *
 * Threefish is a symmetric-key tweakable block cipher designed as part of
 * the Skein hash function, an entry in the NIST hash function competition.
 * Threefish uses no S-boxes or other table lookups in order to avoid cache
 * timing attacks;[1] its nonlinearity comes from alternating additions
 * with exclusive ORs. In that respect, it is similar to Salsa20, TEA,
 * and the SHA-3 candidates CubeHash and BLAKE.
 *
 * First Published: *2008*  
 * Block size: *64 bytes*  
 * Key Size: *64 bytes*  
 * Nonce size: ~*16 bytes*†  
 * Rounds: *72*
 * 
 * †Threefish accepts a *16 byte* "tweak" value, which could be considered
 * a nonce, some AEAD, or a hash of metadata.
 *
 * Specified in:
 * - [Skein Hash Function Family](pec paper)
 */
export class Threefish512 extends AThreefish implements IBlockCrypt {
	constructor(key: Uint8Array, tweak: Uint8Array) {
		super(64, 72, key, tweak);
	}

	private swap(d: U64MutArray) {
		//0=2, 2=4, 4=6, 6=0
		t.set(d.at(0));
		d.at(0).set(d.at(2));
		d.at(2).set(d.at(4));
		d.at(4).set(d.at(6));
		d.at(6).set(t);
		//3=7, 7=3
		t.set(d.at(3));
		d.at(3).set(d.at(7));
		d.at(7).set(t);
	}
	private unswap(d: U64MutArray) {
		//0=6, 6=4, 4=2, 2=0
		t.set(d.at(0));
		d.at(0).set(d.at(6));
		d.at(6).set(d.at(4));
		d.at(4).set(d.at(2));
		d.at(2).set(t);
		//3=7, 7=3
		t.set(d.at(3));
		d.at(3).set(d.at(7));
		d.at(7).set(t);
	}
	private mixPerm(
		d: U64MutArray,
		l0: number,
		l1: number,
		l2: number,
		l3: number
	) {
		d.at(0).addEq(d.at(1));
		d.at(1).lRotEq(l0).xorEq(d.at(0));
		d.at(2).addEq(d.at(3));
		d.at(3).lRotEq(l1).xorEq(d.at(2));
		d.at(4).addEq(d.at(5));
		d.at(5).lRotEq(l2).xorEq(d.at(4));
		d.at(6).addEq(d.at(7));
		d.at(7).lRotEq(l3).xorEq(d.at(6));
		this.swap(d);
		///*DBUG*/ uLog(d);
	}
	private permUnmix(
		d: U64MutArray,
		r0: number,
		r1: number,
		r2: number,
		r3: number
	) {
		this.unswap(d);
		d.at(7).xorEq(d.at(6)).rRotEq(r0);
		d.at(6).subEq(d.at(7));
		d.at(5).xorEq(d.at(4)).rRotEq(r1);
		d.at(4).subEq(d.at(5));
		d.at(3).xorEq(d.at(2)).rRotEq(r2);
		d.at(2).subEq(d.at(3));
		d.at(1).xorEq(d.at(0)).rRotEq(r3);
		d.at(0).subEq(d.at(1));
		///*DBUG*/ uLog(d);
	}

	protected _encBlock(data: Uint8Array) {
		const d64 = U64MutArray.mount(
			new Uint32Array(data.buffer, data.byteOffset, data.length / 4)
		);
		let r = 0;
		do {
			//Even round
			this.addRk(d64, r++);
			///*DBUG*/ uLog(d64);

			this.mixPerm(d64, 46, 36, 19, 37);
			this.mixPerm(d64, 33, 27, 14, 42);
			this.mixPerm(d64, 17, 49, 36, 39);
			this.mixPerm(d64, 44, 9, 54, 56);

			//Odd Round
			this.addRk(d64, r++);
			///*DBUG*/ uLog(d64);

			this.mixPerm(d64, 39, 30, 34, 24);
			this.mixPerm(d64, 13, 50, 10, 17);
			this.mixPerm(d64, 25, 29, 39, 43);
			this.mixPerm(d64, 8, 35, 56, 22);
			///*DBUG*/ console.log(' ');
		} while (r < this.qr);
		this.addRk(d64, r);
		///*DBUG*/ uLog(d64);
	}

	protected _decBlock(data: Uint8Array) {
		const d64 = U64MutArray.mount(
			new Uint32Array(data.buffer, data.byteOffset, data.length / 4)
		);
		let r = this.qr;
		this.subRk(d64, r--);
		///*DBUG*/ uLog(d64);
		do {
			this.permUnmix(d64, 22, 56, 35, 8);
			this.permUnmix(d64, 43, 39, 29, 25);
			this.permUnmix(d64, 17, 10, 50, 13);
			this.permUnmix(d64, 24, 34, 30, 39);

			this.subRk(d64, r--);
			///*DBUG*/ uLog(d64);

			this.permUnmix(d64, 56, 54, 9, 44);
			this.permUnmix(d64, 39, 36, 49, 17);
			this.permUnmix(d64, 42, 14, 27, 33);
			this.permUnmix(d64, 37, 19, 36, 46);

			this.subRk(d64, r--);
			///*DBUG*/ uLog(d64);
			///*DBUG*/ console.log('');
		} while (r >= 0);
	}
}

/**
 * [Threefish1024](https://www.schneier.com/academic/skein/threefish/)
 * ( [Wiki](https://en.wikipedia.org/wiki/Threefish) )
 *
 * Threefish is a symmetric-key tweakable block cipher designed as part of
 * the Skein hash function, an entry in the NIST hash function competition.
 * Threefish uses no S-boxes or other table lookups in order to avoid cache
 * timing attacks;[1] its nonlinearity comes from alternating additions
 * with exclusive ORs. In that respect, it is similar to Salsa20, TEA,
 * and the SHA-3 candidates CubeHash and BLAKE.
 *
 * First Published: *2008*  
 * Block size: *128 bytes*  
 * Key Size: *128 bytes*  
 * Nonce size: ~*16 bytes*†  
 * Rounds: *80*
 * 
 * †Threefish accepts a *16 byte* "tweak" value, which could be considered
 * a nonce, some AEAD, or a hash of metadata.
 *
 * Specified in:
 * - [Skein Hash Function Family](pec paper)
 */
export class Threefish1024 extends AThreefish implements IBlockCrypt {
	constructor(key: Uint8Array, tweak: Uint8Array) {
		super(128, 80, key, tweak);
	}

	private swap(d: U64MutArray) {
		//1=9, 9=7, 7=15, 15=1
		t.set(d.at(1));
		d.at(1).set(d.at(9));
		d.at(9).set(d.at(7));
		d.at(7).set(d.at(15));
		d.at(15).set(t);
		//3=13, 13=5, 5=11, 11=3
		t.set(d.at(3));
		d.at(3).set(d.at(13));
		d.at(13).set(d.at(5));
		d.at(5).set(d.at(11));
		d.at(11).set(t);
		//4=6, 6=4
		t.set(d.at(4));
		d.at(4).set(d.at(6));
		d.at(6).set(t);
		//8=10, 10=12, 12=14, 14=8
		t.set(d.at(8));
		d.at(8).set(d.at(10));
		d.at(10).set(d.at(12));
		d.at(12).set(d.at(14));
		d.at(14).set(t);
	}
	private unswap(d: U64MutArray) {
		//1=15, 15=7, 7=9, 9=1
		t.set(d.at(1));
		d.at(1).set(d.at(15));
		d.at(15).set(d.at(7));
		d.at(7).set(d.at(9));
		d.at(9).set(t);
		//3=11, 11=5, 5=13, 13=3
		t.set(d.at(3));
		d.at(3).set(d.at(11));
		d.at(11).set(d.at(5));
		d.at(5).set(d.at(13));
		d.at(13).set(t);
		//4=6, 6=4
		t.set(d.at(4));
		d.at(4).set(d.at(6));
		d.at(6).set(t);
		//10=8, 8=14, 14=12, 12=10
		t.set(d.at(10));
		d.at(10).set(d.at(8));
		d.at(8).set(d.at(14));
		d.at(14).set(d.at(12));
		d.at(12).set(t);
	}
	private mixPerm(
		d: U64MutArray,
		l0: number,
		l1: number,
		l2: number,
		l3: number,
		l4: number,
		l5: number,
		l6: number,
		l7: number
	) {
		d.at(0).addEq(d.at(1));
		d.at(1).lRotEq(l0).xorEq(d.at(0));
		d.at(2).addEq(d.at(3));
		d.at(3).lRotEq(l1).xorEq(d.at(2));
		d.at(4).addEq(d.at(5));
		d.at(5).lRotEq(l2).xorEq(d.at(4));
		d.at(6).addEq(d.at(7));
		d.at(7).lRotEq(l3).xorEq(d.at(6));
		d.at(8).addEq(d.at(9));
		d.at(9).lRotEq(l4).xorEq(d.at(8));
		d.at(10).addEq(d.at(11));
		d.at(11).lRotEq(l5).xorEq(d.at(10));
		d.at(12).addEq(d.at(13));
		d.at(13).lRotEq(l6).xorEq(d.at(12));
		d.at(14).addEq(d.at(15));
		d.at(15).lRotEq(l7).xorEq(d.at(14));
		this.swap(d);
		///*DBUG*/ uLog(d);
	}
	private permUnmix(
		d: U64MutArray,
		r0: number,
		r1: number,
		r2: number,
		r3: number,
		r4: number,
		r5: number,
		r6: number,
		r7: number
	) {
		this.unswap(d);
		d.at(15).xorEq(d.at(14)).rRotEq(r0);
		d.at(14).subEq(d.at(15));
		d.at(13).xorEq(d.at(12)).rRotEq(r1);
		d.at(12).subEq(d.at(13));
		d.at(11).xorEq(d.at(10)).rRotEq(r2);
		d.at(10).subEq(d.at(11));
		d.at(9).xorEq(d.at(8)).rRotEq(r3);
		d.at(8).subEq(d.at(9));
		d.at(7).xorEq(d.at(6)).rRotEq(r4);
		d.at(6).subEq(d.at(7));
		d.at(5).xorEq(d.at(4)).rRotEq(r5);
		d.at(4).subEq(d.at(5));
		d.at(3).xorEq(d.at(2)).rRotEq(r6);
		d.at(2).subEq(d.at(3));
		d.at(1).xorEq(d.at(0)).rRotEq(r7);
		d.at(0).subEq(d.at(1));
		///*DBUG*/ uLog(d);
	}

	protected _encBlock(data: Uint8Array) {
		const d64 = U64MutArray.mount(
			new Uint32Array(data.buffer, data.byteOffset, data.length / 4)
		);
		let r = 0;
		do {
			//Even round
			this.addRk(d64, r++);
			///*DBUG*/ uLog(d64);

			this.mixPerm(d64, 24, 13, 8, 47, 8, 17, 22, 37);
			this.mixPerm(d64, 38, 19, 10, 55, 49, 18, 23, 52);
			this.mixPerm(d64, 33, 4, 51, 13, 34, 41, 59, 17);
			this.mixPerm(d64, 5, 20, 48, 41, 47, 28, 16, 25);

			//Odd Round
			this.addRk(d64, r++);
			///*DBUG*/ uLog(d64);

			this.mixPerm(d64, 41, 9, 37, 31, 12, 47, 44, 30);
			this.mixPerm(d64, 16, 34, 56, 51, 4, 53, 42, 41);
			this.mixPerm(d64, 31, 44, 47, 46, 19, 42, 44, 25);
			this.mixPerm(d64, 9, 48, 35, 52, 23, 31, 37, 20);

			///*DBUG*/ console.log(' ');
		} while (r < this.qr);
		this.addRk(d64, r);
		///*DBUG*/ uLog(d64);
	}

	protected _decBlock(data: Uint8Array) {
		const d64 = U64MutArray.mount(
			new Uint32Array(data.buffer, data.byteOffset, data.length / 4)
		);
		let r = this.qr;
		this.subRk(d64, r--);
		///*DBUG*/ uLog(d64);
		do {
			this.permUnmix(d64, 20, 37, 31, 23, 52, 35, 48, 9);
			this.permUnmix(d64, 25, 44, 42, 19, 46, 47, 44, 31);
			this.permUnmix(d64, 41, 42, 53, 4, 51, 56, 34, 16);
			this.permUnmix(d64, 30, 44, 47, 12, 31, 37, 9, 41);

			this.subRk(d64, r--);
			///*DBUG*/ uLog(d64);

			this.permUnmix(d64, 25, 16, 28, 47, 41, 48, 20, 5);
			this.permUnmix(d64, 17, 59, 41, 34, 13, 51, 4, 33);
			this.permUnmix(d64, 52, 23, 18, 49, 55, 10, 19, 38);
			this.permUnmix(d64, 37, 22, 17, 8, 47, 8, 13, 24);

			this.subRk(d64, r--);
			///*DBUG*/ uLog(d64);
			///*DBUG*/ console.log('');
		} while (r >= 0);
	}
}
