/*! Copyright 2023 gnabgib MPL-2.0 */

import * as bigEndian from '../endian/big.js';
import { Uint64 } from '../primitive/Uint64.js';
import type { IHash } from './IHash.js';

//[Wikipedia: Whirlpool (hash function)](https://en.wikipedia.org/wiki/Whirlpool_(hash_function))
//[The Whirlpool Hash Function](https://web.archive.org/web/20171129084214/http://www.larc.usp.br/~pbarreto/WhirlpoolPage.html)
//[The Whirlpool Secure Hash Function](https://www2.seas.gwu.edu/~poorvi/Classes/CS381_2007/Whirlpool.pdf) (2006)

const blockSizeEls=8;
const digestSizeEls=8;
const spaceForLen=32;//256bit length
const rounds = 10;
const circulantTable = new Array<Uint64>(8 * 256);
const roundConstants = new Array<Uint64>(rounds);

const substitutionBox = new Uint8Array([
	//block 0
	0x18, 0x23, 0xc6, 0xe8, 0x87, 0xb8, 0x01, 0x4f, 0x36, 0xa6, 0xd2, 0xf5, 0x79,
	0x6f, 0x91, 0x52, 0x60, 0xbc, 0x9b, 0x8e, 0xa3, 0x0c, 0x7b, 0x35, 0x1d, 0xe0,
	0xd7, 0xc2, 0x2e, 0x4b, 0xfe, 0x57, 0x15, 0x77, 0x37, 0xe5, 0x9f, 0xf0, 0x4a,
	0xda, 0x58, 0xc9, 0x29, 0x0a, 0xb1, 0xa0, 0x6b, 0x85, 0xbd, 0x5d, 0x10, 0xf4,
	0xcb, 0x3e, 0x05, 0x67, 0xe4, 0x27, 0x41, 0x8b, 0xa7, 0x7d, 0x95, 0xd8,
	//block 1
	0xfb, 0xee, 0x7c, 0x66, 0xdd, 0x17, 0x47, 0x9e, 0xca, 0x2d, 0xbf, 0x07, 0xad,
	0x5a, 0x83, 0x33, 0x63, 0x02, 0xaa, 0x71, 0xc8, 0x19, 0x49, 0xd9, 0xf2, 0xe3,
	0x5b, 0x88, 0x9a, 0x26, 0x32, 0xb0, 0xe9, 0x0f, 0xd5, 0x80, 0xbe, 0xcd, 0x34,
	0x48, 0xff, 0x7a, 0x90, 0x5f, 0x20, 0x68, 0x1a, 0xae, 0xb4, 0x54, 0x93, 0x22,
	0x64, 0xf1, 0x73, 0x12, 0x40, 0x08, 0xc3, 0xec, 0xdb, 0xa1, 0x8d, 0x3d,
	//block 2
	0x97, 0x00, 0xcf, 0x2b, 0x76, 0x82, 0xd6, 0x1b, 0xb5, 0xaf, 0x6a, 0x50, 0x45,
	0xf3, 0x30, 0xef, 0x3f, 0x55, 0xa2, 0xea, 0x65, 0xba, 0x2f, 0xc0, 0xde, 0x1c,
	0xfd, 0x4d, 0x92, 0x75, 0x06, 0x8a, 0xb2, 0xe6, 0x0e, 0x1f, 0x62, 0xd4, 0xa8,
	0x96, 0xf9, 0xc5, 0x25, 0x59, 0x84, 0x72, 0x39, 0x4c, 0x5e, 0x78, 0x38, 0x8c,
	0xd1, 0xa5, 0xe2, 0x61, 0xb3, 0x21, 0x9c, 0x1e, 0x43, 0xc7, 0xfc, 0x04,
	//block 3
	0x51, 0x99, 0x6d, 0x0d, 0xfa, 0xdf, 0x7e, 0x24, 0x3b, 0xab, 0xce, 0x11, 0x8f,
	0x4e, 0xb7, 0xeb, 0x3c, 0x81, 0x94, 0xf7, 0xb9, 0x13, 0x2c, 0xd3, 0xe7, 0x6e,
	0xc4, 0x03, 0x56, 0x44, 0x7f, 0xa9, 0x2a, 0xbb, 0xc1, 0x53, 0xdc, 0x0b, 0x9d,
	0x6c, 0x31, 0x74, 0xf6, 0x46, 0xac, 0x89, 0x14, 0xe1, 0x16, 0x3a, 0x69, 0x09,
	0x70, 0xb6, 0xd0, 0xed, 0xcc, 0x42, 0x98, 0xa4, 0x28, 0x5c, 0xf8, 0x86,
]);
function init() {
	for (let x = 0; x < 256; x++) {
		const v1 = substitutionBox[x];
		let v2 = v1 << 1;
		if (v2 >= 0x100) v2 ^= 0x11d;
		let v4 = v2 << 1;
		if (v4 >= 0x100) v4 ^= 0x11d;
		const v5 = v4 ^ v1;
		let v8 = v4 << 1;
		if (v8 >= 0x100) v8 ^= 0x11d;
		const v9 = v8 ^ v1;
		circulantTable[x] = new Uint64(
			((v8 << 24) | (v5 << 16) | (v2 << 8) | v9) >>> 0,
			((v1 << 24) | (v1 << 16) | (v4 << 8) | v1) >>> 0
		);
		for (let t = 1; t < 8; t++) {
			circulantTable[(t << 8) | x] = circulantTable[((t - 1) << 8) | x].rRot(8);
		}
	}

	for (let r = 0; r < rounds; r++) {
		let r8 = r << 3;
		roundConstants[r] = circulantTable[r8++]
			.and(new Uint64(0, 0xff000000))
			.xor(circulantTable[(1 << 8) | r8++].and(new Uint64(0, 0x00ff0000)))
			.xor(circulantTable[(2 << 8) | r8++].and(new Uint64(0, 0x0000ff00)))
			.xor(circulantTable[(3 << 8) | r8++].and(new Uint64(0, 0x000000ff)))
			.xor(circulantTable[(4 << 8) | r8++].and(new Uint64(0xff000000, 0)))
			.xor(circulantTable[(5 << 8) | r8++].and(new Uint64(0x00ff0000, 0)))
			.xor(circulantTable[(6 << 8) | r8++].and(new Uint64(0x0000ff00, 0)))
			.xor(circulantTable[(7 << 8) | r8].and(new Uint64(0x000000ff, 0)));
	}
}
init();

export class Whirlpool implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size=digestSizeEls<<3;//64bit els
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSizeEls<<3;//64bit els
	/**
	 * Runtime state of the hash
	 */
	readonly #state = new Array<Uint64>(digestSizeEls);
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSizeEls<<3);
	/**
	 * Number of bytes added to the hash
	 */
	#ingestBytes = Uint64.zero;
	/**
	 * Position of data written to block
	 */
	#bPos = 0;	

    /**
	 * Build a new Whirlpool hash generator
	 */
    constructor() {
        this.reset();
    }

    /**
     * aka Transform
     */
    private hash() {
        const state = new Array<Uint64>(blockSizeEls);
		const K = new Array<Uint64>(blockSizeEls);
		const L = new Array<Uint64>(blockSizeEls);

		//Initialize K and state
		K[0] = this.#state[0];state[0] = Uint64.fromBytes(this.#block,0).xor(K[0]);
		K[1] = this.#state[1];state[1] = Uint64.fromBytes(this.#block,8).xor(K[1]);
		K[2] = this.#state[2];state[2] = Uint64.fromBytes(this.#block,16).xor(K[2]);
		K[3] = this.#state[3];state[3] = Uint64.fromBytes(this.#block,24).xor(K[3]);
		K[4] = this.#state[4];state[4] = Uint64.fromBytes(this.#block,32).xor(K[4]);
		K[5] = this.#state[5];state[5] = Uint64.fromBytes(this.#block,40).xor(K[5]);
		K[6] = this.#state[6];state[6] = Uint64.fromBytes(this.#block,48).xor(K[6]);
		K[7] = this.#state[7];state[7] = Uint64.fromBytes(this.#block,56).xor(K[7]);
		for (let r = 0; r < rounds; r++) {
			for (let i = 0; i < 8; i++) {
				// //Loop unroll:
				// L[i] = new Uint64(0);
				// for (let t = 0; t < 8; t++) {
				// 	const s=56-(t<<3);
				// 	const ctPos=t<<8|((K[(i - t) & 7].rRot(s)).lowU32 & 0xff);
				//     L[i]=L[i].xor(circulantTable[ctPos]);
				// }
				L[i] = circulantTable[K[i].rShift(56).lowU32 & 0xff]
					.xor(circulantTable[256 | (K[(i - 1) & 7].rShift(48).lowU32 & 0xff)])
					.xor(circulantTable[512 | (K[(i - 2) & 7].rShift(40).lowU32 & 0xff)])
					.xor(circulantTable[768 | (K[(i - 3) & 7].rShift(32).lowU32 & 0xff)])
					.xor(circulantTable[1024 | (K[(i - 4) & 7].rShift(24).lowU32 & 0xff)])
					.xor(circulantTable[1280 | (K[(i - 5) & 7].rShift(16).lowU32 & 0xff)])
					.xor(circulantTable[1536 | (K[(i - 6) & 7].rShift(8).lowU32 & 0xff)])
					.xor(circulantTable[1792 | (K[(i - 7) & 7].lowU32 & 0xff)]);
			}
			L[0] = L[0].xor(roundConstants[r]);
			for (let i = 0; i < 8; i++) {
				//Update K for next round, because L used K we need to do this separately
				K[i] = L[i];

				// //Loop unroll:
				// L[i]=K[i];
				// for (let t = 0; t < 8; t++) {
				// 	const s=56-(t<<3);
				// 	const ctPos=t<<8|((state[(i - t) & 7].rRot(s)).lowU32 & 0xff);
				// 	L[i]=L[i].xor(circulantTable[ctPos]);
				// }
				L[i] = L[i]
					.xor(circulantTable[state[i].rShift(56).lowU32 & 0xff])
					.xor(circulantTable[256 | (state[(i - 1) & 7].rShift(48).lowU32 & 0xff)])
					.xor(circulantTable[512 | (state[(i - 2) & 7].rShift(40).lowU32 & 0xff)])
					.xor(circulantTable[768 | (state[(i - 3) & 7].rShift(32).lowU32 & 0xff)])
					.xor(circulantTable[1024 | (state[(i - 4) & 7].rShift(24).lowU32 & 0xff)])
					.xor(circulantTable[1280 | (state[(i - 5) & 7].rShift(16).lowU32 & 0xff)])
					.xor(circulantTable[1536 | (state[(i - 6) & 7].rShift(8).lowU32 & 0xff)])
					.xor(circulantTable[1792 | (state[(i - 7) & 7].lowU32 & 0xff)]);
			}
			//Because state is used in L gen (above), we need to do this separately
			state[0] = L[0];
			state[1] = L[1];
			state[2] = L[2];
			state[3] = L[3];
			state[4] = L[4];
			state[5] = L[5];
			state[6] = L[6];
			state[7] = L[7];
		}
		//Apply the Miyaguchi-Preneel compression function:
        this.#state[0] = this.#state[0].xor(state[0].xor(Uint64.fromBytes(this.#block,0)));
        this.#state[1] = this.#state[1].xor(state[1].xor(Uint64.fromBytes(this.#block,8)));
        this.#state[2] = this.#state[2].xor(state[2].xor(Uint64.fromBytes(this.#block,16)));
        this.#state[3] = this.#state[3].xor(state[3].xor(Uint64.fromBytes(this.#block,24)));
        this.#state[4] = this.#state[4].xor(state[4].xor(Uint64.fromBytes(this.#block,32)));
        this.#state[5] = this.#state[5].xor(state[5].xor(Uint64.fromBytes(this.#block,40)));
        this.#state[6] = this.#state[6].xor(state[6].xor(Uint64.fromBytes(this.#block,48)));
        this.#state[7] = this.#state[7].xor(state[7].xor(Uint64.fromBytes(this.#block,56)));

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
		this.#ingestBytes = this.#ingestBytes.add(Uint64.fromNumber(data.length));

		let nToWrite = data.length;
		let dPos = 0;
		let space = this.blockSize - this.#bPos;
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
			this.#block.set(data.subarray(dPos, dPos + this.blockSize), this.#bPos);
			this.#bPos += space;
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
        const alt = this.clone();
        alt.#block[alt.#bPos] = 0x80;
		alt.#bPos++;

        const sizeSpace = this.blockSize - spaceForLen;
        		//If there's not enough space, end this block
		if (alt.#bPos > sizeSpace) {
			//Zero the remainder of the block
			alt.#block.fill(0, alt.#bPos);
			alt.hash();
		}
        //Zero the rest of the block
		alt.#block.fill(0, alt.#bPos);

        //Technically we write 256bit length ([ms_u64,u64,u64,ls_u64]), but we only count 67 bits (for now)
        // so only need to write the last two spots
        //bigEndian.u64IntoBytes(this.#ingestBytesHigh.rShift(61), alt.#block, sizeSpace);
        //bigEndian.u64IntoBytes(this.#ingestBytesHigh.lShift(3), alt.#block, sizeSpace+8);
        bigEndian.u64IntoBytes(alt.#ingestBytes.rShift(61), alt.#block, sizeSpace+16);
        bigEndian.u64IntoBytes(alt.#ingestBytes.lShift(3), alt.#block, sizeSpace+24);
		alt.hash();
		const ret = new Uint8Array(alt.size);
		bigEndian.u64ArrIntoBytesSafe(alt.#state, ret);
		return ret;   
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		//Setup state
		this.#state[0] = Uint64.zero;
        this.#state[1] = Uint64.zero;
        this.#state[2] = Uint64.zero;
        this.#state[3] = Uint64.zero;
        this.#state[4] = Uint64.zero;
        this.#state[5] = Uint64.zero;
        this.#state[6] = Uint64.zero;
        this.#state[7] = Uint64.zero;

		//Reset ingest count
		this.#ingestBytes = Uint64.zero;
		//Reset block (which is just pointing to the start)
		this.#bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Whirlpool();
	}
	
	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	private clone(): Whirlpool {
		const ret = new Whirlpool();
		for(let i=0;i<digestSizeEls;i++) ret.#state[i]=this.#state[i];
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}