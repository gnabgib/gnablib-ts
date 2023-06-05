/*! Copyright 2023 gnabgib MPL-2.0 */

import type { IHash } from './IHash.js';
import { U32, U32Mut, U32ish } from '../primitive/U32.js';
import { asLE } from '../endian/platform.js';

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
	readonly #state:U32Mut;
    /**
     * Starting seed
     */
    readonly #seed:U32;
    /**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSize);
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
	constructor(seed:U32ish=0) {
        this.#seed=U32.coerce(seed);
        this.#state=this.#seed.mut();
	}

    hash():void {
        //#block=k1, #state=h1
		asLE.i32(this.#block);
        this.#state.xorEq(U32.fromBytes(this.#block).mul(c1).lRot(r1).mul(c2))
            .lRotEq(r2).mulEq(m).addEq(n);
        
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

	_sum():U32Mut {
		const alt = this.clone();
        if (alt.#bPos>0) {
            alt.#block.fill(0,alt.#bPos);
			asLE.i32(alt.#block);
            alt.#state.xorEq(U32.fromBytes(alt.#block).mul(c1).lRot(r1).mul(c2));
        }

        alt.#state.xorEq(alt.#ingestBytes);

        //fmix
        alt.#state.xorEq(alt.#state.clone().rShiftEq(16)).mulEq(c3);
        alt.#state.xorEq(alt.#state.clone().rShiftEq(13)).mulEq(c4);
        alt.#state.xorEq(alt.#state.clone().rShiftEq(16));
		return alt.#state;
	}
	

    sum(): Uint8Array {
		const ret=this._sum().toBytes();
		asLE.i32(ret);
		return ret;
    }
    sum32():number {
		const ret=this._sum();
		return ret.value;
    }

    /**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
        this.#state.value=0
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
	private clone(): Murmur3_32 {
		const ret = new Murmur3_32(this.#seed);
        ret.#state.value=this.#state.value;
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}