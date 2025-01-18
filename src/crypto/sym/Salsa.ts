/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { asLE } from '../../endian/platform.js';
import { ContentError } from '../../error/ContentError.js';
import { U32 } from '../../primitive/number/U32.js';
import { U64, U64Mut } from '../../primitive/number/U64.js';
import { sLen } from '../../safe/safe.js';
import { IFullCrypt } from '../interfaces/IFullCrypt.js';

const blockSize = 64; //16*32bit = 512bit
const blockSize32 = 16;
/** Round constants ("expa" 	"nd 3" 	"2-by" 	"te k"  in ASCII) */
const sigma = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];
/** Round constants ("expa" 	"nd 1" 	"6-by" 	"te k"  in ASCII) */
const tau = [0x61707865, 0x3120646e, 0x79622d36, 0x6b206574];

class SalsaBlock {
	readonly u8 = new Uint8Array(blockSize);
	readonly u32 = new Uint32Array(this.u8.buffer);

	constructor(readonly rounds: number) {}

	// // prettier-ignore
	// private quartRound(a: number, b: number, c: number, d: number) {
	//     this.u32[b] ^=  U32.rol(this.u32[a] + this.u32[d], 7);
	//     this.u32[c] ^=  U32.rol(this.u32[b] + this.u32[a], 9);
	//     this.u32[d] ^=  U32.rol(this.u32[c] + this.u32[b], 13);
	//     this.u32[a] ^=  U32.rol(this.u32[d] + this.u32[c], 18);
	// }

	public block(): void {
		// prettier-ignore
		for (let i = this.rounds; i > 0; i -= 2) {
			//Column round
			/* 0 o v v
			 * v 1 o v
			 * v v 2 o
			 * o v v 3
			 */
			// this.quartRound(0, 4, 8, 12);
            this.u32[4] ^=  U32.rol(this.u32[0] + this.u32[12], 7);
            this.u32[8] ^=  U32.rol(this.u32[4] + this.u32[0], 9);
            this.u32[12] ^=  U32.rol(this.u32[8] + this.u32[4], 13);
            this.u32[0] ^=  U32.rol(this.u32[12] + this.u32[8], 18);
			// this.quartRound(5, 9, 13, 1);
            this.u32[9] ^=  U32.rol(this.u32[5] + this.u32[1], 7);
            this.u32[13] ^=  U32.rol(this.u32[9] + this.u32[5], 9);
            this.u32[1] ^=  U32.rol(this.u32[13] + this.u32[9], 13);
            this.u32[5] ^=  U32.rol(this.u32[1] + this.u32[13], 18);
            // this.quartRound(10, 14, 2, 6);
            this.u32[14] ^=  U32.rol(this.u32[10] + this.u32[6], 7);
            this.u32[2] ^=  U32.rol(this.u32[14] + this.u32[10], 9);
            this.u32[6] ^=  U32.rol(this.u32[2] + this.u32[14], 13);
            this.u32[10] ^=  U32.rol(this.u32[6] + this.u32[2], 18);
			// this.quartRound(15, 3, 7, 11);
            this.u32[3] ^=  U32.rol(this.u32[15] + this.u32[11], 7);
            this.u32[7] ^=  U32.rol(this.u32[3] + this.u32[15], 9);
            this.u32[11] ^=  U32.rol(this.u32[7] + this.u32[3], 13);
            this.u32[15] ^=  U32.rol(this.u32[11] + this.u32[7], 18);
			
            //Row round
			/*[0 > > o
			 * o[1 > >
			 * > o[2 >
			 * > > o[3
			 */
			//this.quartRound(0, 1, 2, 3);
            this.u32[1] ^=  U32.rol(this.u32[0] + this.u32[3], 7);
            this.u32[2] ^=  U32.rol(this.u32[1] + this.u32[0], 9);
            this.u32[3] ^=  U32.rol(this.u32[2] + this.u32[1], 13);
            this.u32[0] ^=  U32.rol(this.u32[3] + this.u32[2], 18);
			//this.quartRound(5, 6, 7, 4);
            this.u32[6] ^=  U32.rol(this.u32[5] + this.u32[4], 7);
            this.u32[7] ^=  U32.rol(this.u32[6] + this.u32[5], 9);
            this.u32[4] ^=  U32.rol(this.u32[7] + this.u32[6], 13);
            this.u32[5] ^=  U32.rol(this.u32[4] + this.u32[7], 18);
			//this.quartRound(10, 11, 8, 9);
            this.u32[11] ^=  U32.rol(this.u32[10] + this.u32[9], 7);
            this.u32[8] ^=  U32.rol(this.u32[11] + this.u32[10], 9);
            this.u32[9] ^=  U32.rol(this.u32[8] + this.u32[11], 13);
            this.u32[10] ^=  U32.rol(this.u32[9] + this.u32[8], 18);
			//this.quartRound(15, 12, 13, 14);
            this.u32[12] ^=  U32.rol(this.u32[15] + this.u32[14], 7);
            this.u32[13] ^=  U32.rol(this.u32[12] + this.u32[15], 9);
            this.u32[14] ^=  U32.rol(this.u32[13] + this.u32[12], 13);
            this.u32[15] ^=  U32.rol(this.u32[14] + this.u32[13], 18);
		}
	}
}

class Salsa implements IFullCrypt {
	readonly blockSize = blockSize;
	readonly #state = new Uint32Array(blockSize32);
	/** Temp processing block */
	readonly #b: SalsaBlock;
	private readonly _count: U64Mut;

	constructor(key: Uint8Array, nonce: Uint8Array, count: U64, rounds: number) {
		this.#b = new SalsaBlock(rounds);
		/* C K K K
		 * K C N N
		 * P P C K
		 * K K K C */

		let ka: Uint8Array;
		let kb: Uint8Array;
		let rc: Array<number>;
		if (key.length === 16) {
			//128 bit key
			//Ka = Kb = LE(Key)
			ka = key.slice(0);
			asLE.i32(ka, 0, 4);
			kb = ka.slice();
			rc = tau;
		} else if (key.length === 32) {
			//256 bit key
			// ka= LE(Key[0:16]), kb=LE(Key[16:32])
			ka = key.slice(0, 16);
			asLE.i32(ka, 0, 4);
			kb = key.slice(16, 32);
			asLE.i32(kb, 0, 4);
			rc = sigma;
		} else
			throw new ContentError('should be 16 or 32', 'key.length', key.length);
		sLen('nonce', nonce).exactly(8).throwNot(); //64 bit nonce

		//CONSTANTS
		this.#state[0] = rc[0];
		this.#state[5] = rc[1];
		this.#state[10] = rc[2];
		this.#state[15] = rc[3];

		//KEY
		const ka32 = new Uint32Array(ka.buffer);
		this.#state.set(ka32, 1);
		const kb32 = new Uint32Array(kb.buffer);
		this.#state.set(kb32, 11);

		//COUNTER
		//Bind #count to the state array in position 8/9 (we know U64 uses little endian order)
		this._count = U64Mut.fromArray(this.#state, 8);
		this._count.set(count);

		//NONCE
		const n = nonce.slice();
		asLE.i32(n, 0, 2);
		const n32 = new Uint32Array(n.buffer);
		this.#state[6] = n32[0];
		this.#state[7] = n32[1];
	}

	/** Salsa state into block, increments counter each time */
	private block(): void {
		this.#b.u32.set(this.#state);
		this.#b.block();
		for (let i = 0; i < blockSize32; i++) this.#b.u32[i] += this.#state[i];
		this._count.addEq(U64.fromInt(1));
	}

	decryptInto(plain: Uint8Array, enc: Uint8Array): void {
		let nToWrite = enc.length;
		let pos = 0;
		if (enc !== plain) plain.set(enc);
		//Decrypt full blocks
		while (nToWrite >= blockSize) {
			this.block();
			for (let i = 0; i < blockSize; i++) {
				plain[pos++] ^= this.#b.u8[i];
			}
			nToWrite -= blockSize;
		}
		//Decrypt last truncated block
		if (nToWrite > 0) {
			this.block();
			for (let i = 0; i < nToWrite; i++) {
				plain[pos++] ^= this.#b.u8[i];
			}
		}
	}

	encryptInto(enc: Uint8Array, plain: Uint8Array): void {
		let nToWrite = plain.length;
		let pos = 0;
		if (enc !== plain) enc.set(plain);
		//Encrypt full blocks
		while (nToWrite >= blockSize) {
			this.block();
			for (let i = 0; i < blockSize; i++) {
				enc[pos++] ^= this.#b.u8[i];
			}
			nToWrite -= blockSize;
		}
		//Encrypt last truncated block
		if (nToWrite > 0) {
			this.block();
			for (let i = 0; i < nToWrite; i++) {
				enc[pos++] ^= this.#b.u8[i];
			}
		}
	}

	encryptSize(plainLen: number): number {
		return plainLen;
	}
}

function hSalsa(
	output: Uint8Array,
	key: Uint8Array,
	input: Uint8Array,
	rounds: number
): void {
	sLen('output', output).atLeast(32).throwNot(); //256 bit output
	sLen('key', key).exactly(32).throwNot(); //256 bit key
	const b = new SalsaBlock(rounds);
	/* C K K K
	 * K C I I
	 * I I C K
	 * K K K C */

	//Setup block
	//CONSTANTS
	b.u32[0] = sigma[0];
	b.u32[5] = sigma[1];
	b.u32[10] = sigma[2];
	b.u32[15] = sigma[3];

	//KEY (8 u32)
	b.u8.set(key.slice(0, 16), 4);
	b.u8.set(key.slice(16, 32), 44); //11*4

	//Input (4 u32) - because input could be >16
	b.u8.set(input.subarray(0, 16), 24); //6*4

	//Make sure everything is LE
	asLE.i32(b.u8, 0, 16);

	//Generate output
	b.block();
	const b32 = new Uint32Array(
		output.buffer,
		output.byteOffset,
		output.byteLength >>> 2
	);
	// #b.u32 = z in docs
	b32[0] = b.u32[0];
	b32[1] = b.u32[5];
	b32[2] = b.u32[10];
	b32[3] = b.u32[15];
	b32[4] = b.u32[6];
	b32[5] = b.u32[7];
	b32[6] = b.u32[8];
	b32[7] = b.u32[9];
	asLE.i32(output, 0, 8);
}

class XSalsa extends Salsa {
	constructor(key: Uint8Array, nonce: Uint8Array, count: U64, rounds: number) {
		sLen('nonce', nonce).exactly(24).throwNot(); //192 bit nonce

		//Generate z (hSalsa output)
		const z = new Uint8Array(32);
		hSalsa(z, key, nonce, rounds);

		super(z, nonce.subarray(16), count, rounds);
	}
}

/**
 * [Salsa20](http://cr.yp.to/snuffle/spec.pdf)
 *
 * Salsa is a stream cipher developed in 2005 by [Daniel J. Bernstein](https://cr.yp.to/djb.html).
 * Like {@link crypto.ChaCha20 | ChaCha20}, the cipher is based on an add-rotate-XOR (ARX) function.  Salsa uses the
 * CTR block mode
 *
 * First Published: *2007*
 * Blocksize: *64 bytes*
 * Key size: *16, 32 bytes*
 * Nonce size: *8 bytes*
 * Rounds: *20*
 *
 * Specified in
 * - [Snuffle 2005](https://cr.yp.to/snuffle.html)
 */
export class Salsa20 extends Salsa {
	/**
	 * @param key Key bytes, either 16 or 32 bytes in length (128, 256 bits)
	 * @param nonce Non-repeated NONCE, exactly 8 bytes (64 bits)
	 * @param count Block count generally 0 or 1 (default 0)
	 */
	constructor(key: Uint8Array, nonce: Uint8Array, count = U64.zero) {
		super(key, nonce, count, 20);
	}
}

/**
 * HSalsa20 Turns 256 bits of key + 128 bits of input into 256 bits of output
 * @param output At least 32 bytes (256 bits / 8 U32)
 * @param key Exactly 32 bytes (256 bits / 8 U32)
 * @param input At least 16 bytes (128 bits / 4 U32) - only first 16 bytes are used
 */
export function hSalsa20(
	output: Uint8Array,
	key: Uint8Array,
	input: Uint8Array
): void {
	sLen('input', input).atLeast(16).throwNot(); //128 bit input
	hSalsa(output, key, input, 20);
}

/**
 * [XSalsa20](https://en.wikipedia.org/wiki/Salsa20#XSalsa20_with_192-bit_nonce)
 *
 * XSalsa20 is a variant of {@link Salsa20} that allows a 192 bit (24 byte) nonce, far more
 * than Salsa's 64 bit (8 byte) nonce.  Larger nonce allows longer reuse of keys (you should
 * not reuse nonces).
 *
 * First Published: *2008*
 * Blocksize: *64 bytes*
 * Key size: *16, 32 bytes*
 * Nonce size: *24 bytes*
 * Rounds: *20*
 */
export class XSalsa20 extends XSalsa {
	/**
	 * @param key Key bytes, 32 bytes in length (256 bits, 8 U32)
	 * @param nonce Non-repeated NONCE, exactly 24 bytes (192 bits, 6 U32)
	 * @param count Block count generally 0 or 1 (default 0)
	 */
	constructor(key: Uint8Array, nonce: Uint8Array, count = U64.zero) {
		super(key, nonce, count, 20);
	}
}

//Salsa20_12 Salsa20_8 XSalsa20_12 XSalsa20_8
