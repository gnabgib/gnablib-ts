/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import type { IHash } from './IHash.js';
import { asLE } from '../endian/platform.js';

//[Wikipedia: Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function)
//[lookup3.c](http://www.burtleburtle.net/bob/c/lookup3.c) (2006)

const blockSize = 12;
const digestSize = 4;
const A = 0,
	B = 1,
	C = 2;

/**
 * NOT Cryptographic
 * NOTE: This has requires length to be known at the start, so you can only call .write ONCE (after that you'll get an exception)
 */
export class Lookup3 implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size = digestSize;
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSize;
	/**
	 * Runtime state of the hash
	 */
	readonly #state = Uint32Array.of(0xdeadbeef, 0xdeadbeef, 0xdeadbeef);
	/**
	 * Starting seed, uint32 0-0xffffffff
	 */
	readonly #seed: number;
	readonly #seed2: number;
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSize);
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
	 * Build a new Lookup3 (non-crypto) hash generator
	 * @param seed
	 */
	constructor(seed = 0, seed2 = 0) {
		this.#state[A] += seed;
		this.#state[B] += seed;
		this.#state[C] += seed + seed2;
		this.#seed = seed;
		this.#seed2 = seed2;
	}

	/**
	 * aka Mix
	 */
	private hash(): void {
		//Make sure block is little-endian
		asLE.i32(this.#block, 0, 3);
		//Add in data
		this.#state[A] += this.#block32[0];
		this.#state[B] += this.#block32[1];
		this.#state[C] += this.#block32[2];

		///MIX
		//a=this.#state[0], b=this.#state[1], c=this.#state[2]
		this.#state[A] -= this.#state[C];
		this.#state[A] ^= (this.#state[C] << 4) | (this.#state[C] >>> 28);
		this.#state[C] += this.#state[B];
		this.#state[B] -= this.#state[A];
		this.#state[B] ^= (this.#state[A] << 6) | (this.#state[A] >>> 26);
		this.#state[A] += this.#state[C];
		this.#state[C] -= this.#state[B];
		this.#state[C] ^= (this.#state[B] << 8) | (this.#state[B] >>> 24);
		this.#state[B] += this.#state[A];

		this.#state[A] -= this.#state[C];
		this.#state[A] ^= (this.#state[C] << 16) | (this.#state[C] >>> 16);
		this.#state[C] += this.#state[B];
		this.#state[B] -= this.#state[A];
		this.#state[B] ^= (this.#state[A] << 19) | (this.#state[A] >>> 13);
		this.#state[A] += this.#state[C];
		this.#state[C] -= this.#state[B];
		this.#state[C] ^= (this.#state[B] << 4) | (this.#state[B] >>> 28);
		this.#state[B] += this.#state[A];

		//console.log(`^MIX: a=${hex.fromI32(this.#state[0])}, b=${hex.fromI32(this.#state[1])}, c=${hex.fromI32(this.#state[2])}`);
		this.#bPos = 0;
	}
	private final(): void {
		//Make sure block is little-endian
		asLE.i32(this.#block, 0, 3);
		//Add in data
		this.#state[A] += this.#block32[0];
		this.#state[B] += this.#block32[1];
		this.#state[C] += this.#block32[2];

		this.#state[C] ^= this.#state[B];
		this.#state[C] -= (this.#state[B] << 14) | (this.#state[B] >>> 18);
		this.#state[A] ^= this.#state[C];
		this.#state[A] -= (this.#state[C] << 11) | (this.#state[C] >>> 21);
		this.#state[B] ^= this.#state[A];
		this.#state[B] -= (this.#state[A] << 25) | (this.#state[A] >>> 7);

		this.#state[C] ^= this.#state[B];
		this.#state[C] -= (this.#state[B] << 16) | (this.#state[B] >>> 16);
		this.#state[A] ^= this.#state[C];
		this.#state[A] -= (this.#state[C] << 4) | (this.#state[C] >>> 28);
		this.#state[B] ^= this.#state[A];
		this.#state[B] -= (this.#state[A] << 14) | (this.#state[A] >>> 18);

		this.#state[C] ^= this.#state[B];
		this.#state[C] -= (this.#state[B] << 24) | (this.#state[B] >>> 8);
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * NOTE: This has requires length to be known at the start, so you can only call .write ONCE (after that you'll get an exception)
	 * @param data
	 */
	write(data: Uint8Array): void {
		if (this.#ingestBytes > 0)
			throw new Error('Can only write to this hash once');
		this.#ingestBytes += data.length;
		this.#state[0] += data.length;
		this.#state[1] += data.length;
		this.#state[2] += data.length;

		let nToWrite = data.length;
		let dPos = 0;
		let space = blockSize - this.#bPos;
		while (nToWrite > 0) {
			//We want >= BECAUSE we only to interim hashes if there's more than one block of data
			if (space >= nToWrite) {
				//More space than data, copy in verbatim
				this.#block.set(data.subarray(dPos), this.#bPos);
				//Update pos
				this.#bPos += nToWrite;
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + blockSize), this.#bPos);
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = blockSize;
		}
	}

	private static _sum(alt:Lookup3):void {
		//We only finalize if there's >0 bits
		if (alt.#bPos > 0 || alt.#ingestBytes === 12) {
			alt.#block.fill(0, alt.#bPos);
			alt.final();
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
	sumIn():Uint8Array {
		Lookup3._sum(this);
		const ret = new Uint8Array(this.#state.slice(1).buffer);
		//Wiki implies big-endian (since that's how we right numbers)
		//asBE.i32(ret);
		return ret;
	}
	

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum32(): [number, number] {
		Lookup3._sum(this);
		const s8 = new Uint8Array(this.#state.buffer);
		asLE.i32(s8, 0, 3);
		const ret=new Uint32Array(s8.buffer);
		return [ret[1],ret[2]];
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this.#state[A] = 0xdeadbeef + this.#seed;
		this.#state[B] = 0xdeadbeef + this.#seed;
		this.#state[C] = 0xdeadbeef + this.#seed + this.#seed2;
		this.#ingestBytes = 0;
		this.#bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Lookup3(this.#seed, this.#seed2);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): Lookup3 {
		const ret = new Lookup3(this.#seed, this.#seed2);
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}
