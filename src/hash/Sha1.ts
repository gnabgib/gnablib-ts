/*! Copyright 2022-2023 gnabgib MPL-2.0 */

import { asBE } from '../endian/platform.js';
import { U32 } from '../primitive/U32.js';
import type { IHash } from './IHash.js';

//[US Secure Hash Algorithm 1 (SHA1)](https://datatracker.ietf.org/doc/html/rfc3174) (2001)
//[Wikipedia: SHA-1](https://en.wikipedia.org/wiki/SHA-1)
// You can generate test values with: `echo -n '<test>' | sha1sum `

// file deepcode ignore InsecureHash: This is an implementation of Sha1 not usage


const digestSize = 20; //160 bits
const digestSizeU32 = 5;
const blockSize = 64; //512 bits
const spaceForLenBytes = 8; //Number of bytes needed to append length
//Round constants (section 5) - sqrt(2), sqrt(3), sqrt(5), sqrt(10)
const rc = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
//Initialize vector (section 6.1) Big endian 0-f,f-0 with an extra cross peaked constant
const iv = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

export class Sha1 implements IHash {
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
	readonly #state = new Uint32Array(digestSizeU32);
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSize);
	readonly #block32=new Uint32Array(this.#block.buffer);
	/**
	 * Number of bytes added to the hash
	 */
	#ingestBytes = 0;
	/**
	 * Position of data written to block
	 */
	#bPos = 0;

	/**
	 * Build a new Sha-1 hash generator
	 */
	constructor() {
		this.reset();
	}

	private hash() {
		const w=new Uint32Array(80);
		let a=this.#state[0],b=this.#state[1],c=this.#state[2],d=this.#state[3],e=this.#state[4];

		let t:number;
		let j = 0;
		for (; j < 16; j++) {
			//Because the block isn't used after this, mutate (possibly) in place into Big Endian encoding
			asBE.i32(this.#block,j*4);
			w[j]=this.#block32[j];
			// (b&c)|((~b)&d) - Same as MD4-r1
			t = U32.rol(a, 5) + (d ^ (b & (c ^ d))) + e + w[j] + rc[0];
			//Rare use of comma!  Make it clear there's a 5 stage swap going on
			(e = d), (d = c), (c = U32.rol(b, 30)), (b = a), (a = t);
		}
		for (; j < 20; j++) {
			w[j] = U32.rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
			// (b&c)|((~b)&d) - Same as MD4-r1
			t = U32.rol(a, 5) + (d ^ (b & (c ^ d))) + e + w[j] + rc[0];
			(e = d), (d = c), (c = U32.rol(b, 30)), (b = a), (a = t);
		}
		for (; j < 40; j++) {
			w[j] = U32.rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
			//Same as MD4-r3
			t = U32.rol(a, 5) + (b ^ c ^ d) + e + w[j] + rc[1];
			(e = d), (d = c), (c = U32.rol(b, 30)), (b = a), (a = t);
		}
		for (; j < 60; j++) {
			w[j] = U32.rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
			//Same as MD4-r2
			t = U32.rol(a, 5) + (((b | c) & d) | (b & c)) + e + w[j] + rc[2];
			(e = d), (d = c), (c = U32.rol(b, 30)), (b = a), (a = t);
		}
		for (; j < 80; j++) {
			w[j] = U32.rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
			//Same as MD4-r3
			t = U32.rol(a, 5) + (b ^ c ^ d) + e + w[j] + rc[3];
			(e = d), (d = c), (c = U32.rol(b, 30)), (b = a), (a = t);
		}

		(this.#state[0] += a), (this.#state[1] += b), (this.#state[2] += c), (this.#state[3] += d), (this.#state[4] += e);

		//Reset block pointer
		this.#bPos = 0;
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		//It would be more accurately to update these on each cycle (below) but since we cannot
		// fail.. or if we do, we cannot recover, it seems ok to do it all at once
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
			this.#bPos += space;
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
		const alt = this.clone();
		alt.#block[alt.#bPos] = 0x80;
		alt.#bPos++;

		const sizeSpace = blockSize - spaceForLenBytes;

		//If there's not enough space, end this block
		if (alt.#bPos > sizeSpace) {
			//Zero the remainder of the block
			alt.#block.fill(0, alt.#bPos);
			alt.hash();
		}
		//Zero the rest of the block
		alt.#block.fill(0, alt.#bPos);

		//Write out the data size in big-endian
		const ss32=sizeSpace>>2;// div 4
		//We tracked bytes, <<3 (*8) to count bits
		//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
		alt.#block32[ss32]=alt.#ingestBytes / 0x20000000;
		alt.#block32[ss32+1]=alt.#ingestBytes << 3;
		asBE.i32(alt.#block,sizeSpace);
		asBE.i32(alt.#block,sizeSpace+4);
		alt.hash();

		//Project state into bytes
		const s8=new Uint8Array(alt.#state.buffer,alt.#state.byteOffset);
		//Make sure the bytes are BE - this might mangle alt.#state (but we're moments from disposing)
		for(let i=0;i<digestSize;i++) asBE.i32(s8,i*4);
		return s8.slice(0,digestSize);
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		//Setup state
		this.#state[0] = iv[0];
		this.#state[1] = iv[1];
		this.#state[2] = iv[2];
		this.#state[3] = iv[3];
		this.#state[4] = iv[4];
		//Reset ingest count
		this.#ingestBytes = 0;
		//Reset block (which is just pointing to the start)
		this.#bPos = 0;
	}

	/**
     * Create an empty IHash using the same algorithm
     */
	newEmpty(): IHash {
  		return new Sha1();
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	private clone(): Sha1 {
		const ret = new Sha1();
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}