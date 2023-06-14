/*! Copyright 2023 gnabgib MPL-2.0 */

import * as bigEndian from '../endian/big.js';
import { hex } from '../encoding/Hex.js';
import type { IHash } from './IHash.js';
import { Uint64 } from '../primitive/Uint64.js';
import { utf8 } from '../encoding/Utf8.js';
import { U32 } from '../primitive/U32.js';
import { asBE } from '../endian/platform.js';
import { safety } from '../primitive/Safety.js';

//[US Secure Hash Algorithms](https://datatracker.ietf.org/doc/html/rfc6234) (2011)
//[US Secure Hash Algorithms (SHA and HMAC-SHA)](https://datatracker.ietf.org/doc/html/rfc4634) (2006) - obsolete by above
//[Wikipedia: SHA-2](https://en.wikipedia.org/wiki/SHA-2)
// FIPS 180-4 (added 512/224, 512/256)
// You can generate test values with: `echo -n '<test>' | shasum -a (224|256|384|512|512224|512256) -`

const spaceForLen32 = 8; //Number of bytes needed to append length
const spaceForLen64 = 16; //Number of bytes needed to append length
const blockSize32 = 64;//bytes
const stateSize = 8;//* bit size
const wSize32 = 64;
const blockSize64 = 128;//bytes
const wSize64 = 80;

const iv512 = [
	//(first 64 bits of the fractional parts of the square roots of the first 8 primes 2..19):
	//These are 64bit numbers.. split into 2*32bit pieces.. there's 4 a line *2 lines=8 numbers
	//Note for 32bit use use 0+i*2 (every other value starting with the first)
	0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1, 
    0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
];

const iv384 = [
	//(first 64 bits of the fraction parts of the square roots of the 9th through 16th primes)
    //These are 64bit numbers.. split into 2*32bit pieces.. there's 4 a line *2 lines=8 numbers
	//Note for 32bit use use 1+i*2 (every other value starting with the second - quirk of sha224 to use the low bits
	0xcbbb9d5d, 0xc1059ed8, 0x629a292a, 0x367cd507, 0x9159015a, 0x3070dd17, 0x152fecd8, 0xf70e5939,
	0x67332667, 0xffc00b31, 0x8eb44a87, 0x68581511, 0xdb0c2e0d, 0x64f98fa7, 0x47b5481d, 0xbefa4fa4
];

const init512_224 = [
	//These are pre-generated call generateIV(224);
	0x8c3d37c8, 0x19544da2, 0x73e19966, 0x89dcd4d6, 0x1dfab7ae, 0x32ff9c82, 0x679dd514, 0x582f9fcf,
	0x0f6d2b69, 0x7bd44da8, 0x77e36f73, 0x04c48942, 0x3f9d85a8, 0x6a1d36c8, 0x1112e6ad, 0x91d692a1
];

const init512_256 = [
	//These are pre-generated call generateIV(256);
	0x22312194, 0xfc2bf72c, 0x9f555fa3, 0xc84c64c2, 0x2393b86b, 0x6f53b151, 0x96387719, 0x5940eabd,
	0x96283ee2, 0xa88effe3, 0xbe5e1e25, 0x53863992, 0x2b0199fc, 0x2c85b8aa, 0x0eb72ddc, 0x81c52ca2
];

const k = [
	//These are 64bit numbers.. split into 2*32bit pieces.. there's 4 a line *20 lines=80 numbers
	//Note for 32bit use use 0+i*2 (every other value starting with the first)
	0x428a2f98,
	0xd728ae22, 0x71374491, 0x23ef65cd, 0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5,
	0x8189dbbc, 0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019, 0x923f82a4,
	0xaf194f9b, 0xab1c5ed5, 0xda6d8118, 0xd807aa98, 0xa3030242, 0x12835b01,
	0x45706fbe, 0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2, 0x72be5d74,
	0xf27b896f, 0x80deb1fe, 0x3b1696b1, 0x9bdc06a7, 0x25c71235, 0xc19bf174,
	0xcf692694, 0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3, 0x0fc19dc6,
	0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65, 0x2de92c6f, 0x592b0275, 0x4a7484aa,
	0x6ea6e483, 0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5, 0x983e5152,
	0xee66dfab, 0xa831c66d, 0x2db43210, 0xb00327c8, 0x98fb213f, 0xbf597fc7,
	0xbeef0ee4, 0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725, 0x06ca6351,
	0xe003826f, 0x14292967, 0x0a0e6e70, 0x27b70a85, 0x46d22ffc, 0x2e1b2138,
	0x5c26c926, 0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df, 0x650a7354,
	0x8baf63de, 0x766a0abb, 0x3c77b2a8, 0x81c2c92e, 0x47edaee6, 0x92722c85,
	0x1482353b, 0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001, 0xc24b8b70,
	0xd0f89791, 0xc76c51a3, 0x0654be30, 0xd192e819, 0xd6ef5218, 0xd6990624,
	0x5565a910, 0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8, 0x19a4c116,
	0xb8d2d0c8, 0x1e376c08, 0x5141ab53, 0x2748774c, 0xdf8eeb99, 0x34b0bcb5,
	0xe19b48a8, 0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb, 0x5b9cca4f,
	0x7763e373, 0x682e6ff3, 0xd6b2b8a3, 0x748f82ee, 0x5defb2fc, 0x78a5636f,
	0x43172f60, 0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec, 0x90befffa,
	0x23631e28, 0xa4506ceb, 0xde82bde9, 0xbef9a3f7, 0xb2c67915, 0xc67178f2,
	0xe372532b, 0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207, 0xeada7dd6,
	0xcde0eb1e, 0xf57d4f7f, 0xee6ed178, 0x06f067aa, 0x72176fba, 0x0a637dc5,
	0xa2c898a6, 0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b, 0x28db77f5,
	0x23047d84, 0x32caab7b, 0x40c72493, 0x3c9ebe0a, 0x15c9bebc, 0x431d67c4,
	0x9c100d4c, 0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a, 0x5fcb6fab,
	0x3ad6faec, 0x6c44198c, 0x4a475817,
];

type iv32 = (state: Uint32Array) => void;
type iv64 = (state: Array<Uint64>) => void;

class Sha2_32bit implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size: number;
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSize32;
	/**
	 * Runtime state of the hash
	 */
	readonly #state = new Uint32Array(stateSize);
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSize32);
	readonly #block32=new Uint32Array(this.#block.buffer);
	/**
	 * Number of bytes added to the hash
	 */
	#ingestBytes = 0;
	/**
	 * Position of data written to block
	 */
	#bPos = 0;
	readonly #iv: iv32;

	constructor(digestSize: number, iv: iv32) {
		this.size = digestSize;
		this.#iv = iv;
		this.reset();
	}

	private hash() {
		const w = new Uint32Array(wSize32);
		asBE.i32(this.#block,0,16);
		w.set(this.#block32);

		//Expand
		let j = 16;
		for (; j < w.length; j++) {
			const w15 = w[j - 15];
			const w2 = w[j - 2];
			const s0 = U32.ror(w15, 7) ^ U32.ror(w15, 18) ^ (w15 >>> 3);
			const s1 = U32.ror(w2, 17) ^ U32.ror(w2, 19) ^ (w2 >>> 10);
			w[j] = w[j - 16] + s0 + w[j - 7] + s1;
		}

		let a = this.#state[0],
			b = this.#state[1],
			c = this.#state[2],
			d = this.#state[3],
			e = this.#state[4],
			f = this.#state[5],
			g = this.#state[6],
			h = this.#state[7];

		for (j = 0; j < w.length; j++) {
			const s1 = U32.ror(e, 6) ^ U32.ror(e, 11) ^ U32.ror(e, 25);
			//const ch=(e&f)^((~e)&g);//Same as MD4-r1
			const ch = g ^ (e & (f ^ g)); //Same as MD4-r1
			const temp1 = h + s1 + ch + k[j * 2] + w[j];
			const s0 = U32.ror(a, 2) ^ U32.ror(a, 13) ^ U32.ror(a, 22);
			//const maj=(a&b)^(a&c)^(b&c);
			const maj = ((a ^ b) & c) ^ (a & b); //Similar to MD4-r2 (| -> ^)
			const temp2 = s0 + maj;

			(h = g), (g = f), (f = e), (e = d + temp1), (d = c), (c = b), (b = a), (a = temp1 + temp2);
		}

		this.#state[0] += a;
		this.#state[1] += b;
		this.#state[2] += c;
		this.#state[3] += d;
		this.#state[4] += e;
		this.#state[5] += f;
		this.#state[6] += g;
		this.#state[7] += h;

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

		const sizeSpace = this.blockSize - spaceForLen32;

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
		for(let i=0;i<this.size;i++) asBE.i32(s8,i*4);
		return s8.slice(0,this.size);
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this.#iv(this.#state);
		//Reset ingest count
		this.#ingestBytes = 0;
		//Reset block (which is just pointing to the start)
		this.#bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Sha2_32bit(this.size, this.#iv);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	private clone(): Sha2_32bit {
		const ret = new Sha2_32bit(this.size, this.#iv);
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}

class Sha2_64bit implements IHash {
	/**
	 * Digest size in bytes
	 */
	readonly size: number;
	/**
	 * Block size in bytes
	 */
	readonly blockSize = blockSize64;
	/**
	 * Runtime state of the hash
	 */
	readonly #state = new Array<Uint64>(stateSize);
	/**
	 * Temp processing block
	 */
	readonly #block = new Uint8Array(blockSize64);
	/**
	 * Number of bytes added to the hash
	 */
	#ingestBytes = 0;
	/**
	 * Position of data written to block
	 */
	#bPos = 0;
	readonly #iv: iv64;

	constructor(digestSize: number, iv: iv64) {
		this.size = digestSize;
		this.#iv = iv;
		this.reset();
	}

	private hash() {
		const w = new Array<Uint64>(wSize64);
		//Copy
		bigEndian.u64IntoArrFromBytes(w, 0, 16, this.#block);

		//Expand
		let j = 16;
		for (; j < wSize64; j++) {
			const w15 = w[j - 15];
			const w2 = w[j - 2];
			const s0 = w15.rRot(1).xor(w15.rRot(8)).xor(w15.rShift(7));
			const s1 = w2.rRot(19).xor(w2.rRot(61)).xor(w2.rShift(6));
			w[j] = w[j - 16]
				.add(s0)
				.add(w[j - 7])
				.add(s1);
		}

		let a = this.#state[0],
			b = this.#state[1],
			c = this.#state[2],
			d = this.#state[3],
			e = this.#state[4],
			f = this.#state[5],
			g = this.#state[6],
			h = this.#state[7];

		for (j = 0; j < wSize64; j++) {
			const kU64 = new Uint64(k[j * 2 + 1], k[j * 2]);
			const s1 = e.rRot(14).xor(e.rRot(18)).xor(e.rRot(41));
			const ch = g.xor(e.and(f.xor(g))); //Same as MD4-r1
			const temp1 = h.add(s1).add(ch).add(kU64).add(w[j]);

			const s0 = a.rRot(28).xor(a.rRot(34)).xor(a.rRot(39));
			const maj = a.xor(b).and(c).xor(a.and(b)); //Similar to MD4-r2 (| -> ^)
			const temp2 = s0.add(maj);


			(h = g), (g = f), (f = e), (e = d.add(temp1)), (d = c), (c = b), (b = a), (a = temp1.add(temp2));
		}

		this.#state[0] = this.#state[0].add(a);
		this.#state[1] = this.#state[1].add(b);
		this.#state[2] = this.#state[2].add(c);
		this.#state[3] = this.#state[3].add(d);
		this.#state[4] = this.#state[4].add(e);
		this.#state[5] = this.#state[5].add(f);
		this.#state[6] = this.#state[6].add(g);
		this.#state[7] = this.#state[7].add(h);

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

		const sizeSpace = this.blockSize - spaceForLen64;

		//If there's not enough space, end this block
		if (alt.#bPos > sizeSpace) {
			//Zero the remainder of the block
			alt.#block.fill(0, alt.#bPos);
			alt.hash();
		}
		//Zero the rest of the block
		alt.#block.fill(0, alt.#bPos);

		//Write out the data size in big-endian
        // There's space for 128 bits of size (spaceForLenBytes64=16) but we can only count
        // up to 2^52 bits (JS limitation), so we only need to write n+2,n+3 values (the others are zero)

		//We tracked bytes, <<3 (*8) to count bits
		//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
		bigEndian.u32IntoBytes(
			alt.#ingestBytes / 0x20000000,
			alt.#block,
			sizeSpace+8
		);
		bigEndian.u32IntoBytes(alt.#ingestBytes << 3, alt.#block, sizeSpace + 12);
		alt.hash();
		const ret = new Uint8Array(this.size);
		bigEndian.u64ArrIntoBytesSafe(alt.#state, ret);
		return ret;
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this.#iv(this.#state);
		//Reset ingest count
		this.#ingestBytes = 0;
		//Reset block (which is just pointing to the start)
		this.#bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new Sha2_64bit(this.size, this.#iv);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	private clone(): Sha2_64bit {
		const ret = new Sha2_64bit(this.size, this.#iv);
        for(let i=0;i<stateSize;i++) ret.#state[i]=this.#state[i];
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}

/**
 * The "SHA-512/t IV generation function"
 * - This is expensive (you have to SHA512 with a modified INIT in order to generate the new
 *  initial values, so for the common forms (224,256), the init is hard-coded.
 * @see Sha512_224, @see Sha512_256
 * @param t - Must be a multiple of 8, greater than zero, less than 512, and NOT 384
 *  (use @see Sha384 instead)
 * @throws {EnforceTypeError} - t isn't a number
 * @throws {RangeError}- t doesn't satisfy above rules
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/*export*/ function generateIV(t: number): void {
	safety.intSatisfies(t,(t) => t >= 8 && t <= 504 && t % 8 == 0 && t != 384);
	//First we xor 0xa5a5a5a5a5a5a5a5 with the initial IV
	// In two parts: 0xa5a5a5a5 0xa5a5a5a5
	const init = new Array<number>(iv512.length);
	for (let i = 0; i < init.length; i++) init[i] = (iv512[i] ^ 0xa5a5a5a5)>>>0;

    const iv=(state: Array<Uint64>) => {
		//Setup state
        state[0]=new Uint64(init[1],init[0]);
        state[1]=new Uint64(init[3],init[2]);
        state[2]=new Uint64(init[5],init[4]);
        state[3]=new Uint64(init[7],init[6]);
        state[4]=new Uint64(init[9],init[8]);
        state[5]=new Uint64(init[11],init[10]);
        state[6]=new Uint64(init[13],init[12]);
        state[7]=new Uint64(init[15],init[14]);
	}
	//Now we SHA2-512 the description string
    const gen=new Sha2_64bit(64,iv);
    gen.write(utf8.toBytes('SHA-512/' + t.toString()));
    const hash=gen.sum();
    for(let i=0;i<hash.length;i+=8)
        console.log(`0x${hex.fromBytes(hash.subarray(i,i+4))}, 0x${hex.fromBytes(hash.subarray(i+4,i+8))},`);
}

export class Sha224 extends Sha2_32bit {
	/**
	 * Build a new Sha2-224 hash generator
	 */
    constructor() {
		super(28, Sha224.iv);
	}

	private static iv(state: Uint32Array): void {
		//Setup state
		state[0] = iv384[1];
		state[1] = iv384[3];
		state[2] = iv384[5];
		state[3] = iv384[7];
		state[4] = iv384[9];
		state[5] = iv384[11];
		state[6] = iv384[13];
		state[7] = iv384[15];
	}
}

export class Sha256 extends Sha2_32bit {
    /**
	 * Build a new Sha2-256 hash generator
	 */
    constructor() {
		super(32, Sha256.iv);
	}

	private static iv(state: Uint32Array): void {
		//Setup state
		state[0] = iv512[0];
		state[1] = iv512[2];
		state[2] = iv512[4];
		state[3] = iv512[6];
		state[4] = iv512[8];
		state[5] = iv512[10];
		state[6] = iv512[12];
		state[7] = iv512[14];
	}
}

export class Sha384 extends Sha2_64bit {
    /**
	 * Build a new Sha2-384 hash generator
	 */
	constructor() {
		super(48, Sha384.iv);
	}

	private static iv(state: Array<Uint64>): void {
		//Setup state
        state[0]=new Uint64(iv384[1],iv384[0]);
        state[1]=new Uint64(iv384[3],iv384[2]);
        state[2]=new Uint64(iv384[5],iv384[4]);
        state[3]=new Uint64(iv384[7],iv384[6]);
        state[4]=new Uint64(iv384[9],iv384[8]);
        state[5]=new Uint64(iv384[11],iv384[10]);
        state[6]=new Uint64(iv384[13],iv384[12]);
        state[7]=new Uint64(iv384[15],iv384[14]);
    }
}

export class Sha512 extends Sha2_64bit {
    /**
	 * Build a new Sha2-512 hash generator
	 */
    constructor() {
		super(64, Sha512.iv);
	}

	private static iv(state: Array<Uint64>): void {
		//Setup state
        state[0]=new Uint64(iv512[1],iv512[0]);
        state[1]=new Uint64(iv512[3],iv512[2]);
        state[2]=new Uint64(iv512[5],iv512[4]);
        state[3]=new Uint64(iv512[7],iv512[6]);
        state[4]=new Uint64(iv512[9],iv512[8]);
        state[5]=new Uint64(iv512[11],iv512[10]);
        state[6]=new Uint64(iv512[13],iv512[12]);
        state[7]=new Uint64(iv512[15],iv512[14]);
	}
}

export class Sha512_224 extends Sha2_64bit {
    /**
	 * Build a new Sha2-512/224 hash generator
	 */
	constructor() {
		super(28, Sha512_224.iv);
	}

	private static iv(state: Array<Uint64>): void {
		//Setup state
        state[0]=new Uint64(init512_224[1],init512_224[0]);
        state[1]=new Uint64(init512_224[3],init512_224[2]);
        state[2]=new Uint64(init512_224[5],init512_224[4]);
        state[3]=new Uint64(init512_224[7],init512_224[6]);
        state[4]=new Uint64(init512_224[9],init512_224[8]);
        state[5]=new Uint64(init512_224[11],init512_224[10]);
        state[6]=new Uint64(init512_224[13],init512_224[12]);
        state[7]=new Uint64(init512_224[15],init512_224[14]);
	}
}

export class Sha512_256 extends Sha2_64bit {
    /**
	 * Build a new Sha2-512/256 hash generator
	 */
    constructor() {
		super(32, Sha512_256.iv);
	}

	private static iv(state: Array<Uint64>): void {
		//Setup state
        state[0]=new Uint64(init512_256[1],init512_256[0]);
        state[1]=new Uint64(init512_256[3],init512_256[2]);
        state[2]=new Uint64(init512_256[5],init512_256[4]);
        state[3]=new Uint64(init512_256[7],init512_256[6]);
        state[4]=new Uint64(init512_256[9],init512_256[8]);
        state[5]=new Uint64(init512_256[11],init512_256[10]);
        state[6]=new Uint64(init512_256[13],init512_256[12]);
        state[7]=new Uint64(init512_256[15],init512_256[14]);
	}
}
