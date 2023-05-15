/*! Copyright 2023 gnabgib MPL-2.0 */

//import * as hex from '../encoding/Hex.js';
import type { IHash } from "./IHash.js";
import * as littleEndian from '../endian/little.js';
import { Uint64 } from '../primitive/Uint64.js';
import * as intExt from '../primitive/IntExt.js';

//[Wikipedia: SHA-3](https://en.wikipedia.org/wiki/SHA-3)
//[Keccak](https://keccak.team/keccak.html)
//[FIPS PUB 202: SHA3-Standard](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf) (2015)

//https://emn178.github.io/online-tools/keccak_224.html (256,384,512, SHA3 224,256,384,512 Shake 128,256)

const roundConst = [
	0x00000000, 0x00000001, 0x00000000, 0x00008082, 0x80000000, 0x0000808a, 0x80000000, 0x80008000,
	0x00000000, 0x0000808b, 0x00000000, 0x80000001, 0x80000000, 0x80008081, 0x80000000, 0x00008009,
	0x00000000, 0x0000008a, 0x00000000, 0x00000088, 0x00000000, 0x80008009, 0x00000000, 0x8000000a,
	0x00000000, 0x8000808b, 0x80000000, 0x0000008b, 0x80000000, 0x00008089, 0x80000000, 0x00008003,
	0x80000000, 0x00008002, 0x80000000, 0x00000080, 0x00000000, 0x0000800a, 0x80000000, 0x8000000a,
	0x80000000, 0x80008081, 0x80000000, 0x00008080, 0x00000000, 0x80000001, 0x80000000, 0x80008008
];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function rhoGen() {
	// Rho shift: (t+1)(t+2)/2=t^2+3t+2 mod 64
	// https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf#3.2.2
	const ret = [];
	for (let i = 0; i < 24; i++) ret.push(((i * i + 3 * i + 2) / 2) % 64);
	console.log(`const rhoShift=[${ret.join(', ')}];`);
}
const rhoShift = [
	1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44
];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function piGen() {
	//Pi shift: [(x+3y)%5,x]->[x,y]
	//https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf#3.2.3
	const pullFrom = [];
	for (let i = 0; i < 25; i++) {
		const x = i % 5;
		const y = (i / 5) | 0;
		const p = ((x + 3 * y) % 5) + x * 5;
		//Inverse of formula:
		pullFrom[p] = i;
	}
	const ret = [];
	let st = pullFrom[1];
	//Now follow the money
	for (let i = 0; i < 24; i++) {
		ret.push(st);
		st = pullFrom[st];
	}
	console.log(`const piShift=[${ret.join(', ')}];`);
}
const piShift = [
	10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1
];

const rounds = 24;
const maxBlockSizeU64 = 5 * 5;
const maxBlockSizeBytes = 200; //1600 bits,8*5*5=200
const keccak_suffix = 1;
const sha3_suffix = 6;
const shake_suffix = 0x1f;

class KeccakCore implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size:number;
	/**
	 * Block size in bytes
	 */
	readonly blockSize:number;
	/**
	 * Runtime state of the hash
	 */
	readonly #state = new Uint8Array(maxBlockSizeBytes);
	/**
	 * Temp processing block
	 */
	readonly #block:Uint8Array;
    readonly #suffix:number;
	/**
	 * Number of bytes added to the hash
	 */
	#ingestBytes = Uint64.zero;
	/**
	 * Position of data written to block
	 */
	#bPos = 0;	

	/**
	 * @param suffix 1 for Keccak, 6 for SHA3, 0x1f/31 for Shake
	 * @param digestSizeBytes Output digest size (bytes)
	 * @param capacityBytes (default digestSize)
	 */
	constructor(suffix: number, digestSizeBytes: number, capacityBytes = 0) {
		intExt.inRangeInclusive(capacityBytes, 0, maxBlockSizeBytes / 2);
        if (capacityBytes<=0) capacityBytes=digestSizeBytes;
        capacityBytes*=2;

		this.#suffix = suffix;
        this.size=digestSizeBytes;
        this.blockSize= maxBlockSizeBytes - capacityBytes;
		this.#block=new Uint8Array(maxBlockSizeBytes);

        this.reset();
	}

    /**
     * aka absorb
     */
    private hash():void {
        //Copy state-bytes into u64
		const st = new Array<Uint64>(maxBlockSizeU64);
		littleEndian.u64IntoArrFromBytes(st, 0, maxBlockSizeU64, this.#block);

		const bc = new Array<Uint64>(5);
		let t: Uint64;
		for (let r = 0; r < rounds; r++) {
			// Theta
			//unroll: for (let i = 0; i < 5; i++) bc[i]=st[i].xor(st[i+5]).xor(st[i+10]).xor(st[i+15]).xor(st[i+20]);
			bc[0] = st[0].xor(st[5]).xor(st[10]).xor(st[15]).xor(st[20]);
			bc[1] = st[1].xor(st[6]).xor(st[11]).xor(st[16]).xor(st[21]);
			bc[2] = st[2].xor(st[7]).xor(st[12]).xor(st[17]).xor(st[22]);
			bc[3] = st[3].xor(st[8]).xor(st[13]).xor(st[18]).xor(st[23]);
			bc[4] = st[4].xor(st[9]).xor(st[14]).xor(st[19]).xor(st[24]);
			for (let i = 0; i < 5; i++) {
				t = bc[(i + 4) % 5].xor(bc[(i + 1) % 5].lRot(1));
				st[i] = st[i].xor(t);
				st[i + 5] = st[i + 5].xor(t);
				st[i + 10] = st[i + 10].xor(t);
				st[i + 15] = st[i + 15].xor(t);
				st[i + 20] = st[i + 20].xor(t);
			}

			// Rho & Pi
			t = st[1];
			for (let i = 0; i < 24; i++) {
				const j = piShift[i];
				bc[0] = st[j];
				st[j] = t.lRot(rhoShift[i]);
				t = bc[0];
			}

			//  Chi
			for (let j = 0; j < 25; j += 5) {
				//unroll: for (let i = 0; i < 5; i++) bc[i] = st[j + i];
				bc[0] = st[j];
				bc[1] = st[j + 1];
				bc[2] = st[j + 2];
				bc[3] = st[j + 3];
				bc[4] = st[j + 4];
				//unroll: for (let i = 0; i < 5; i++) st[j+i]=st[j+i].xor(bc[(i + 2) % 5].and(bc[(i + 1) % 5].not()));
				st[j] = st[j].xor(bc[2].and(bc[1].not()));
				st[j + 1] = st[j + 1].xor(bc[3].and(bc[2].not()));
				st[j + 2] = st[j + 2].xor(bc[4].and(bc[3].not()));
				st[j + 3] = st[j + 3].xor(bc[0].and(bc[4].not()));
				st[j + 4] = st[j + 4].xor(bc[1].and(bc[0].not()));
			}

			//  Iota
			st[0] = st[0].xor(new Uint64(roundConst[2 * r + 1], roundConst[2 * r]));
		}
		//Copy the data back to state
		littleEndian.u64ArrIntoBytes(st, this.#block);
		//Reset block pointer
		this.#bPos = 0;
    }

    write(data: Uint8Array): void {
        for (let i = 0; i < data.length; i++) {
			this.#block[this.#bPos++] ^= data[i];
			if (this.#bPos === this.blockSize) {
				this.hash();
				this.#bPos = 0;
			}
		}
    }

    /**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */    
    sum(): Uint8Array {
        const alt = this.clone();
        //End with a 0b1 in MSB
		alt.#block[alt.#bPos] ^= alt.#suffix;
        alt.#block[alt.blockSize - 1] ^= 0x80;
		alt.hash();
        //Squeeze
		return alt.#block.slice(0, alt.size);
    }

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
    reset(): void {
        this.#state.fill(0,0);
        this.#block.fill(0,0);
		//Reset ingest count
		this.#ingestBytes = Uint64.zero;
		//Reset block (which is just pointing to the start)
		this.#bPos = 0;
    }

	/**
	 * Create an empty IHash using the same algorithm
	 */
    newEmpty(): IHash {
        return new KeccakCore(this.#suffix,this.size,(maxBlockSizeBytes-this.blockSize)/2);
    }

    /**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	private clone(): KeccakCore {
		const ret = new KeccakCore(this.#suffix,this.size,(maxBlockSizeBytes-this.blockSize)/2);
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}

export class Keccak extends KeccakCore {
    /**
     * Build a new Keccak hash generator
     * @param digestSize Output digest size (bytes)
     * @param capacityBytes Capacity (Keccak specific param) if <=0 it's @param digestSize
     */
    constructor(digestSize:number,capacityBytes = 0) {
        super(keccak_suffix,digestSize,capacityBytes);
    }
}
export class Keccak224 extends KeccakCore {
    /**
     * Build a new Keccak 224bit hash generator
     * @param capacityBytes Capacity (Keccak specific param) if <=0 it's 224
     */
    constructor(capacityBytes = 0) {
        super(keccak_suffix,28/*224/8*/,capacityBytes);
    }
}
export class Keccak256 extends KeccakCore {
    /**
     * Build a new Keccak 256bit hash generator
     * @param capacityBytes Capacity (Keccak specific param) if <=0 it's 256
     */
    constructor(capacityBytes = 0) {
        super(keccak_suffix,32/*256/8*/,capacityBytes);
    }
}
export class Keccak384 extends KeccakCore {
    /**
     * Build a new Keccak 384bit hash generator
     * @param capacityBytes Capacity (Keccak specific param) if <=0 it's 384
     */
    constructor(capacityBytes = 0) {
        super(keccak_suffix,48/*384/8*/,capacityBytes);
    }
}
export class Keccak512 extends KeccakCore {
    /**
     * Build a new Keccak 512bit hash generator
     * @param capacityBytes Capacity (Keccak specific param) if <=0 it's 512
     */
    constructor(capacityBytes = 0) {
        super(keccak_suffix,64/*512/8*/,capacityBytes);
    }
}

export class Sha3_224 extends KeccakCore {
    /**
     * Build a new Sha3 224bit hash generator
     */
    constructor() {
        super(sha3_suffix,28/*224/8*/);
    }
}
export class Sha3_256 extends KeccakCore {
    /**
     * Build a new Sha3 256bit hash generator
     */
    constructor() {
        super(sha3_suffix,32/*256/8*/);
    }
}
export class Sha3_384 extends KeccakCore {
    /**
     * Build a new Sha3 384bit hash generator
     */
    constructor() {
        super(sha3_suffix,48/*384/8*/);
    }
}
export class Sha3_512 extends KeccakCore {
    /**
     * Build a new Sha3 512bit hash generator
     */
    constructor() {
        super(sha3_suffix,64/*512/8*/);
    }
}

export class Shake128 extends KeccakCore {
    /**
     * Build a new Shake 128bit XOF generator
     * @param digestSize Output digest size (bytes)
     */
    constructor(digestSize: number) {
        super(shake_suffix,digestSize,16/*128/8*/);
    }
}
export class Shake256 extends KeccakCore {
    /**
     * Build a new Shake 256bit XOF generator
     * @param digestSize Output digest size (bytes)
     */
    constructor(digestSize: number) {
        super(shake_suffix,digestSize,32/*256/8*/);
    }
}
