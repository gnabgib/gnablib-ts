/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { asBE, asLE } from '../endian/platform.js';
import { U32 } from '../primitive/number/U32.js';
import { U64, U64Mut, U64MutArray } from '../primitive/number/U64.js';
import type { IHash } from '../crypto/interfaces/IHash.js';

//[xxHash](https://cyan4973.github.io/xxHash/)
//https://www.pelock.com/products/hash-calculator

const digestSize32 = 4; //32 bits
const digestSize64 = 8; //64 bits
const blockSizeEls = 4;
const blockSize32Bytes = blockSizeEls << 2; //16
const blockSize64Bytes = blockSizeEls << 3; //32
const p32_1 = 2654435761;
const p32_2 = 2246822519;
const p32_3 = 3266489917;
const p32_4 = 668265263;
const p32_5 = 374761393;
const p64_1 = U64.fromUint32Pair(0x85ebca87, 0x9e3779b1); //11400714785074694791
const p64_2 = U64.fromUint32Pair(0x27d4eb4f, 0xc2b2ae3d); //14029467366897019727
const p64_3 = U64.fromUint32Pair(0x9e3779f9, 0x165667b1); //1609587929392839161
const p64_4 = U64.fromUint32Pair(0xc2b2ae63, 0x85ebca77); //9650029242287828579
const p64_5 = U64.fromUint32Pair(0x165667c5, 0x27d4eb2f); //2870177450012600261

export class XxHash32 implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size = digestSize32;
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSize32Bytes;
	/**
	 * Runtime state of the hash
	 */
	private readonly _state = new Uint32Array(blockSizeEls);
	/**
	 * Temp processing block
	 */
	private readonly _block = new Uint8Array(blockSize32Bytes);
	private readonly _block32 = new Uint32Array(this._block.buffer);
	/**
	 * Starting seed
	 */
	private readonly _seed: number;
	/**
	 * Position of data written to block
	 */
	private _bPos = 0;
	/**
	 * Number of bytes added to the hash
	 */
	private _ingestBytes = 0;

	/**
	 * Build a new XxHash32 (non-crypto) hash generator
	 * @param seed Optional 32bit seed number
	 */
	constructor(seed = 0) {
		this._seed = seed;
		this.reset();
	}

	private hash(): void {
		asLE.i32(this._block, 0, 4);
		this._state[0] = Math.imul(
			U32.rol(this._state[0] + Math.imul(this._block32[0], p32_2), 13),
			p32_1
		);
		this._state[1] = Math.imul(
			U32.rol(this._state[1] + Math.imul(this._block32[1], p32_2), 13),
			p32_1
		);
		this._state[2] = Math.imul(
			U32.rol(this._state[2] + Math.imul(this._block32[2], p32_2), 13),
			p32_1
		);
		this._state[3] = Math.imul(
			U32.rol(this._state[3] + Math.imul(this._block32[3], p32_2), 13),
			p32_1
		);

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
		let space = blockSize32Bytes - this._bPos;
		while (nToWrite > 0) {
			//Note this is >, so if there's exactly space this won't trigger
			// (ie bPos will always be some distance away from max allowing at least 1 byte write)
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				this._block.set(data.subarray(dPos), this._bPos);
				//Update pos
				this._bPos += nToWrite;
				return;
			}
			this._block.set(data.subarray(dPos, dPos + space), this._bPos);
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = blockSize32Bytes;
		}
	}

	_sum(): number {
		let result = this._ingestBytes;
		if (this._ingestBytes >= blockSize32Bytes) {
			result +=
				U32.rol(this._state[0], 1) +
				U32.rol(this._state[1], 7) +
				U32.rol(this._state[2], 12) +
				U32.rol(this._state[3], 18);
		} else {
			result += this._seed + p32_5;
		}
		let nToAdd = this._bPos;
		//i is el-pos
		let i = 0;
		for (; nToAdd >= 4; i++) {
			asLE.i32(this._block, i * 4);
			result = Math.imul(
				U32.rol(result + Math.imul(this._block32[i], p32_3), 17),
				p32_4
			);
			nToAdd -= 4;
		}
		//Switch i to byte-pos
		i *= 4;
		for (; i < this._bPos; i++) {
			result = Math.imul(U32.rol(result + this._block[i] * p32_5, 11), p32_1);
		}
		result ^= result >>> 15;
		result = Math.imul(result, p32_2);
		result ^= result >>> 13;
		result = Math.imul(result, p32_3);
		result ^= result >>> 16;
		return result;
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum(): Uint8Array {
		return this.sumIn();
	}
	/**
	 * Sum the hash (doesn't mutate internal state, here for compat)
	 */
	sumIn(): Uint8Array {
		const r32 = Uint32Array.of(this._sum());
		//Copy the first element and convert to bytes
		const r8 = new Uint8Array(r32.slice(0, 1).buffer);
		asBE.i32(r8);
		return r8;
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 * @returns Unsigned 32bit integer (0-0xffffffff)
	 */
	sum32(): number {
		return this._sum() >>> 0;
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this._state[0] = this._seed + p32_1 + p32_2;
		this._state[1] = this._seed + p32_2;
		this._state[2] = this._seed;
		this._state[3] = this._seed - p32_1;
		this._bPos = 0;
		this._ingestBytes = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new XxHash32(this._seed);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): XxHash32 {
		const ret = new XxHash32(this._seed);
		ret._state.set(this._state);
		ret._block.set(this._block);
		ret._ingestBytes = this._ingestBytes;
		ret._bPos = this._bPos;
		return ret;
	}
}

export class XxHash64 implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size = digestSize64;
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSize64Bytes;
	/**
	 * Runtime state of the hash
	 */
	private readonly _state = U64MutArray.fromLen(blockSizeEls);
	/**
	 * Temp processing block
	 */
	private readonly _block = new Uint8Array(blockSize64Bytes);
	private readonly _block64 = U64MutArray.fromBytes(this._block.buffer);
	/**
	 * Starting seed
	 */
	private readonly _seed: U64;
	/**
	 * Position of data written to block
	 */
	private _bPos = 0;
	/**
	 * Number of bytes added to the hash
	 */
	private readonly _ingestBytes = U64Mut.fromInt(0);

	constructor(seed = U64.fromInt(0)) {
		this._seed = seed;
		this.reset();
	}

	private hash(): void {
		asLE.i64(this._block, 0, 4);
		this._state
			.at(0)
			.set(
				this._state
					.at(0)
					.addEq(this._block64.at(0).mulEq(p64_2))
					.lRotEq(31)
					.mulEq(p64_1)
			);
		this._state
			.at(1)
			.set(
				this._state
					.at(1)
					.addEq(this._block64.at(1).mulEq(p64_2))
					.lRotEq(31)
					.mulEq(p64_1)
			);
		this._state
			.at(2)
			.set(
				this._state
					.at(2)
					.addEq(this._block64.at(2).mulEq(p64_2))
					.lRotEq(31)
					.mulEq(p64_1)
			);
		this._state
			.at(3)
			.set(
				this._state
					.at(3)
					.addEq(this._block64.at(3).mulEq(p64_2))
					.lRotEq(31)
					.mulEq(p64_1)
			);
		this._bPos = 0;
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		//It would be more accurately to update these on each cycle (below) but since we cannot
		// fail.. or if we do, we cannot recover, it seems ok to do it all at once
		this._ingestBytes.addEq(U64Mut.fromIntUnsafe(data.length));

		let nToWrite = data.length;
		let dPos = 0;
		let space = blockSize64Bytes - this._bPos;
		while (nToWrite > 0) {
			//Note this is >, so if there's exactly space this won't trigger
			// (ie bPos will always be some distance away from max allowing at least 1 byte write)
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				this._block.set(data.subarray(dPos), this._bPos);
				//Update pos
				this._bPos += nToWrite;
				return;
			}
			this._block.set(data.subarray(dPos, dPos + space), this._bPos);
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = blockSize64Bytes;
		}
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum(): Uint8Array {
		return this.sumIn();
	}

	/**
	 * Sum the hash (doesn't mutate internal state, here for compat)
	 */
	sumIn(): Uint8Array {
		const result = U64Mut.fromIntUnsafe(0);
		if (this._ingestBytes.gte(U64.fromInt(blockSize64Bytes))) {
			result
				.addEq(this._state.at(0).lRot(1))
				.addEq(this._state.at(1).lRot(7))
				.addEq(this._state.at(2).lRot(12))
				.addEq(this._state.at(3).lRot(18));
			//We must .mut() the states because we don't want to change the
			// running context
			result.set(
				this._state
					.at(0)
					.mut()
					.mulEq(p64_2)
					.lRotEq(31)
					.mulEq(p64_1)
					.xorEq(result)
					.mulEq(p64_1)
					.addEq(p64_4)
			);
			result.set(
				this._state
					.at(1)
					.mut()
					.mulEq(p64_2)
					.lRotEq(31)
					.mulEq(p64_1)
					.xorEq(result)
					.mulEq(p64_1)
					.addEq(p64_4)
			);
			result.set(
				this._state
					.at(2)
					.mut()
					.mulEq(p64_2)
					.lRotEq(31)
					.mulEq(p64_1)
					.xorEq(result)
					.mulEq(p64_1)
					.addEq(p64_4)
			);
			result.set(
				this._state
					.at(3)
					.mut()
					.mulEq(p64_2)
					.lRotEq(31)
					.mulEq(p64_1)
					.xorEq(result)
					.mulEq(p64_1)
					.addEq(p64_4)
			);
		} else {
			result.addEq(this._seed).addEq(p64_5);
		}
		result.addEq(this._ingestBytes);
		let nToAdd = this._bPos;
		//i is el-pos
		let i = 0;
		for (; nToAdd >= 8; i++) {
			asLE.i64(this._block, i * 4);
			result.set(
				result
					.xorEq(this._block64.at(i).mulEq(p64_2).lRotEq(31).mulEq(p64_1))
					.lRotEq(27)
					.mulEq(p64_1)
					.addEq(p64_4)
			);
			nToAdd -= 8;
		}
		//Switch i to byte-pos
		i *= 8;
		if (nToAdd >= 4) {
			result.set(
				U64Mut.fromIntUnsafe(U32.iFromBytesLE(this._block, i))
					.mulEq(p64_1)
					.xorEq(result)
					.lRotEq(23)
					.mulEq(p64_2)
					.addEq(p64_3)
			);
			i += 4;
		}
		for (; i < this._bPos; i++) {
			result.set(
				U64Mut.fromIntUnsafe(this._block[i])
					.mulEq(p64_5)
					.xorEq(result)
					.lRotEq(11)
					.mulEq(p64_1)
			);
		}
		result.xorEq(result.rShift(33));
		result.mulEq(p64_2);
		result.xorEq(result.rShift(29));
		result.mulEq(p64_3);
		result.xorEq(result.rShift(32));
		//We write numbers in BE
		return result.toBytesBE();
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this._state.at(0).set(this._seed.mut().addEq(p64_1).addEq(p64_2));
		this._state.at(1).set(this._seed.mut().addEq(p64_2));
		this._state.at(2).set(this._seed);
		this._state.at(3).set(this._seed).subEq(p64_1);

		this._bPos = 0;
		this._ingestBytes.set(U64Mut.zero);
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new XxHash64(this._seed);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): XxHash64 {
		const ret = new XxHash64(this._seed);
		ret._state.set(this._state);
		ret._block.set(this._block);
		ret._ingestBytes.set(this._ingestBytes);
		ret._bPos = this._bPos;
		return ret;
	}
}
