/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64Mut, U64MutArray } from '../../primitive/number/U64.js';
// import { uLog64 } from '../../runtime/goLog.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

// Seemingly arbitrary constant C - E.2
const C = U64.fromI32s(0xa9fc1a22, 0x1bd11bda);
// Used for swapping
const t = U64Mut.fromInt(0);

export class Tweak {
	private readonly t8 = new Uint8Array(24);
	readonly t64: U64MutArray;
	private _lock = false;

	constructor(tweak?: Uint8Array) {
		if (tweak && tweak.length > 0) {
			sLen('tweak', tweak).exactly(16).throwNot();
			this.t8.set(tweak);
		}
		const t32 = new Uint32Array(this.t8.buffer);
		this.t64 = U64MutArray.mount(t32);
		//this.t64.at(2).set(this.t64.at(0)).xorEq(this.t64.at(1));
	}
	/** Whether this is the first block */
	set isFirst(value: boolean) {
		if (value) this.t8[15] |= 0x40;
		else this.t8[15] &= ~0x40;
		this._lock = false;
	}

	/** Whether this is the last block */
	set isLast(value: boolean) {
		if (value) this.t8[15] |= 0x80;
		else this.t8[15] &= ~0x80;
		this._lock = false;
	}

	set lock(value: boolean) {
		if (value && !this._lock) {
			//Xor third element
			this._lock = true;
			this.t64.at(2).set(this.t64.at(0)).xorEq(this.t64.at(1));
		} else this._lock = value;
	}

	/** Increase the counter */
	incr(by: number) {
		// console.log(`increment tweak ${this.t64.at(0)}+${by}`)
		this.t64.at(0).addEq(U64.fromInt(by));
		this._lock = false;
	}

    /** Convert into a cfg block (will reset counter) */
    makeCfg(blockSize: number) {
        this.t8.fill(0);
        //A config block is always a first and final block
        this.t8[15] = 4 |0xc0;
        this.t64.at(0).set(U64.fromInt(blockSize));
        this._lock = false;
    }

	/** Convert into a message block (will reset counter) */
	makeMsg() {
		this.t8.fill(0);
		//last=0, first=1, type=48, bitpad=0, treelevel=0, position=0
		this.t8[15] = 48 | 0x40;
		this._lock = false;
	}

	// /** Convert into a key block (will reset counter) */
	// makeKey() {
	// 	this.t8.fill(0);
	// 	//last=0, first=0, type=0, bitpad=0, treelevel=0, position=0
	// 	this._lock = false;
	// }

	/** Convert into an output block */
	makeOut() {
		this.t8.fill(0);
		this.t8[0] = 8; //Not sure why
		this.t8[15] = 63 | 0xc0;
		//last=1, first=1, type=63, bitpad=0, treelevel=0, position=0
		this._lock = false;
	}

    /** Create a Key block (used in MAC) */
    static NewKey()  {
        const r=new Tweak();
        //Identifier is 0 (nop), but we'll set first block
        r.t8[15] = 0x40;
        return r;
    }

	// /** Create a config block */
	// static NewCfg(blockSize: number) {
	// 	const r = new Tweak();
	// 	//A config block is always a first and final block
	// 	r.t8[15] = 4 |0xc0;
	// 	r.t64.at(0).set(U64.fromInt(blockSize));
	// 	return r;
	// }
	// /** Create a personalization block */
	// static NewPrs() {
	// 	const r = new Tweak();
	// 	r.t8[15] = 8;
	// 	return r;
	// }
	// /** Create a public key block */
	// static NewPk() {
	// 	const r = new Tweak();
	// 	r.t8[15] = 12;
	// 	return r;
	// }
	// /** Create a key identifier block */
	// static NewKdf() {
	// 	const r = new Tweak();
	// 	r.t8[15] = 16;
	// 	return r;
	// }
	// /** Create a nonce block */
	// static NewNon() {
	// 	const r = new Tweak();
	// 	r.t8[15] = 20;
	// 	return r;
	// }
	// /** Create a message block */
	// static NewMsg() {
	// 	const r = new Tweak();
	// 	r.t8[15] = 48;
	// 	return r;
	// }
}

export class Key {
	readonly k64: U64MutArray;
	private _lock = false;

	private constructor(private readonly k8: Uint8Array) {
		const k32 = new Uint32Array(k8.buffer);
		this.k64 = U64MutArray.mount(k32);
	}

	get length() {
		return this.k8.length - 8;
	}

	set lock(value: boolean) {
		if (value && !this._lock) {
			//Calc parity
			const nLast = this.k64.length - 1;
			const parity = this.k64.at(nLast).set(C);
			for (let i = 0; i < nLast; i++) parity.xorEq(this.k64.at(i));
			this._lock = true;
		} else this._lock = value;
	}

	static fromSize(size: number) {
		const k = new Uint8Array(size + 8);
		return new Key(k);
	}
	static fromKey(key: Uint8Array) {
		const k = new Uint8Array(key.length + 8);
		k.set(key);
		return new Key(k);
	}
}

abstract class AThreefish {
	/** Block size in bytes */
	readonly blockSize: number;
	/** Key */
	readonly #k: Key;

	constructor(
		/** Rounds/4 */
		readonly qr: number,
		key: Key,
		/** Tweak */
		private readonly t: Tweak
	) {
		this.blockSize = key.length;
		this.#k = key;
	}

	protected addRk(d: U64MutArray, r: number) {
		d.at(d.length - 3).addEq(this.t.t64.at(r % 3));
		d.at(d.length - 2).addEq(this.t.t64.at((r + 1) % 3));
		d.at(d.length - 1).addEq(U64.fromInt(r));

		d.at(0).addEq(this.#k.k64.at(r % this.#k.k64.length));
		d.at(1).addEq(this.#k.k64.at((r + 1) % this.#k.k64.length));
		d.at(2).addEq(this.#k.k64.at((r + 2) % this.#k.k64.length));
		d.at(3).addEq(this.#k.k64.at((r + 3) % this.#k.k64.length));
		if (d.length == 4) return;
		d.at(4).addEq(this.#k.k64.at((r + 4) % this.#k.k64.length));
		d.at(5).addEq(this.#k.k64.at((r + 5) % this.#k.k64.length));
		d.at(6).addEq(this.#k.k64.at((r + 6) % this.#k.k64.length));
		d.at(7).addEq(this.#k.k64.at((r + 7) % this.#k.k64.length));
		if (d.length == 8) return;
		d.at(8).addEq(this.#k.k64.at((r + 8) % this.#k.k64.length));
		d.at(9).addEq(this.#k.k64.at((r + 9) % this.#k.k64.length));
		d.at(10).addEq(this.#k.k64.at((r + 10) % this.#k.k64.length));
		d.at(11).addEq(this.#k.k64.at((r + 11) % this.#k.k64.length));
		d.at(12).addEq(this.#k.k64.at((r + 12) % this.#k.k64.length));
		d.at(13).addEq(this.#k.k64.at((r + 13) % this.#k.k64.length));
		d.at(14).addEq(this.#k.k64.at((r + 14) % this.#k.k64.length));
		d.at(15).addEq(this.#k.k64.at((r + 15) % this.#k.k64.length));
	}
	protected subRk(d: U64MutArray, r: number) {
		d.at(d.length - 3).subEq(this.t.t64.at(r % 3));
		d.at(d.length - 2).subEq(this.t.t64.at((r + 1) % 3));
		d.at(d.length - 1).subEq(U64.fromInt(r));

		d.at(0).subEq(this.#k.k64.at(r % this.#k.k64.length));
		d.at(1).subEq(this.#k.k64.at((r + 1) % this.#k.k64.length));
		d.at(2).subEq(this.#k.k64.at((r + 2) % this.#k.k64.length));
		d.at(3).subEq(this.#k.k64.at((r + 3) % this.#k.k64.length));
		if (d.length == 4) return;
		d.at(4).subEq(this.#k.k64.at((r + 4) % this.#k.k64.length));
		d.at(5).subEq(this.#k.k64.at((r + 5) % this.#k.k64.length));
		d.at(6).subEq(this.#k.k64.at((r + 6) % this.#k.k64.length));
		d.at(7).subEq(this.#k.k64.at((r + 7) % this.#k.k64.length));
		if (d.length == 8) return;
		d.at(8).subEq(this.#k.k64.at((r + 8) % this.#k.k64.length));
		d.at(9).subEq(this.#k.k64.at((r + 9) % this.#k.k64.length));
		d.at(10).subEq(this.#k.k64.at((r + 10) % this.#k.k64.length));
		d.at(11).subEq(this.#k.k64.at((r + 11) % this.#k.k64.length));
		d.at(12).subEq(this.#k.k64.at((r + 12) % this.#k.k64.length));
		d.at(13).subEq(this.#k.k64.at((r + 13) % this.#k.k64.length));
		d.at(14).subEq(this.#k.k64.at((r + 14) % this.#k.k64.length));
		d.at(15).subEq(this.#k.k64.at((r + 15) % this.#k.k64.length));
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
        this.#k.lock=true;
        this.t.lock=true;
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
        this.#k.lock=true;
        this.t.lock=true;
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
 * - [Skein Hash Function Family](https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf)
 */
export class Threefish256 extends AThreefish implements IBlockCrypt {
	constructor(key: Key | Uint8Array, tweak: Tweak | Uint8Array) {
		const rounds = 72;
		const blockSize = 32;
		sLen('key', key).exactly(blockSize).throwNot();
		if (key instanceof Uint8Array) key = Key.fromKey(key);
		if (tweak instanceof Uint8Array) tweak = new Tweak(tweak);
		super(rounds / 4, key, tweak);
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
			///*DBUG*/uLog64(d64, '+rk');

			this.mixPerm(d64, 14, 16);
			this.mixPerm(d64, 52, 57);
			this.mixPerm(d64, 23, 40);
			this.mixPerm(d64, 5, 37);

			//Odd Round
			this.addRk(d64, r++);
			///*DBUG*/uLog64(d64, '+rk');

			this.mixPerm(d64, 25, 33);
			this.mixPerm(d64, 46, 12);
			this.mixPerm(d64, 58, 22);
			this.mixPerm(d64, 32, 32);
		} while (r < this.qr);
		this.addRk(d64, r);
		///*DBUG*/uLog64(d64, '+rk');
	}
	protected _decBlock(data: Uint8Array) {
		const d64 = U64MutArray.mount(
			new Uint32Array(data.buffer, data.byteOffset, data.length / 4)
		);
		let r = this.qr;
		this.subRk(d64, r--);
		///*DBUG*/uLog64(d64, '-rk');
		do {
			//Odd round
			this.permUnmix(d64, 32, 32);
			this.permUnmix(d64, 22, 58);
			this.permUnmix(d64, 12, 46);
			this.permUnmix(d64, 33, 25);

			this.subRk(d64, r--);
			///*DBUG*/uLog64(d64, '-rk');

			//Even round
			this.permUnmix(d64, 37, 5);
			this.permUnmix(d64, 40, 23);
			this.permUnmix(d64, 57, 52);
			this.permUnmix(d64, 16, 14);

			this.subRk(d64, r--);
			///*DBUG*/uLog64(d64, '-rk');
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
 * - [Skein Hash Function Family](https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf)
 */
export class Threefish512 extends AThreefish implements IBlockCrypt {
	constructor(key: Key | Uint8Array, tweak: Tweak | Uint8Array) {
		const rounds = 72;
		const blockSize = 64;
		sLen('key', key).exactly(blockSize).throwNot();
		if (key instanceof Uint8Array) key = Key.fromKey(key);
		if (tweak instanceof Uint8Array) tweak = new Tweak(tweak);
		super(rounds / 4, key, tweak);
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
 * - [Skein Hash Function Family](https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf)
 */
export class Threefish1024 extends AThreefish implements IBlockCrypt {
	constructor(key: Key | Uint8Array, tweak: Tweak | Uint8Array) {
		//super(128, 80, key, tweak);
		const rounds = 80;
		const blockSize = 128;
		sLen('key', key).exactly(blockSize).throwNot();
		if (key instanceof Uint8Array) key = Key.fromKey(key);
		if (tweak instanceof Uint8Array) tweak = new Tweak(tweak);
		super(rounds / 4, key, tweak);
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
