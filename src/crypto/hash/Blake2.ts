/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import * as littleEndian from '../../endian/little.js';
import { Uint64, Uint64ish } from '../../primitive/Uint64.js';
import type { IHash } from '../interfaces/IHash.js';
import { U32 } from '../../primitive/number/U32.js';
import { U64 } from '../../primitive/number/U64.js';
import { somewhatSafe } from '../../safe/index.js';
import { LengthError } from '../../error/LengthError.js';

// [The BLAKE2 Cryptographic Hash and Message Authentication Code (MAC)](https://datatracker.ietf.org/doc/html/rfc7693) (2015)
// [BLAKE2 — fast secure hashing](https://www.blake2.net/)
// [Wikipedia: Blake2](https://en.wikipedia.org/wiki/BLAKE_(hash_function)#BLAKE2)

const maxDigestEls = 8;
const blockSizeEls = 16;
const paramSize32 = 32;
const paramSize64 = 64;
const saltSize32 = 8;
const saltSize64 = 16;
const sRounds = 10;
const bRounds = 12;

//Same as Sha2-512
const iv = [
	//(first 64 bits of the fractional parts of the square roots of the first 8 primes 2,3,5,7,11,13,17,19):
	//These are 64bit numbers.. split into 2*32bit pieces.. there's 4 a line *2 lines=8 numbers
	0x6a09e667,
	0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a,
	0x5f1d36f1 /*..*/, 0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab,
	0xfb41bd6b, 0x5be0cd19, 0x137e2179 /*..*/,
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
const rRot1_32 = 16;
const rRot2_32 = 12;
const rRot3_32 = 8;
const rRot4_32 = 7;
const rRot1_64 = 32;
const rRot2_64 = 24;
const rRot3_64 = 16;
const rRot4_64 = 63;

class Blake2_32bit implements IHash {
	readonly #key: Uint8Array;
	readonly #params: Uint8Array;
	/**
	 * Digest size in bytes
	 * aka digestLength
	 */
	get size(): number {
		return this.#params[0];
	}
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSizeEls << 2;
	/**
	 * Runtime state of the hash
	 */
	readonly #state = new Uint32Array(maxDigestEls);
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSizeEls << 2);
	/**
	 * Number of bytes added to the hash (this is just the low count)
	 */
	private _ingestBytes = Uint64.zero;
	/**
	 * Position of data written to block
	 */
	private _bPos = 0;

	constructor(key: Uint8Array, params: Uint8Array) {
		somewhatSafe.int.inRangeInc('key.length', key.length, 0, 32);
		this.#key = key;
		this.#params = params;
		this.reset();
	}

	get keyLen(): number {
		return this.#params[1];
	}

	get fanOut(): number {
		return this.#params[2];
	}

	get maxDepth(): number {
		return this.#params[3];
	}

	get leafLen(): number {
		return U32.iFromBytesLE(this.#params, 4);
	}

	get nodeOffset(): U64 {
		const bytes = new Uint8Array(8);
		bytes.set(this.#params.subarray(8, 14));
		return U64.fromBytesLE(bytes);
	}

	get nodeDepth(): number {
		return this.#params[14];
	}

	get innerLen(): number {
		return this.#params[15];
	}

	get salt(): Uint8Array {
		return this.#params.subarray(16, 24);
	}

	get personalization(): Uint8Array {
		return this.#params.subarray(24);
	}

	private mix(
		i: number,
		b: number,
		c: number,
		d: number,
		v: Uint32Array,
		sigma: number[]
	): void {
		//Also referred to as "g" in docs
		const a = i & 3, //%4
			i2 = i << 1,
			j = sigma[i2],
			k = sigma[i2 + 1],
			mj = U32.iFromBytesLE(this.#block, j * 4), //m[j]
			mk = U32.iFromBytesLE(this.#block, k * 4); //m[k]

		//Step 1
		v[a] += v[b] + mj; //a ← a + b + m[j]
		v[d] = U32.ror(v[d] ^ v[a], rRot1_32); //d ← (d ⊕ a) >>> 32
		//Step 2
		v[c] += v[d]; //c ← c + d
		v[b] = U32.ror(v[b] ^ v[c], rRot2_32); //b ← (b ⊕ c) >>> 12
		//Step 3
		v[a] += v[b] + mk; //a ← a + b + m[k]
		v[d] = U32.ror(v[d] ^ v[a], rRot3_32); //d ← (d ⊕ a) >>> 8
		//Step 4
		v[c] += v[d]; //c ← c + d
		v[b] = U32.ror(v[b] ^ v[c], rRot4_32); //b ← (b ⊕ c) >>> 7
	}

	/**
	 * aka compress
	 * @param last
	 */
	// h = #state, countLow=#ingestBytes (note it's bytes in Blake2)
	private hash(last = false): void {
		const v = new Uint32Array(blockSizeEls);
		v.set(this.#state);
		//v[0..7] = this.#state[0..7];

		v[8] = iv[0];
		v[9] = iv[2];
		v[10] = iv[4];
		v[11] = iv[6];
		//note it's bytes in Blake2
		v[12] = iv[8] ^ this._ingestBytes.lowU32;
		//No need to xor v13, countHigh is always 0 for now
		v[13] = iv[10] ^ this._ingestBytes.highU32;
		v[14] = iv[12];
		v[15] = iv[14];

		if (last) {
			v[14] = ~v[14];
		}
		// console.log(`v=${hex.fromU64s(v,' ')}`);

		for (let r = 0; r < sRounds; r++) {
			const sigma = sigmas[r % 10];
			//column
			this.mix(0, 4, 8, 12, v, sigma);
			this.mix(1, 5, 9, 13, v, sigma);
			this.mix(2, 6, 10, 14, v, sigma);
			this.mix(3, 7, 11, 15, v, sigma);

			//diagonal
			this.mix(4, 5, 10, 15, v, sigma);
			this.mix(5, 6, 11, 12, v, sigma);
			this.mix(6, 7, 8, 13, v, sigma);
			this.mix(7, 4, 9, 14, v, sigma);
			// console.log(`v${r+1}=${hex.fromU64s(v,' ')}`);
		}

		this.#state[0] ^= v[0] ^ v[8];
		this.#state[1] ^= v[1] ^ v[9];
		this.#state[2] ^= v[2] ^ v[10];
		this.#state[3] ^= v[3] ^ v[11];
		this.#state[4] ^= v[4] ^ v[12];
		this.#state[5] ^= v[5] ^ v[13];
		this.#state[6] ^= v[6] ^ v[14];
		this.#state[7] ^= v[7] ^ v[15];
		//console.log(`st=${hex.fromU64s(this.#state,' ')}`);

		//Reset block pointer
		this._bPos = 0;
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		let nToWrite = data.length;
		let dPos = 0;
		let space = this.blockSize - this._bPos;
		while (nToWrite > 0) {
			//Note this is >, so if there's exactly space this won't trigger
			// (ie bPos will always be some distance away from max allowing at least 1 byte write)
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				const subData = data.subarray(dPos);
				this.#block.set(subData, this._bPos);
				//Update pos
				this._bPos += nToWrite;
				//Update count
				this._ingestBytes = this._ingestBytes.add(
					Uint64.fromNumber(subData.length)
				);
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + this.blockSize), this._bPos);
			this._ingestBytes = this._ingestBytes.add(
				Uint64.fromNumber(this.blockSize)
			);
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
		//Zero the rest of the block
		this.#block.fill(0, this._bPos);
		this.hash(true);
		const ret = new Uint8Array(this.size);
		littleEndian.u32ArrIntoBytesSafe(this.#state, ret);
		return ret;
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		//Setup state
		this.#state[0] = iv[0] ^ U32.iFromBytesLE(this.#params, 0);
		this.#state[1] = iv[2] ^ U32.iFromBytesLE(this.#params, 4);
		this.#state[2] = iv[4] ^ U32.iFromBytesLE(this.#params, 8);
		this.#state[3] = iv[6] ^ U32.iFromBytesLE(this.#params, 12);
		this.#state[4] = iv[8] ^ U32.iFromBytesLE(this.#params, 16);
		this.#state[5] = iv[10] ^ U32.iFromBytesLE(this.#params, 20);
		this.#state[6] = iv[12] ^ U32.iFromBytesLE(this.#params, 24);
		this.#state[7] = iv[14] ^ U32.iFromBytesLE(this.#params, 28);

		//Reset ingest count
		this._ingestBytes = Uint64.zero;
		//Reset block (which is just pointing to the start)
		this._bPos = 0;

		//If a key was provided, start writing to the block
		if (this.#key.length > 0) this.write(this.#key);
		//console.log('B');
		//console.log(`${hex.fromU64s(this.#state,' ')}`);
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Blake2_32bit(this.#key, this.#params);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): IHash {
		const ret = new Blake2_32bit(this.#key, this.#params);
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}
}

class Blake2_64bit implements IHash {
	readonly #key: Uint8Array;
	readonly #params: Uint8Array;
	/**
	 * Digest size in bytes
	 * aka digestLength
	 */
	get size(): number {
		return this.#params[0];
	}
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSizeEls << 3;
	/**
	 * Runtime state of the hash
	 */
	readonly #state = new Array<Uint64>(maxDigestEls);
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSizeEls << 3);
	/**
	 * Number of bytes added to the hash (this is just the low count)
	 */
	private _ingestBytes = Uint64.zero;
	//_ingestBytesHigh=Uint64.zero;//13
	/**
	 * Position of data written to block
	 */
	private _bPos = 0;

	constructor(key: Uint8Array, params: Uint8Array) {
		somewhatSafe.int.inRangeInc('key.length', key.length, 0, 64);
		this.#key = key;
		this.#params = params;
		this.reset();
	}

	get keyLen(): number {
		return this.#params[1];
	}

	get fanOut(): number {
		return this.#params[2];
	}

	get maxDepth(): number {
		return this.#params[3];
	}

	get leafLen(): number {
		return U32.iFromBytesLE(this.#params, 4);
	}

	get nodeOffset(): U64 {
		const bytes = new Uint8Array(this.#params.subarray(8, 16));
		return U64.fromBytesLE(bytes);
	}

	get nodeDepth(): number {
		return this.#params[16];
	}

	get innerLen(): number {
		return this.#params[17];
	}

	get salt(): Uint8Array {
		return this.#params.subarray(32, 48);
	}

	get personalization(): Uint8Array {
		return this.#params.subarray(48);
	}

	private mix(
		i: number,
		b: number,
		c: number,
		d: number,
		v: Uint64[],
		sigma: number[]
	): void {
		//Also referred to as "g" in docs
		const a = i & 3, //%4
			i2 = i << 1,
			j = sigma[i2],
			k = sigma[i2 + 1],
			mj = littleEndian.u64FromBytes(this.#block, j * 8), //m[j]
			mk = littleEndian.u64FromBytes(this.#block, k * 8); //m[k]
		// console.log(`mj=${hex.fromBytes(mj.toBytes())}`);
		// console.log(`mk=${hex.fromBytes(mk.toBytes())}`);

		//Step 1
		v[a] = v[a].add(v[b]).add(mj); //a ← a + b + m[j]
		v[d] = v[d].xor(v[a]).rRot(rRot1_64); //d ← (d ⊕ a) >>> 32
		//Step 2
		v[c] = v[c].add(v[d]); //c ← c + d
		v[b] = v[b].xor(v[c]).rRot(rRot2_64); //b ← (b ⊕ c) >>> 24
		//Step 3
		v[a] = v[a].add(v[b]).add(mk); //a ← a + b + m[k]
		v[d] = v[d].xor(v[a]).rRot(rRot3_64); //d ← (d ⊕ a) >>> 16
		//Step 4
		v[c] = v[c].add(v[d]); //c ← c + d
		v[b] = v[b].xor(v[c]).rRot(rRot4_64); //b ← (b ⊕ c) >>> 63
	}

	/**
	 * aka compress
	 * @param last
	 */
	// h = #state, countLow=#ingestBytes (note it's bytes in Blake2)
	private hash(last = false): void {
		const v = new Array<Uint64>(16);
		v[0] = this.#state[0];
		v[1] = this.#state[1];
		v[2] = this.#state[2];
		v[3] = this.#state[3];
		v[4] = this.#state[4];
		v[5] = this.#state[5];
		v[6] = this.#state[6];
		v[7] = this.#state[7];

		v[8] = new Uint64(iv[1], iv[0]);
		v[9] = new Uint64(iv[3], iv[2]);
		v[10] = new Uint64(iv[5], iv[4]);
		v[11] = new Uint64(iv[7], iv[6]);
		//note it's bytes in Blake2
		v[12] = new Uint64(iv[9], iv[8]).xor(this._ingestBytes);
		//No need to xor v13, countHigh is always 0 for now
		v[13] = new Uint64(iv[11], iv[10]);
		v[14] = new Uint64(iv[13], iv[12]);
		v[15] = new Uint64(iv[15], iv[14]);

		if (last) {
			v[14] = v[14].not();
		}
		// console.log(`v=${hex.fromU64s(v,' ')}`);

		for (let r = 0; r < bRounds; r++) {
			const sigma = sigmas[r % 10];
			//column
			this.mix(0, 4, 8, 12, v, sigma);
			this.mix(1, 5, 9, 13, v, sigma);
			this.mix(2, 6, 10, 14, v, sigma);
			this.mix(3, 7, 11, 15, v, sigma);

			//diagonal
			this.mix(4, 5, 10, 15, v, sigma);
			this.mix(5, 6, 11, 12, v, sigma);
			this.mix(6, 7, 8, 13, v, sigma);
			this.mix(7, 4, 9, 14, v, sigma);
			// console.log(`v${r+1}=${hex.fromU64s(v,' ')}`);
		}

		this.#state[0] = this.#state[0].xor(v[0]).xor(v[8]);
		this.#state[1] = this.#state[1].xor(v[1]).xor(v[9]);
		this.#state[2] = this.#state[2].xor(v[2]).xor(v[10]);
		this.#state[3] = this.#state[3].xor(v[3]).xor(v[11]);
		this.#state[4] = this.#state[4].xor(v[4]).xor(v[12]);
		this.#state[5] = this.#state[5].xor(v[5]).xor(v[13]);
		this.#state[6] = this.#state[6].xor(v[6]).xor(v[14]);
		this.#state[7] = this.#state[7].xor(v[7]).xor(v[15]);
		//console.log(`st=${hex.fromU64s(this.#state,' ')}`);

		//Reset block pointer
		this._bPos = 0;
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		let nToWrite = data.length;
		let dPos = 0;
		let space = this.blockSize - this._bPos;
		while (nToWrite > 0) {
			//Note this is >, so if there's exactly space this won't trigger
			// (ie bPos will always be some distance away from max allowing at least 1 byte write)
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				const subData = data.subarray(dPos);
				this.#block.set(subData, this._bPos);
				//Update pos
				this._bPos += nToWrite;
				//Update count
				this._ingestBytes = this._ingestBytes.add(
					Uint64.fromNumber(subData.length)
				);
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + this.blockSize), this._bPos);
			this._ingestBytes = this._ingestBytes.add(
				Uint64.fromNumber(this.blockSize)
			);
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
	 */
	sumIn(): Uint8Array {
		//Zero the rest of the block
		this.#block.fill(0, this._bPos);
		this.hash(true);
		const ret = new Uint8Array(this.size);
		littleEndian.u64ArrIntoBytesSafe(this.#state, ret);
		return ret;
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		//Setup state
		this.#state[0] = new Uint64(
			(iv[1] ^ U32.iFromBytesLE(this.#params, 0)) >>> 0,
			(iv[0] ^ U32.iFromBytesLE(this.#params, 4)) >>> 0
		);
		this.#state[1] = new Uint64(
			(iv[3] ^ U32.iFromBytesLE(this.#params, 8)) >>> 0,
			(iv[2] ^ U32.iFromBytesLE(this.#params, 12)) >>> 0
		);
		this.#state[2] = new Uint64(
			(iv[5] ^ U32.iFromBytesLE(this.#params, 16)) >>> 0,
			(iv[4] ^ U32.iFromBytesLE(this.#params, 20)) >>> 0
		);
		this.#state[3] = new Uint64(
			(iv[7] ^ U32.iFromBytesLE(this.#params, 24)) >>> 0,
			(iv[6] ^ U32.iFromBytesLE(this.#params, 28)) >>> 0
		);
		this.#state[4] = new Uint64(
			(iv[9] ^ U32.iFromBytesLE(this.#params, 32)) >>> 0,
			(iv[8] ^ U32.iFromBytesLE(this.#params, 36)) >>> 0
		);
		this.#state[5] = new Uint64(
			(iv[11] ^ U32.iFromBytesLE(this.#params, 40)) >>> 0,
			(iv[10] ^ U32.iFromBytesLE(this.#params, 44)) >>> 0
		);
		this.#state[6] = new Uint64(
			(iv[13] ^ U32.iFromBytesLE(this.#params, 48)) >>> 0,
			(iv[12] ^ U32.iFromBytesLE(this.#params, 52)) >>> 0
		);
		this.#state[7] = new Uint64(
			(iv[15] ^ U32.iFromBytesLE(this.#params, 56)) >>> 0,
			(iv[14] ^ U32.iFromBytesLE(this.#params, 60)) >>> 0
		);

		//Reset ingest count
		this._ingestBytes = Uint64.zero;
		//Reset block (which is just pointing to the start)
		this._bPos = 0;

		//If a key was provided, start writing to the block
		if (this.#key.length > 0) this.write(this.#key);
		//console.log('B');
		//console.log(`${hex.fromU64s(this.#state,' ')}`);
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Blake2_64bit(this.#key, this.#params);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): IHash {
		const ret = new Blake2_64bit(this.#key, this.#params);
		for (let i = 0; i < this.#state.length; i++) ret.#state[i] = this.#state[i];
		ret.#block.set(this.#block);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}
}

export class Blake2s extends Blake2_32bit {
	constructor(
		digestSize: number,
		fanOut: number,
		maxDepth: number,
		leafMaxLen: number,
		nodeOffset: Uint64ish,
		nodeDepth: number,
		innerHashLen: number,
		key?: Uint8Array,
		/** 8 bytes or empty, defaults to all zeros */
		salt?: Uint8Array,
		/** 8 bytes or empty, defaults to all zeros */
		personalization?: Uint8Array
	) {
		key = key ?? new Uint8Array(0);
		const p = new Uint8Array(paramSize32);
		somewhatSafe.int.inRangeInc('digestSize', digestSize, 1, 32);
		somewhatSafe.int.inRangeInc('fanOut', fanOut, 0, 255);
		p[0] = digestSize;
		p[1] = key.length;
		p[2] = fanOut;
		p[3] = maxDepth;
		p.set(U32.toBytesLE(leafMaxLen), 4);
		littleEndian.u64IntoBytesUnsafe(Uint64.coerce(nodeOffset), p, 8);
		p[14] = nodeDepth;
		p[15] = innerHashLen;
		//Either no salt, or salt must be 16 bytes
		if (!salt || salt.length == 0) {
			//nop
		} else if (salt.length != saltSize32) {
			somewhatSafe.len.exactly('salt', salt, saltSize32);
		} else {
			p.set(salt, 16);
		}
		//Either no personalize or it must be 16 bytes
		if (!personalization || personalization.length == 0) {
			//nop
		} else if (personalization.length != saltSize32) {
			somewhatSafe.len.exactly('personalization', personalization, saltSize32);
		} else {
			p.set(personalization, 24);
		}
		super(key, p);
	}
	static Sequential(
		digestSizeBytes: number,
		key?: Uint8Array,
		salt?: Uint8Array,
		personalization?: Uint8Array
	): Blake2s {
		return new Blake2s(
			digestSizeBytes,
			1,
			1,
			0,
			0,
			0,
			0,
			key,
			salt,
			personalization
		);
	}
}

export class Blake2b extends Blake2_64bit {
	constructor(
		digestSize: number,
		fanOut: number,
		maxDepth: number,
		leafMaxLen: number,
		nodeOffset: Uint64ish,
		nodeDepth: number,
		innerHashLen: number,
		key?: Uint8Array,
		/** 16 bytes or empty, defaults to all zeros */
		salt?: Uint8Array,
		/** 16 bytes or empty, defaults to all zeros */
		personalization?: Uint8Array
	) {
		key = key ?? new Uint8Array(0);
		const p = new Uint8Array(paramSize64);
		somewhatSafe.int.inRangeInc('digestSize', digestSize, 1, 64);
		somewhatSafe.int.inRangeInc('fanOut', fanOut, 0, 255);
		p[0] = digestSize;
		p[1] = key.length;
		p[2] = fanOut;
		p[3] = maxDepth;
		p.set(U32.toBytesLE(leafMaxLen), 4);
		littleEndian.u64IntoBytesUnsafe(Uint64.coerce(nodeOffset), p, 8);
		p[16] = nodeDepth;
		p[17] = innerHashLen;
		//Either no salt, or salt must be 16 bytes
		if (!salt || salt.length == 0) {
			//nop
		} else if (salt.length != saltSize64) {
			throw new LengthError(saltSize64, 'salt', salt.length);
		} else {
			p.set(salt, 32);
		}
		//Either no personalize or it must be 16 bytes
		if (!personalization || personalization.length == 0) {
			//nop
		} else if (personalization.length != saltSize64) {
			throw new LengthError(
				saltSize64,
				'personalization',
				personalization.length
			);
		} else {
			p.set(personalization, 48);
		}
		super(key, p);
	}
	static Sequential(
		digestSizeBytes: number,
		key?: Uint8Array,
		salt?: Uint8Array,
		personalization?: Uint8Array
	): Blake2b {
		return new Blake2b(
			digestSizeBytes,
			1,
			1,
			0,
			0,
			0,
			0,
			key,
			salt,
			personalization
		);
	}
}

export class Blake2s_224 extends Blake2s {
	/**
	 * Build a new Blake2s-224 hash generator
	 * @param key Optional key (0-32 bytes)
	 * @param salt Optional salt (8 bytes if supplied)
	 * @param personalization Optional personalization (8 bytes if supplied)
	 */
	constructor(
		key?: Uint8Array,
		salt?: Uint8Array,
		personalization?: Uint8Array
	) {
		super(28, 1, 1, 0, 0, 0, 0, key, salt, personalization);
	}
}

export class Blake2s_256 extends Blake2s {
	/**
	 * Build a new Blake2s-256 hash generator
	 * @param key Optional key (0-32 bytes)
	 * @param salt Optional salt (8 bytes if supplied)
	 * @param personalization Optional personalization (8 bytes if supplied)
	 */
	constructor(
		key?: Uint8Array,
		salt?: Uint8Array,
		personalization?: Uint8Array
	) {
		super(32, 1, 1, 0, 0, 0, 0, key, salt, personalization);
	}
}

export class Blake2b_256 extends Blake2b {
	/**
	 * Build a new Blake2b-256 hash generator
	 * @param key Optional key (0-64 bytes)
	 * @param salt Optional salt (16 bytes if supplied)
	 * @param personalization Optional personalization (16 bytes if supplied)
	 */
	constructor(
		key?: Uint8Array,
		salt?: Uint8Array,
		personalization?: Uint8Array
	) {
		super(32, 1, 1, 0, 0, 0, 0, key, salt, personalization);
	}
}

export class Blake2b_384 extends Blake2b {
	/**
	 * Build a new Blake2b-384 hash generator
	 * @param key Optional key (0-64 bytes)
	 * @param salt Optional salt (16 bytes if supplied)
	 * @param personalization Optional personalization (16 bytes if supplied)
	 */
	constructor(
		key?: Uint8Array,
		salt?: Uint8Array,
		personalization?: Uint8Array
	) {
		super(48, 1, 1, 0, 0, 0, 0, key, salt, personalization);
	}
}

export class Blake2b_512 extends Blake2b {
	/**
	 * Build a new Blake2b-512 hash generator
	 * @param key Optional key (0-64 bytes)
	 * @param salt Optional salt (16 bytes if supplied)
	 * @param personalization Optional personalization (16 bytes if supplied)
	 */
	constructor(
		key?: Uint8Array,
		salt?: Uint8Array,
		personalization?: Uint8Array
	) {
		super(64, 1, 1, 0, 0, 0, 0, key, salt, personalization);
	}
}
