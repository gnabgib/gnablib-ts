/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IHash } from '../interfaces/IHash.js';
import { U32 } from '../../primitive/number/U32Static.js';
import { IAeadCrypt } from '../interfaces/IAeadCrypt.js';
import { sLen } from '../../safe/safe.js';
import { xorEq } from '../../primitive/xtUint8Array.js';
import { ByteWriter } from '../../primitive/ByteWriter.js';

// prettier-ignore
/** Round constants (expand into 64bit) 2.6.1 */
const roundConst = Uint8Array.of(
	0xf0, 0xe1, 0xd2, 0xc3, 
	0xb4, 0xa5, 0x96, 0x87,
	0x78, 0x69, 0x5a, 0x4b
);
/**
 * XOR 2 U32 (aka U64, endian irrelevant) from `b:bPos64` into `a:aPos64`
 * @param a
 * @param aPos64 Position as if U64 (2* for U32)
 * @param b
 * @param bPos64 Position as if U64 (2* for U32)
 */
function xor64(
	a: Uint32Array,
	aPos64: number,
	b: Uint32Array,
	bPos64: number
): void {
	aPos64 <<= 1; //*2
	bPos64 <<= 1; //*2
	a[aPos64] ^= b[bPos64];
	a[aPos64 + 1] ^= b[bPos64 + 1];
}
/**
 * NOT 2 U32 (aka U64, endian irrelevant) in `a:aPos64`
 * @param a
 * @param aPos64 Position as if U64 (2* for U32)
 */
function not64(a: Uint32Array, aPos64: number): void {
	aPos64 <<= 1; //*2
	a[aPos64] = ~a[aPos64];
	a[aPos64 + 1] = ~a[aPos64 + 1];
}
/**
 * AND 2 U32 (aka U64, endian irrelevant) from `b:bPos64` into `a:aPos64`
 * @param a
 * @param aPos64 Position as if U64 (2* for U32)
 * @param b
 * @param bPos64 Position as if U64 (2* for U32)
 */
function and64(
	a: Uint32Array,
	aPos64: number,
	b: Uint32Array,
	bPos64: number
): void {
	aPos64 <<= 1; //*2
	bPos64 <<= 1; //*2
	a[aPos64] &= b[bPos64];
	a[aPos64 + 1] &= b[bPos64 + 1];
}

function ror64(a: Uint8Array, aPos64: number, by: number): void {
	//Maybe this could be converted into a generic case.. we cast in/out of U32 (big endian) to
	//Convert into byte pos
	aPos64 <<= 3; //*8

	by = by & 0x3f; //limit 0-64
	let fPull = aPos64;
	let sPull = aPos64 + 4;
	if (by >= 32) {
		//If it's a large rotate switch the positions and shrink
		fPull += 4;
		sPull = aPos64;
		by -= 32;
	}
	const first = U32.fromBytesBE(a, fPull);
	const second = U32.fromBytesBE(a, sPull);
	const iBy = 32 - by;
	const bw = ByteWriter.mount(a);
	bw.skip(aPos64);
	U32.intoBytesBE((first >>> by) | (second << iBy), bw);
	U32.intoBytesBE((second >>> by) | (first << iBy), bw);
}

const tagSize = 16;
const stage_init = 0;
const stage_ad = 1;
const stage_data = 2;
const stage_done = 3;

abstract class AAscon {
	/** 40 bytes / 320 bit state */
	protected readonly state = new Uint8Array(40);
	/** 10 elements */
	protected readonly s32 = new Uint32Array(this.state.buffer);
	/** Position in state*/
	protected _sPos = 0;

	constructor(
		readonly blockSize: number,
		readonly aRound: number,
		readonly bRound: number
	) {}

	/** Permutation 2.6 */
	protected p(rounds: number): void {
		// prettier-ignore
		for (let i = 0; i < rounds; i++) {
			//2.6.1 Add constants
			//xor in the round constant to the last byte of u64 3/5 = byte 23
			this.state[23] ^= roundConst[12 - rounds + i];

			//7.3 (2.6.2 Substitute)
			xor64(this.s32, 0, this.s32, 4); xor64(this.s32, 4, this.s32, 3); xor64(this.s32, 2, this.s32, 1);
			const t = this.s32.slice();
			not64(t, 0); not64(t, 1); not64(t, 2); not64(t, 3); not64(t, 4);
			and64(t, 0, this.s32, 1); and64(t, 1, this.s32, 2); and64(t, 2, this.s32, 3); and64(t, 3, this.s32, 4); and64(t, 4, this.s32, 0);
			xor64(this.s32, 0, t, 1); xor64(this.s32, 1, t, 2); xor64(this.s32, 2, t, 3); xor64(this.s32, 3, t, 4); xor64(this.s32, 4, t, 0);
			xor64(this.s32, 1, this.s32, 0); xor64(this.s32, 0, this.s32, 4); xor64(this.s32, 3, this.s32, 2); not64(this.s32, 2);

			//2.6.3 diffusion
			//Copy x0-4 twice (so we can ROR in place)
			const ror0 = this.state.slice();
			const ror1 = this.state.slice();
			//Rotate per spec
			ror64(ror0, 0, 19); ror64(ror1, 0, 28);
			ror64(ror0, 1, 61); ror64(ror1, 1, 39);
			ror64(ror0, 2,  1); ror64(ror1, 2,  6);
			ror64(ror0, 3, 10); ror64(ror1, 3, 17);
			ror64(ror0, 4,  7); ror64(ror1, 4, 41);
			//Create U32 arrays so we can use xor64
			const ror0_32 = new Uint32Array(ror0.buffer);
			const ror1_32 = new Uint32Array(ror1.buffer);
			xor64(this.s32, 0, ror0_32, 0); xor64(this.s32, 0, ror1_32, 0);
			xor64(this.s32, 1, ror0_32, 1); xor64(this.s32, 1, ror1_32, 1);
			xor64(this.s32, 2, ror0_32, 2); xor64(this.s32, 2, ror1_32, 2);
			xor64(this.s32, 3, ror0_32, 3); xor64(this.s32, 3, ror1_32, 3);
			xor64(this.s32, 4, ror0_32, 4); xor64(this.s32, 4, ror1_32, 4);
		}
		this._sPos = 0;
	}
}

/**
 * [Ascon](https://ascon.iaik.tugraz.at/index.html)
 *
 * Ascon is a family of lightweight authenticated ciphers, based on a sponge construction along the lines
 * of SpongeWrap and MonkeyDuplex. This design makes it easy to reuse Ascon in multiple ways (as a cipher, hash, or a MAC)
 *
 * First Published: *2014*
 * Block size: *8, 16 bytes*
 * Key size: *16 bytes*
 * Rounds: *6-8*
 *
 * Specified in
 * - [NIST](https://csrc.nist.gov/CSRC/media/Projects/lightweight-cryptography/documents/round-2/spec-doc-rnd2/ascon-spec-round2.pdf)
 */
class _AsconAead extends AAscon implements IAeadCrypt {
	readonly tagSize = tagSize;
	readonly #key: Uint8Array;
	/** Stage Init=0/AssocData=1/Data=2 */
	private _stage = stage_init;

	/**
	 * Construct a new Ascon AEAD state
	 * @param key Secret key, in bytes, 0-20 in length
	 * @param nonce Nonce, in bytes, exactly 16 bytes
	 * @param rate Rate - a tunable parameter
	 * @param aRound Number of rounds for a permutations - a tunable parameter
	 * @param bRound Number of rounds for b permutations - a tunable parameter
	 */
	constructor(
		key: Uint8Array,
		nonce: Uint8Array,
		rate: number,
		aRound: number,
		bRound: number
	) {
		super(rate, aRound, bRound);
		//We don't need to test key here since the implementations do
		//sLen('key',key).atMost(20).throwNot(); //0-160 bits
		sLen('nonce', nonce).exactly(16).throwNot(); //128 bits
		//Note rate/aRound/bRound are tunable but not expected to be exposed so no need for safety checks)
		this.#key = key;

		//Initialize (2.4.1)
		this.state[0] = key.length << 3;
		this.state[1] = rate << 3;
		this.state[2] = aRound;
		this.state[3] = bRound;
		const kPos = 4 + (20 - key.length);
		this.state.set(key, kPos);
		this.state.set(nonce, 24);
		//Run pa
		this.p(aRound);
		//Xor in the key
		xorEq(this.state.subarray(40 - key.length), key);
	}

	/**
	 * Add associated data (can be called multiple times, must be done before {@link encryptInto}/{@link decryptInto})
	 * @param data
	 */
	writeAD(data: Uint8Array): void {
		if (this._stage > stage_ad)
			throw new Error('Associated data can no longer be written');
		this._stage = stage_ad;
		let nToWrite = data.length;
		let dPos = 0;
		//Xor in full blocks and permute
		while (nToWrite >= this.blockSize) {
			for (let i = 0; i < this.blockSize; i++)
				this.state[this._sPos++] ^= data[dPos++];
			this.p(this.bRound);
			nToWrite -= this.blockSize;
		}
		//Xor in any remainder
		while (dPos < data.length) this.state[this._sPos++] ^= data[dPos++];
	}

	private finalizeAD(): void {
		if (this._stage === stage_ad) {
			//If we started writing AD we need to finish
			//Append a 1
			this.state[this._sPos] ^= 0x80;
			//Permute
			this.p(this.bRound);
		}
		//Add the domain separator NOTE 2.4.2: "After processing A (also if s=0), a 1 bit domain separator is xored into S"
		this.state[39] ^= 1;
		this._stage = stage_data;
	}

	encryptInto(enc: Uint8Array, plain: Uint8Array): void {
		if (this._stage < stage_data) this.finalizeAD();
		else if (this._stage == stage_done)
			throw new Error('Cannot encrypt data after finalization');
		this._stage = stage_data;

		let nToWrite = plain.length;
		let pPos = 0;
		let ePos = 0;
		//Xor in full blocks
		while (nToWrite >= this.blockSize) {
			for (; this._sPos < this.blockSize; )
				this.state[this._sPos++] ^= plain[pPos++];
			//Copy out the cipher
			enc.set(this.state.subarray(0, this.blockSize), ePos);
			this.p(this.bRound);
			nToWrite -= this.blockSize;
			ePos += this.blockSize;
		}
		if (pPos < plain.length) {
			//Xor any remainder
			while (pPos < plain.length) this.state[this._sPos++] ^= plain[pPos++];
			//Copy out the cipher
			enc.set(this.state.subarray(0, this._sPos), pPos - this._sPos);
		}
	}

	decryptInto(plain: Uint8Array, enc: Uint8Array): void {
		if (this._stage < stage_data) this.finalizeAD();
		else if (this._stage == stage_done)
			throw new Error('Cannot decrypt data after finalization');
		this._stage = stage_data;

		let nToWrite = enc.length;
		let pPos = 0;
		let space = this.blockSize - this._sPos;
		plain.set(enc);
		//Xor out full blocks
		while (nToWrite >= this.blockSize) {
			for (; this._sPos < this.blockSize; )
				plain[pPos++] ^= this.state[this._sPos++];
			//Update state
			this.state.set(enc.subarray(pPos - space, pPos));
			this.p(this.bRound);
			nToWrite -= this.blockSize;
			space = this.blockSize;
		}
		if (pPos < plain.length) {
			space = plain.length - pPos;
			while (pPos < plain.length) plain[pPos++] ^= this.state[this._sPos++];
			//Update state
			this.state.set(enc.subarray(pPos - space));
		}
	}

	verify(tag: Uint8Array): boolean {
		//End assoc writing
		if (this._stage < stage_data) this.finalizeAD();
		//End data writing
		this.state[this._sPos] ^= 0x80;
		this._stage = stage_done;
		//Xor in key after blockSize
		for (let i = 0; i < this.#key.length; i++)
			this.state[this.blockSize + i] ^= this.#key[i];
		//pA
		this.p(this.aRound);
		//Xor up to 16 bytes of key at end of state, but key is always 16,20
		//const n = this.#key.length < 16 ? this.#key.length : 16;
		const n=16;
		for (let i = 40 - n, j = this.#key.length - n; i < 40; )
			this.state[i++] ^= this.#key[j++];

		let zero = 0;
		for (let i = 0; i < tag.length; i++) zero |= tag[i] ^ this.state[24 + i];
		return zero === 0;
	}

	finalize(): Uint8Array {
		//End assoc writing
		if (this._stage < stage_data) this.finalizeAD();
		//End data writing
		this.state[this._sPos++] ^= 0x80;
		this._stage = stage_done;
		//Xor in key after blockSize
		for (let i = 0; i < this.#key.length; i++)
			this.state[this.blockSize + i] ^= this.#key[i];
		//pA
		this.p(this.aRound);
		//Xor up to 16 bytes of key at end of state, but key is always 16, 20
		//const n = this.#key.length < 16 ? this.#key.length : 16;
		const n=16;
		for (let i = 40 - n, j = this.#key.length - n; i < 40; )
			this.state[i++] ^= this.#key[j++];
		//Return last 16 bytes of state
		return this.state.slice(24);
	}

	encryptSize(plainLen: number): number {
		return plainLen;
	}
}

/**
 * [Ascon-128](https://ascon.iaik.tugraz.at/index.html)
 *
 * Ascon is a family of lightweight authenticated ciphers, based on a sponge construction along the lines
 * of SpongeWrap and MonkeyDuplex. This design makes it easy to reuse Ascon in multiple ways (as a cipher, hash, or a MAC)
 *
 * First Published: *2014*
 * Block size: *8 bytes*
 * Key size: *16 bytes*
 * Nonce size: *16 bytes*
 * Rounds: *6*
 *
 * Specified in
 * - [NIST](https://csrc.nist.gov/CSRC/media/Projects/lightweight-cryptography/documents/round-2/spec-doc-rnd2/ascon-spec-round2.pdf)
 */
export class Ascon128 extends _AsconAead {
	/**
	 * Construct a new Ascon-128 AEAD state
	 * @param key Secret key, in bytes, exactly 16 bytes
	 * @param nonce Nonce, in bytes, exactly 16 bytes
	 */
	constructor(key: Uint8Array, nonce: Uint8Array) {
		super(key, nonce, 8, 12, 6);
		sLen('key', key).exactly(16).throwNot(); //128 bits
	}
}

/**
 * [Ascon-128a](https://ascon.iaik.tugraz.at/index.html)
 *
 * Ascon is a family of lightweight authenticated ciphers, based on a sponge construction along the lines
 * of SpongeWrap and MonkeyDuplex. This design makes it easy to reuse Ascon in multiple ways (as a cipher, hash, or a MAC)
 *
 * First Published: *2014*
 * Block size: *16 bytes*
 * Key size: *16 bytes*
 * Nonce size: *16 bytes*
 * Rounds: *8*
 *
 * Specified in
 * - [NIST](https://csrc.nist.gov/CSRC/media/Projects/lightweight-cryptography/documents/round-2/spec-doc-rnd2/ascon-spec-round2.pdf)
 */
export class Ascon128a extends _AsconAead {
	/**
	 * Construct a new Ascon-128a AEAD state
	 * @param key Secret key, in bytes, exactly 16 bytes
	 * @param nonce Nonce, in bytes, exactly 16 bytes
	 */
	constructor(key: Uint8Array, nonce: Uint8Array) {
		super(key, nonce, 16, 12, 8);
		sLen('key', key).exactly(16).throwNot(); //128 bits
	}
}

/**
 * [Ascon-80pq](https://ascon.iaik.tugraz.at/index.html)
 *
 * Ascon is a family of lightweight authenticated ciphers, based on a sponge construction along the lines
 * of SpongeWrap and MonkeyDuplex. This design makes it easy to reuse Ascon in multiple ways (as a cipher, hash, or a MAC)
 *
 * First Published: *2014*
 * Block size: *8 bytes*
 * Key size: *20 bytes*
 * Nonce size: *16 bytes*
 * Rounds: *6*
 *
 * Specified in
 * - [NIST](https://csrc.nist.gov/CSRC/media/Projects/lightweight-cryptography/documents/round-2/spec-doc-rnd2/ascon-spec-round2.pdf)
 */
export class Ascon80pq extends _AsconAead {
	/**
	 * Construct a new Ascon-128a AEAD state
	 * @param key Secret key, in bytes, exactly 20 bytes
	 * @param nonce Nonce, in bytes, exactly 16 bytes
	 */
	constructor(key: Uint8Array, nonce: Uint8Array) {
		super(key, nonce, 8, 12, 6);
		sLen('key', key).exactly(20).throwNot(); //160 bits
	}
}

class _AsconHash extends AAscon implements IHash {
	constructor(
		rate: number,
		aRound: number,
		bRound: number,
		readonly size: number,
		private readonly xof: boolean
	) {
		super(rate, aRound, bRound);
		this.state[1] = rate << 3;
		this.state[2] = aRound;
		this.state[3] = aRound - bRound;
		//00 40 0c 00 00000100
		//Hash/HashA set the output size to 256 in U32 (00000100, setting byte 6 to 1)
		//But Xof/XofA sets it to zero.. even if you set it to.. 256
		if (!this.xof) this.state[6] = 1;
		//Run pa
		this.p(aRound);
	}

	write(data: Uint8Array): void {
		let nToWrite = data.length;
		let length = this.blockSize - this._sPos;
		let dPos = 0;
		//Xor in full blocks and permute
		while (nToWrite >= length) {
			for (; this._sPos < this.blockSize; )
				this.state[this._sPos++] ^= data[dPos++];
			this.p(this.bRound);
			nToWrite -= this.blockSize;
			length = this.blockSize;
		}
		//Xor in any remainder
		while (dPos < data.length) this.state[this._sPos++] ^= data[dPos++];
	}

	sum(): Uint8Array {
		return this.clone().sumIn();
	}

	sumIn(): Uint8Array {
		this.state[this._sPos++] ^= 0x80;
		const ret = new Uint8Array(this.size);
		this.p(this.aRound);
		let pos = 0;
		while (pos + this.blockSize < this.size) {
			ret.set(this.state.subarray(0, this.blockSize), pos);
			pos += this.blockSize;
			this.p(this.bRound);
		}
		ret.set(this.state.subarray(0, this.size - pos), pos);
		return ret;
	}

	reset(): void {
		this.s32.fill(0);
		this.state[1] = this.blockSize << 3;
		this.state[2] = this.aRound;
		this.state[3] = this.aRound - this.bRound;
		if (!this.xof) this.state[6] = 1;
		this._sPos = 0;
		this.p(this.aRound);
	}

	newEmpty(): IHash {
		return new _AsconHash(
			this.blockSize,
			this.aRound,
			this.bRound,
			this.size,
			this.xof
		);
	}

	clone(): IHash {
		const ret = new _AsconHash(
			this.blockSize,
			this.aRound,
			this.bRound,
			this.size,
			this.xof
		);
		ret.state.set(this.state);
		ret._sPos = this._sPos;
		return ret;
	}
}

/**
 * [Ascon-Hash](https://ascon.iaik.tugraz.at/index.html)
 *
 * Ascon is a family of lightweight authenticated ciphers, based on a sponge construction along the lines
 * of SpongeWrap and MonkeyDuplex. This design makes it easy to reuse Ascon in multiple ways (as a cipher, hash, or a MAC)
 *
 * First Published: *2014*
 * Block size: *8 bytes*
 * Rounds: *12/12*
 * Hash size: *32 bytes*
 *
 * Specified in
 * - [NIST](https://csrc.nist.gov/CSRC/media/Projects/lightweight-cryptography/documents/round-2/spec-doc-rnd2/ascon-spec-round2.pdf)
 */
export class AsconHash extends _AsconHash {
	constructor() {
		super(8, 12, 12, 32, false);
	}
}

/**
 * [Ascon-HashA](https://ascon.iaik.tugraz.at/index.html)
 *
 * Ascon is a family of lightweight authenticated ciphers, based on a sponge construction along the lines
 * of SpongeWrap and MonkeyDuplex. This design makes it easy to reuse Ascon in multiple ways (as a cipher, hash, or a MAC)
 *
 * First Published: *2014*
 * Block size: *8 bytes*
 * Rounds: *12/8*
 * Hash size: *32 bytes*
 *
 * Specified in
 * - [NIST](https://csrc.nist.gov/CSRC/media/Projects/lightweight-cryptography/documents/round-2/spec-doc-rnd2/ascon-spec-round2.pdf)
 */
export class AsconHashA extends _AsconHash {
	constructor() {
		super(8, 12, 8, 32, false);
	}
}

/**
 * [Ascon-HashA](https://ascon.iaik.tugraz.at/index.html)
 *
 * Ascon is a family of lightweight authenticated ciphers, based on a sponge construction along the lines
 * of SpongeWrap and MonkeyDuplex. This design makes it easy to reuse Ascon in multiple ways (as a cipher, hash, or a MAC)
 *
 * First Published: *2014*
 * Block size: *8 bytes*
 * Rounds: *12/12*
 * Hash size: *? bytes*
 *
 * Specified in
 * - [NIST](https://csrc.nist.gov/CSRC/media/Projects/lightweight-cryptography/documents/round-2/spec-doc-rnd2/ascon-spec-round2.pdf)
 */
export class AsconXof extends _AsconHash {
	constructor(digestSize: number) {
		super(8, 12, 12, digestSize, true);
	}
}

/**
 * [Ascon-HashA](https://ascon.iaik.tugraz.at/index.html)
 *
 * Ascon is a family of lightweight authenticated ciphers, based on a sponge construction along the lines
 * of SpongeWrap and MonkeyDuplex. This design makes it easy to reuse Ascon in multiple ways (as a cipher, hash, or a MAC)
 *
 * First Published: *2014*
 * Block size: *8 bytes*
 * Rounds: *12/8*
 * Hash size: *? bytes*
 *
 * Specified in
 * - [NIST](https://csrc.nist.gov/CSRC/media/Projects/lightweight-cryptography/documents/round-2/spec-doc-rnd2/ascon-spec-round2.pdf)
 */
export class AsconXofA extends _AsconHash {
	constructor(digestSize: number) {
		super(8, 12, 8, digestSize, true);
		//X: super(8,12,12,?,true);
		//Xa: super(8,12,8,?,true);
	}
}
