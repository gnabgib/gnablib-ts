/*! Copyright 2022-2024 the gnablib contributors MPL-1.1 */

import { asLE } from '../../endian/platform.js';
import { U32 } from '../../primitive/number/U32Static.js';
import type { IHash } from '../interfaces/IHash.js';

//[Wikipedia: RipeMD](https://en.wikipedia.org/wiki/RIPEMD) (1992)
//https://homes.esat.kuleuven.be/~bosselae/ripemd/rmd128.txt
//https://homes.esat.kuleuven.be/~bosselae/ripemd/rmd160.txt
//https://homes.esat.kuleuven.be/~bosselae/ripemd160.html (1996)
//https://homes.esat.kuleuven.be/~bosselae/ripemd/rmd256.txt
//https://homes.esat.kuleuven.be/~bosselae/ripemd/rmd320.txt

const blockSize = 64; //512 bits
const spaceForLenBytes = 8; //Number of bytes needed to append length
const iv = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
const iv2 = [0x76543210, 0xfedcba98, 0x89abcdef, 0x01234567, 0x3c2d1e0f];
const f = [
	(x: number, y: number, z: number): number => x ^ y ^ z, //Same as MD4-r3
	(x: number, y: number, z: number): number => z ^ (x & (y ^ z)), // like MD4-r1, optimize from (x&y)|(~x&z)
	(x: number, y: number, z: number): number => (x | ~y) ^ z,
	(x: number, y: number, z: number): number => y ^ (z & (x ^ y)), // like MD4-r1, optimize from (x&z)|(y&~z)
	(x: number, y: number, z: number): number => x ^ (y | ~z),
];
const r = [
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
	15 /*r 0..15 -- -- -- -- -- -- -- -- -- -- */, 7, 4, 13, 1, 10, 6, 15, 3, 12,
	0, 9, 5, 2, 14, 11, 8 /*r 16..31 -- -- -- -- -- -- -- -- -- --*/, 3, 10, 14,
	4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5,
	12 /*r 32..47 -- -- -- -- -- -- -- -- -- --*/, 1, 9, 11, 10, 0, 8, 12, 4, 13,
	3, 7, 15, 14, 5, 6, 2 /*r 48..63 -- -- -- -- -- -- -- -- -- --*/, 4, 0, 5, 9,
	7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15,
	13 /*r 64..79 -- -- -- -- -- -- -- -- -- --*/,
];
const rr = [
	5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3,
	12 /*r' 0..15  -- -- -- -- -- -- -- -- -- -*/, 6, 11, 3, 7, 0, 13, 5, 10, 14,
	15, 8, 12, 4, 9, 1, 2 /*r' 16..31 -- -- -- -- -- -- -- -- -- -*/, 15, 5, 1, 3,
	7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4,
	13 /*r' 32..47 -- -- -- -- -- -- -- -- -- -*/, 8, 6, 4, 1, 3, 11, 15, 0, 5,
	12, 2, 13, 9, 7, 10, 14 /*r' 48..63 -- -- -- -- -- -- -- -- -- -*/, 12, 15,
	10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9,
	11 /*r' 64..79 -- -- -- -- -- -- -- -- -- -*/,
];
//0,int(2**30 x sqrt(2)), int(2**30 x sqrt(3)),int(2**30 x sqrt(5)),int(2**30 x sqrt(7))
const k = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e];
//int(2**30 x cbrt(2)),int(2**30 x cbrt(3)),int(2**30 x cbrt(5)),int(2**30 x cbrt(7)),0
const kk = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000];
//In 128/256 the last constant of the parallel set is zeroed, but otherwise notice these are the same as @see kk
const kk128 = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x00000000];
const s = [
	11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9,
	8 /*s 0..15 -- -- -- -- -- -- -- -- -- -*/, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12,
	15, 9, 11, 7, 13, 12 /*s 16..31 -- -- -- -- -- -- -- -- -- */, 11, 13, 6, 7,
	14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7,
	5 /*s 32..47 -- -- -- -- -- -- -- -- -- */, 11, 12, 14, 15, 14, 15, 9, 8, 9,
	14, 5, 6, 8, 6, 5, 12 /*s 48..63 -- -- -- -- -- -- -- -- -- */, 9, 15, 5, 11,
	6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5,
	6 /*s 64..79 -- -- -- -- -- -- -- -- -- */,
];
const ss = [
	8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12,
	6 /*s 0..15 -- -- -- -- -- -- -- -- -- -*/, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7,
	12, 7, 6, 15, 13, 11 /*s 16..31 -- -- -- -- -- -- -- -- -- */, 9, 7, 15, 11,
	8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7,
	5 /*s 32..47 -- -- -- -- -- -- -- -- -- */, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9,
	12, 9, 12, 5, 15, 8 /*s 48..63 -- -- -- -- -- -- -- -- -- */, 8, 5, 12, 9, 12,
	5, 14, 6, 8, 13, 6, 5, 15, 13, 11,
	11 /*s 64..79 -- -- -- -- -- -- -- -- -- */,
];
type ivFunc = (state: Uint32Array) => void;
type hashFunc = (state: Uint32Array, x: Uint32Array) => void;

class RipeMd implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size: number;
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSize;
	/**
	 * Runtime state of the hash
	 */
	readonly #state: Uint32Array;
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSize);
	readonly #block32 = new Uint32Array(this.#block.buffer);
	/**
	 * Number of bytes added to the hash
	 */
	private _ingestBytes = 0;
	/**
	 * Position of data written to block
	 */
	private _bPos = 0;
	readonly #iv: ivFunc;
	private readonly _hash: hashFunc;

	/**
	 * Build a new RipeMd-320 hash generator
	 */
	constructor(digestSize: number, iv: ivFunc, hash: hashFunc) {
		this.size = digestSize;
		this.#state = new Uint32Array(digestSize >> 2);
		this.#iv = iv;
		this._hash = hash;
		this.reset();
	}

	private hash(): void {
		//Make sure block is LE (might mangle state, but it's reset after hash)
		for (let i = 0; i < 16; i++) asLE.i32(this.#block, i * 4);

		// littleEndian.u32IntoArrFromBytes(x, 0, 16, this.#block);
		this._hash(this.#state, this.#block32);

		//Reset block pointer
		this._bPos = 0;
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		//It would be more accurately to update these on each cycle (below) but since we cannot
		// fail.. or if we do, we cannot recover, it seems ok to do it all at once
		this._ingestBytes += data.length;

		let nToWrite = data.length;
		let dPos = 0;
		let space = blockSize - this._bPos;
		while (nToWrite > 0) {
			//Note this is >, so if there's exactly space this won't trigger
			// (ie bPos will always be some distance away from max allowing at least 1 byte write)
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				this.#block.set(data.subarray(dPos), this._bPos);
				//Update pos
				this._bPos += nToWrite;
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + blockSize), this._bPos);
			this._bPos += space;
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = blockSize;
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
		this.#block[this._bPos] = 0x80;
		this._bPos++;

		const sizeSpace = blockSize - spaceForLenBytes;

		//If there's not enough space, end this block
		if (this._bPos > sizeSpace) {
			//Zero the remainder of the block
			this.#block.fill(0, this._bPos);
			this.hash();
		}
		//Zero the rest of the block
		this.#block.fill(0, this._bPos);

		const ss32 = sizeSpace >> 2; // div 4
		//We tracked bytes, <<3 (*8) to count bits
		this.#block32[ss32] = this._ingestBytes << 3;
		//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
		this.#block32[ss32 + 1] = this._ingestBytes / 0x20000000;
		//This might mangle #block, but we're about to hash anyway
		asLE.i32(this.#block, sizeSpace);
		asLE.i32(this.#block, sizeSpace + 4);
		this.hash();

		//Project state into bytes
		const s8 = new Uint8Array(this.#state.buffer, this.#state.byteOffset);
		//Make sure the bytes are LE - this might mangle alt.#state (but we're moments from disposing)
		for (let i = 0; i < this.size; i++) asLE.i32(s8, i * 4);
		//Finally slice (duplicate) the data so caller can't discover hidden state
		return s8.slice(0, this.size);
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this.#iv(this.#state);
		//Reset ingest count
		this._ingestBytes = 0;
		//Reset block (which is just pointing to the start)
		this._bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new RipeMd(this.size, this.#iv, this._hash);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): IHash {
		const ret = new RipeMd(this.size, this.#iv, this._hash);
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}
}

export class RipeMd128 extends RipeMd {
	/**
	 * Build a new RipeMd-128 hash generator
	 */
	constructor() {
		super(16, RipeMd128.iv, RipeMd128.hash);
	}

	private static iv(state: Uint32Array): void {
		//Setup state
		state[0] = iv[0];
		state[1] = iv[1];
		state[2] = iv[2];
		state[3] = iv[3];
	}

	private static hash(v: Uint32Array, x: Uint32Array): void {
		//Using the rare , to show these are big swaps
		/* eslint-disable @typescript-eslint/no-unused-expressions */
		let t: number;

		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3];
		let aa = v[0],
			bb = v[1],
			cc = v[2],
			dd = v[3];

		for (let j = 0; j < 64; j++) {
			const round = j >> 4;
			t = U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = d), (d = c), (c = b), (b = t);
			t = U32.lRot(
				aa + f[3 - round](bb, cc, dd) + x[rr[j]] + kk128[round],
				ss[j]
			);
			(aa = dd), (dd = cc), (cc = bb), (bb = t);
		}
		(t = v[1] + c + dd),
			(v[1] = v[2] + d + aa),
			(v[2] = v[3] + a + bb),
			(v[3] = v[0] + b + cc),
			(v[0] = t);
	}
}

export class RipeMd160 extends RipeMd {
	/**
	 * Build a new RipeMd-160 hash generator
	 */
	constructor() {
		super(20, RipeMd160.iv, RipeMd160.hash);
	}

	private static iv(state: Uint32Array): void {
		//Setup state
		state[0] = iv[0];
		state[1] = iv[1];
		state[2] = iv[2];
		state[3] = iv[3];
		state[4] = iv[4];
	}

	private static hash(v: Uint32Array, x: Uint32Array): void {
		//Using the rare , to show these are big swaps
		/* eslint-disable @typescript-eslint/no-unused-expressions */
		let t: number;
		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3],
			e = v[4];
		let aa = v[0],
			bb = v[1],
			cc = v[2],
			dd = v[3],
			ee = v[4];

		for (let j = 0; j < 80; j++) {
			const round = Math.floor(j / 16);
			t = e + U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = e), (e = d), (d = U32.lRot(c, 10)), (c = b), (b = t);
			t =
				ee +
				U32.lRot(aa + f[4 - round](bb, cc, dd) + x[rr[j]] + kk[round], ss[j]);
			(aa = ee), (ee = dd), (dd = U32.lRot(cc, 10)), (cc = bb), (bb = t);
		}

		t = v[1] + c + dd;
		//Using the rare , to show this is a big swap
		(v[1] = v[2] + d + ee),
			(v[2] = v[3] + e + aa),
			(v[3] = v[4] + a + bb),
			(v[4] = v[0] + b + cc),
			(v[0] = t);
	}
}

export class RipeMd256 extends RipeMd {
	/**
	 * Build a new RipeMd-256 hash generator
	 */
	constructor() {
		super(32, RipeMd256.iv, RipeMd256.hash);
	}

	private static iv(state: Uint32Array): void {
		//Setup state
		state[0] = iv[0];
		state[1] = iv[1];
		state[2] = iv[2];
		state[3] = iv[3];

		state[4] = iv2[0];
		state[5] = iv2[1];
		state[6] = iv2[2];
		state[7] = iv2[3];
	}

	private static hash(v: Uint32Array, x: Uint32Array): void {
		//Using the rare , to show these are big swaps
		/* eslint-disable @typescript-eslint/no-unused-expressions */
		let t: number;
		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3];
		let aa = v[4],
			bb = v[5],
			cc = v[6],
			dd = v[7];

		let j = 0;
		let round = 0;
		for (; j < 16; j++) {
			t = U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = d), (d = c), (c = b), (b = t);
			t = U32.lRot(
				aa + f[3 - round](bb, cc, dd) + x[rr[j]] + kk128[round],
				ss[j]
			);
			(aa = dd), (dd = cc), (cc = bb), (bb = t);
		}
		(t = a), (a = aa), (aa = t);

		round = 1;
		for (; j < 32; j++) {
			t = U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = d), (d = c), (c = b), (b = t);
			t = U32.lRot(
				aa + f[3 - round](bb, cc, dd) + x[rr[j]] + kk128[round],
				ss[j]
			);
			(aa = dd), (dd = cc), (cc = bb), (bb = t);
		}
		(t = b), (b = bb), (bb = t);

		round = 2;
		for (; j < 48; j++) {
			t = U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = d), (d = c), (c = b), (b = t);
			t = U32.lRot(
				aa + f[3 - round](bb, cc, dd) + x[rr[j]] + kk128[round],
				ss[j]
			);
			(aa = dd), (dd = cc), (cc = bb), (bb = t);
		}
		(t = c), (c = cc), (cc = t);

		round = 3;
		for (; j < 64; j++) {
			t = U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = d), (d = c), (c = b), (b = t);
			t = U32.lRot(
				aa + f[3 - round](bb, cc, dd) + x[rr[j]] + kk128[round],
				ss[j]
			);
			(aa = dd), (dd = cc), (cc = bb), (bb = t);
		}
		(t = d), (d = dd), (dd = t);

		(v[0] += a), (v[1] += b), (v[2] += c), (v[3] += d);
		(v[4] += aa), (v[5] += bb), (v[6] += cc), (v[7] += dd);
	}
}

export class RipeMd320 extends RipeMd {
	/**
	 * Build a new RipeMd-320 hash generator
	 */
	constructor() {
		super(40, RipeMd320.iv, RipeMd320.hash);
	}

	private static iv(state: Uint32Array): void {
		//Setup state
		state[0] = iv[0];
		state[1] = iv[1];
		state[2] = iv[2];
		state[3] = iv[3];
		state[4] = iv[4];

		state[5] = iv2[0];
		state[6] = iv2[1];
		state[7] = iv2[2];
		state[8] = iv2[3];
		state[9] = iv2[4];
	}

	private static hash(v: Uint32Array, x: Uint32Array): void {
		//Using the rare , to show these are big swaps
		/* eslint-disable @typescript-eslint/no-unused-expressions */
		let t: number;
		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3],
			e = v[4];
		let aa = v[5],
			bb = v[6],
			cc = v[7],
			dd = v[8],
			ee = v[9];

		let j = 0;
		let round = 0;
		for (; j < 16; j++) {
			t = e + U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = e), (e = d), (d = U32.lRot(c, 10)), (c = b), (b = t);
			t =
				ee +
				U32.lRot(aa + f[4 - round](bb, cc, dd) + x[rr[j]] + kk[round], ss[j]);
			(aa = ee), (ee = dd), (dd = U32.lRot(cc, 10)), (cc = bb), (bb = t);
		}
		(t = b), (b = bb), (bb = t);

		round = 1;
		for (; j < 32; j++) {
			t = e + U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = e), (e = d), (d = U32.lRot(c, 10)), (c = b), (b = t);
			t =
				ee +
				U32.lRot(aa + f[4 - round](bb, cc, dd) + x[rr[j]] + kk[round], ss[j]);
			(aa = ee), (ee = dd), (dd = U32.lRot(cc, 10)), (cc = bb), (bb = t);
		}
		(t = d), (d = dd), (dd = t);

		round = 2;
		for (; j < 48; j++) {
			t = e + U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = e), (e = d), (d = U32.lRot(c, 10)), (c = b), (b = t);
			t =
				ee +
				U32.lRot(aa + f[4 - round](bb, cc, dd) + x[rr[j]] + kk[round], ss[j]);
			(aa = ee), (ee = dd), (dd = U32.lRot(cc, 10)), (cc = bb), (bb = t);
		}
		(t = a), (a = aa), (aa = t);

		round = 3;
		for (; j < 64; j++) {
			t = e + U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = e), (e = d), (d = U32.lRot(c, 10)), (c = b), (b = t);
			t =
				ee +
				U32.lRot(aa + f[4 - round](bb, cc, dd) + x[rr[j]] + kk[round], ss[j]);
			(aa = ee), (ee = dd), (dd = U32.lRot(cc, 10)), (cc = bb), (bb = t);
		}
		(t = c), (c = cc), (cc = t);

		round = 4;
		for (; j < 80; j++) {
			t = e + U32.lRot(a + f[round](b, c, d) + x[r[j]] + k[round], s[j]);
			(a = e), (e = d), (d = U32.lRot(c, 10)), (c = b), (b = t);
			t =
				ee +
				U32.lRot(aa + f[4 - round](bb, cc, dd) + x[rr[j]] + kk[round], ss[j]);
			(aa = ee), (ee = dd), (dd = U32.lRot(cc, 10)), (cc = bb), (bb = t);
		}
		(t = e), (e = ee), (ee = t);

		(v[0] += a), (v[1] += b), (v[2] += c), (v[3] += d), (v[4] += e);
		(v[5] += aa), (v[6] += bb), (v[7] += cc), (v[8] += dd), (v[9] += ee);
	}
}
