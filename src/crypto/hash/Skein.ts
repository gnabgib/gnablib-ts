/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64MutArray } from '../../primitive/number/U64.js';
// import { uLog64 } from '../../runtime/goLog.js';
import { sInt, sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';
import type { IHash } from '../interfaces/IHash.js';
import {
	Key,
	Threefish1024,
	Threefish256,
	Threefish512,
	Tweak,
} from '../sym/Threefish.js';

const zeroU8 = new Uint8Array(0);

interface threefishConstructor {
	new (key: Key, tweak: Tweak): IBlockCrypt;
}

class SkeinCore {
	/** Block size in bytes */
	readonly blockSize: number;
	/** Digest size in bytes */
	readonly size: number;
	/** Whether any data has been written */
	private _hasData = false;
	/** Temp processing block */
	private readonly _block: Uint8Array;
	private readonly _b64: U64MutArray;
	/** Position of data written to block */
	private _bPos = 0;
	private readonly _cfgBackup: U64MutArray;
	private readonly _hVal: Key;
	private readonly _tweak: Tweak;
	private readonly _tfConstructor: threefishConstructor;
	private readonly _c: IBlockCrypt;

	constructor(
		blockSize: number,
		digestSize: number,
		ctor: threefishConstructor,
		key: Uint8Array
	) {
		this.blockSize = blockSize;
		this.size = digestSize;
		this._block = new Uint8Array(blockSize);
		this._b64 = U64MutArray.mount(new Uint32Array(this._block.buffer));
		this._hVal = Key.fromSize(blockSize);
		this._tweak = Tweak.NewKey();
		this._tfConstructor = ctor;
		this._c = new ctor(this._hVal, this._tweak);

		if (key.length > 0) {
			///*DBUG*/uLog64(this._tweak.t64,"key-tweak");
			this.write(key);
			this.finalize();
			this._hVal.lock = false;
			//Reset the block since CFG assumes it's empty
			this._block.fill(0);
			///*DBUG*/uLog64(this._hVal.k64,"hVal");
		}

		this._tweak.makeCfg(32);

		this._block[0] = 0x53; //S
		this._block[1] = 0x48; //H
		this._block[2] = 0x41; //A
		this._block[3] = 0x33; //3 (ascii)
		//Version
		this._block[4] = 0x01; //1
		//Limits the size to 536870912 bytes
		this._block[8] = digestSize << 3;
		this._block[9] = digestSize >>> 5;
		this._block[10] = digestSize >>> 13;
		this._block[11] = digestSize >>> 21;

		///*DBUG*/uLog64(this._tweak.t64,"tweak")
		this.ubi();

		//We backup this hVal so that we can reset the hash
		this._cfgBackup = this._hVal.k64.clone();
		this._bPos = 0;
		this._tweak.makeMsg();
		this._hasData = false;
		///*DBUG*/uLog64(this._hVal.k64,"hVal")
		///*DBUG*/console.log('=setup')
	}

	/** Perform a UBI op (encrypt with Threefish and then xor result back into key) */
	private ubi() {
		const s = this._b64.clone();
		this._c.encryptBlock(this._block);
		this._hVal.k64.set(s);
		const n = this._hVal.k64.length - 1;
		for (let i = 0; i < n; i++) this._hVal.k64.at(i).xorEq(this._b64.at(i));
		this._hVal.lock = false;
		///*DBUG*/uLog64(this._hVal.k64,"hVal'")
	}

	/** Hash a block */
	private hash() {
		// /*DBUG*/console.log('update');
		this._tweak.incr(this.blockSize);
		this.ubi();
		this._tweak.isFirst = false;
		//Reset block pointer
		this._bPos = 0;
		///*DBUG*/uLog64(this._hVal.k64,"hash-hVal'")
	}

	/** Hash a final block */
	private finalize() {
		// /*DBUG*/console.log('finalize');
		this._tweak.incr(this._bPos);
		this._tweak.isLast = true;
		// /*DBUG*/uLog64(this._tweak.t64,'tweak-f');
		//Zero the rest of the block
		///*DBUG*/console.log(`zero from ${this._bPos}`)
		this._block.fill(0, this._bPos);
		// /*DBUG*/uLog64(this._b64,'block');
		this.ubi();
		this._bPos = 0;
		///*DBUG*/uLog64(this._hVal.k64,"final-hVal'")
	}

	/** Write data to the hash (can be called multiple times) */
	write(data: Uint8Array): void {
		this._hasData = true;
		let nToWrite = data.length;
		let dPos = 0;
		let space = this.blockSize - this._bPos;
		while (nToWrite > 0) {
			if (space >= nToWrite) {
				//More space than data
				this._block.set(data.subarray(dPos));
				this._bPos += nToWrite;
				return;
			}
			this._block.set(data.subarray(dPos, dPos + this.blockSize), this._bPos);
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = this.blockSize;
		}
	}

	/** Create a copy of the current context (uses different memory) */
	clone() {
		const r = new SkeinCore(
			this.blockSize,
			this.size,
			this._tfConstructor,
			zeroU8
		);
		r._hasData = this._hasData;
		r._block.set(this._block);
		r._bPos = this._bPos;
		r._cfgBackup.set(this._cfgBackup);
		r._hVal.k64.set(this._hVal.k64);
		r._hVal.lock = false;
		r._tweak.t64.set(this._tweak.t64);
		r._tweak.lock = false;
		return r;
	}

	/** Sum the hash with the all content written so far (does not mutate state) */
	sum(): Uint8Array {
		return this.clone().sumIn();
	}

	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 * Use if you won't need the obj again (for performance)
	 */
	sumIn(): Uint8Array {
		// /*DBUG*/console.log("sum")
		if (this._hasData) {
			this.finalize();
		}
		const ret = new Uint8Array(this.size);
		let i = this.size;
		let ctr = 0;
		this._tweak.makeOut();
		const hVal = this._hVal.k64.clone();
		// this._block.fill(0);
		while (i > 0) {
			const write = Math.min(i, this.blockSize);
			///*DBUG*/console.log("output")
			const c = U64.fromInt(ctr);
			this._block.fill(0);
			this._b64.at(0).set(c);
			///*DBUG*/uLog64(this._b64,"block")
			///*DBUG*/uLog64(this._tweak.t64,"tweak")
			///*DBUG*/uLog64(this._hVal.k64,"hVal")
			this.ubi();
			///*DBUG*/uLog64(this._b64,"b'")
			this._b64.at(0).xorEq(c);
			///*DBUG*/uLog64(this._b64,"b'")
			ret.set(this._block.slice(0, write), ctr * this.blockSize);
			ctr++;
			i -= this.blockSize;
			this._hVal.k64.set(hVal);
		}
		// console.log(ret);
		return ret;
	}

	/** Reset hash state. Any past writes will be forgotten */
	reset(): void {
		this._hasData = false;
		// this._block.fill(0);
		this._bPos = 0;
		this._hVal.k64.set(this._cfgBackup);
		this._hVal.lock = false;
		this._tweak.makeMsg();
	}

	/** Create an empty IHash using the same algorithm */
	newEmpty(): IHash {
		return new SkeinCore(
			this.blockSize,
			this.size,
			this._tfConstructor,
			zeroU8
		);
	}
}
class Skein256Core extends SkeinCore implements IHash {
	constructor(digestSize: number, key: Uint8Array) {
		super(32, digestSize, Threefish256, key);
	}
}
class Skein512Core extends SkeinCore implements IHash {
	constructor(digestSize: number, key: Uint8Array) {
		super(64, digestSize, Threefish512, key);
	}
}
class Skein1024Core extends SkeinCore implements IHash {
	constructor(digestSize: number, key: Uint8Array) {
		super(128, digestSize, Threefish1024, key);
	}
}

/**
 * [Skein hash](https://www.schneier.com/academic/skein/) 256
 * ( [Wiki](https://en.wikipedia.org/wiki/Skein_%28hash_function%29) )
 *
 * Skein is a cryptographic hash function and one of five finalists in the NIST
 * hash function competition (to become SHA-3).  It ultimately lost to Keccak.
 *
 * First Published: *2008*  
 * Block size: *32 bytes*  
 * Output size: *16/20/28/32 bytes* or *1-32 bytes* (32 default)
 *
 * Specified in:
 * - [Skein Hash Function Family](https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf)
 */
export class Skein256 extends Skein256Core {
	constructor(sizeBytes = 32) {
		//Since this is a hash (not a XOF) let's limit
		sInt('sizeBytes', sizeBytes).atLeast(1).atMost(32).throwNot();
		super(sizeBytes, zeroU8);
	}

	/** Build a new Skein256 with 128bit output - a recommended replacement for MD5 */
	static New128() {
		return new Skein256(16);
	}

	/** Build a new Skein256 with 160bit output - a recommended replacement for SHA1 */
	static New160() {
		return new Skein256(20);
	}

	/** Build a new Skein256 with 224bit output - a recommended replacement for SHA2-224 */
	static New224() {
		return new Skein256(28);
	}

	/** Build a new Skein256 with 256bit output - a recommended replacement for SHA2-256 */
	static New256() {
		return new Skein256(32);
	}
}

/**
 * [Skein hash](https://www.schneier.com/academic/skein/) 512
 * ( [Wiki](https://en.wikipedia.org/wiki/Skein_%28hash_function%29) )
 *
 * Skein is a cryptographic hash function and one of five finalists in the NIST
 * hash function competition (to become SHA-3).  It ultimately lost to Keccak.
 *
 * First Published: *2008*  
 * Block size: *64 bytes*  
 * Output size: *16/20/28/32/48/64 bytes* or *1-64 bytes* (64 default)
 *
 * Specified in:
 * - [Skein Hash Function Family](https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf)
 */
export class Skein512 extends Skein512Core {
	constructor(sizeBytes = 64) {
		//Since this is a hash (not a XOF) let's limit
		sInt('sizeBytes', sizeBytes).atLeast(1).atMost(64).throwNot();
		super(sizeBytes, zeroU8);
	}

	/** Build a new Skein512 with 128bit output - a recommended replacement for MD5 */
	static New128() {
		return new Skein512(16);
	}

	/** Build a new Skein512 with 160bit output - a recommended replacement for SHA1 */
	static New160() {
		return new Skein512(20);
	}

	/** Build a new Skein512 with 224bit output - a recommended replacement for SHA2-224 */
	static New224() {
		return new Skein512(28);
	}

	/** Build a new Skein512 with 256bit output - a recommended replacement for SHA2-256 */
	static New256() {
		return new Skein512(32);
	}

	/** Build a new Skein512 with 384bit output - a recommended replacement for SHA2-384 */
	static New384() {
		return new Skein512(48);
	}

	/** Build a new Skein512 with 512bit output - a recommended replacement for SHA2-512 */
	static New512() {
		return new Skein512(64);
	}
}

/**
 * [Skein hash](https://www.schneier.com/academic/skein/) 1024
 * ( [Wiki](https://en.wikipedia.org/wiki/Skein_%28hash_function%29) )
 *
 * Skein is a cryptographic hash function and one of five finalists in the NIST
 * hash function competition (to become SHA-3).  It ultimately lost to Keccak.
 *
 * First Published: *2008*  
 * Block size: *128 bytes*  
 * Output size: *48/64/128 bytes* or *1-128 bytes* (128 default)
 *
 * Specified in:
 * - [Skein Hash Function Family](https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf)
 */
export class Skein1024 extends Skein1024Core {
	constructor(sizeBytes = 128) {
		//Since this is a hash (not a XOF) let's limit
		sInt('sizeBytes', sizeBytes).atLeast(1).atMost(128).throwNot();
		super(sizeBytes, zeroU8);
	}

	/** Build a new Skein1024 with 384bit output - a recommended replacement for SHA2-384 */
	static New384() {
		return new Skein1024(48);
	}

	/** Build a new Skein1024 with 512bit output - a recommended replacement for SHA2-512 */
	static New512() {
		return new Skein1024(64);
	}

	/** Build a new Skein1024 with 1024bit output - a recommended replacement for SHA2-512 */
	static New1024() {
		return new Skein1024(128);
	}
}

/**
 * [Skein MAC](https://www.schneier.com/academic/skein/) 256
 * 
 * First Published: *2008*  
 * Block size: *32 bytes*  
 * Output size: *32 bytes*
 * 
 * Specified in:
 * - [Skein Hash Function Family](https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf)
 * section 2.6
 */
export class SkeinMac256 extends Skein256Core {
    /** Build with a key 1-n bytes */
	constructor(key: Uint8Array) {
        sLen('key',key).atLeast(1).throwNot();
		super(32, key);
	}
}

/**
 * [Skein MAC](https://www.schneier.com/academic/skein/) 512
 * 
 * First Published: *2008*  
 * Block size: *64 bytes*  
 * Output size: *64 bytes*
 * 
 * Specified in:
 * - [Skein Hash Function Family](https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf)
 * section 2.6
 */
export class SkeinMac512 extends Skein512Core {
    /** Build with a key 1-n bytes */
	constructor(key: Uint8Array) {
        sLen('key',key).atLeast(1).throwNot();
		super(64, key);
	}
}

/**
 * [Skein MAC](https://www.schneier.com/academic/skein/) 512
 * 
 * First Published: *2008*  
 * Block size: *128 bytes*  
 * Output size: *128 bytes*
 * 
 * Specified in:
 * - [Skein Hash Function Family](https://web.archive.org/web/20140824053109/http://www.skein-hash.info/sites/default/files/skein1.3.pdf)
 * section 2.6
 */
export class SkeinMac1024 extends Skein1024Core {
    /** Build with a key 1-n bytes */
	constructor(key: Uint8Array) {
        sLen('key',key).atLeast(1).throwNot();
		super(128, key);
	}
}
