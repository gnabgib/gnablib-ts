/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import type { IHash } from './IHash.js';
import { asBE, asLE } from '../endian/platform.js';

//[Wikipedia: Lookup2](https://en.wikipedia.org/wiki/Jenkins_hash_function)
//["My Hash"](http://burtleburtle.net/bob/hash/doobs.html)
//[lookup2.c](http://www.burtleburtle.net/bob/c/lookup2.c) (1996)

const blockSize = 12;
const digestSize = 4;
const A = 0,
	B = 1,
	C = 2;

/**
 * NOT Cryptographic
 */
export class Lookup2 implements IHash {
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
	readonly #state = Uint32Array.of(0x9e3779b9, 0x9e3779b9, 0);
	/**
	 * Starting seed, uint32 0-0xffffffff
	 */
	readonly #seed: number;
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
	 * Build a new Lookup2 (non-crypto) hash generator
	 * @param seed
	 */
	constructor(seed = 0) {
		this.#state[2] = seed;
		this.#seed = this.#state[2];
	}

	/**
	 * aka Mix
	 */
	hash(): void {
		//Make sure block is little-endian
		asLE.i32(this.#block, 0, 3);
		//Add in data
		this.#state[A] += this.#block32[0];
		this.#state[B] += this.#block32[1];
		this.#state[C] += this.#block32[2];

		///MIX
		//a=this.#state[0], b=this.#state[1], c=this.#state[2]
		this.#state[A] -= this.#state[B];
		this.#state[A] -= this.#state[C];
		this.#state[A] ^= this.#state[C] >>> 13;
		this.#state[B] -= this.#state[C];
		this.#state[B] -= this.#state[A];
		this.#state[B] ^= this.#state[A] << 8;
		this.#state[C] -= this.#state[A];
		this.#state[C] -= this.#state[B];
		this.#state[C] ^= this.#state[B] >>> 13;

		this.#state[A] -= this.#state[B];
		this.#state[A] -= this.#state[C];
		this.#state[A] ^= this.#state[C] >>> 12;
		this.#state[B] -= this.#state[C];
		this.#state[B] -= this.#state[A];
		this.#state[B] ^= this.#state[A] << 16;
		this.#state[C] -= this.#state[A];
		this.#state[C] -= this.#state[B];
		this.#state[C] ^= this.#state[B] >>> 5;

		this.#state[A] -= this.#state[B];
		this.#state[A] -= this.#state[C];
		this.#state[A] ^= this.#state[C] >>> 3;
		this.#state[B] -= this.#state[C];
		this.#state[B] -= this.#state[A];
		this.#state[B] ^= this.#state[A] << 10;
		this.#state[C] -= this.#state[A];
		this.#state[C] -= this.#state[B];
		this.#state[C] ^= this.#state[B] >>> 15;

		//console.log(`^MIX: a=${hex.fromI32(this.#state[0])}, b=${hex.fromI32(this.#state[1])}, c=${hex.fromI32(this.#state[2])}`);
		this.#bPos = 0;
	}

	write(data: Uint8Array): void {
		this.#ingestBytes += data.length;
		let nToWrite = data.length;
		let dPos = 0;
		let space = blockSize - this.#bPos;
		while (nToWrite > 0) {
			//Note this is >, so if there's exactly space this won't trigger
			// (ie bPos will always be some distance away from max allowing at least 1 byte write)
			if (space > nToWrite) {
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

	private static _sum(alt:Lookup2):void {
		alt.#state[2] += alt.#ingestBytes;
		alt.#block.fill(0, alt.#bPos);
		alt.hash();
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
		Lookup2._sum(this);
		const ret = new Uint8Array(this.#state.slice(2).buffer);
		//Wiki implies big-endian (since that's how we right numbers)
		asBE.i32(ret);
		return ret;
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum32(): number {
		Lookup2._sum(this);
		return this.#state[2];
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this.#state[A] = 0x9e3779b9;
		this.#state[B] = 0x9e3779b9;
		this.#state[C] = this.#seed;
		this.#ingestBytes = 0;
		this.#bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Lookup2(this.#seed);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): Lookup2 {
		const ret = new Lookup2(this.#seed);
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}
