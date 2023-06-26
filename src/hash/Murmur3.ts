/*! Copyright 2023 gnabgib MPL-2.0 */

import type { IHash } from './IHash.js';
import { U32 } from '../primitive/U32.js';
import { asBE, asLE } from '../endian/platform.js';

const blockSize=4;
const stateSize = 4;
const c1=0xcc9e2d51;
const c2=0x1b873593;
const c3=0x85ebca6b;
const c4=0xc2b2ae35;
const r1=15;
const r2=13;
const m=5;
const n=0xe6546b64;

/**
 * NOT Cryptographic
 */
export class Murmur3_32 implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size = stateSize;
    /**
	 * Block size in bytes
	 */
	readonly blockSize = blockSize;
    /**
	 * Runtime state of the hash
	 */
	#state:number;
    /**
     * Starting seed
     */
    readonly #seed:number;
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
	 * Build a new Murmur3 32bit (non-crypto) hash generator
	 */
	constructor(seed=0) {
        this.#seed=seed;
        this.#state=seed;
	}

    hash():void {
        //#block=k1, #state=h1
		asLE.i32(this.#block);
		this.#state^=U32.mul(U32.rol(U32.mul(this.#block32[0],c1),r1),c2);
		this.#state=U32.mul(U32.rol(this.#state,r2),m)+n;
        
        this.#bPos=0;
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
                this.#block.set(data.subarray(dPos),this.#bPos);
				//Update pos
				this.#bPos += nToWrite;
				return;
			}
			this.#block.set(data.subarray(dPos, dPos + stateSize), this.#bPos);
			this.hash();
			dPos += space;
			nToWrite -= space;
			space = stateSize;
		}    
    }

	private static _sum(alt:Murmur3_32) {
		if (alt.#bPos>0) {
            alt.#block.fill(0,alt.#bPos);
			asLE.i32(alt.#block);
			alt.#state^=U32.mul(U32.rol(U32.mul(alt.#block32[0],c1),r1),c2);
        }

		alt.#state^=alt.#ingestBytes;

        //fmix
		alt.#state^=alt.#state>>>16;
		alt.#state=U32.mul(alt.#state,c3);
		alt.#state^=alt.#state>>>13;
		alt.#state=U32.mul(alt.#state,c4);
		alt.#state^=alt.#state>>>16;
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
		Murmur3_32._sum(this);
		const r32=Uint32Array.of(this.#state);
		const r8=new Uint8Array(r32.buffer);
		asBE.i32(r8);
		return r8;
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
    sum32():number {
		const alt=this.clone();
		Murmur3_32._sum(alt);
		return alt.#state>>>0;
    }

    /**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
        this.#state=this.#seed;
		//Reset ingest count
		this.#ingestBytes = 0;
		//Reset block (which is just pointing to the start)
		this.#bPos = 0;
	}

    /**
     * Create an empty IHash using the same algorithm
     */
    newEmpty(): IHash {
        return new Murmur3_32(this.#seed);
    }

    /**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): Murmur3_32 {
		const ret = new Murmur3_32(this.#seed);
        ret.#state=this.#state;
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}