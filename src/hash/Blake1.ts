/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { asBE } from '../endian/platform.js';
import { safety } from '../primitive/Safety.js';
import { U32 } from '../primitive/U32.js';
import { U64Mut, U64MutArray } from '../primitive/U64.js';

import type { IHash } from './IHash.js';

//[Wikipedia: Blake1](https://en.wikipedia.org/wiki/BLAKE_(hash_function))
//[SHA-3 proposal BLAKE](https://ehash.iaik.tugraz.at/uploads/0/06/Blake.pdf) (2008)

const digestSizeEls = 8;
const blockSizeEls = 16; //4x4
const b32rounds = 10; //Blake32 was submitted with 10 rounds, then increased to 14 and renamed blake256
const b256rounds = 14;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const b64rounds = 14; //Blake64 was submitted with 14 rounds, then increased to 16 and renamed blake512
const b512rounds = 16;
const spaceForLen32 = 8; //Number of bytes needed to append length
const spaceForLen64 = 16; //Number of bytes needed to append length
//Same as Sha2-512
const iv = [
	//(first 64 bits of the fractional parts of the square roots of the first 8 primes 2,3,5,7,11,13,17,19):
	//These are 64bit numbers.. split into 2*32bit pieces.. there's 4 a line *2 lines=8 numbers
	0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 
	0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1, 
	0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 
	0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
];
const n = [
	//256
	0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344, 
	0xa4093822, 0x299f31d0,	0x082efa98, 0xec4e6c89, 
	0x452821e6, 0x38d01377, 0xbe5466cf, 0x34e90c6c,
	0xc0ac29b7, 0xc97c50dd, 0x3f84d5b5, 0xb5470917,
	//512
	0x9216d5d9, 0x8979fb1b, 0xd1310ba6, 0x98dfb5ac, 
	0x2ffd72db, 0xd01adfb7,	0xb8e1afed, 0x6a267e96, 
	0xba7c9045, 0xf12c7f99, 0x24a19947, 0xb3916cf7,
	0x0801f2e2, 0x858efc16, 0x636920d8, 0x71574e69,
];
const sigmas = [
	[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
	[14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
	[11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
	[7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
	[9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
	[2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
	[12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
	[13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
	[6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
	[10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
];

class Blake1_32bit implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size = digestSizeEls << 2;
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSizeEls << 2;
	/**
	 * Number of rounds (10 for BLake32, 14 for Blake256)
	 */
	readonly #nr: number;
	/**
	 * Salt, must be exactly 4 u32 (16 bytes)
	 */
	readonly #salt: Uint32Array;
	/**
	 * Runtime state of the hash
	 */
	readonly #state = new Uint32Array(digestSizeEls);
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSizeEls << 2);
	readonly #block32 = new Uint32Array(this.#block.buffer);
	/**
	 * Number of bytes added to the hash
	 */
	#ingestBytes = 0;
	/**
	 * Position of data written to block
	 */
	#bPos = 0;

	/**
	 * Build a new 32bit blake1 hash generator
	 */
	constructor(salt?: Uint32Array, roundCount = 10) {
		if (!salt || salt.length === 0) {
			this.#salt = new Uint32Array(4);
		} else {
			safety.lenExactly(salt, 4, 'salt');
			this.#salt = salt;
		}
		this.#nr = roundCount;
		this.reset();
	}

	private g(
		i: number,
		b: number,
		c: number,
		d: number,
		v: Uint32Array,
		sigma: number[]
	): void {
		const a = i & 3, //% 4
			i2 = i << 1,
			j = sigma[i2],
			k = sigma[i2 + 1],
			nj = n[j],
			nk = n[k],
			mj = this.#block32[j],
			mk = this.#block32[k];

		//Step 1
		v[a] += v[b] + (mj ^ nk); //a ← a + b + (m[j] ⊕ n[k])
		v[d] = U32.ror(v[d] ^ v[a], 16); //d ← (d ⊕ a) >>> 16
		//Step 2
		v[c] += v[d]; //c ← c + d
		v[b] = U32.ror(v[b] ^ v[c], 12); //b ← (b ⊕ c) >>> 12
		//Step 3
		v[a] += v[b] + (mk ^ nj); //a ← a + b + (m[k] ⊕ n[j])
		v[d] = U32.ror(v[d] ^ v[a], 8); //d ← (d ⊕ a) >>> 8
		//Step 4
		v[c] += v[d]; //c ← c + d
		v[b] = U32.ror(v[b] ^ v[c], 7); //b ← (b ⊕ c) >>> 7
	}

	/**
	 * aka Compress
	 * @param countOverride If provided (not null/undefined) use this for the count rather than this.#ingestBytes
	 */
	private hash(countOverride?: number): void {
		countOverride = countOverride ?? this.#ingestBytes;
		const count32a = countOverride << 3; //We don't need to mask since the uint32array does it for us
		const count32b = (countOverride / 0x20000000) | 0;
		const v = new Uint32Array(blockSizeEls);
		//0..7 = state
		v.set(this.#state);
		v[8] = n[0] ^ this.#salt[0];
		v[9] = n[1] ^ this.#salt[1];
		v[10] = n[2] ^ this.#salt[2];
		v[11] = n[3] ^ this.#salt[3];
		v[12] = n[4] ^ count32a;
		v[13] = n[5] ^ count32a;
		v[14] = n[6] ^ count32b;
		v[15] = n[7] ^ count32b;
		//Switch (maybe) block to big endian (may mangle storage)
		for (let i = 0; i < blockSizeEls << 2; i += 4) asBE.i32(this.#block, i);

		for (let r = 0; r < this.#nr; r++) {
			const sigma = sigmas[r % 10];
			//column
			this.g(0, 4, 8, 12, v, sigma);
			this.g(1, 5, 9, 13, v, sigma);
			this.g(2, 6, 10, 14, v, sigma);
			this.g(3, 7, 11, 15, v, sigma);

			//diagonal
			this.g(4, 5, 10, 15, v, sigma);
			this.g(5, 6, 11, 12, v, sigma);
			this.g(6, 7, 8, 13, v, sigma);
			this.g(7, 4, 9, 14, v, sigma);
		}

		this.#state[0] ^= this.#salt[0] ^ v[0] ^ v[8];
		this.#state[1] ^= this.#salt[1] ^ v[1] ^ v[9];
		this.#state[2] ^= this.#salt[2] ^ v[2] ^ v[10];
		this.#state[3] ^= this.#salt[3] ^ v[3] ^ v[11];
		this.#state[4] ^= this.#salt[0] ^ v[4] ^ v[12];
		this.#state[5] ^= this.#salt[1] ^ v[5] ^ v[13];
		this.#state[6] ^= this.#salt[2] ^ v[6] ^ v[14];
		this.#state[7] ^= this.#salt[3] ^ v[7] ^ v[15];

		//Reset block pointer
		this.#bPos = 0;
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		let nToWrite = data.length;
		let dPos = 0;
		let space = this.blockSize - this.#bPos;
		while (nToWrite > 0) {
			//Note this is >, so if there's exactly space this won't trigger
			// (ie bPos will always be some distance away from max allowing at least 1 byte write)
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				const subData = data.subarray(dPos);
				this.#block.set(subData, this.#bPos);
				//Update pos
				this.#bPos += nToWrite;
				//Update count
				this.#ingestBytes += subData.length;
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + this.blockSize), this.#bPos);
			//pointless: this.#bPos += space;
			this.#ingestBytes += this.blockSize;
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = this.blockSize;
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
	 * Use if you won't need the obj again (for performance)
	 */
	sumIn(): Uint8Array {
		//End with a 0b1 in MSB
		this.#block[this.#bPos] = 0x80;
		this.#bPos++;

		const sizeSpace = this.blockSize - spaceForLen32;
		let countOverride: number | undefined = undefined;

		//If there's not enough space, end this block
		if (this.#bPos > sizeSpace) {
			//Zero the remainder of the block
			this.#block.fill(0, this.#bPos);
			this.hash();
			countOverride = 0;
		}
		//Zero the rest of the block
		this.#block.fill(0, this.#bPos);

		//Add a 0b1 in LSB before length
		this.#block[sizeSpace - 1] |= 1;

		//Write out the data size in big-endian
		const ss32 = sizeSpace >> 2; // div 4
		//We tracked bytes, <<3 (*8) to count bits
		//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
		this.#block32[ss32] = this.#ingestBytes / 0x20000000;
		this.#block32[ss32 + 1] = this.#ingestBytes << 3;
		//Because hash will invert, we need to switch to BE to get it back to LE
		asBE.i32(this.#block, sizeSpace);
		asBE.i32(this.#block, sizeSpace + 4);
		this.hash(countOverride);

		//Project state into bytes
		const s8 = new Uint8Array(this.#state.buffer, this.#state.byteOffset);
		//Make sure the bytes are BE - this might mangle alt.#state (but we're moments from disposing)
		for (let i = 0; i < this.size; i++) asBE.i32(s8, i * 4);
		return s8.slice(0, this.size);
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		//Setup state
		this.#state[0] = iv[0];
		this.#state[1] = iv[2];
		this.#state[2] = iv[4];
		this.#state[3] = iv[6];
		this.#state[4] = iv[8];
		this.#state[5] = iv[10];
		this.#state[6] = iv[12];
		this.#state[7] = iv[14];

		//Reset ingest count
		this.#ingestBytes = 0;
		//Reset block (which is just pointing to the start)
		this.#bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Blake1_32bit(this.#salt, this.#nr);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): Blake1_32bit {
		const ret = new Blake1_32bit(this.#salt, this.#nr);
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}

// chain=#state, m=#block
class Blake1_64bit implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size = digestSizeEls << 3;
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSizeEls << 3;
	/**
	 * Number of rounds (14 for BLake64, 16 for Blake512)
	 */
	readonly #nr: number;
	/**
	 * Salt, must be exactly 4 u64 (32 bytes)
	 */
	readonly #salt: U64MutArray;
	/**
	 * Runtime state of the hash
	 */
	readonly #state = U64MutArray.fromLen(digestSizeEls);
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSizeEls << 3);
	readonly #block64 = U64MutArray.fromBytes(this.#block.buffer);
	/**
	 * Number of bytes added to the hash
	 */
	#ingestBytes = 0;
	/**
	 * Position of data written to block
	 */
	#bPos = 0;

	/**
	 * Build a new Blake-512 hash generator
	 */
	constructor(salt?: U64MutArray, roundCount = 14) {
		if (!salt) {
			this.#salt = U64MutArray.fromLen(4);
		} else {
			safety.lenExactly(salt, 4, 'salt');
			this.#salt = salt;
		}
		this.#nr = roundCount;
		this.reset();
	}

	private g(
		i: number,
		b: number,
		c: number,
		d: number,
		v: U64MutArray,
		sigma: number[]
	): void {
		const a = i & 3, //% 4
			i2 = i << 1,
			j = sigma[i2],
			k = sigma[i2 + 1],
			nj = U64Mut.fromUint32Pair(n[2 * j + 1], n[2 * j]),
			nk = U64Mut.fromUint32Pair(n[2 * k + 1], n[2 * k]),
			mj = this.#block64.at(j),
			mk = this.#block64.at(k);

		//NOTE: We can xorEq of the n vars because they're copies (while the m vars is the linked-block-state)
		//Step 1
		v.at(a).addEq(v.at(b)).addEq(nk.xorEq(mj)); //a ← a + b + (m[j] ⊕ n[k])
		v.at(d).xorEq(v.at(a)).rRotEq(32); //d ← (d ⊕ a) >>> 32
		//Step 2
		v.at(c).addEq(v.at(d)); //c ← c + d
		v.at(b).xorEq(v.at(c)).rRotEq(25); //b ← (b ⊕ c) >>> 25
		//Step 3
		v.at(a).addEq(v.at(b)).addEq(nj.xorEq(mk)); //a ← a + b + (m[k] ⊕ n[j])
		v.at(d).xorEq(v.at(a)).rRotEq(16); //d ← (d ⊕ a) >>> 16
		//Step 4
		v.at(c).addEq(v.at(d)); //c ← c + d
		v.at(b).xorEq(v.at(c)).rRotEq(11); //b ← (b ⊕ c) >>> 11
	}

	/**
	 * aka Compress
	 * @param countOverride If provided (not null/undefined) use this for the count rather than this.#ingestBytes
	 */
	private hash(countOverride?: number): void {
		countOverride = countOverride ?? this.#ingestBytes;
		const count64a = U64Mut.fromUint32Pair(
			countOverride << 3,
			countOverride / 0x20000000
		);
		//const count64b=0;//The counter can never be > a JS number (53 bits) so this will always be 0
		const v = U64MutArray.fromLen(16);
		v.set(this.#state);

		v.at(8).set(U64Mut.fromUint32Pair(n[1], n[0]).xorEq(this.#salt.at(0)));
		v.at(9).set(U64Mut.fromUint32Pair(n[3], n[2]).xorEq(this.#salt.at(1)));
		v.at(10).set(U64Mut.fromUint32Pair(n[5], n[4]).xorEq(this.#salt.at(2)));
		v.at(11).set(U64Mut.fromUint32Pair(n[7], n[6]).xorEq(this.#salt.at(3)));
		v.at(12).set(U64Mut.fromUint32Pair(n[9], n[8]).xorEq(count64a));
		v.at(13).set(U64Mut.fromUint32Pair(n[11], n[10]).xorEq(count64a));
		v.at(14).set(U64Mut.fromUint32Pair(n[13], n[12]) /*.xorEq(count64b)*/);
		v.at(15).set(U64Mut.fromUint32Pair(n[15], n[14]) /*.xorEq(count64b)*/);

		//Switch (maybe) block to big endian (may mangle storage)
		for (let i = 0; i < this.#block.length; i += 8) {
			asBE.i64(this.#block, i);
		}

		for (let r = 0; r < this.#nr; r++) {
			const sigma = sigmas[r % 10];
			//column
			this.g(0, 4, 8, 12, v, sigma);
			this.g(1, 5, 9, 13, v, sigma);
			this.g(2, 6, 10, 14, v, sigma);
			this.g(3, 7, 11, 15, v, sigma);

			//diagonal
			this.g(4, 5, 10, 15, v, sigma);
			this.g(5, 6, 11, 12, v, sigma);
			this.g(6, 7, 8, 13, v, sigma);
			this.g(7, 4, 9, 14, v, sigma);
		}

		this.#state.at(0).xorEq(this.#salt.at(0)).xorEq(v.at(0)).xorEq(v.at(8));
		this.#state.at(1).xorEq(this.#salt.at(1)).xorEq(v.at(1)).xorEq(v.at(9));
		this.#state.at(2).xorEq(this.#salt.at(2)).xorEq(v.at(2)).xorEq(v.at(10));
		this.#state.at(3).xorEq(this.#salt.at(3)).xorEq(v.at(3)).xorEq(v.at(11));
		this.#state.at(4).xorEq(this.#salt.at(0)).xorEq(v.at(4)).xorEq(v.at(12));
		this.#state.at(5).xorEq(this.#salt.at(1)).xorEq(v.at(5)).xorEq(v.at(13));
		this.#state.at(6).xorEq(this.#salt.at(2)).xorEq(v.at(6)).xorEq(v.at(14));
		this.#state.at(7).xorEq(this.#salt.at(3)).xorEq(v.at(7)).xorEq(v.at(15));

		//Reset block pointer
		this.#bPos = 0;
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		let nToWrite = data.length;
		let dPos = 0;
		let space = this.blockSize - this.#bPos;
		while (nToWrite > 0) {
			//Note this is >, so if there's exactly space this won't trigger
			// (ie bPos will always be some distance away from max allowing at least 1 byte write)
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				const subData = data.subarray(dPos);
				this.#block.set(subData, this.#bPos);
				//Update pos
				this.#bPos += nToWrite;
				//Update count
				this.#ingestBytes += subData.length;
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + this.blockSize), this.#bPos);
			//pointless: this.#bPos += space;
			this.#ingestBytes += this.blockSize;
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = this.blockSize;
		}
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum(): Uint8Array {
		return this.clone().sumIn();
	}

	sumIn(): Uint8Array {
		//End with a 0b1 in MSB
		this.#block[this.#bPos] = 0x80;
		this.#bPos++;

		const sizeSpace = this.blockSize - spaceForLen64;
		let countOverride: number | undefined = undefined;

		//If there's not enough space, end this block
		if (this.#bPos > sizeSpace) {
			//Zero the remainder of the block
			this.#block.fill(0, this.#bPos);
			this.hash();
			countOverride = 0;
		}
		//Zero the rest of the block
		this.#block.fill(0, this.#bPos);

		//Add a 0b1 in LSB before length
		this.#block[sizeSpace - 1] |= 1;

		//Write out the data size in big-endian
		// There's space for 128 bits of size (spaceForLenBytes64=16) but we can only count
		// up to 2^52 bits (JS limitation), so we only need to write n+2,n+3 values (the others are zero)
		const ss64 = sizeSpace >> 3; // div 8
		//We tracked bytes, <<3 (*8) to count bits
		//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
		this.#block64
			.at(ss64 + 1)
			.set(
				U64Mut.fromUint32Pair(
					this.#ingestBytes << 3,
					this.#ingestBytes / 0x20000000
				)
			);
		//Note hash also applies asBE to the block.  We call it twice because we want this value to be LE
		asBE.i64(this.#block, sizeSpace + 8);
		this.hash(countOverride);
		return this.#state.toBytesBE();
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		//Setup state
		this.#state.at(0).set(U64Mut.fromUint32Pair(iv[1], iv[0]));
		this.#state.at(1).set(U64Mut.fromUint32Pair(iv[3], iv[2]));
		this.#state.at(2).set(U64Mut.fromUint32Pair(iv[5], iv[4]));
		this.#state.at(3).set(U64Mut.fromUint32Pair(iv[7], iv[6]));
		this.#state.at(4).set(U64Mut.fromUint32Pair(iv[9], iv[8]));
		this.#state.at(5).set(U64Mut.fromUint32Pair(iv[11], iv[10]));
		this.#state.at(6).set(U64Mut.fromUint32Pair(iv[13], iv[12]));
		this.#state.at(7).set(U64Mut.fromUint32Pair(iv[15], iv[14]));

		//Reset ingest count
		this.#ingestBytes = 0;
		//Reset block (which is just pointing to the start)
		this.#bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Blake1_64bit(this.#salt, this.#nr);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): Blake1_64bit {
		const ret = new Blake1_64bit(this.#salt, this.#nr);
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}

export class Blake32 extends Blake1_32bit {
	/**
	 * Build a new Blake32 hash generator (retired in favour of @see Blake256)
	 * @param salt 4*Uint32 (exactly) of salt, or empty
	 */
	constructor(salt?: Uint32Array) {
		super(salt, b32rounds);
	}
}

export class Blake256 extends Blake1_32bit {
	/**
	 * Build a new Blake1-256 hash generator
	 * @param salt 4*Uint32 (exactly) of salt, or empty
	 */
	constructor(salt?: Uint32Array) {
		super(salt, b256rounds);
	}
}

export class Blake64 extends Blake1_64bit {
	/**
	 * Build a new Blake64 hash generator
	 * @param salt 4*Uint64 (exactly) of salt, or empty
	 */
	constructor(salt?: U64MutArray) {
		super(salt, b64rounds);
	}
}

export class Blake512 extends Blake1_64bit {
	/**
	 * Build a new Blake1-512 hash generator
	 * @param salt 4*Uint64 (exactly) of salt, or empty
	 */
	constructor(salt?: U64MutArray) {
		super(salt, b512rounds);
	}
}
