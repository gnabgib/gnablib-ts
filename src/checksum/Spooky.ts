/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import type { IHash } from '../crypto/interfaces/IHash.js';
import { asLE } from '../endian/platform.js';
import { U64, U64Mut, U64MutArray } from '../primitive/number/U64.js';
import { AChecksum32 } from './_AChecksum.js';

//[Wikipedia: Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function)
//[SpookyHash: a 128-bit non-cryptographic hash](http://burtleburtle.net/bob/hash/spooky.html)
//[SpookyV2.cpp](http://burtleburtle.net/bob/c/SpookyV2.cpp) (2012)
//SpookyHash v2 was released shortly after V1, and improved on it, so no v1 implementation planned

const sBlockSizeEls = 4;
const sc = U64Mut.fromUint32Pair(0xdeadbeef, 0xdeadbeef);
const lBlockSizeEls = 12;
const lBlockSizeBytes = lBlockSizeEls << 3; //96
const sToL = lBlockSizeBytes << 1; //192

/**
 * NOT Cryptographic
 */
export class SpookyShort extends AChecksum32 implements IHash {
	/** Runtime state of the hash */
	protected readonly _state = U64MutArray.fromLen(sBlockSizeEls);
	/** Temp processing block */
	private readonly _b64 = U64MutArray.fromBytes(this._b8.buffer);

	/**
	 * Build a new Spooky2Short (non-crypto) hash generator
	 * @param seed
	 */
	constructor(
		protected readonly seed = U64.zero,
		protected readonly seed2 = U64.zero
	) {
		super(16, 32);
		this._state.at(0).set(seed);
		this._state.at(1).set(seed2);
		this._state.at(2).set(sc);
		this._state.at(3).set(sc);
		this._bPos = 16;
	}

	/**
	 * aka Mix
	 */
	protected hash() {
		//Make sure block is little-endian
		asLE.i64(this._b8, 0, sBlockSizeEls);
		//Add in data
		this._state.at(0).addEq(this._b64.at(0));
		this._state.at(1).addEq(this._b64.at(1));
		this._state.at(2).addEq(this._b64.at(2));
		this._state.at(3).addEq(this._b64.at(3));

		///MIX
		// h2 = Rot64(h2,50);  h2 += h3;  h0 ^= h2;
		// h3 = Rot64(h3,52);  h3 += h0;  h1 ^= h3;
		// h0 = Rot64(h0,30);  h0 += h1;  h2 ^= h0;
		// h1 = Rot64(h1,41);  h1 += h2;  h3 ^= h1;
		this._state.at(2).lRotEq(50).addEq(this._state.at(3));
		this._state.at(0).xorEq(this._state.at(2));
		this._state.at(3).lRotEq(52).addEq(this._state.at(0));
		this._state.at(1).xorEq(this._state.at(3));
		this._state.at(0).lRotEq(30).addEq(this._state.at(1));
		this._state.at(2).xorEq(this._state.at(0));
		this._state.at(1).lRotEq(41).addEq(this._state.at(2));
		this._state.at(3).xorEq(this._state.at(1));
		// h2 = Rot64(h2,54);  h2 += h3;  h0 ^= h2;
		// h3 = Rot64(h3,48);  h3 += h0;  h1 ^= h3;
		// h0 = Rot64(h0,38);  h0 += h1;  h2 ^= h0;
		// h1 = Rot64(h1,37);  h1 += h2;  h3 ^= h1;
		this._state.at(2).lRotEq(54).addEq(this._state.at(3));
		this._state.at(0).xorEq(this._state.at(2));
		this._state.at(3).lRotEq(48).addEq(this._state.at(0));
		this._state.at(1).xorEq(this._state.at(3));
		this._state.at(0).lRotEq(38).addEq(this._state.at(1));
		this._state.at(2).xorEq(this._state.at(0));
		this._state.at(1).lRotEq(37).addEq(this._state.at(2));
		this._state.at(3).xorEq(this._state.at(1));
		// h2 = Rot64(h2,62);  h2 += h3;  h0 ^= h2;
		// h3 = Rot64(h3,34);  h3 += h0;  h1 ^= h3;
		// h0 = Rot64(h0,5);   h0 += h1;  h2 ^= h0;
		// h1 = Rot64(h1,36);  h1 += h2;  h3 ^= h1;
		this._state.at(2).lRotEq(62).addEq(this._state.at(3));
		this._state.at(0).xorEq(this._state.at(2));
		this._state.at(3).lRotEq(34).addEq(this._state.at(0));
		this._state.at(1).xorEq(this._state.at(3));
		this._state.at(0).lRotEq(5).addEq(this._state.at(1));
		this._state.at(2).xorEq(this._state.at(0));
		this._state.at(1).lRotEq(36).addEq(this._state.at(2));
		this._state.at(3).xorEq(this._state.at(1));

		this._bPos = 0;
	}
	private final() {
		//Make sure block is little-endian
		asLE.i64(this._b8, 0, sBlockSizeEls);
		//Add in data
		this._state.at(0).addEq(this._b64.at(0));
		this._state.at(1).addEq(this._b64.at(1));
		this._state.at(2).addEq(this._b64.at(2));
		this._state.at(3).addEq(this._b64.at(3));

		// h3 ^= h2;  h2 = Rot64(h2,15);  h3 += h2;
		// h0 ^= h3;  h3 = Rot64(h3,52);  h0 += h3;
		// h1 ^= h0;  h0 = Rot64(h0,26);  h1 += h0;
		// h2 ^= h1;  h1 = Rot64(h1,51);  h2 += h1;
		this._state.at(3).xorEq(this._state.at(2));
		this._state.at(2).lRotEq(15);
		this._state.at(3).addEq(this._state.at(2));
		this._state.at(0).xorEq(this._state.at(3));
		this._state.at(3).lRotEq(52);
		this._state.at(0).addEq(this._state.at(3));
		this._state.at(1).xorEq(this._state.at(0));
		this._state.at(0).lRotEq(26);
		this._state.at(1).addEq(this._state.at(0));
		this._state.at(2).xorEq(this._state.at(1));
		this._state.at(1).lRotEq(51);
		this._state.at(2).addEq(this._state.at(1));
		// h3 ^= h2;  h2 = Rot64(h2,28);  h3 += h2;
		// h0 ^= h3;  h3 = Rot64(h3,9);   h0 += h3;
		// h1 ^= h0;  h0 = Rot64(h0,47);  h1 += h0;
		// h2 ^= h1;  h1 = Rot64(h1,54);  h2 += h1;
		this._state.at(3).xorEq(this._state.at(2));
		this._state.at(2).lRotEq(28);
		this._state.at(3).addEq(this._state.at(2));
		this._state.at(0).xorEq(this._state.at(3));
		this._state.at(3).lRotEq(9);
		this._state.at(0).addEq(this._state.at(3));
		this._state.at(1).xorEq(this._state.at(0));
		this._state.at(0).lRotEq(47);
		this._state.at(1).addEq(this._state.at(0));
		this._state.at(2).xorEq(this._state.at(1));
		this._state.at(1).lRotEq(54);
		this._state.at(2).addEq(this._state.at(1));
		// h3 ^= h2;  h2 = Rot64(h2,32);  h3 += h2;
		// h0 ^= h3;  h3 = Rot64(h3,25);  h0 += h3;
		// h1 ^= h0;  h0 = Rot64(h0,63);  h1 += h0;
		this._state.at(3).xorEq(this._state.at(2));
		this._state.at(2).lRotEq(32);
		this._state.at(3).addEq(this._state.at(2));
		this._state.at(0).xorEq(this._state.at(3));
		this._state.at(3).lRotEq(25);
		this._state.at(0).addEq(this._state.at(3));
		this._state.at(1).xorEq(this._state.at(0));
		this._state.at(0).lRotEq(63);
		this._state.at(1).addEq(this._state.at(0));
	}
	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum(): Uint8Array {
		return this.clone().sumIn();
	}
	/** Sum the hash - mutates internal state, but avoids memory alloc */
	sumIn(): Uint8Array {
		//In the bPos 1-15 range (remember it starts at 16 = 17-31 ingest%32) we need to zero
		// up to 16, move AB->CD, and zero AB
		if (this._bPos >= 1 && this._bPos < 16) {
			this._b8.fill(0, this._bPos, 16);
			this._b64.at(2).set(this._b64.at(0));
			this._b64.at(3).set(this._b64.at(1));
			this._b64.at(0).set(U64.zero);
			this._b64.at(1).set(U64.zero);
		} else {
			//Zero the rest
			this.fillBlock();
		}
		//Add the length
		this._b64.at(3).addEq(U64Mut.fromUint32Pair(0, this._ingestBytes << 24));
		//If a multiple of 16, add SC to C/D (bPos =0 or 16)
		if ((this._bPos & 15) === 0) {
			this._b64.at(2).addEq(sc);
			this._b64.at(3).addEq(sc);
		}
		this.final();
		const ret = this._state.toBytesBE().slice(0, 16);
		return ret;
	}

	/** Set hash state. Any past writes will be forgotten */
	reset(): void {
		this._state.at(0).set(this.seed);
		this._state.at(1).set(this.seed2);
		this._state.at(2).set(sc);
		this._state.at(3).set(sc);

		this._ingestBytes = 0;
		this._bPos = 16;
	}

	/** Create an empty IHash using the same algorithm */
	newEmpty(): IHash {
		return new SpookyShort(this.seed, this.seed2);
	}

	/** Create a copy of the current context (uses different memory) */
	clone(): SpookyShort {
		const ret = new SpookyShort(this.seed, this.seed2);
		ret._state.set(this._state);
		super._clone(ret);
		return ret;
	}
}

/**
 * NOT Cryptographic
 */
export class SpookyLong extends AChecksum32 {
	/**
	 * Runtime state of the hash
	 */
	private readonly _state = U64MutArray.fromLen(lBlockSizeEls);
	/**
	 * Temp processing block
	 */
	private readonly _b64 = U64MutArray.fromBytes(this._b8.buffer);

	/**
	 * Build a new Spooky2Short (non-crypto) hash generator
	 * @param seed
	 */
	constructor(
		protected readonly seed = U64.zero,
		protected readonly seed2 = U64.zero
	) {
		super(16, 96);
		this._state.at(0).set(seed);
		this._state.at(1).set(seed2);
		this._state.at(2).set(sc);
		this._state.at(3).set(seed);
		this._state.at(4).set(seed2);
		this._state.at(5).set(sc);
		this._state.at(6).set(seed);
		this._state.at(7).set(seed2);
		this._state.at(8).set(sc);
		this._state.at(9).set(seed);
		this._state.at(10).set(seed2);
		this._state.at(11).set(sc);
	}

	/**
	 * aka Mix
	 */
	protected hash(): void {
		//Make sure block is little-endian
		asLE.i64(this._b8, 0, lBlockSizeEls);

		//s0 += data[0];    s2 ^= s10;    s11 ^= s0;    s0 = Rot64(s0,11);    s11 += s1;
		this._state.at(0).addEq(this._b64.at(0));
		this._state.at(2).xorEq(this._state.at(10));
		this._state.at(11).xorEq(this._state.at(0)).addEq(this._state.at(1));
		this._state.at(0).lRotEq(11);
		//s1 += data[1];    s3 ^= s11;    s0 ^= s1;    s1 = Rot64(s1,32);    s0 += s2;
		this._state.at(1).addEq(this._b64.at(1));
		this._state.at(3).xorEq(this._state.at(11));
		this._state.at(0).xorEq(this._state.at(1)).addEq(this._state.at(2));
		this._state.at(1).lRotEq(32);
		//s2 += data[2];    s4 ^= s0;    s1 ^= s2;    s2 = Rot64(s2,43);    s1 += s3;
		this._state.at(2).addEq(this._b64.at(2));
		this._state.at(4).xorEq(this._state.at(0));
		this._state.at(1).xorEq(this._state.at(2)).addEq(this._state.at(3));
		this._state.at(2).lRotEq(43);
		//s3 += data[3];    s5 ^= s1;    s2 ^= s3;    s3 = Rot64(s3,31);    s2 += s4;
		this._state.at(3).addEq(this._b64.at(3));
		this._state.at(5).xorEq(this._state.at(1));
		this._state.at(2).xorEq(this._state.at(3)).addEq(this._state.at(4));
		this._state.at(3).lRotEq(31);
		//s4 += data[4];    s6 ^= s2;    s3 ^= s4;    s4 = Rot64(s4,17);    s3 += s5;
		this._state.at(4).addEq(this._b64.at(4));
		this._state.at(6).xorEq(this._state.at(2));
		this._state.at(3).xorEq(this._state.at(4)).addEq(this._state.at(5));
		this._state.at(4).lRotEq(17);
		//s5 += data[5];    s7 ^= s3;    s4 ^= s5;    s5 = Rot64(s5,28);    s4 += s6;
		this._state.at(5).addEq(this._b64.at(5));
		this._state.at(7).xorEq(this._state.at(3));
		this._state.at(4).xorEq(this._state.at(5)).addEq(this._state.at(6));
		this._state.at(5).lRotEq(28);
		//s6 += data[6];    s8 ^= s4;    s5 ^= s6;    s6 = Rot64(s6,39);    s5 += s7;
		this._state.at(6).addEq(this._b64.at(6));
		this._state.at(8).xorEq(this._state.at(4));
		this._state.at(5).xorEq(this._state.at(6)).addEq(this._state.at(7));
		this._state.at(6).lRotEq(39);
		//s7 += data[7];    s9 ^= s5;    s6 ^= s7;    s7 = Rot64(s7,57);    s6 += s8;
		this._state.at(7).addEq(this._b64.at(7));
		this._state.at(9).xorEq(this._state.at(5));
		this._state.at(6).xorEq(this._state.at(7)).addEq(this._state.at(8));
		this._state.at(7).lRotEq(57);
		//s8 += data[8];    s10 ^= s6;    s7 ^= s8;    s8 = Rot64(s8,55);    s7 += s9;
		this._state.at(8).addEq(this._b64.at(8));
		this._state.at(10).xorEq(this._state.at(6));
		this._state.at(7).xorEq(this._state.at(8)).addEq(this._state.at(9));
		this._state.at(8).lRotEq(55);
		//s9 += data[9];    s11 ^= s7;    s8 ^= s9;    s9 = Rot64(s9,54);    s8 += s10;
		this._state.at(9).addEq(this._b64.at(9));
		this._state.at(11).xorEq(this._state.at(7));
		this._state.at(8).xorEq(this._state.at(9)).addEq(this._state.at(10));
		this._state.at(9).lRotEq(54);
		//s10 += data[10];    s0 ^= s8;    s9 ^= s10;    s10 = Rot64(s10,22);    s9 += s11;
		this._state.at(10).addEq(this._b64.at(10));
		this._state.at(0).xorEq(this._state.at(8));
		this._state.at(9).xorEq(this._state.at(10)).addEq(this._state.at(11));
		this._state.at(10).lRotEq(22);
		//s11 += data[11];    s1 ^= s9;    s10 ^= s11;    s11 = Rot64(s11,46);    s10 += s0;
		this._state.at(11).addEq(this._b64.at(11));
		this._state.at(1).xorEq(this._state.at(9));
		this._state.at(10).xorEq(this._state.at(11)).addEq(this._state.at(0));
		this._state.at(11).lRotEq(46);

		this._bPos = 0;
	}
	private finalPartial(): void {
		// h11+= h1;    h2 ^= h11;   h1 = Rot64(h1,44);
		this._state.at(11).addEq(this._state.at(1));
		this._state.at(2).xorEq(this._state.at(11));
		this._state.at(1).lRotEq(44);
		// h0 += h2;    h3 ^= h0;    h2 = Rot64(h2,15);
		this._state.at(0).addEq(this._state.at(2));
		this._state.at(3).xorEq(this._state.at(0));
		this._state.at(2).lRotEq(15);
		// h1 += h3;    h4 ^= h1;    h3 = Rot64(h3,34);
		this._state.at(1).addEq(this._state.at(3));
		this._state.at(4).xorEq(this._state.at(1));
		this._state.at(3).lRotEq(34);
		// h2 += h4;    h5 ^= h2;    h4 = Rot64(h4,21);
		this._state.at(2).addEq(this._state.at(4));
		this._state.at(5).xorEq(this._state.at(2));
		this._state.at(4).lRotEq(21);
		// h3 += h5;    h6 ^= h3;    h5 = Rot64(h5,38);
		this._state.at(3).addEq(this._state.at(5));
		this._state.at(6).xorEq(this._state.at(3));
		this._state.at(5).lRotEq(38);
		// h4 += h6;    h7 ^= h4;    h6 = Rot64(h6,33);
		this._state.at(4).addEq(this._state.at(6));
		this._state.at(7).xorEq(this._state.at(4));
		this._state.at(6).lRotEq(33);
		// h5 += h7;    h8 ^= h5;    h7 = Rot64(h7,10);
		this._state.at(5).addEq(this._state.at(7));
		this._state.at(8).xorEq(this._state.at(5));
		this._state.at(7).lRotEq(10);
		// h6 += h8;    h9 ^= h6;    h8 = Rot64(h8,13);
		this._state.at(6).addEq(this._state.at(8));
		this._state.at(9).xorEq(this._state.at(6));
		this._state.at(8).lRotEq(13);
		// h7 += h9;    h10^= h7;    h9 = Rot64(h9,38);
		this._state.at(7).addEq(this._state.at(9));
		this._state.at(10).xorEq(this._state.at(7));
		this._state.at(9).lRotEq(38);
		// h8 += h10;   h11^= h8;    h10= Rot64(h10,53);
		this._state.at(8).addEq(this._state.at(10));
		this._state.at(11).xorEq(this._state.at(8));
		this._state.at(10).lRotEq(53);
		// h9 += h11;   h0 ^= h9;    h11= Rot64(h11,42);
		this._state.at(9).addEq(this._state.at(11));
		this._state.at(0).xorEq(this._state.at(9));
		this._state.at(11).lRotEq(42);
		// h10+= h0;    h1 ^= h10;   h0 = Rot64(h0,54);
		this._state.at(10).addEq(this._state.at(0));
		this._state.at(1).xorEq(this._state.at(10));
		this._state.at(0).lRotEq(54);
	}
	private final(): void {
		//Make sure block is little-endian
		asLE.i64(this._b8, 0, lBlockSizeEls);

		//Add in data
		this._state.at(0).addEq(this._b64.at(0));
		this._state.at(1).addEq(this._b64.at(1));
		this._state.at(2).addEq(this._b64.at(2));
		this._state.at(3).addEq(this._b64.at(3));
		this._state.at(4).addEq(this._b64.at(4));
		this._state.at(5).addEq(this._b64.at(5));
		this._state.at(6).addEq(this._b64.at(6));
		this._state.at(7).addEq(this._b64.at(7));
		this._state.at(8).addEq(this._b64.at(8));
		this._state.at(9).addEq(this._b64.at(9));
		this._state.at(10).addEq(this._b64.at(10));
		this._state.at(11).addEq(this._b64.at(11));

		//Three times a lady
		this.finalPartial();
		this.finalPartial();
		this.finalPartial();
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		this._ingestBytes += data.length;

		let nToWrite = data.length;
		let dPos = 0;
		let space = lBlockSizeBytes - this._bPos;
		while (nToWrite > 0) {
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				this._b8.set(data.subarray(dPos), this._bPos);
				//Update pos
				this._bPos += nToWrite;
				return;
			}
			this._b8.set(data.subarray(dPos, dPos + space), this._bPos);
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = lBlockSizeBytes;
		}
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum(): Uint8Array {
		return this.clone().sumIn();
	}

	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 */
	sumIn(): Uint8Array {
		this.fillBlock();
		this._b8[lBlockSizeBytes - 1] = this._ingestBytes % lBlockSizeBytes;
		this.final();
		const ret = this._state.toBytesBE().slice(0, 16);
		return ret;
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset() {
		this._state.at(0).set(this.seed);
		this._state.at(1).set(this.seed2);
		this._state.at(2).set(sc);
		this._state.at(3).set(this.seed);
		this._state.at(4).set(this.seed2);
		this._state.at(5).set(sc);
		this._state.at(6).set(this.seed);
		this._state.at(7).set(this.seed2);
		this._state.at(8).set(sc);
		this._state.at(9).set(this.seed);
		this._state.at(10).set(this.seed2);
		this._state.at(11).set(sc);
		super._reset();
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty() {
		return new SpookyLong(this.seed, this.seed2);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): SpookyLong {
		const ret = new SpookyLong(this.seed, this.seed2);
		ret._state.set(this._state);
		super._clone(ret);
		return ret;
	}
}

/**
 * NOT Cryptographic - It's better to use SpookyShort (<192 bytes) or SpookyLong (>=192 bytes)
 * directly if you know final length before you build, and if the first write isn't large
 * - While < 192 bytes both long and short will be written to (necessary to support the transition)
 * - Once >=192 bytes only long will be written to (so if the first write is large there's no performance penalty,
 *   but you might as well just use SpookyLong?)
 */
export class Spooky extends SpookyShort {
	private _l: SpookyLong;
	private _u: SpookyShort | SpookyLong = this;

	constructor(seed = U64.zero, seed2 = U64.zero) {
		super(seed, seed2);
		this._l = new SpookyLong(seed, seed2);
	}

	write(data: Uint8Array) {
		if (this._u != this) return this._u.write(data);
		if (data.length + this._ingestBytes > sToL) {
			this._u = this._l;
			return this._u.write(data);
		}
		//Unfortunately we have to double write data in case another write pushes length over sToL
		super.write(data);
		this._l.write(data);
	}

	sum(): Uint8Array {
		return this._u != this ? this._u.sum() : super.sum();
	}

	/** Sum the hash - mutates internal state, but avoids memory alloc. */
	sumIn(): Uint8Array {
		return this._u != this ? this._u.sumIn() : super.sumIn();
	}

	/**
	 * Set hash state. Any past writes will be forgotten, both short and
	 * long will be available until length exceeds 192
	 */
	reset() {
		this._u = this;
		super.reset();
		this._l.reset();
	}

	/** Create an empty IHash using the same algorithm */
	newEmpty(): IHash {
		return new Spooky(this.seed, this.seed2);
	}

	/** Create a copy of the current context (uses different memory) */
	clone(): Spooky {
		const ret = new Spooky(this.seed, this.seed2);
		ret._state.set(this._state);
		super._clone(ret);

		ret._l = this._l.clone();
		if (this._u != this) ret._u = ret._l;
		return ret;
	}
}
