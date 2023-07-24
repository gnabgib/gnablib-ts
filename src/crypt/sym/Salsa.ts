/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { asLE } from '../../endian/platform.js';
import { InvalidValueError } from '../../primitive/ErrorExt.js';
import { safety } from '../../primitive/Safety.js';
import { U32 } from '../../primitive/U32.js';
import { U64 } from '../../primitive/U64.js';
import { IFullCrypt } from '../IFullCrypt.js';

const blockSize = 64; //16*32bit = 512bit
const blockSize32 = 16;

class Salsa implements IFullCrypt {
	readonly blockSize = blockSize;
	/** ChaCha state */
	readonly #state = new Uint32Array(blockSize32);
	/** Temp processing block */
	readonly #b8 = new Uint8Array(blockSize);
	readonly #b32 = new Uint32Array(this.#b8.buffer);

	constructor(
		key: Uint8Array,
		nonce: Uint8Array,
		count: U64,
		readonly rounds: number
	) {
		const k = new Uint8Array(32);
		if (key.length === 16) {
			//128 bit key (gets doubled)
			k.set(key);
			k.set(key, 16);
		} else if (key.length === 32) {
			//256 big key
			k.set(key);
		} else throw new InvalidValueError('key.length', key.length, 16, 32);
		safety.lenExactly(nonce, 8, 'nonce'); //96 bit nonce

		//CONSTANTS
		//"expa" 	"nd 3" 	"2-by" 	"te k"  in ASCII
		this.#state[0] = 0x61707865;
		this.#state[5] = 0x3320646e;
		this.#state[10] = 0x79622d32;
		this.#state[15] = 0x6b206574;

		//KEY
		//Clone the key to not mutate the input
		//const k = key.slice();
		//Make sure key is in little-endian
		asLE.i32(k, 0, 8);
		const k32 = new Uint32Array(k.buffer);
		this.#state[1] = k32[0];
		this.#state[2] = k32[1];
		this.#state[3] = k32[2];
		this.#state[4] = k32[3];
		this.#state[11] = k32[4];
		this.#state[12] = k32[5];
		this.#state[13] = k32[6];
		this.#state[14] = k32[7];

		//COUNTER
		this.#state[8] = count.low;
		this.#state[9] = count.high;

		//NONCE
		const n0 = nonce.slice();
		asLE.i32(n0, 0, 2);
		const n32 = new Uint32Array(n0.buffer);
		this.#state[6] = n32[0];
		this.#state[7] = n32[1];
	}

	// prettier-ignore
	private quartRound(a: number, b: number, c: number, d: number) {
        this.#b32[b] ^=  U32.rol(this.#b32[a] + this.#b32[d], 7);
        this.#b32[c] ^=  U32.rol(this.#b32[b] + this.#b32[a], 9);
        this.#b32[d] ^=  U32.rol(this.#b32[c] + this.#b32[b], 13);
        this.#b32[a] ^=  U32.rol(this.#b32[d] + this.#b32[c], 18);
	}

	/** Salsa state into block, increments counter each time */
	private block(): void {
		this.#b32.set(this.#state);
		for (let i = this.rounds; i > 0; i -= 2) {
			//Column round
			/* 0 - v v
			 * v 1 - v
			 * v v 2 -
			 * - v v 3
			 */
			this.quartRound(0, 4, 8, 12);
			this.quartRound(5, 9, 13, 1);
			this.quartRound(10, 14, 2, 6);
			this.quartRound(15, 3, 7, 11);
			//Row round
			/* 0 > > |
			 * | 1 > >
			 * > | 2 >
			 * > > | 3
			 */
			this.quartRound(0, 1, 2, 3);
			this.quartRound(5, 6, 7, 4);
			this.quartRound(10, 11, 8, 9);
			this.quartRound(15, 12, 13, 14);
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
 * [Salsa20](http://cr.yp.to/snuffle/spec.pdf)
 *
 * Salsa is a stream cipher developed in 2005 by [Daniel J. Bernstein](https://cr.yp.to/djb.html).
 * Like {@link ChaCha20}, the cipher is based on an add-rotate-XOR (ARX) function.  Salsa uses the
 * CTR block mode
 *
 * First Published: *2007*
 * Blocksize: *64 bytes*
 * Key size: *32 bytes*
 * Rounds: *20*
 *
 * Specified in
 * - [Snuffle 2005](https://cr.yp.to/snuffle.html)
 */
export class Salsa20 extends Salsa {
	constructor(key: Uint8Array, nonce: Uint8Array, count = U64.fromInt(1)) {
		super(key, nonce, count, 20);
	}
}
