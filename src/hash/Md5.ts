/*! Copyright 2022-2023 gnabgib MPL-2.0 */

import { asLE } from '../endian/platform.js';
import { U32 } from '../primitive/U32.js';
import type { IHash } from './IHash.js';

//[The MD5 Message-Digest Algorithm](https://datatracker.ietf.org/doc/html/rfc1321) (1992)
//[Wikipedia: MD5](https://en.wikipedia.org/wiki/MD5)
// You can generate test values with: `echo -n '<test>' | md5sum `
const digestSize = 16; //128 bits
const digestSizeU32 = 4;
const blockSize = 64; //512 bits
const spaceForLenBytes = 8; //Number of bytes needed to append length
//Initialize vector (section 3.3) 	Big endian 0-f,f-0
const iv = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

export class Md5 implements IHash {
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
	 * Build a new MD5 hash generator
	 */
	constructor() {
		this.reset();
	}

	private hash() {
		//console.log(i, n);
		const aa = this.#state[0];
		const bb = this.#state[1];
		const cc = this.#state[2];
		const dd = this.#state[3];

		//Make sure block is LE (might mangle state, but it's reset after hash)
		for(let i=0;i<blockSize;i+=4) asLE.i32(this.#block,i);

		/* Round 1. */
		//a = b + ((a + F(b,c,d) + X[k] + T[i]) <<< s)
		//F(X,Y,Z) = XY v not(X) Z // (X&Y)|(~X&Z) | X&(Y^Z)  // Z^(X&(Y^Z)) [more efficient]
		const round0col0 = 7;
		const round0col1 = 12;
		const round0col2 = 17;
		const round0col3 = 22;
		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(((this.#state[2] ^ this.#state[3]) & this.#state[1]) ^ this.#state[3]) +
					this.#state[0] +
					this.#block32[0] +
					0xd76aa478,
				round0col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(((this.#state[1] ^ this.#state[2]) & this.#state[0]) ^ this.#state[2]) +
					this.#state[3] +
					this.#block32[1] +
					0xe8c7b756,
				round0col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(((this.#state[0] ^ this.#state[1]) & this.#state[3]) ^ this.#state[1]) +
					this.#state[2] +
					this.#block32[2] +
					0x242070db,
				round0col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(((this.#state[3] ^ this.#state[0]) & this.#state[2]) ^ this.#state[0]) +
					this.#state[1] +
					this.#block32[3] +
					0xc1bdceee,
				round0col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(((this.#state[2] ^ this.#state[3]) & this.#state[1]) ^ this.#state[3]) +
					this.#state[0] +
					this.#block32[4] +
					0xf57c0faf,
				round0col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(((this.#state[1] ^ this.#state[2]) & this.#state[0]) ^ this.#state[2]) +
					this.#state[3] +
					this.#block32[5] +
					0x4787c62a,
				round0col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(((this.#state[0] ^ this.#state[1]) & this.#state[3]) ^ this.#state[1]) +
					this.#state[2] +
					this.#block32[6] +
					0xa8304613,
				round0col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(((this.#state[3] ^ this.#state[0]) & this.#state[2]) ^ this.#state[0]) +
					this.#state[1] +
					this.#block32[7] +
					0xfd469501,
				round0col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(((this.#state[2] ^ this.#state[3]) & this.#state[1]) ^ this.#state[3]) +
					this.#state[0] +
					this.#block32[8] +
					0x698098d8,
				round0col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(((this.#state[1] ^ this.#state[2]) & this.#state[0]) ^ this.#state[2]) +
					this.#state[3] +
					this.#block32[9] +
					0x8b44f7af,
				round0col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(((this.#state[0] ^ this.#state[1]) & this.#state[3]) ^ this.#state[1]) +
					this.#state[2] +
					this.#block32[10] +
					0xffff5bb1,
				round0col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(((this.#state[3] ^ this.#state[0]) & this.#state[2]) ^ this.#state[0]) +
					this.#state[1] +
					this.#block32[11] +
					0x895cd7be,
				round0col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(((this.#state[2] ^ this.#state[3]) & this.#state[1]) ^ this.#state[3]) +
					this.#state[0] +
					this.#block32[12] +
					0x6b901122,
				round0col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(((this.#state[1] ^ this.#state[2]) & this.#state[0]) ^ this.#state[2]) +
					this.#state[3] +
					this.#block32[13] +
					0xfd987193,
				round0col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(((this.#state[0] ^ this.#state[1]) & this.#state[3]) ^ this.#state[1]) +
					this.#state[2] +
					this.#block32[14] +
					0xa679438e,
				round0col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(((this.#state[3] ^ this.#state[0]) & this.#state[2]) ^ this.#state[0]) +
					this.#state[1] +
					this.#block32[15] +
					0x49b40821,
				round0col3
			);

		/* Round 2. */
		//a = b + ((a + G(b,c,d) + X[k] + T[i]) <<< s)
		//G(X,Y,Z) = XZ v Y not(Z) // (X&Z)|(Y&~Z) //  Y^(Z&(X^Y))
		const round1col0 = 5;
		const round1col1 = 9;
		const round1col2 = 14;
		const round1col3 = 20;
		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(((this.#state[1] ^ this.#state[2]) & this.#state[3]) ^ this.#state[2]) +
					this.#state[0] +
					this.#block32[1] +
					0xf61e2562,
				round1col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(((this.#state[0] ^ this.#state[1]) & this.#state[2]) ^ this.#state[1]) +
					this.#state[3] +
					this.#block32[6] +
					0xc040b340,
				round1col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(((this.#state[3] ^ this.#state[0]) & this.#state[1]) ^ this.#state[0]) +
					this.#state[2] +
					this.#block32[11] +
					0x265e5a51,
				round1col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(((this.#state[2] ^ this.#state[3]) & this.#state[0]) ^ this.#state[3]) +
					this.#state[1] +
					this.#block32[0] +
					0xe9b6c7aa,
				round1col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(((this.#state[1] ^ this.#state[2]) & this.#state[3]) ^ this.#state[2]) +
					this.#state[0] +
					this.#block32[5] +
					0xd62f105d,
				round1col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(((this.#state[0] ^ this.#state[1]) & this.#state[2]) ^ this.#state[1]) +
					this.#state[3] +
					this.#block32[10] +
					0x02441453,
				round1col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(((this.#state[3] ^ this.#state[0]) & this.#state[1]) ^ this.#state[0]) +
					this.#state[2] +
					this.#block32[15] +
					0xd8a1e681,
				round1col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(((this.#state[2] ^ this.#state[3]) & this.#state[0]) ^ this.#state[3]) +
					this.#state[1] +
					this.#block32[4] +
					0xe7d3fbc8,
				round1col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(((this.#state[1] ^ this.#state[2]) & this.#state[3]) ^ this.#state[2]) +
					this.#state[0] +
					this.#block32[9] +
					0x21e1cde6,
				round1col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(((this.#state[0] ^ this.#state[1]) & this.#state[2]) ^ this.#state[1]) +
					this.#state[3] +
					this.#block32[14] +
					0xc33707d6,
				round1col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(((this.#state[3] ^ this.#state[0]) & this.#state[1]) ^ this.#state[0]) +
					this.#state[2] +
					this.#block32[3] +
					0xf4d50d87,
				round1col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(((this.#state[2] ^ this.#state[3]) & this.#state[0]) ^ this.#state[3]) +
					this.#state[1] +
					this.#block32[8] +
					0x455a14ed,
				round1col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(((this.#state[1] ^ this.#state[2]) & this.#state[3]) ^ this.#state[2]) +
					this.#state[0] +
					this.#block32[13] +
					0xa9e3e905,
				round1col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(((this.#state[0] ^ this.#state[1]) & this.#state[2]) ^ this.#state[1]) +
					this.#state[3] +
					this.#block32[2] +
					0xfcefa3f8,
				round1col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(((this.#state[3] ^ this.#state[0]) & this.#state[1]) ^ this.#state[0]) +
					this.#state[2] +
					this.#block32[7] +
					0x676f02d9,
				round1col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(((this.#state[2] ^ this.#state[3]) & this.#state[0]) ^ this.#state[3]) +
					this.#state[1] +
					this.#block32[12] +
					0x8d2a4c8a,
				round1col3
			);

		/* Round 3. */
		//a = b + ((a + H(b,c,d) + X[k] + T[i]) <<< s)
		//H(X,Y,Z) = X xor Y xor Z // X^Y^Z
		const round2col0 = 4;
		const round2col1 = 11;
		const round2col2 = 16;
		const round2col3 = 23;
		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(this.#state[1] ^ this.#state[2] ^ this.#state[3]) +
					this.#state[0] +
					this.#block32[5] +
					0xfffa3942,
				round2col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(this.#state[0] ^ this.#state[1] ^ this.#state[2]) +
					this.#state[3] +
					this.#block32[8] +
					0x8771f681,
				round2col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(this.#state[3] ^ this.#state[0] ^ this.#state[1]) +
					this.#state[2] +
					this.#block32[11] +
					0x6d9d6122,
				round2col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(this.#state[2] ^ this.#state[3] ^ this.#state[0]) +
					this.#state[1] +
					this.#block32[14] +
					0xfde5380c,
				round2col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(this.#state[1] ^ this.#state[2] ^ this.#state[3]) +
					this.#state[0] +
					this.#block32[1] +
					0xa4beea44,
				round2col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(this.#state[0] ^ this.#state[1] ^ this.#state[2]) +
					this.#state[3] +
					this.#block32[4] +
					0x4bdecfa9,
				round2col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(this.#state[3] ^ this.#state[0] ^ this.#state[1]) +
					this.#state[2] +
					this.#block32[7] +
					0xf6bb4b60,
				round2col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(this.#state[2] ^ this.#state[3] ^ this.#state[0]) +
					this.#state[1] +
					this.#block32[10] +
					0xbebfbc70,
				round2col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(this.#state[1] ^ this.#state[2] ^ this.#state[3]) +
					this.#state[0] +
					this.#block32[13] +
					0x289b7ec6,
				round2col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(this.#state[0] ^ this.#state[1] ^ this.#state[2]) +
					this.#state[3] +
					this.#block32[0] +
					0xeaa127fa,
				round2col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(this.#state[3] ^ this.#state[0] ^ this.#state[1]) +
					this.#state[2] +
					this.#block32[3] +
					0xd4ef3085,
				round2col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(this.#state[2] ^ this.#state[3] ^ this.#state[0]) +
					this.#state[1] +
					this.#block32[6] +
					0x04881d05,
				round2col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(this.#state[1] ^ this.#state[2] ^ this.#state[3]) +
					this.#state[0] +
					this.#block32[9] +
					0xd9d4d039,
				round2col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(this.#state[0] ^ this.#state[1] ^ this.#state[2]) +
					this.#state[3] +
					this.#block32[12] +
					0xe6db99e5,
				round2col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(this.#state[3] ^ this.#state[0] ^ this.#state[1]) +
					this.#state[2] +
					this.#block32[15] +
					0x1fa27cf8,
				round2col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(this.#state[2] ^ this.#state[3] ^ this.#state[0]) +
					this.#state[1] +
					this.#block32[2] +
					0xc4ac5665,
				round2col3
			);

		/* Round 4. */
		//a = b + ((a + I(b,c,d) + X[k] + T[i]) <<< s)
		//I(X,Y,Z) = Y xor (X v not(Z)) // Y^(X|~Z)
		const round3col0 = 6;
		const round3col1 = 10;
		const round3col2 = 15;
		const round3col3 = 21;
		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(this.#state[2] ^ (this.#state[1] | ~this.#state[3])) +
					this.#state[0] +
					this.#block32[0] +
					0xf4292244,
				round3col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(this.#state[1] ^ (this.#state[0] | ~this.#state[2])) +
					this.#state[3] +
					this.#block32[7] +
					0x432aff97,
				round3col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(this.#state[0] ^ (this.#state[3] | ~this.#state[1])) +
					this.#state[2] +
					this.#block32[14] +
					0xab9423a7,
				round3col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(this.#state[3] ^ (this.#state[2] | ~this.#state[0])) +
					this.#state[1] +
					this.#block32[5] +
					0xfc93a039,
				round3col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(this.#state[2] ^ (this.#state[1] | ~this.#state[3])) +
					this.#state[0] +
					this.#block32[12] +
					0x655b59c3,
				round3col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(this.#state[1] ^ (this.#state[0] | ~this.#state[2])) +
					this.#state[3] +
					this.#block32[3] +
					0x8f0ccc92,
				round3col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(this.#state[0] ^ (this.#state[3] | ~this.#state[1])) +
					this.#state[2] +
					this.#block32[10] +
					0xffeff47d,
				round3col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(this.#state[3] ^ (this.#state[2] | ~this.#state[0])) +
					this.#state[1] +
					this.#block32[1] +
					0x85845dd1,
				round3col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(this.#state[2] ^ (this.#state[1] | ~this.#state[3])) +
					this.#state[0] +
					this.#block32[8] +
					0x6fa87e4f,
				round3col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(this.#state[1] ^ (this.#state[0] | ~this.#state[2])) +
					this.#state[3] +
					this.#block32[15] +
					0xfe2ce6e0,
				round3col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(this.#state[0] ^ (this.#state[3] | ~this.#state[1])) +
					this.#state[2] +
					this.#block32[6] +
					0xa3014314,
				round3col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(this.#state[3] ^ (this.#state[2] | ~this.#state[0])) +
					this.#state[1] +
					this.#block32[13] +
					0x4e0811a1,
				round3col3
			);

		this.#state[0] =
			this.#state[1] +
			U32.rol(
				(this.#state[2] ^ (this.#state[1] | ~this.#state[3])) +
					this.#state[0] +
					this.#block32[4] +
					0xf7537e82,
				round3col0
			);
		this.#state[3] =
			this.#state[0] +
			U32.rol(
				(this.#state[1] ^ (this.#state[0] | ~this.#state[2])) +
					this.#state[3] +
					this.#block32[11] +
					0xbd3af235,
				round3col1
			);
		this.#state[2] =
			this.#state[3] +
			U32.rol(
				(this.#state[0] ^ (this.#state[3] | ~this.#state[1])) +
					this.#state[2] +
					this.#block32[2] +
					0x2ad7d2bb,
				round3col2
			);
		this.#state[1] =
			this.#state[2] +
			U32.rol(
				(this.#state[3] ^ (this.#state[2] | ~this.#state[0])) +
					this.#state[1] +
					this.#block32[9] +
					0xeb86d391,
				round3col3
			);

		this.#state[0] += aa;
		this.#state[1] += bb;
		this.#state[2] += cc;
		this.#state[3] += dd;

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
		this.#block[this.#bPos] = 0x80;
		this.#bPos++;

		const sizeSpace = blockSize - spaceForLenBytes;

		//If there's not enough space, end this block
		if (this.#bPos > sizeSpace) {
			//Zero the remainder of the block
			this.#block.fill(0, this.#bPos);
			this.hash();
		}
		//Zero the rest of the block
		this.#block.fill(0, this.#bPos);

		//Write out the data size in little-endian
		const ss32=sizeSpace>>2;// div 4
		//We tracked bytes, <<3 (*8) to count bits
		this.#block32[ss32]=this.#ingestBytes << 3;
		//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
		this.#block32[ss32+1]=this.#ingestBytes / 0x20000000;
		//This might mangle #block, but we're about to hash anyway
		asLE.i32(this.#block,sizeSpace);
		asLE.i32(this.#block,sizeSpace+4);
		this.hash();

		//Project state into bytes
		const s8=new Uint8Array(this.#state.buffer,this.#state.byteOffset);
		//Make sure the bytes are LE - this might mangle alt.#state (but we're moments from disposing)
		for(let i=0;i<digestSize;i++) asLE.i32(s8,i*4);
		//Finally slice (duplicate) the data so caller can't discover hidden state
		return s8.slice(0,this.size);
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
		//Reset ingest count
		this.#ingestBytes = 0;
		//Reset block (which is just pointing to the start)
		this.#bPos = 0;
	}

	/**
     * Create an empty IHash using the same algorithm
     */
	newEmpty(): IHash {
		return new Md5();
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): Md5 {
		const ret = new Md5();
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}
