/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U32 } from '../../primitive/number/U32Static.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

const blockSize = 16;
/** Phi - fractional part of the golden ratio (√5 + 1)/2 - section 4 */
const phi = 0x9e3779b9;

function sb0(r: Uint32Array, a: number) {
	const t0 = r[a] ^ r[a + 3];
	const t1 = r[a + 2] ^ t0;
	const t2 = r[a + 1] ^ t1;
	r[a + 3] = (r[a] & r[a + 3]) ^ t2;
	const t3 = r[a] ^ (r[a + 1] & t0);
	r[a + 2] = t2 ^ (r[a + 2] | t3);
	const t4 = r[a + 3] & (t1 ^ t3);
	r[a + 1] = ~t1 ^ t4;
	r[a] = t4 ^ ~t3;
}
function sb1(r: Uint32Array, a: number) {
	const t0 = r[a + 1] ^ ~r[a];
	const t1 = r[a + 2] ^ (r[a] | t0);
	r[a + 2] = r[a + 3] ^ t1;
	const t2 = r[a + 1] ^ (r[a + 3] | t0);
	const t3 = t0 ^ r[a + 2];
	r[a + 3] = t3 ^ (t1 & t2);
	const t4 = t1 ^ t2;
	r[a + 1] = r[a + 3] ^ t4;
	r[a] = t1 ^ (t3 & t4);
}
function sb2(r: Uint32Array, a: number) {
	const v0 = r[a]; // save r0
	const v3 = r[a + 3]; // save r3
	const t0 = ~v0;
	const t1 = r[a + 1] ^ v3;
	const t2 = r[a + 2] & t0;
	r[a] = t1 ^ t2;
	const t3 = r[a + 2] ^ t0;
	const t4 = r[a + 2] ^ r[a];
	const t5 = r[a + 1] & t4;
	r[a + 3] = t3 ^ t5;
	r[a + 2] = v0 ^ ((v3 | t5) & (r[a] | t3));
	r[a + 1] = t1 ^ r[a + 3] ^ (r[a + 2] ^ (v3 | t0));
}
function sb3(r: Uint32Array, a: number) {
	const v1 = r[a + 1]; // save r1
	const v3 = r[a + 3]; // save r3
	const t0 = r[a] ^ r[a + 1];
	const t1 = r[a] & r[a + 2];
	const t2 = r[a] | r[a + 3];
	const t3 = r[a + 2] ^ r[a + 3];
	const t4 = t0 & t2;
	const t5 = t1 | t4;
	r[a + 2] = t3 ^ t5;
	const t6 = r[a + 1] ^ t2;
	const t7 = t5 ^ t6;
	const t8 = t3 & t7;
	r[a] = t0 ^ t8;
	const t9 = r[a + 2] & r[a];
	r[a + 1] = t7 ^ t9;
	r[a + 3] = (v1 | v3) ^ (t3 ^ t9);
}
function sb4(r: Uint32Array, a: number) {
	const v0 = r[a];
	const t0 = v0 ^ r[a + 3];
	const t1 = r[a + 3] & t0;
	const t2 = r[a + 2] ^ t1;
	const t3 = r[a + 1] | t2;
	r[a + 3] = t0 ^ t3;
	const t4 = ~r[a + 1];
	const t5 = t0 | t4;
	r[a] = t2 ^ t5;
	const t6 = v0 & r[a];
	const t7 = t0 ^ t4;
	const t8 = t3 & t7;
	r[a + 2] = t6 ^ t8;
	r[a + 1] = v0 ^ t2 ^ (t7 & r[a + 2]);
}
function sb5(r: Uint32Array, a: number) {
	const v1 = r[a + 1];
	const t0 = ~r[a];
	const t1 = r[a] ^ v1;
	const t2 = r[a] ^ r[a + 3];
	const t3 = r[a + 2] ^ t0;
	const t4 = t1 | t2;
	r[a] = t3 ^ t4;
	const t5 = r[a + 3] & r[a];
	const t6 = t1 ^ r[a];
	r[a + 1] = t5 ^ t6;
	const t7 = t0 | r[a];
	const t8 = t1 | t5;
	const t9 = t2 ^ t7;
	r[a + 2] = t8 ^ t9;
	r[a + 3] = v1 ^ t5 ^ (r[a + 1] & t9);
}
function sb6(r: Uint32Array, a: number) {
	const t0 = ~r[a];
	const t1 = r[a] ^ r[a + 3];
	const t2 = r[a + 1] ^ t1;
	const t3 = t0 | t1;
	const t4 = r[a + 2] ^ t3;
	r[a + 1] = r[a + 1] ^ t4;
	const t5 = t1 | r[a + 1];
	const t6 = r[a + 3] ^ t5;
	const t7 = t4 & t6;
	r[a + 2] = t2 ^ t7;
	const t8 = t4 ^ t6;
	r[a] = r[a + 2] ^ t8;
	r[a + 3] = ~t4 ^ (t2 & t8);
}
function sb7(r: Uint32Array, a: number) {
	const t0 = r[a + 1] ^ r[a + 2];
	const t1 = r[a + 2] & t0;
	const t2 = r[a + 3] ^ t1;
	const t3 = r[a] ^ t2;
	const t4 = r[a + 3] | t0;
	const t5 = t3 & t4;
	r[a + 1] = r[a + 1] ^ t5;
	const t6 = t2 | r[a + 1];
	const t7 = r[a] & t3;
	r[a + 3] = t0 ^ t7;
	const t8 = t3 ^ t6;
	const t9 = r[a + 3] & t8;
	r[a + 2] = t2 ^ t9;
	r[a] = ~t8 ^ (r[a + 3] & r[a + 2]);
}
function sb0Inv(r: Uint32Array) {
	const t0 = ~r[0];
	const t1 = r[0] ^ r[1];
	const t2 = r[3] ^ (t0 | t1);
	const t3 = r[2] ^ t2;
	r[2] = t1 ^ t3;
	const t4 = t0 ^ (r[3] & t1);
	r[1] = t2 ^ (r[2] & t4);
	r[3] = (r[0] & t2) ^ (t3 | r[1]);
	r[0] = r[3] ^ (t3 ^ t4);
}
function sb1Inv(r: Uint32Array) {
	const t0 = r[1] ^ r[3];
	const t1 = r[0] ^ (r[1] & t0);
	const t2 = t0 ^ t1;
	r[3] = r[2] ^ t2;
	const t3 = r[1] ^ (t0 & t1);
	const t4 = r[3] | t3;
	r[1] = t1 ^ t4;
	const t5 = ~r[1];
	const t6 = r[3] ^ t3;
	r[0] = t5 ^ t6;
	r[2] = t2 ^ (t5 | t6);
}
function sb2Inv(r: Uint32Array) {
	const v0 = r[0];
	const v3 = r[3];
	const t0 = r[1] ^ v3;
	const t1 = ~t0;
	const t2 = v0 ^ r[2];
	const t3 = r[2] ^ t0;
	const t4 = r[1] & t3;
	r[0] = t2 ^ t4;
	const t5 = v0 | t1;
	const t6 = v3 ^ t5;
	const t7 = t2 | t6;
	r[3] = t0 ^ t7;
	const t8 = ~t3;
	const t9 = r[0] | r[3];
	r[1] = t8 ^ t9;
	r[2] = (v3 & t8) ^ (t2 ^ t9);
}
function sb3Inv(r: Uint32Array) {
	const t0 = r[0] | r[1];
	const t1 = r[1] ^ r[2];
	const t2 = r[1] & t1;
	const t3 = r[0] ^ t2;
	const t4 = r[2] ^ t3;
	const t5 = r[3] | t3;
	r[0] = t1 ^ t5;
	const t6 = t1 | t5;
	const t7 = r[3] ^ t6;
	r[2] = t4 ^ t7;
	const t8 = t0 ^ t7;
	const t9 = r[0] & t8;
	r[3] = t3 ^ t9;
	r[1] = r[3] ^ (r[0] ^ t8);
}
function sb4Inv(r: Uint32Array) {
	const v3 = r[3];
	const t0 = r[2] | v3;
	const t1 = r[0] & t0;
	const t2 = r[1] ^ t1;
	const t3 = r[0] & t2;
	const t4 = r[2] ^ t3;
	r[1] = v3 ^ t4;
	const t5 = ~r[0];
	const t6 = t4 & r[1];
	r[3] = t2 ^ t6;
	const t7 = r[1] | t5;
	const t8 = v3 ^ t7;
	r[0] = r[3] ^ t8;
	r[2] = (t2 & t8) ^ (r[1] ^ t5);
}
function sb5Inv(r: Uint32Array) {
	const v0 = r[0];
	const v1 = r[1];
	const v3 = r[3];
	const t0 = ~r[2];
	const t1 = v1 & t0;
	const t2 = v3 ^ t1;
	const t3 = v0 & t2;
	const t4 = v1 ^ t0;
	r[3] = t3 ^ t4;
	const t5 = v1 | r[3];
	const t6 = v0 & t5;
	r[1] = t2 ^ t6;
	const t7 = v0 | v3;
	const t8 = t0 ^ t5;
	r[0] = t7 ^ t8;
	r[2] = (v1 & t7) ^ (t3 | (v0 ^ r[2]));
}
function sb6Inv(r: Uint32Array) {
	const v1 = r[1];
	const v3 = r[3];
	const t0 = ~r[0];
	const t1 = r[0] ^ v1;
	const t2 = r[2] ^ t1;
	const t3 = r[2] | t0;
	const t4 = v3 ^ t3;
	r[1] = t2 ^ t4;
	const t5 = t2 & t4;
	const t6 = t1 ^ t5;
	const t7 = v1 | t6;
	r[3] = t4 ^ t7;
	const t8 = v1 | r[3];
	r[0] = t6 ^ t8;
	r[2] = (v3 & t0) ^ (t2 ^ t8);
}
function sb7Inv(r: Uint32Array) {
	const v0 = r[0];
	const v3 = r[3];
	const t0 = r[2] | (v0 & r[1]);
	const t1 = v3 & (v0 | r[1]);
	r[3] = t0 ^ t1;
	const t2 = ~v3;
	const t3 = r[1] ^ t1;
	const t4 = t3 | (r[3] ^ t2);
	r[1] = v0 ^ t4;
	r[0] = r[2] ^ t3 ^ (v3 | r[1]);
	r[2] = t0 ^ r[1] ^ (r[0] ^ (v0 & r[3]));
}
/** Linear transform - Section 3 */
function linear(x: Uint32Array) {
	x[0] = U32.lRot(x[0], 13);
	x[2] = U32.lRot(x[2], 3);
	x[1] = U32.lRot(x[1] ^ x[0] ^ x[2], 1);
	x[3] = U32.lRot(x[3] ^ x[2] ^ (x[0] << 3), 7);
	x[0] = U32.lRot(x[0] ^ x[1] ^ x[3], 5);
	x[2] = U32.lRot(x[2] ^ x[3] ^ (x[1] << 7), 22);
}
function linearInv(v: Uint32Array) {
	const t0 = U32.rRot(v[2], 22) ^ v[3] ^ (v[1] << 7);
	const t1 = U32.rRot(v[0], 5) ^ v[1] ^ v[3];
	v[3] = U32.rRot(v[3], 7) ^ t0 ^ (t1 << 3);
	v[1] = U32.rRot(v[1], 1) ^ t1 ^ t0;
	v[2] = U32.rRot(t0, 3);
	v[0] = U32.rRot(t1, 13);
}
function fourXor(x: Uint32Array, y: Uint32Array, yi: number) {
	x[0] ^= y[yi];
	x[1] ^= y[yi + 1];
	x[2] ^= y[yi + 2];
	x[3] ^= y[yi + 3];
}

function keySchedule(key: Uint8Array): Uint32Array {
	const rk = new Uint32Array(132);
	const k32 = new Uint32Array(key.buffer, key.byteOffset, key.length / 4);
	const k = new Uint32Array(16);
	k.set(k32);

	//Add a trailing 1 if it's shorter than the full 256
	if (k32.length < 8) k[k32.length] = 1;

	let i = 0;
	for (; i < 8; i++) {
		k[i + 8] = U32.lRot(k[i] ^ k[i + 3] ^ k[i + 5] ^ k[i + 7] ^ phi ^ i, 11);
	}
	rk.set(k.subarray(8));

	for (; i < 132; i++) {
		rk[i] = U32.lRot(
			rk[i - 8] ^ rk[i - 5] ^ rk[i - 3] ^ rk[i - 1] ^ phi ^ i,
			11
		);
	}

	sb3(rk, 0);
	sb2(rk, 4);
	sb1(rk, 8);
	sb0(rk, 12);
	sb7(rk, 16);
	sb6(rk, 20);
	sb5(rk, 24);
	sb4(rk, 28);

	sb3(rk, 32);
	sb2(rk, 36);
	sb1(rk, 40);
	sb0(rk, 44);
	sb7(rk, 48);
	sb6(rk, 52);
	sb5(rk, 56);
	sb4(rk, 60);

	sb3(rk, 64);
	sb2(rk, 68);
	sb1(rk, 72);
	sb0(rk, 76);
	sb7(rk, 80);
	sb6(rk, 84);
	sb5(rk, 88);
	sb4(rk, 92);

	sb3(rk, 96);
	sb2(rk, 100);
	sb1(rk, 104);
	sb0(rk, 108);
	sb7(rk, 112);
	sb6(rk, 116);
	sb5(rk, 120);
	sb4(rk, 124);

	sb3(rk, 128);
	// console.log(`s=&[${rk.join(' ')}]`);
	return rk;
}

class Serpent64bit {
	/** Block size in bytes */
	readonly blockSize = blockSize;
	readonly #rk: Uint32Array;
	constructor(key: Uint8Array) {
		this.#rk = keySchedule(key);
	}

	// prettier-ignore
	private _encBlock(data: Uint8Array) {
		const d32 = new Uint32Array(data.buffer, data.byteOffset, data.length / 4);

		fourXor(d32, this.#rk, 0);

		sb0(d32, 0); linear(d32); fourXor(d32, this.#rk, 4);
		sb1(d32, 0); linear(d32); fourXor(d32, this.#rk, 8);
		sb2(d32, 0); linear(d32); fourXor(d32, this.#rk, 12);
		sb3(d32, 0); linear(d32); fourXor(d32, this.#rk, 16);
		sb4(d32, 0); linear(d32); fourXor(d32, this.#rk, 20);
		sb5(d32, 0); linear(d32); fourXor(d32, this.#rk, 24);
		sb6(d32, 0); linear(d32); fourXor(d32, this.#rk, 28);
		sb7(d32, 0); linear(d32); fourXor(d32, this.#rk, 32);

		sb0(d32, 0); linear(d32); fourXor(d32, this.#rk, 36);
		sb1(d32, 0); linear(d32); fourXor(d32, this.#rk, 40);
		sb2(d32, 0); linear(d32); fourXor(d32, this.#rk, 44);
		sb3(d32, 0); linear(d32); fourXor(d32, this.#rk, 48);
		sb4(d32, 0); linear(d32); fourXor(d32, this.#rk, 52);
		sb5(d32, 0); linear(d32); fourXor(d32, this.#rk, 56);
		sb6(d32, 0); linear(d32); fourXor(d32, this.#rk, 60);
		sb7(d32, 0); linear(d32); fourXor(d32, this.#rk, 64);

		sb0(d32, 0); linear(d32); fourXor(d32, this.#rk, 68);
		sb1(d32, 0); linear(d32); fourXor(d32, this.#rk, 72);
		sb2(d32, 0); linear(d32); fourXor(d32, this.#rk, 76);
		sb3(d32, 0); linear(d32); fourXor(d32, this.#rk, 80);
		sb4(d32, 0); linear(d32); fourXor(d32, this.#rk, 84);
		sb5(d32, 0); linear(d32); fourXor(d32, this.#rk, 88);
		sb6(d32, 0); linear(d32); fourXor(d32, this.#rk, 92);
		sb7(d32, 0); linear(d32); fourXor(d32, this.#rk, 96);

		sb0(d32, 0); linear(d32); fourXor(d32, this.#rk, 100);
		sb1(d32, 0); linear(d32); fourXor(d32, this.#rk, 104);
		sb2(d32, 0); linear(d32); fourXor(d32, this.#rk, 108);
		sb3(d32, 0); linear(d32); fourXor(d32, this.#rk, 112);
		sb4(d32, 0); linear(d32); fourXor(d32, this.#rk, 116);
		sb5(d32, 0); linear(d32); fourXor(d32, this.#rk, 120);
		sb6(d32, 0); linear(d32); fourXor(d32, this.#rk, 124);
		sb7(d32, 0); fourXor(d32, this.#rk, 128);
		//console.log(`d=[${d32.join(' ')}]`);
	}

    // prettier-ignore
	private _decBlock(data: Uint8Array) {
		const d32 = new Uint32Array(data.buffer, data.byteOffset, data.length / 4);

		fourXor(d32, this.#rk, 128);

		sb7Inv(d32); fourXor(d32, this.#rk, 124); linearInv(d32);
		sb6Inv(d32); fourXor(d32, this.#rk, 120); linearInv(d32);
		sb5Inv(d32); fourXor(d32, this.#rk, 116); linearInv(d32);
		sb4Inv(d32); fourXor(d32, this.#rk, 112); linearInv(d32);
		sb3Inv(d32); fourXor(d32, this.#rk, 108); linearInv(d32);
		sb2Inv(d32); fourXor(d32, this.#rk, 104); linearInv(d32);
		sb1Inv(d32); fourXor(d32, this.#rk, 100); linearInv(d32);
		sb0Inv(d32); fourXor(d32, this.#rk, 96); linearInv(d32);

		sb7Inv(d32); fourXor(d32, this.#rk, 92); linearInv(d32);
		sb6Inv(d32); fourXor(d32, this.#rk, 88); linearInv(d32);
		sb5Inv(d32); fourXor(d32, this.#rk, 84); linearInv(d32);
		sb4Inv(d32); fourXor(d32, this.#rk, 80); linearInv(d32);
		sb3Inv(d32); fourXor(d32, this.#rk, 76); linearInv(d32);
		sb2Inv(d32); fourXor(d32, this.#rk, 72); linearInv(d32);
		sb1Inv(d32); fourXor(d32, this.#rk, 68); linearInv(d32);
		sb0Inv(d32); fourXor(d32, this.#rk, 64); linearInv(d32);

		sb7Inv(d32); fourXor(d32, this.#rk, 60); linearInv(d32);
		sb6Inv(d32); fourXor(d32, this.#rk, 56); linearInv(d32);
		sb5Inv(d32); fourXor(d32, this.#rk, 52); linearInv(d32);
		sb4Inv(d32); fourXor(d32, this.#rk, 48); linearInv(d32);
		sb3Inv(d32); fourXor(d32, this.#rk, 44); linearInv(d32);
		sb2Inv(d32); fourXor(d32, this.#rk, 40); linearInv(d32);
		sb1Inv(d32); fourXor(d32, this.#rk, 36); linearInv(d32);
		sb0Inv(d32); fourXor(d32, this.#rk, 32); linearInv(d32);

		sb7Inv(d32); fourXor(d32, this.#rk, 28); linearInv(d32);
		sb6Inv(d32); fourXor(d32, this.#rk, 24); linearInv(d32);
		sb5Inv(d32); fourXor(d32, this.#rk, 20); linearInv(d32);
		sb4Inv(d32); fourXor(d32, this.#rk, 16); linearInv(d32);
		sb3Inv(d32); fourXor(d32, this.#rk, 12); linearInv(d32);
		sb2Inv(d32); fourXor(d32, this.#rk, 8); linearInv(d32);
		sb1Inv(d32); fourXor(d32, this.#rk, 4); linearInv(d32);
		sb0Inv(d32); fourXor(d32, this.#rk, 0);
		//console.log(`d=[${d32.join(' ')}]`);
	}

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#encryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	encryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * 8;
		sLen('block', block)
			.atLeast(byteStart + blockSize)
			.throwNot();
		this._encBlock(block.subarray(byteStart, byteStart + blockSize));
	}

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#decryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	decryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * 8;
		sLen('block', block)
			.atLeast(byteStart + blockSize)
			.throwNot();
		this._decBlock(block.subarray(byteStart, byteStart + blockSize));
	}
}

/**
 * [Serpent-128](https://www.cl.cam.ac.uk/~rja14/serpent.html)
 * ( [Wiki](https://en.wikipedia.org/wiki/Serpent_(cipher)) )
 * 
 * A finalist in the Advanced Encryption Standard (AES) contest, in which it
 * ranked second to Rijndael. Serpent was designed by Ross Anderson, Eli Biham,
 * and Lars Knudsen.
 *
 * First Published: *1998*  
 * Block size: *16 bytes*  
 * Key Size: *16 bytes*  
 * Nonce size: *0 bytes*  
 * Rounds: *32*
 * 
 * Specified in:
 * - [Spec paper](https://www.cl.cam.ac.uk/archive/rja14/Papers/serpent.pdf)
 */
export class Serpent_128 extends Serpent64bit implements IBlockCrypt {
    /** key must be 16 bytes (128 bits) long */
	constructor(key: Uint8Array) {
		sLen('key', key).exactly(16).throwNot();
		super(key);
	}
}

/**
 * [Serpent-192](https://www.cl.cam.ac.uk/~rja14/serpent.html)
 * ( [Wiki](https://en.wikipedia.org/wiki/Serpent_(cipher)) )
 * 
 * A finalist in the Advanced Encryption Standard (AES) contest, in which it
 * ranked second to Rijndael. Serpent was designed by Ross Anderson, Eli Biham,
 * and Lars Knudsen.
 *
 * First Published: *1998*  
 * Block size: *16 bytes*  
 * Key Size: *24 bytes*  
 * Nonce size: *0 bytes*  
 * Rounds: *32*
 * 
 * Specified in:
 * - [Spec paper](https://www.cl.cam.ac.uk/archive/rja14/Papers/serpent.pdf)
 */
export class Serpent_192 extends Serpent64bit implements IBlockCrypt {
    /** key must be 24 bytes (192 bits) long */
	constructor(key: Uint8Array) {
		sLen('key', key).exactly(24).throwNot();
		super(key);
	}
}

/**
 * [Serpent-256](https://www.cl.cam.ac.uk/~rja14/serpent.html)
 * ( [Wiki](https://en.wikipedia.org/wiki/Serpent_(cipher)) )
 * 
 * A finalist in the Advanced Encryption Standard (AES) contest, in which it
 * ranked second to Rijndael. Serpent was designed by Ross Anderson, Eli Biham,
 * and Lars Knudsen.
 *
 * First Published: *1998*  
 * Block size: *16 bytes*  
 * Key Size: *32 bytes*  
 * Nonce size: *0 bytes*  
 * Rounds: *32*
 * 
 * Specified in:
 * - [Spec paper](https://www.cl.cam.ac.uk/archive/rja14/Papers/serpent.pdf)
 */
export class Serpent_256 extends Serpent64bit implements IBlockCrypt {
    /** key must be 32 bytes (256 bits) long */
	constructor(key: Uint8Array) {
		sLen('key', key).exactly(32).throwNot();
		super(key);
	}
}
