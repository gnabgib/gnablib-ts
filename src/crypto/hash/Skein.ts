/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64MutArray } from '../../primitive/number/U64.js';
import { uLog64 } from '../../runtime/goLog.js';
import { sInt } from '../../safe/safe.js';
import type { IHash } from '../interfaces/IHash.js';
import { Key, Threefish256, Threefish512, Tweak } from '../sym/Threefish.js';

const defaultOut256 = 32;
const defaultOut512 = 64;
const zeroU8 = new Uint8Array(0);

/**
 * [Skein hash](https://www.schneier.com/academic/skein/)
 * ( [Wiki](https://en.wikipedia.org/wiki/Skein_%28hash_function%29) )
 */

const blockSize256 = 32;
const blockSize512=64;

class Skein256Core implements IHash {
	/** Block size in bytes */
	readonly blockSize = blockSize256;
	/** Digest size in bytes */
	readonly size: number;
	/** Whether any data has been written */
	private _hasData = false;
	/** Temp processing block */
	private readonly _block = new Uint8Array(blockSize256);
	private readonly _b64 = U64MutArray.mount(
		new Uint32Array(this._block.buffer)
	);
	/** Position of data written to block */
	private _bPos = 0;
	private _cfgBackup: U64MutArray;
	private _hVal: Key;
	private _tweak: Tweak;
	private _c: Threefish256;

	constructor(digestSizeBytes: number, key: Uint8Array) {
		this.size = digestSizeBytes;
		//Limit size to 536870912 bytes, which is the most we can store in config with current settings (and way beyond expected)
		sInt('digestSizeBytes', digestSizeBytes)
            .atLeast(1)
			.atMost(536870912)
			.throwNot();
		//Initialize
		//This is a deconstructed u64, u64 array
		const tweak = new Uint8Array(16);
		if (key.length > 0) {
			//Of second U64:
			//-56th bit is set to 0 indicate a key.. so, nothing to do there
			//-62nd bit is set to 1 to indicate first block ()
			//Because this is LE, [16]=0x40
			tweak[16] = 0x40;
		}
		this._block[0] = 0x53; //S
		this._block[1] = 0x48; //H
		this._block[2] = 0x41; //A
		this._block[3] = 0x33; //3 (ascii)
		//Version
		this._block[4] = 0x01; //1
		this._block[8] = digestSizeBytes << 3;
		this._block[9] = digestSizeBytes >>> 5;
		this._block[10] = digestSizeBytes >>> 13;
		this._block[11] = digestSizeBytes >>> 21;
		this._tweak = Tweak.NewCfg(blockSize256);
		this._hVal = Key.fromSize(blockSize256);
		///*DBUG*/uLog64(this._tweak.t64,"tweak")
		this._c = new Threefish256(this._hVal, this._tweak);
		this.ubi();

		//We backup this hVal so that we can reset the hash
		this._cfgBackup = this._hVal.k64.clone();
		this._bPos = 0;
		this._tweak.makeMsg();
		// /*DBUG*/uLog64(this._hVal.k64,"hVal")
		// /*DBUG*/console.log('=setup')
	}

	ubi() {
		const s = this._b64.clone();
		this._tweak.lock = true;
		this._hVal.lock = true;
		this._c.encryptBlock(this._block);
		this._hVal.k64.set(s);
		this._hVal.k64.at(0).xorEq(this._b64.at(0));
		this._hVal.k64.at(1).xorEq(this._b64.at(1));
		this._hVal.k64.at(2).xorEq(this._b64.at(2));
		this._hVal.k64.at(3).xorEq(this._b64.at(3));
		this._hVal.lock = false;
		///*DBUG*/uLog64(this._hVal.k64,"hVal'")
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
			const write = Math.min(i, blockSize256);
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
			ret.set(this._block.slice(0, write), ctr * blockSize256);
			ctr++;
			i -= blockSize256;
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
		return new Skein256Core(this.size, zeroU8);
	}

	/** Create a copy of the current context (uses different memory) */
	clone(): Skein256Core {
		const r = new Skein256Core(this.size, zeroU8);
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

	private hash() {
		// /*DBUG*/console.log('update');
		this._tweak.incr(blockSize256);
		this.ubi();
		this._tweak.isFirst = false;
		//Reset block pointer
		this._bPos = 0;
	}
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
		// /*DBUG*/uLog64(this._hVal.k64,"hVal'-f")
	}

	write(data: Uint8Array): void {
		this._hasData = true;
		let nToWrite = data.length;
		let dPos = 0;
		let space = blockSize256 - this._bPos;
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
			space = blockSize256;
		}
	}
}

class Skein512Core implements IHash {
	/** Block size in bytes */
	readonly blockSize = blockSize512;
	/** Digest size in bytes */
	readonly size: number;
	/** Whether any data has been written */
	private _hasData = false;
	/** Temp processing block */
	private readonly _block = new Uint8Array(blockSize512);
	private readonly _b64 = U64MutArray.mount(
		new Uint32Array(this._block.buffer)
	);
	/** Position of data written to block */
	private _bPos = 0;
	private _cfgBackup: U64MutArray;
	private _hVal: Key;
	private _tweak: Tweak;
	private _c: Threefish512;

	constructor(digestSizeBytes: number, key: Uint8Array) {
		this.size = digestSizeBytes;
		//Limit size to 536870912 bytes, which is the most we can store in config with current settings (and way beyond expected)
		sInt('digestSizeBytes', digestSizeBytes)
			.atLeast(1)
			.atMost(536870912)
			.throwNot();
		//Initialize
		this._block[0] = 0x53; //S
		this._block[1] = 0x48; //H
		this._block[2] = 0x41; //A
		this._block[3] = 0x33; //3 (ascii)
		//Version
		this._block[4] = 0x01; //1
        //Size
		this._block[8] = digestSizeBytes << 3;
		this._block[9] = digestSizeBytes >>> 5;
		this._block[10] = digestSizeBytes >>> 13;
		this._block[11] = digestSizeBytes >>> 21;
		this._tweak = Tweak.NewCfg(blockSize256);
		this._hVal = Key.fromSize(blockSize512);
		///*DBUG*/uLog64(this._tweak.t64,"tweak")
		this._c = new Threefish512(this._hVal, this._tweak);
		this.ubi();

		//We backup this hVal so that we can reset the hash
		this._cfgBackup = this._hVal.k64.clone();
		this._bPos = 0;
		this._tweak.makeMsg();
		// /*DBUG*/uLog64(this._hVal.k64,"hVal")
		// /*DBUG*/console.log('=setup')
	}

	ubi() {
		const s = this._b64.clone();
		this._tweak.lock = true;
		this._hVal.lock = true;
		this._c.encryptBlock(this._block);
		this._hVal.k64.set(s);
		this._hVal.k64.at(0).xorEq(this._b64.at(0));
		this._hVal.k64.at(1).xorEq(this._b64.at(1));
		this._hVal.k64.at(2).xorEq(this._b64.at(2));
		this._hVal.k64.at(3).xorEq(this._b64.at(3));
        this._hVal.k64.at(4).xorEq(this._b64.at(4));
        this._hVal.k64.at(5).xorEq(this._b64.at(5));
        this._hVal.k64.at(6).xorEq(this._b64.at(6));
        this._hVal.k64.at(7).xorEq(this._b64.at(7));
		this._hVal.lock = false;
		///*DBUG*/uLog64(this._hVal.k64,"hVal'")
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
			const write = Math.min(i, blockSize512);
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
			ret.set(this._block.slice(0, write), ctr * blockSize512);
			ctr++;
			i -= blockSize512;
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
		return new Skein512Core(this.size, zeroU8);
	}

	/** Create a copy of the current context (uses different memory) */
	clone(): Skein512Core {
		const r = new Skein512Core(this.size, zeroU8);
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

	private hash() {
		// /*DBUG*/console.log('update');
		this._tweak.incr(blockSize512);
		this.ubi();
		this._tweak.isFirst = false;
		//Reset block pointer
		this._bPos = 0;
	}
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
		// /*DBUG*/uLog64(this._hVal.k64,"hVal'-f")
	}

	write(data: Uint8Array): void {
		this._hasData = true;
		let nToWrite = data.length;
		let dPos = 0;
		let space = blockSize512 - this._bPos;
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
			space = blockSize512;
		}
	}
}


export class Skein256 extends Skein256Core {
	constructor(sizeBytes = defaultOut256) {
		super(sizeBytes, zeroU8);
	}
}
export class Skein512 extends Skein512Core {
	constructor(sizeBytes = defaultOut512) {
		super(sizeBytes, zeroU8);
	}
}
// export class Skein256Mac extends Skein256Core {
//     constructor(key:Uint8Array) {
//         super(defaultOutSize,key);
//     }
// }
