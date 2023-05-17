/*! Copyright 2022-2023 gnabgib MPL-2.0 */

import * as littleEndian from '../endian/little.js';
import * as bitExt from '../primitive/BitExt.js';
import type { IHash } from './IHash.js';

//[MD4 to Historic Status](https://datatracker.ietf.org/doc/html/rfc6150) (2011)
//[The MD4 Message-Digest Algorithm](https://datatracker.ietf.org/doc/html/rfc1320) (1992)
//[The MD4 Message Digest Algorithm](https://datatracker.ietf.org/doc/html/rfc1186) (1990)
//[Wikipedia: MD4](https://en.wikipedia.org/wiki/MD4)

const digestSize = 16; //128 bits
const digestSizeU32 = 4;
const blockSize = 64; //512 bits
const spaceForLenBytes = 8; //Number of bytes needed to append length
//Initialize vector (section 3.3) 	Big endian 0-f,f-0
const iv = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

export class Md4 implements IHash {
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
	/**
	 * Number of bytes added to the hash
	 */
	#ingestBytes = 0;
	/**
	 * Position of data written to block
	 */
	#bPos = 0;

	/**
	 * Build a new MD4 hash generator
	 */
	constructor() {
		this.reset();
	}

	private hash() {
		const aa = this.#state[0];
		const bb = this.#state[1];
		const cc = this.#state[2];
		const dd = this.#state[3];

		const x = new Uint32Array(16);
		littleEndian.u32IntoArrFromBytes(x, 0, 16, this.#block);

		/* Round 1. */
		//a = (a + F(b,c,d) + X[k]) <<< s
		//F(X,Y,Z) = XY v not(X) Z // (X&Y)|(~X&Z) | X&(Y^Z)  // Z^(X&(Y^Z)) [more efficient]
		const round0col0 = 3;
		const round0col1 = 7;
		const round0col2 = 11;
		const round0col3 = 19;
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(this.#state[3] ^ (this.#state[1] & (this.#state[2] ^ this.#state[3]))) +
				x[0],
			round0col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(this.#state[2] ^ (this.#state[0] & (this.#state[1] ^ this.#state[2]))) +
				x[1],
			round0col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(this.#state[1] ^ (this.#state[3] & (this.#state[0] ^ this.#state[1]))) +
				x[2],
			round0col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(this.#state[0] ^ (this.#state[2] & (this.#state[3] ^ this.#state[0]))) +
				x[3],
			round0col3
		);
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(this.#state[3] ^ (this.#state[1] & (this.#state[2] ^ this.#state[3]))) +
				x[4],
			round0col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(this.#state[2] ^ (this.#state[0] & (this.#state[1] ^ this.#state[2]))) +
				x[5],
			round0col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(this.#state[1] ^ (this.#state[3] & (this.#state[0] ^ this.#state[1]))) +
				x[6],
			round0col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(this.#state[0] ^ (this.#state[2] & (this.#state[3] ^ this.#state[0]))) +
				x[7],
			round0col3
		);
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(this.#state[3] ^ (this.#state[1] & (this.#state[2] ^ this.#state[3]))) +
				x[8],
			round0col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(this.#state[2] ^ (this.#state[0] & (this.#state[1] ^ this.#state[2]))) +
				x[9],
			round0col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(this.#state[1] ^ (this.#state[3] & (this.#state[0] ^ this.#state[1]))) +
				x[10],
			round0col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(this.#state[0] ^ (this.#state[2] & (this.#state[3] ^ this.#state[0]))) +
				x[11],
			round0col3
		);
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(this.#state[3] ^ (this.#state[1] & (this.#state[2] ^ this.#state[3]))) +
				x[12],
			round0col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(this.#state[2] ^ (this.#state[0] & (this.#state[1] ^ this.#state[2]))) +
				x[13],
			round0col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(this.#state[1] ^ (this.#state[3] & (this.#state[0] ^ this.#state[1]))) +
				x[14],
			round0col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(this.#state[0] ^ (this.#state[2] & (this.#state[3] ^ this.#state[0]))) +
				x[15],
			round0col3
		);

		/* Round 2 */
		//a = (a + G(b,c,d) + X[k] + 5A827999) <<< s
		//G(X,Y,Z) = XY v XZ v YZ // (X&Y)|(X&Z)|(Y&Z) // (((X|Y)&Z)|(X&Y)) [more efficient]
		const round1col0 = 3;
		const round1col1 = 5;
		const round1col2 = 9;
		const round1col3 = 13;
		const round2Add = 0x5a827999; //sqrt(2)
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(((this.#state[1] | this.#state[2]) & this.#state[3]) |
					(this.#state[1] & this.#state[2])) +
				x[0] +
				round2Add,
			round1col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(((this.#state[0] | this.#state[1]) & this.#state[2]) |
					(this.#state[0] & this.#state[1])) +
				x[4] +
				round2Add,
			round1col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(((this.#state[0] | this.#state[1]) & this.#state[3]) |
					(this.#state[0] & this.#state[1])) +
				x[8] +
				round2Add,
			round1col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(((this.#state[0] | this.#state[2]) & this.#state[3]) |
					(this.#state[0] & this.#state[2])) +
				x[12] +
				round2Add,
			round1col3
		);
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(((this.#state[1] | this.#state[2]) & this.#state[3]) |
					(this.#state[1] & this.#state[2])) +
				x[1] +
				round2Add,
			round1col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(((this.#state[0] | this.#state[1]) & this.#state[2]) |
					(this.#state[0] & this.#state[1])) +
				x[5] +
				round2Add,
			round1col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(((this.#state[0] | this.#state[1]) & this.#state[3]) |
					(this.#state[0] & this.#state[1])) +
				x[9] +
				round2Add,
			round1col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(((this.#state[0] | this.#state[2]) & this.#state[3]) |
					(this.#state[0] & this.#state[2])) +
				x[13] +
				round2Add,
			round1col3
		);
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(((this.#state[1] | this.#state[2]) & this.#state[3]) |
					(this.#state[1] & this.#state[2])) +
				x[2] +
				round2Add,
			round1col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(((this.#state[0] | this.#state[1]) & this.#state[2]) |
					(this.#state[0] & this.#state[1])) +
				x[6] +
				round2Add,
			round1col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(((this.#state[0] | this.#state[1]) & this.#state[3]) |
					(this.#state[0] & this.#state[1])) +
				x[10] +
				round2Add,
			round1col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(((this.#state[0] | this.#state[2]) & this.#state[3]) |
					(this.#state[0] & this.#state[2])) +
				x[14] +
				round2Add,
			round1col3
		);
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(((this.#state[1] | this.#state[2]) & this.#state[3]) |
					(this.#state[1] & this.#state[2])) +
				x[3] +
				round2Add,
			round1col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(((this.#state[0] | this.#state[1]) & this.#state[2]) |
					(this.#state[0] & this.#state[1])) +
				x[7] +
				round2Add,
			round1col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(((this.#state[0] | this.#state[1]) & this.#state[3]) |
					(this.#state[0] & this.#state[1])) +
				x[11] +
				round2Add,
			round1col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(((this.#state[0] | this.#state[2]) & this.#state[3]) |
					(this.#state[0] & this.#state[2])) +
				x[15] +
				round2Add,
			round1col3
		);

		/* Round 3. */
		//a = (a + H(b,c,d) + X[k] + 6ED9EBA1) <<< s
		//H(X,Y,Z) = X xor Y xor Z // X^Y^Z
		const round2col0 = 3;
		const round2col1 = 9;
		const round2col2 = 11;
		const round2col3 = 15;
		const round3Add = 0x6ed9eba1; //sqrt(3)
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(this.#state[1] ^ this.#state[2] ^ this.#state[3]) +
				x[0] +
				round3Add,
			round2col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(this.#state[0] ^ this.#state[1] ^ this.#state[2]) +
				x[8] +
				round3Add,
			round2col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(this.#state[3] ^ this.#state[0] ^ this.#state[1]) +
				x[4] +
				round3Add,
			round2col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(this.#state[2] ^ this.#state[3] ^ this.#state[0]) +
				x[12] +
				round3Add,
			round2col3
		);
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(this.#state[1] ^ this.#state[2] ^ this.#state[3]) +
				x[2] +
				round3Add,
			round2col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(this.#state[0] ^ this.#state[1] ^ this.#state[2]) +
				x[10] +
				round3Add,
			round2col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(this.#state[3] ^ this.#state[0] ^ this.#state[1]) +
				x[6] +
				round3Add,
			round2col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(this.#state[2] ^ this.#state[3] ^ this.#state[0]) +
				x[14] +
				round3Add,
			round2col3
		);
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(this.#state[1] ^ this.#state[2] ^ this.#state[3]) +
				x[1] +
				round3Add,
			round2col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(this.#state[0] ^ this.#state[1] ^ this.#state[2]) +
				x[9] +
				round3Add,
			round2col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(this.#state[3] ^ this.#state[0] ^ this.#state[1]) +
				x[5] +
				round3Add,
			round2col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(this.#state[2] ^ this.#state[3] ^ this.#state[0]) +
				x[13] +
				round3Add,
			round2col3
		);
		this.#state[0] = bitExt.rotLeft32(
			this.#state[0] +
				(this.#state[1] ^ this.#state[2] ^ this.#state[3]) +
				x[3] +
				round3Add,
			round2col0
		);
		this.#state[3] = bitExt.rotLeft32(
			this.#state[3] +
				(this.#state[0] ^ this.#state[1] ^ this.#state[2]) +
				x[11] +
				round3Add,
			round2col1
		);
		this.#state[2] = bitExt.rotLeft32(
			this.#state[2] +
				(this.#state[3] ^ this.#state[0] ^ this.#state[1]) +
				x[7] +
				round3Add,
			round2col2
		);
		this.#state[1] = bitExt.rotLeft32(
			this.#state[1] +
				(this.#state[2] ^ this.#state[3] ^ this.#state[0]) +
				x[15] +
				round3Add,
			round2col3
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

		//Write out the data size in little-endian

		//We tracked bytes, <<3 (*8) to count bits
		littleEndian.u32IntoBytes(alt.#ingestBytes << 3, alt.#block, sizeSpace);
		//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
		littleEndian.u32IntoBytes(
			alt.#ingestBytes / 0x20000000,
			alt.#block,
			sizeSpace + 4
		);
		alt.hash();
		const ret = new Uint8Array(digestSize);
		littleEndian.u32ArrIntoBytesUnsafe(alt.#state, ret);
		return ret;
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
		return new Md4();
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	private clone(): Md4 {
		const ret = new Md4();
		ret.#state.set(this.#state);
		ret.#block.set(this.#block);
		ret.#ingestBytes = this.#ingestBytes;
		ret.#bPos = this.#bPos;
		return ret;
	}
}

//Encode RFC 1320 in JS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/*export*/ function generator() {
	const shiftSets = [
		[3, 7, 11, 19],
		[3, 5, 9, 13],
		[3, 9, 11, 15],
	];
	const rowSet = ['abcd', 'dabc', 'cdab', 'bcda'];
	const addSets = ['', '5A827999', '6ED9EBA1'];
	const posSets = [
		[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'],
		[0, 4, 8, 'c', 1, 5, 9, 'd', 2, 6, 'a', 'e', 3, 7, 'b', 'f'],
		[0, 8, 4, 'c', 2, 'a', 6, 'e', 1, 9, 5, 'd', 3, 'b', 7, 'f'],
	];
	const fns = [
		(x: string, y: string, z: string) =>
			'(' + z + ' ^ (' + x + ' & (' + y + ' ^ ' + z + ')))',
		(x: string, y: string, z: string) =>
			'(((' + x + ' | ' + y + ') & ' + z + ')|(' + x + ' & ' + y + '))',
		//(x, y, z) => '((' + x + ' & ' + y + ')|(' + x + ' & ' + z + ')|(' + y + ' & ' + z + '))',
		(x: string, y: string, z: string) => '(' + x + '^' + y + '^' + z + ')',
	];
	//3 blocks (rounds) in MD4
	for (let block = 0; block < 3; block++) {
		const s = shiftSets[block];
		console.log('/* Round', block + 1, '*/');
		console.log('const round' + block + 'col0 = ', s[0], ';');
		console.log('const round' + block + 'col1 = ', s[1], ';');
		console.log('const round' + block + 'col2 = ', s[2], ';');
		console.log('const round' + block + 'col3 = ', s[3], ';');
		const fn = fns[block];
		const pos = posSets[block];
		const add = addSets[block] === '' ? ',' : '+0x' + addSets[block] + ',';
		for (let i = 0; i < 16; i++) {
			const col = i % 4;
			//const row=(i/4)|0;
			const a = rowSet[col][0];
			const b = rowSet[col][1];
			const c = rowSet[col][2];
			const d = rowSet[col][3];
			console.log(
				a,
				'=bitExt.rotLeft32(',
				a,
				'+',
				fn(b, c, d),
				'+ x' + pos[i],
				add,
				'round' + block + 'col' + col,
				');'
			);
		}
		console.log('');
	}
}