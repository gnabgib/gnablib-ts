/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { asLE } from '../../endian/platform.js';
import { InvalidValueError } from '../../primitive/ErrorExt.js';
import { safety } from '../../primitive/Safety.js';
import { U32 } from '../../primitive/number/U32.js';
import { IFullCrypt } from '../interfaces/IFullCrypt.js';

const blockSize = 64; //16*32bit = 512bit
const blockSize32 = 16;
const COUNT=12;
/** Round constants ("expa" 	"nd 3" 	"2-by" 	"te k"  in ASCII) */
const sigma=Uint32Array.of(0x61707865, 0x3320646e, 0x79622d32, 0x6b206574);
/** Round constants ("expa" 	"nd 1" 	"6-by" 	"te k"  in ASCII) */
const tau=Uint32Array.of(0x61707865, 0x3120646e, 0x79622d36, 0x6b206574);

class ChaChaBlock {
	readonly u8 = new Uint8Array(blockSize);
	readonly u32 = new Uint32Array(this.u8.buffer);

	constructor(readonly rounds: number) {}

	// prettier-ignore
	private quartRound(a: number, b: number, c: number, d: number) {
		this.u32[a] += this.u32[b]; this.u32[d] = U32.rol(this.u32[d] ^ this.u32[a], 16);
		this.u32[c] += this.u32[d]; this.u32[b] = U32.rol(this.u32[b] ^ this.u32[c], 12);
		this.u32[a] += this.u32[b]; this.u32[d] = U32.rol(this.u32[d] ^ this.u32[a], 8);
		this.u32[c] += this.u32[d]; this.u32[b] = U32.rol(this.u32[b] ^ this.u32[c], 7);
	}

	public block():void {
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
	}
}

class ChaCha implements IFullCrypt {
	readonly blockSize = blockSize;
	readonly #state = new Uint32Array(blockSize32);
	/** Temp processing block */
	readonly #b: ChaChaBlock;

	constructor(
		key: Uint8Array,
		nonce: Uint8Array,
		count: number,
		rounds: number
	) {
		this.#b = new ChaChaBlock(rounds);
		/* C C C C
		 * K K K K
		 * K K K K
		 * P N N N */


		let k:Uint8Array;
        let rc:Uint32Array;
        if (key.length===16) {
            //128 bit key
			k=new Uint8Array(32);
			k.set(key,0);
			k.set(key,16);
            rc=tau;
        } else if (key.length===32) {
            //256 bit key
            k=key.slice();
            rc=sigma;
        } else throw new InvalidValueError('key.length', key.length, 16, 32);
		safety.lenExactly(nonce, 12, 'nonce'); //96 bit nonce
		asLE.i32(k,0,8);

		//CONSTANTS
		this.#state.set(rc);

		//KEY
		const k32 = new Uint32Array(k.buffer);
		this.#state.set(k32,4);

		//COUNTER
		this.#state[COUNT] = count;

		//NONCE
		const n = nonce.slice();
		asLE.i32(n, 0, 3);
		const n32 = new Uint32Array(n.buffer);
		this.#state.set(n32,13);
	}

	/** ChaCha state into block, increments counter each time */
	private block(): void {
		this.#b.u32.set(this.#state);
		this.#b.block();
		for (let i = 0; i < blockSize32; i++) this.#b.u32[i] += this.#state[i];
		this.#state[COUNT] += 1;
	}

	decryptInto(plain: Uint8Array, enc: Uint8Array): void {
		let nToWrite = enc.length;
		let pos = 0;
		plain.set(enc);
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
		if (plain!=enc) enc.set(plain);
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

function hChaCha(
	output: Uint8Array,
	key: Uint8Array,
	input: Uint8Array,
	rounds: number
):void {
    safety.lenGte(output,32,'output'); //256 bit output
	safety.lenExactly(key, 32, 'key'); //256 bit key
	safety.lenGte(input, 16, 'input'); //128 bit input
	const b = new ChaChaBlock(rounds);
	/* C C C C
	 * K K K K
	 * K K K K
	 * I I I I */

	//Setup block
	//CONSTANTS
	b.u32.set(sigma);

	//KEY (8 u32)
	b.u8.set(key,16);//4*4

	//Input (4 u32) - because input could be >16
	b.u8.set(input.slice(0,16),48);//12*4

    //Make sure everything is LE
    asLE.i32(b.u8,0,16);

	//Generate output
	b.block();
	const b32 = new Uint32Array(
		output.buffer,
		output.byteOffset,
		output.byteLength >>> 2
	);
	b32[0] = b.u32[0];
	b32[1] = b.u32[1];
	b32[2] = b.u32[2];
	b32[3] = b.u32[3];
	b32[4] = b.u32[12];
	b32[5] = b.u32[13];
	b32[6] = b.u32[14];
	b32[7] = b.u32[15];
    asLE.i32(output,0,8);
}

class XChaCha extends ChaCha {
	constructor(
		key: Uint8Array,
		nonce: Uint8Array,
		count: number,
		rounds: number
    ) {
        safety.lenExactly(nonce, 24, 'nonce'); //192 bit nonce
                
        //Generate z (hChaCha output)
        const z=new Uint8Array(32);
        hChaCha(z,key,nonce,rounds);

		const n=new Uint8Array(12);
		n.set(nonce.subarray(16),4);

        super(z,n,count,rounds);
    }
}

/**
 * [ChaCha20](https://en.wikipedia.org/wiki/Salsa20#ChaCha_variant)
 *
 * ChaCha is a stream cipher developed in 2008 by [Daniel J. Bernstein](https://cr.yp.to/djb.html).
 * Like {@link crypto/Salsa20}, the cipher is based on an add-rotate-XOR (ARX) function and designed to
 * increase the diffusion per round while achieving the same/better performance.  ChaCha uses the
 * CTR block mode
 *
 * First Published: *2008*  
 * Blocksize: *64 bytes/512 bits*  
 * Key size: *16, 32 bytes/128, 256 bits*  
 * Nonce size: *12 bytes/96 bits*  
 * Rounds: *20*
 *
 * Specified in
 * - [RFC8439](https://datatracker.ietf.org/doc/html/rfc8439)
 * - ~[RFC7539](https://datatracker.ietf.org/doc/html/rfc7539)~
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

/**
 * hChaCha20 turns 256 bits of key + 128 bits of input into 256 bits of output
 * @param output At least 32 bytes (256 bits / 8 U32)
 * @param key Exactly 32 bytes (256 bits / 8 U32)
 * @param input At least 16 bytes (128 bits / 4 U32) - only first 16 bytes are used
 */
export function hChaCha20(
	output: Uint8Array,
	key: Uint8Array,
	input: Uint8Array
):void {
    hChaCha(output,key,input,20);
}

/**
 * [XChaCha20](https://en.wikipedia.org/wiki/Salsa20#XChaCha)
 * 
 * XChaCha20 is a variant of {@link ChaCha20} that allows a 192 bit (24 byte) nonce, more
 * than ChaCha's 96 bit (12 byte) nonce.  Larger nonce allows longer reuse of keys (you should
 * not reuse nonces).
 * 
 * Blocksize: *64 bytes/512 bits*  
 * Key size: *32 bytes/256 bits*  
 * Nonce size: *24 bytes/192 bits*  
 * Rounds: *20*
 */
export class XChaCha20 extends XChaCha {
    /**
	 * @param key Key bytes, 32 bytes in length (256 bits, 8 U32)
	 * @param nonce Non-repeated NONCE, exactly 24 bytes (192 bits, 6 U32)
	 * @param count Block count generally 0 or 1 (default 0)
	 */
	constructor(key: Uint8Array, nonce: Uint8Array, count = 0) {
		super(key, nonce, count, 20);
	}
}