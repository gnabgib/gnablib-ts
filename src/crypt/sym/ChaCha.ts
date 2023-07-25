/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { asLE } from '../../endian/platform.js';
import { safety } from '../../primitive/Safety.js';
import { U32 } from '../../primitive/U32.js';
import { IFullCrypt } from '../IFullCrypt.js';

const blockSize = 64; //16*32bit = 512bit
const blockSize32 = 16;

class ChaCha implements IFullCrypt {
	readonly blockSize = blockSize;
	/** ChaCha state */
	readonly #state = new Uint32Array(blockSize32);
	/** Temp processing block */
	readonly #b8 = new Uint8Array(blockSize);
	readonly #b32 = new Uint32Array(this.#b8.buffer);

	constructor(
		key: Uint8Array,
		nonce: Uint8Array,
		count: number,
		readonly rounds: number
	) {
		safety.lenExactly(key, 32, 'key'); //256 bit key
		safety.lenExactly(nonce, 12, 'nonce'); //96 bit nonce

		//Section 2.3 RFC7539
		//CONSTANTS
		//"expa" 	"nd 3" 	"2-by" 	"te k"  in ASCII
		this.#state[0] = 0x61707865;
		this.#state[1] = 0x3320646e;
		this.#state[2] = 0x79622d32;
		this.#state[3] = 0x6b206574;

		//KEY
		//Clone the key to not mutate the input
		const k = key.slice();
		//Make sure key is in little-endian
		asLE.i32(key, 0, 8);
		const k32 = new Uint32Array(k.buffer);
		this.#state[4] = k32[0];
		this.#state[5] = k32[1];
		this.#state[6] = k32[2];
		this.#state[7] = k32[3];
		this.#state[8] = k32[4];
		this.#state[9] = k32[5];
		this.#state[10] = k32[6];
		this.#state[11] = k32[7];

		//COUNTER
		this.#state[12] = count;

		//NONCE
		const n0 = nonce.slice();
		asLE.i32(n0, 0, 3);
		const n32 = new Uint32Array(n0.buffer);
		this.#state[13] = n32[0];
		this.#state[14] = n32[1];
		this.#state[15] = n32[2];
	}

    // prettier-ignore
	private quartRound(a: number, b: number, c: number, d: number) {
		this.#b32[a] += this.#b32[b]; this.#b32[d] = U32.rol(this.#b32[d] ^ this.#b32[a], 16);
		this.#b32[c] += this.#b32[d]; this.#b32[b] = U32.rol(this.#b32[b] ^ this.#b32[c], 12);
		this.#b32[a] += this.#b32[b]; this.#b32[d] = U32.rol(this.#b32[d] ^ this.#b32[a], 8);
		this.#b32[c] += this.#b32[d]; this.#b32[b] = U32.rol(this.#b32[b] ^ this.#b32[c], 7);
	}

	/** ChaCha state into block, increments counter each time */
	private block(): void {
		this.#b32.set(this.#state);
		for (let i = this.rounds; i > 0; i -= 2) {
			//Column round
			this.quartRound(0, 4, 8, 12);
			this.quartRound(1, 5, 9, 13);
			this.quartRound(2, 6, 10, 14);
			this.quartRound(3, 7, 11, 15);
			//Diagonal round
			this.quartRound(0, 5, 10, 15);
			this.quartRound(1, 6, 11, 12);
			this.quartRound(2, 7, 8, 13);
			this.quartRound(3, 4, 9, 14);
		}
		for (let i = 0; i < blockSize32; i++) this.#b32[i] += this.#state[i];
		this.#state[12] += 1;
	}

	decryptInto(plain: Uint8Array, enc: Uint8Array): void {
		let nToWrite = enc.length;
		let pos = 0;
		plain.set(enc);
		//Decrypt full blocks
		while (nToWrite >= blockSize) {
			this.block();
			for (let i = 0; i < blockSize; i++) {
				plain[pos++] ^= this.#b8[i];
			}
			nToWrite -= blockSize;
		}
		//Decrypt last truncated block
		if (nToWrite > 0) {
			this.block();
			for (let i = 0; i < nToWrite; i++) {
				plain[pos++] ^= this.#b8[i];
			}
		}
	}

	encryptInto(enc: Uint8Array, plain: Uint8Array): void {
		let nToWrite = plain.length;
		let pos = 0;
		enc.set(plain);
		//Encrypt full blocks
		while (nToWrite >= blockSize) {
			this.block();
			for (let i = 0; i < blockSize; i++) {
				enc[pos++] ^= this.#b8[i];
			}
			nToWrite -= blockSize;
		}
		//Encrypt last truncated block
		if (nToWrite > 0) {
			this.block();
			for (let i = 0; i < nToWrite; i++) {
				enc[pos++] ^= this.#b8[i];
			}
		}
	}

	encryptSize(plainLen: number): number {
		return plainLen;
	}
}

/**
 * [ChaCha20](https://en.wikipedia.org/wiki/Salsa20#ChaCha_variant)
 *
 * ChaCha is a stream cipher developed in 2008 by [Daniel J. Bernstein](https://cr.yp.to/djb.html).
 * Like {@link Salsa20}, the cipher is based on an add-rotate-XOR (ARX) function and designed to
 * increase the diffusion per round while achieving the same/better performance.  ChaCha uses the
 * CTR block mode
 *
 * First Published: *2008*
 * Blocksize: *64 bytes*
 * Key size: *32 bytes*
 * Rounds: *20*
 *
 * Specified in
 * - [RFC7539](https://datatracker.ietf.org/doc/html/rfc7539#autoid-11)
 */
export class ChaCha20 extends ChaCha {
	/**
	 * 
	 * @param key Key bytes, exactly 32 bytes (256 bits)
	 * @param nonce Non-repeated  NONCE, exactly 12 bytes (96 bits)
	 * @param count Block count generally 0 or 1 (default 0)
	 */
	constructor(key: Uint8Array, nonce: Uint8Array, count = 0) {
		super(key, nonce, count, 20);
	}
}
