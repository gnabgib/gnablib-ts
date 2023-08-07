/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import type { IHash } from '../crypto/interfaces/IHash.js';
import { asLE } from '../endian/platform.js';
import { U64, U64Mut, U64MutArray } from '../primitive/U64.js';

//[Wikipedia: Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function)
//[SpookyHash: a 128-bit non-cryptographic hash](http://burtleburtle.net/bob/hash/spooky.html)
//[SpookyV2.cpp](http://burtleburtle.net/bob/c/SpookyV2.cpp) (2012)
//SpookyHash v2 was released shortly after V1, and improved on it, so no v1 implementation planned

const sBlockSizeEls = 4;
const sBlockSizeBytes = sBlockSizeEls << 3; //32
const digestSize = 16; //128 bits
const sc = U64Mut.fromUint32Pair(0xdeadbeef, 0xdeadbeef);
const lBlockSizeEls = 12;
const lBlockSizeBytes = lBlockSizeEls << 3; //96
const sToL = lBlockSizeBytes << 1; //192

abstract class ASpooky implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size = digestSize;
	protected readonly _seed: U64;
	protected readonly _seed2: U64;
	/**
	 * Number of bytes added to the hash
	 */
	protected _ingestBytes = 0;

	constructor(seed = U64.zero, seed2 = U64.zero) {
		this._seed = seed;
		this._seed2 = seed2;
	}
	get ingestBytes(): number {
		return this._ingestBytes;
	}
	abstract write(data: Uint8Array): void;
	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum(): Uint8Array {
		return this.clone().sumIn();
	}
	abstract sumIn(): Uint8Array;
	abstract reset(): void;
	abstract newEmpty(): IHash;
	abstract clone(): ASpooky;
	abstract get blockSize(): number;
}

/**
 * NOT Cryptographic
 */
export class SpookyShort extends ASpooky {
	/**
	 * Block size in bytes
	 */
	readonly blockSize = sBlockSizeBytes;
	/**
	 * Runtime state of the hash
	 */
	readonly #state = U64MutArray.fromLen(sBlockSizeEls);
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(sBlockSizeBytes);
	readonly #block64 = U64MutArray.fromBytes(this.#block.buffer);
	/**
	 * Position of data written to block
	 */
	#bPos = 16;

	/**
	 * Build a new Spooky2Short (non-crypto) hash generator
	 * @param seed
	 */
	constructor(seed = U64.zero, seed2 = U64.zero) {
		//These are sadly not compatible (notice SC in 3 vs seed)
		super(seed, seed2);
		this.#state.at(0).set(seed);
		this.#state.at(1).set(seed2);
		this.#state.at(2).set(sc);
		this.#state.at(3).set(sc);
	}

	/**
	 * aka Mix
	 */
	private hash(): void {
		//Make sure block is little-endian
		asLE.i64(this.#block, 0, sBlockSizeEls);
		//Add in data
		this.#state.at(0).addEq(this.#block64.at(0));
		this.#state.at(1).addEq(this.#block64.at(1));
		this.#state.at(2).addEq(this.#block64.at(2));
		this.#state.at(3).addEq(this.#block64.at(3));

		///MIX
		// h2 = Rot64(h2,50);  h2 += h3;  h0 ^= h2;
		// h3 = Rot64(h3,52);  h3 += h0;  h1 ^= h3;
		// h0 = Rot64(h0,30);  h0 += h1;  h2 ^= h0;
		// h1 = Rot64(h1,41);  h1 += h2;  h3 ^= h1;
		this.#state.at(2).lRotEq(50).addEq(this.#state.at(3));
		this.#state.at(0).xorEq(this.#state.at(2));
		this.#state.at(3).lRotEq(52).addEq(this.#state.at(0));
		this.#state.at(1).xorEq(this.#state.at(3));
		this.#state.at(0).lRotEq(30).addEq(this.#state.at(1));
		this.#state.at(2).xorEq(this.#state.at(0));
		this.#state.at(1).lRotEq(41).addEq(this.#state.at(2));
		this.#state.at(3).xorEq(this.#state.at(1));
		// h2 = Rot64(h2,54);  h2 += h3;  h0 ^= h2;
		// h3 = Rot64(h3,48);  h3 += h0;  h1 ^= h3;
		// h0 = Rot64(h0,38);  h0 += h1;  h2 ^= h0;
		// h1 = Rot64(h1,37);  h1 += h2;  h3 ^= h1;
		this.#state.at(2).lRotEq(54).addEq(this.#state.at(3));
		this.#state.at(0).xorEq(this.#state.at(2));
		this.#state.at(3).lRotEq(48).addEq(this.#state.at(0));
		this.#state.at(1).xorEq(this.#state.at(3));
		this.#state.at(0).lRotEq(38).addEq(this.#state.at(1));
		this.#state.at(2).xorEq(this.#state.at(0));
		this.#state.at(1).lRotEq(37).addEq(this.#state.at(2));
		this.#state.at(3).xorEq(this.#state.at(1));
		// h2 = Rot64(h2,62);  h2 += h3;  h0 ^= h2;
		// h3 = Rot64(h3,34);  h3 += h0;  h1 ^= h3;
		// h0 = Rot64(h0,5);   h0 += h1;  h2 ^= h0;
		// h1 = Rot64(h1,36);  h1 += h2;  h3 ^= h1;
		this.#state.at(2).lRotEq(62).addEq(this.#state.at(3));
		this.#state.at(0).xorEq(this.#state.at(2));
		this.#state.at(3).lRotEq(34).addEq(this.#state.at(0));
		this.#state.at(1).xorEq(this.#state.at(3));
		this.#state.at(0).lRotEq(5).addEq(this.#state.at(1));
		this.#state.at(2).xorEq(this.#state.at(0));
		this.#state.at(1).lRotEq(36).addEq(this.#state.at(2));
		this.#state.at(3).xorEq(this.#state.at(1));

		this.#bPos = 0;
	}
	private final(): void {
		//Make sure block is little-endian
		asLE.i64(this.#block, 0, sBlockSizeEls);
		//Add in data
		this.#state.at(0).addEq(this.#block64.at(0));
		this.#state.at(1).addEq(this.#block64.at(1));
		this.#state.at(2).addEq(this.#block64.at(2));
		this.#state.at(3).addEq(this.#block64.at(3));

		// h3 ^= h2;  h2 = Rot64(h2,15);  h3 += h2;
		// h0 ^= h3;  h3 = Rot64(h3,52);  h0 += h3;
		// h1 ^= h0;  h0 = Rot64(h0,26);  h1 += h0;
		// h2 ^= h1;  h1 = Rot64(h1,51);  h2 += h1;
		this.#state.at(3).xorEq(this.#state.at(2));
		this.#state.at(2).lRotEq(15);
		this.#state.at(3).addEq(this.#state.at(2));
		this.#state.at(0).xorEq(this.#state.at(3));
		this.#state.at(3).lRotEq(52);
		this.#state.at(0).addEq(this.#state.at(3));
		this.#state.at(1).xorEq(this.#state.at(0));
		this.#state.at(0).lRotEq(26);
		this.#state.at(1).addEq(this.#state.at(0));
		this.#state.at(2).xorEq(this.#state.at(1));
		this.#state.at(1).lRotEq(51);
		this.#state.at(2).addEq(this.#state.at(1));
		// h3 ^= h2;  h2 = Rot64(h2,28);  h3 += h2;
		// h0 ^= h3;  h3 = Rot64(h3,9);   h0 += h3;
		// h1 ^= h0;  h0 = Rot64(h0,47);  h1 += h0;
		// h2 ^= h1;  h1 = Rot64(h1,54);  h2 += h1;
		this.#state.at(3).xorEq(this.#state.at(2));
		this.#state.at(2).lRotEq(28);
		this.#state.at(3).addEq(this.#state.at(2));
		this.#state.at(0).xorEq(this.#state.at(3));
		this.#state.at(3).lRotEq(9);
		this.#state.at(0).addEq(this.#state.at(3));
		this.#state.at(1).xorEq(this.#state.at(0));
		this.#state.at(0).lRotEq(47);
		this.#state.at(1).addEq(this.#state.at(0));
		this.#state.at(2).xorEq(this.#state.at(1));
		this.#state.at(1).lRotEq(54);
		this.#state.at(2).addEq(this.#state.at(1));
		// h3 ^= h2;  h2 = Rot64(h2,32);  h3 += h2;
		// h0 ^= h3;  h3 = Rot64(h3,25);  h0 += h3;
		// h1 ^= h0;  h0 = Rot64(h0,63);  h1 += h0;
		this.#state.at(3).xorEq(this.#state.at(2));
		this.#state.at(2).lRotEq(32);
		this.#state.at(3).addEq(this.#state.at(2));
		this.#state.at(0).xorEq(this.#state.at(3));
		this.#state.at(3).lRotEq(25);
		this.#state.at(0).addEq(this.#state.at(3));
		this.#state.at(1).xorEq(this.#state.at(0));
		this.#state.at(0).lRotEq(63);
		this.#state.at(1).addEq(this.#state.at(0));

	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		this._ingestBytes += data.length;

		let nToWrite = data.length;
		let dPos = 0;
		let space = sBlockSizeBytes - this.#bPos;
		while (nToWrite > 0) {
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				this.#block.set(data.subarray(dPos), this.#bPos);
				//Update pos
				this.#bPos += nToWrite;
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + space), this.#bPos);
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = sBlockSizeBytes;
		}
	}

	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 */
	sumIn(): Uint8Array {
		//In the bPos 1-15 range (remember it starts at 16 = 17-31 ingest%32) we need to zero
		// up to 16, move AB->CD, and zero AB
		if (this.#bPos >= 1 && this.#bPos < 16) {
			this.#block.fill(0, this.#bPos, 16);
			this.#block64.at(2).set(this.#block64.at(0));
			this.#block64.at(3).set(this.#block64.at(1));
			this.#block64.at(0).set(U64Mut.fromInt(0));
			this.#block64.at(1).set(U64Mut.fromInt(0));
		} else {
			//Zero the rest
			this.#block.fill(0, this.#bPos);
		}
		//Add the length
		this.#block64
			.at(3)
			.addEq(U64Mut.fromUint32Pair(0, this._ingestBytes << 24));
		//If a multiple of 16, add SC to C/D (bPos =0 or 16)
		if ((this.#bPos & 15) === 0) {
			this.#block64.at(2).addEq(sc);
			this.#block64.at(3).addEq(sc);
		}
		this.final();
		const ret = this.#state.toBytesBE().slice(0, 16);
		return ret;
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		//These are sadly not compatible (notice SC in 3 vs seed)
		this.#state.at(0).set(this._seed);
		this.#state.at(1).set(this._seed2);
		this.#state.at(2).set(sc);
		this.#state.at(3).set(sc);

		this._ingestBytes = 0;
		this.#bPos = 16;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new SpookyShort(this._seed, this._seed2);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): SpookyShort {
		const ret = new SpookyShort(this._seed, this._seed2);
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret._ingestBytes = this._ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}

/**
 * NOT Cryptographic
 */
export class SpookyLong extends ASpooky {
	/**
	 * Block size in bytes
	 */
	readonly blockSize = lBlockSizeEls;
	/**
	 * Runtime state of the hash
	 */
	readonly #state = U64MutArray.fromLen(lBlockSizeEls);
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(lBlockSizeBytes);
	readonly #block64 = U64MutArray.fromBytes(this.#block.buffer);
	/**
	 * Position of data written to block
	 */
	#bPos = 0;

	/**
	 * Build a new Spooky2Short (non-crypto) hash generator
	 * @param seed
	 */
	constructor(seed = U64.zero, seed2 = U64.zero) {
		super(seed, seed2);
		this.#state.at(0).set(seed);
		this.#state.at(1).set(seed2);
		this.#state.at(2).set(sc);
		this.#state.at(3).set(seed);
		this.#state.at(4).set(seed2);
		this.#state.at(5).set(sc);
		this.#state.at(6).set(seed);
		this.#state.at(7).set(seed2);
		this.#state.at(8).set(sc);
		this.#state.at(9).set(seed);
		this.#state.at(10).set(seed2);
		this.#state.at(11).set(sc);
	}

	/**
	 * aka Mix
	 */
	private hash(): void {
		//Make sure block is little-endian
		asLE.i64(this.#block, 0, lBlockSizeEls);

		//s0 += data[0];    s2 ^= s10;    s11 ^= s0;    s0 = Rot64(s0,11);    s11 += s1;
		this.#state.at(0).addEq(this.#block64.at(0));
		this.#state.at(2).xorEq(this.#state.at(10));
		this.#state.at(11).xorEq(this.#state.at(0)).addEq(this.#state.at(1));
		this.#state.at(0).lRotEq(11);
		//s1 += data[1];    s3 ^= s11;    s0 ^= s1;    s1 = Rot64(s1,32);    s0 += s2;
		this.#state.at(1).addEq(this.#block64.at(1));
		this.#state.at(3).xorEq(this.#state.at(11));
		this.#state.at(0).xorEq(this.#state.at(1)).addEq(this.#state.at(2));
		this.#state.at(1).lRotEq(32);
		//s2 += data[2];    s4 ^= s0;    s1 ^= s2;    s2 = Rot64(s2,43);    s1 += s3;
		this.#state.at(2).addEq(this.#block64.at(2));
		this.#state.at(4).xorEq(this.#state.at(0));
		this.#state.at(1).xorEq(this.#state.at(2)).addEq(this.#state.at(3));
		this.#state.at(2).lRotEq(43);
		//s3 += data[3];    s5 ^= s1;    s2 ^= s3;    s3 = Rot64(s3,31);    s2 += s4;
		this.#state.at(3).addEq(this.#block64.at(3));
		this.#state.at(5).xorEq(this.#state.at(1));
		this.#state.at(2).xorEq(this.#state.at(3)).addEq(this.#state.at(4));
		this.#state.at(3).lRotEq(31);
		//s4 += data[4];    s6 ^= s2;    s3 ^= s4;    s4 = Rot64(s4,17);    s3 += s5;
		this.#state.at(4).addEq(this.#block64.at(4));
		this.#state.at(6).xorEq(this.#state.at(2));
		this.#state.at(3).xorEq(this.#state.at(4)).addEq(this.#state.at(5));
		this.#state.at(4).lRotEq(17);
		//s5 += data[5];    s7 ^= s3;    s4 ^= s5;    s5 = Rot64(s5,28);    s4 += s6;
		this.#state.at(5).addEq(this.#block64.at(5));
		this.#state.at(7).xorEq(this.#state.at(3));
		this.#state.at(4).xorEq(this.#state.at(5)).addEq(this.#state.at(6));
		this.#state.at(5).lRotEq(28);
		//s6 += data[6];    s8 ^= s4;    s5 ^= s6;    s6 = Rot64(s6,39);    s5 += s7;
		this.#state.at(6).addEq(this.#block64.at(6));
		this.#state.at(8).xorEq(this.#state.at(4));
		this.#state.at(5).xorEq(this.#state.at(6)).addEq(this.#state.at(7));
		this.#state.at(6).lRotEq(39);
		//s7 += data[7];    s9 ^= s5;    s6 ^= s7;    s7 = Rot64(s7,57);    s6 += s8;
		this.#state.at(7).addEq(this.#block64.at(7));
		this.#state.at(9).xorEq(this.#state.at(5));
		this.#state.at(6).xorEq(this.#state.at(7)).addEq(this.#state.at(8));
		this.#state.at(7).lRotEq(57);
		//s8 += data[8];    s10 ^= s6;    s7 ^= s8;    s8 = Rot64(s8,55);    s7 += s9;
		this.#state.at(8).addEq(this.#block64.at(8));
		this.#state.at(10).xorEq(this.#state.at(6));
		this.#state.at(7).xorEq(this.#state.at(8)).addEq(this.#state.at(9));
		this.#state.at(8).lRotEq(55);
		//s9 += data[9];    s11 ^= s7;    s8 ^= s9;    s9 = Rot64(s9,54);    s8 += s10;
		this.#state.at(9).addEq(this.#block64.at(9));
		this.#state.at(11).xorEq(this.#state.at(7));
		this.#state.at(8).xorEq(this.#state.at(9)).addEq(this.#state.at(10));
		this.#state.at(9).lRotEq(54);
		//s10 += data[10];    s0 ^= s8;    s9 ^= s10;    s10 = Rot64(s10,22);    s9 += s11;
		this.#state.at(10).addEq(this.#block64.at(10));
		this.#state.at(0).xorEq(this.#state.at(8));
		this.#state.at(9).xorEq(this.#state.at(10)).addEq(this.#state.at(11));
		this.#state.at(10).lRotEq(22);
		//s11 += data[11];    s1 ^= s9;    s10 ^= s11;    s11 = Rot64(s11,46);    s10 += s0;
		this.#state.at(11).addEq(this.#block64.at(11));
		this.#state.at(1).xorEq(this.#state.at(9));
		this.#state.at(10).xorEq(this.#state.at(11)).addEq(this.#state.at(0));
		this.#state.at(11).lRotEq(46);

		this.#bPos = 0;
	}
	private finalPartial(): void {
		// h11+= h1;    h2 ^= h11;   h1 = Rot64(h1,44);
		this.#state.at(11).addEq(this.#state.at(1));
		this.#state.at(2).xorEq(this.#state.at(11));
		this.#state.at(1).lRotEq(44);
		// h0 += h2;    h3 ^= h0;    h2 = Rot64(h2,15);
		this.#state.at(0).addEq(this.#state.at(2));
		this.#state.at(3).xorEq(this.#state.at(0));
		this.#state.at(2).lRotEq(15);
		// h1 += h3;    h4 ^= h1;    h3 = Rot64(h3,34);
		this.#state.at(1).addEq(this.#state.at(3));
		this.#state.at(4).xorEq(this.#state.at(1));
		this.#state.at(3).lRotEq(34);
		// h2 += h4;    h5 ^= h2;    h4 = Rot64(h4,21);
		this.#state.at(2).addEq(this.#state.at(4));
		this.#state.at(5).xorEq(this.#state.at(2));
		this.#state.at(4).lRotEq(21);
		// h3 += h5;    h6 ^= h3;    h5 = Rot64(h5,38);
		this.#state.at(3).addEq(this.#state.at(5));
		this.#state.at(6).xorEq(this.#state.at(3));
		this.#state.at(5).lRotEq(38);
		// h4 += h6;    h7 ^= h4;    h6 = Rot64(h6,33);
		this.#state.at(4).addEq(this.#state.at(6));
		this.#state.at(7).xorEq(this.#state.at(4));
		this.#state.at(6).lRotEq(33);
		// h5 += h7;    h8 ^= h5;    h7 = Rot64(h7,10);
		this.#state.at(5).addEq(this.#state.at(7));
		this.#state.at(8).xorEq(this.#state.at(5));
		this.#state.at(7).lRotEq(10);
		// h6 += h8;    h9 ^= h6;    h8 = Rot64(h8,13);
		this.#state.at(6).addEq(this.#state.at(8));
		this.#state.at(9).xorEq(this.#state.at(6));
		this.#state.at(8).lRotEq(13);
		// h7 += h9;    h10^= h7;    h9 = Rot64(h9,38);
		this.#state.at(7).addEq(this.#state.at(9));
		this.#state.at(10).xorEq(this.#state.at(7));
		this.#state.at(9).lRotEq(38);
		// h8 += h10;   h11^= h8;    h10= Rot64(h10,53);
		this.#state.at(8).addEq(this.#state.at(10));
		this.#state.at(11).xorEq(this.#state.at(8));
		this.#state.at(10).lRotEq(53);
		// h9 += h11;   h0 ^= h9;    h11= Rot64(h11,42);
		this.#state.at(9).addEq(this.#state.at(11));
		this.#state.at(0).xorEq(this.#state.at(9));
		this.#state.at(11).lRotEq(42);
		// h10+= h0;    h1 ^= h10;   h0 = Rot64(h0,54);
		this.#state.at(10).addEq(this.#state.at(0));
		this.#state.at(1).xorEq(this.#state.at(10));
		this.#state.at(0).lRotEq(54);
	}
	private final(): void {
		//Make sure block is little-endian
		asLE.i64(this.#block, 0, lBlockSizeEls);

		//Add in data
		this.#state.at(0).addEq(this.#block64.at(0));
		this.#state.at(1).addEq(this.#block64.at(1));
		this.#state.at(2).addEq(this.#block64.at(2));
		this.#state.at(3).addEq(this.#block64.at(3));
		this.#state.at(4).addEq(this.#block64.at(4));
		this.#state.at(5).addEq(this.#block64.at(5));
		this.#state.at(6).addEq(this.#block64.at(6));
		this.#state.at(7).addEq(this.#block64.at(7));
		this.#state.at(8).addEq(this.#block64.at(8));
		this.#state.at(9).addEq(this.#block64.at(9));
		this.#state.at(10).addEq(this.#block64.at(10));
		this.#state.at(11).addEq(this.#block64.at(11));

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
		let space = lBlockSizeBytes - this.#bPos;
		while (nToWrite > 0) {
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				this.#block.set(data.subarray(dPos), this.#bPos);
				//Update pos
				this.#bPos += nToWrite;
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + space), this.#bPos);
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = lBlockSizeBytes;
		}
	}

	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 */
	sumIn(): Uint8Array {
		this.#block.fill(0, this.#bPos);
		this.#block[lBlockSizeBytes - 1] = this._ingestBytes % lBlockSizeBytes;
		this.final();
		const ret = this.#state.toBytesBE().slice(0, 16);
		return ret;
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this.#state.at(0).set(this._seed);
		this.#state.at(1).set(this._seed2);
		this.#state.at(2).set(sc);
		this.#state.at(3).set(this._seed);
		this.#state.at(4).set(this._seed2);
		this.#state.at(5).set(sc);
		this.#state.at(6).set(this._seed);
		this.#state.at(7).set(this._seed2);
		this.#state.at(8).set(sc);
		this.#state.at(9).set(this._seed);
		this.#state.at(10).set(this._seed2);
		this.#state.at(11).set(sc);

		this._ingestBytes = 0;
		this.#bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new SpookyLong(this._seed, this._seed2);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): SpookyLong {
		const ret = new SpookyLong(this._seed, this._seed2);
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret._ingestBytes = this._ingestBytes;
		ret.#bPos = this.#bPos;
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
export class Spooky implements IHash {
	private _seed: U64;
	private _seed2: U64;
	private _s: SpookyShort;
	private _l: SpookyLong;
	private _useLong = false;
	/**
	 * Digest size in bytes
	 */
	readonly size = digestSize;
	/**
	 * Block size in bytes
	 * NOTE: This isn't consistent, better to use SpookyShort, SpookyLong
	 */
	get blockSize(): number {
		return this._useLong ? this._l.blockSize : this._s.blockSize;
	}

	constructor(seed = U64.zero, seed2 = U64.zero) {
		this._seed = seed;
		this._seed2 = seed2;
		this._s = new SpookyShort(seed, seed2);
		this._l = new SpookyLong(seed, seed2);
	}

	write(data: Uint8Array): void {
		if (this._useLong) return this._l.write(data);
		if (data.length + this._s.ingestBytes > sToL) {
			this._useLong = true;
			return this._l.write(data);
		}
		//Unfortunately we have to double write data in case another write pushes length over sToL
		this._s.write(data);
		this._l.write(data);
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum(): Uint8Array {
		return this._useLong ? this._l.sum() : this._s.sum();
	}

	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 */
	sumIn(): Uint8Array {
		return this._useLong ? this._l.sumIn() : this._s.sumIn();
	}

	/**
	 * Set hash state. Any past writes will be forgotten, both short and
	 * long will be available until length exceeds 192
	 */
	reset(): void {
		this._useLong = false;
		this._s.reset();
		this._l.reset();
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Spooky(this._seed, this._seed2);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 */
	clone(): Spooky {
		const ret = new Spooky();
		ret._s = this._s.clone();
		ret._l = this._l.clone();
		ret._useLong = this._useLong;
		return ret;
	}
}
