/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import type { IHash } from '../interfaces/IHash.js';
import * as littleEndian from '../../endian/little.js';
import { Uint64 } from '../../primitive/Uint64.js';
import { utf8 } from '../../codec/Utf8.js';
import { somewhatSafe } from '../../safe/safe.js';

//[Wikipedia: SHA-3](https://en.wikipedia.org/wiki/SHA-3)
//[Keccak](https://keccak.team/keccak.html)
//[FIPS PUB 202: SHA3-Standard](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf) (2015)
//[SP 800-185: SHA-3 Derived Functinos](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-185.pdf) (2016)
//[KangarooTwelve and TurboSHAKE (v10)](https://datatracker.ietf.org/doc/draft-irtf-cfrg-kangarootwelve/) (June 2023)

const roundConst = [
	0x00000000, 0x00000001, 0x00000000, 0x00008082, 0x80000000, 0x0000808a,
	0x80000000, 0x80008000, 0x00000000, 0x0000808b, 0x00000000, 0x80000001,
	0x80000000, 0x80008081, 0x80000000, 0x00008009, 0x00000000, 0x0000008a,
	0x00000000, 0x00000088, 0x00000000, 0x80008009, 0x00000000, 0x8000000a,
	0x00000000, 0x8000808b, 0x80000000, 0x0000008b, 0x80000000, 0x00008089,
	0x80000000, 0x00008003, 0x80000000, 0x00008002, 0x80000000, 0x00000080,
	0x00000000, 0x0000800a, 0x80000000, 0x8000000a, 0x80000000, 0x80008081,
	0x80000000, 0x00008080, 0x00000000, 0x80000001, 0x80000000, 0x80008008,
];
// /** rhoShift Generator */
// function rhoGen() {
// 	// Rho shift: (t+1)(t+2)/2=t^2+3t+2 mod 64
// 	// https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf#3.2.2
// 	const ret = [];
// 	for (let i = 0; i < 24; i++) ret.push(((i * i + 3 * i + 2) / 2) % 64);
// 	console.log(`const rhoShift=[${ret.join(', ')}];`);
// }
const rhoShift = [
	1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39,
	61, 20, 44,
];
// /** piShift Generator */
// function piGen() {
// 	//Pi shift: [(x+3y)%5,x]->[x,y]
// 	//https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf#3.2.3
// 	const pullFrom = [];
// 	for (let i = 0; i < 25; i++) {
// 		const x = i % 5;
// 		const y = (i / 5) | 0;
// 		const p = ((x + 3 * y) % 5) + x * 5;
// 		//Inverse of formula:
// 		pullFrom[p] = i;
// 	}
// 	const ret = [];
// 	let st = pullFrom[1];
// 	//Now follow the money
// 	for (let i = 0; i < 24; i++) {
// 		ret.push(st);
// 		st = pullFrom[st];
// 	}
// 	console.log(`const piShift=[${ret.join(', ')}];`);
// }
const piShift = [
	10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22,
	9, 6, 1,
];

const k12RoundStart = 12;
const maxBlockSizeU64 = 5 * 5;
const maxBlockSizeBytes = 200; //1600 bits,8*5*5=200
const keccak_suffix = 1;
const sha3_suffix = 6;
const shake_suffix = 0x1f;
const cShake_suffix = 4;
//cShake, kMac
const cap128 = 16; /*128/8*/
const cap256 = 32; /*256/8*/
const pad128 = 168;
const pad256 = 136;
const kMacFn = 'KMAC';
const tupleHashFn = 'TupleHash';
const parallelHashFn = 'ParallelHash';

class KeccakCore implements IHash {
	private readonly _size: number;
	/**
	 * Digest size in bytes
	 */
	get size(): number {
		return this._size;
	}
	/**
	 * Block size in bytes
	 */
	readonly blockSize: number;
	/**
	 * Runtime state of the hash
	 */
	protected readonly state = new Uint8Array(maxBlockSizeBytes);
	/**
	 * Temp processing block
	 */
	protected readonly block: Uint8Array;
	readonly suffix: number;
	readonly #roundStart: number;
	/**
	 * Position of data written to block
	 */
	protected bPos = 0;

	/**
	 * @param suffix 1 for Keccak, 6 for SHA3, 0x1f/31 for Shake
	 * @param digestSizeBytes Output digest size (bytes)
	 * @param capacityBytes (default digestSize)
	 */
	constructor(
		suffix: number,
		digestSizeBytes: number,
		capacityBytes = 0,
		roundStart = 0
	) {
		somewhatSafe.uint.atMost(
			'capacityBytes',
			capacityBytes,
			maxBlockSizeBytes / 2
		);
		if (capacityBytes <= 0) capacityBytes = digestSizeBytes;
		capacityBytes *= 2;

		this.suffix = suffix;
		this.#roundStart = roundStart;
		this._size = digestSizeBytes;
		this.blockSize = maxBlockSizeBytes - capacityBytes;
		this.block = new Uint8Array(maxBlockSizeBytes);

		//We don't need to reset keccak because there's no IV to load, and while it
		// would be consistent with other hashes, it causes problems with cShake which
		// needs to override reset.
		//this.reset();
	}

	/**
	 * aka absorb
	 */
	private hash(): void {
		//Copy state-bytes into u64
		const st = new Array<Uint64>(maxBlockSizeU64);
		littleEndian.u64IntoArrFromBytes(st, 0, maxBlockSizeU64, this.block);
		//console.log(`hash : ${hex.fromBytes(this.#block)}`);
		//console.log(`hash : ${hex.fromU64s(st,' ')}`);

		const bc = new Array<Uint64>(5);
		let t: Uint64;
		for (let r = this.#roundStart; r < 24; r++) {
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
			//console.log(`r[${r}] : ${hex.fromU64s(st,' ')}`);
		}
		//Copy the data back to state
		littleEndian.u64ArrIntoBytes(st, this.block);
		//Reset block pointer
		this.bPos = 0;
		//console.log(`post hash : ${hex.fromBytes(this.#block)}`);
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		//console.log(`write: ${hex.fromBytes(data)} (:${this.#bPos}+${data.length} /${this.blockSize})`);
		for (let i = 0; i < data.length; i++) {
			this.block[this.bPos++] ^= data[i];
			if (this.bPos === this.blockSize) {
				this.hash();
				this.bPos = 0;
			}
		}
		//console.log(`post-write: ${hex.fromBytes(this.#block)}`);
	}

	/**
	 * Sum the hash with the all content written so far (does not mutate state)
	 */
	sum(): Uint8Array {
		return this.clone().sumIn();
	}

	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 * Use if you won't need the obj again (for performance)
	 */
	sumIn(): Uint8Array {
		//End with a 0b1 in MSB
		this.xorSuffix();
		this.block[this.blockSize - 1] ^= 0x80;
		this.hash();
		//Squeeze
		const ret = new Uint8Array(this.size);
		//If alt.size (requested bytes) is larger than our sponge, we take out the first sponge.length
		// bits, hash, and take out the next, until we obtain enough bits (note there are security implications
		// of squeezing a lot of data out with weak sources)
		let retSize = this.size;
		let ptr = 0;
		while (retSize > this.blockSize) {
			ret.set(this.block.slice(0, this.blockSize), ptr);
			ptr += this.blockSize;
			retSize -= this.blockSize;
			this.hash();
		}
		ret.set(this.block.slice(0, retSize), ptr);
		return ret;
	}

	protected xorSuffix(): void {
		this.block[this.bPos] ^= this.suffix;
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this.state.fill(0);
		this.block.fill(0);
		//Reset block (which is just pointing to the start)
		this.bPos = 0;
	}

	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new KeccakCore(
			this.suffix,
			this.size,
			(maxBlockSizeBytes - this.blockSize) / 2,
			this.#roundStart
		);
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): KeccakCore {
		const ret = new KeccakCore(
			this.suffix,
			this.size,
			(maxBlockSizeBytes - this.blockSize) / 2,
			this.#roundStart
		);
		ret.state.set(this.state);
		ret.block.set(this.block);
		ret.bPos = this.bPos;
		return ret;
	}
	protected _cloneHelp(ret: KeccakCore): void {
		ret.state.set(this.state);
		ret.block.set(this.block);
		ret.bPos = this.bPos;
	}
}

export class Keccak extends KeccakCore {
	/**
	 * Build a new Keccak hash generator
	 * @param digestSize Output digest size (bytes)
	 * @param capacityBytes Capacity (Keccak specific param) if <=0 it's @param digestSize
	 */
	constructor(digestSize: number, capacityBytes = 0) {
		super(keccak_suffix, digestSize, capacityBytes);
	}
}
export class Keccak224 extends KeccakCore {
	/**
	 * Build a new Keccak 224bit hash generator
	 * @param capacityBytes Capacity (Keccak specific param) if <=0 it's 224
	 */
	constructor(capacityBytes = 0) {
		super(keccak_suffix, 28 /*224/8*/, capacityBytes);
	}
}
export class Keccak256 extends KeccakCore {
	/**
	 * Build a new Keccak 256bit hash generator
	 * @param capacityBytes Capacity (Keccak specific param) if <=0 it's 256
	 */
	constructor(capacityBytes = 0) {
		super(keccak_suffix, 32 /*256/8*/, capacityBytes);
	}
}
export class Keccak384 extends KeccakCore {
	/**
	 * Build a new Keccak 384bit hash generator
	 * @param capacityBytes Capacity (Keccak specific param) if <=0 it's 384
	 */
	constructor(capacityBytes = 0) {
		super(keccak_suffix, 48 /*384/8*/, capacityBytes);
	}
}
export class Keccak512 extends KeccakCore {
	/**
	 * Build a new Keccak 512bit hash generator
	 * @param capacityBytes Capacity (Keccak specific param) if <=0 it's 512
	 */
	constructor(capacityBytes = 0) {
		super(keccak_suffix, 64 /*512/8*/, capacityBytes);
	}
}

export class Sha3_224 extends KeccakCore {
	/**
	 * Build a new Sha3 224bit hash generator
	 */
	constructor() {
		super(sha3_suffix, 28 /*224/8*/);
	}
}
export class Sha3_256 extends KeccakCore {
	/**
	 * Build a new Sha3 256bit hash generator
	 */
	constructor() {
		super(sha3_suffix, 32 /*256/8*/);
	}
}
export class Sha3_384 extends KeccakCore {
	/**
	 * Build a new Sha3 384bit hash generator
	 */
	constructor() {
		super(sha3_suffix, 48 /*384/8*/);
	}
}
export class Sha3_512 extends KeccakCore {
	/**
	 * Build a new Sha3 512bit hash generator
	 */
	constructor() {
		super(sha3_suffix, 64 /*512/8*/);
	}
}

export class Shake128 extends KeccakCore {
	/**
	 * Build a new Shake 128bit XOF generator
	 * @param digestSize Output digest size (bytes)
	 */
	constructor(digestSize: number) {
		super(shake_suffix, digestSize, 16 /*128/8*/);
	}
}
export class Shake256 extends KeccakCore {
	/**
	 * Build a new Shake 256bit XOF generator
	 * @param digestSize Output digest size (bytes)
	 */
	constructor(digestSize: number) {
		super(shake_suffix, digestSize, 32 /*256/8*/);
	}
}

// SP800-185 SHA3 Derived functions

function leftEncode(w: number): Uint8Array {
	//This is very complicatedly written in the spec
	//The max number we can hold is 2^51 because of JS
	//So we only require 7 bytes to represent that (size+6)
	const ret = new Uint8Array(7);
	let ptr = 6;
	do {
		ret[ptr--] = w; //bitExt.reverse(w);/*implied: &0xff*/
		//Can't use bit shift because it's limited to 32 bit ints
		//w>>>=8;
		w = Math.floor(w / 256);
	} while (w > 0);
	ret[ptr] = 6 - ptr; //bitExt.reverse(ptr-1);
	return ret.subarray(ptr);
}
function rightEncode(w: number): Uint8Array {
	//The max number we can hold is 2^51 because of JS
	//So we only require 7 bytes to represent that (size+6)
	const ret = new Uint8Array(7);
	let ptr = 5;
	do {
		ret[ptr--] = w; //bitExt.reverse(w);/*implied: &0xff*/
		//Can't use bit shift because it's limited to 32 bit ints
		//w>>>=8;
		w = Math.floor(w / 256);
	} while (w > 0);
	ret[6] = 5 - ptr; //bitExt.reverse(ptr-1);
	return ret.subarray(ptr + 1);
}
function encodeString(x?: string | Uint8Array): Uint8Array {
	const s =
		x == undefined
			? new Uint8Array(0)
			: x instanceof Uint8Array
			? x
			: utf8.toBytes(x);
	const l = leftEncode(s.length << 3);
	const ret = new Uint8Array(l.length + s.length);
	ret.set(l);
	ret.set(s, l.length);
	return ret;
}
function bytePad(w: number, ...x: Uint8Array[]): Uint8Array {
	somewhatSafe.int.gte('w', w, 1);
	const l = leftEncode(w);
	//Sum all the inputs (x)
	let reqSpace = 0;
	for (let i = 0; i < x.length; i++) reqSpace += x[i].length;
	//Figure out allocation size
	let alloc = w;
	while (alloc < reqSpace) alloc += w;
	const ret = new Uint8Array(alloc);
	ret.set(l);
	let ptr = l.length;
	for (let i = 0; i < x.length; i++) {
		ret.set(x[i], ptr);
		ptr += x[i].length;
	}
	return ret;
}

class CShake implements IHash {
	//cSHAKE128(X, L, N, S)  X=inputString, L=outputLengthBits, N=functionName, S=customization
	private _keccak: KeccakCore;
	protected readonly customization: Uint8Array;

	constructor(
		/** capacity size*/
		protected cap: number,
		/** padding size*/
		protected pad: number,
		digestSize: number,
		/** function name */
		protected functionName = '',
		customization?: Uint8Array | string
	) {
		if (
			functionName.length == 0 &&
			(!customization || customization.length == 0)
		) {
			//Shake
			this._keccak = new KeccakCore(shake_suffix, digestSize, cap);
			this.customization = new Uint8Array(0);
		} else {
			//cShake
			this._keccak = new KeccakCore(cShake_suffix, digestSize, cap);
			this.customization =
				customization == undefined
					? new Uint8Array(0)
					: customization instanceof Uint8Array
					? customization
					: utf8.toBytes(customization);
			this._keccak.write(
				bytePad(
					this.pad,
					encodeString(this.functionName),
					encodeString(this.customization)
				)
			);
		}
	}
	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		this._keccak.write(data);
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
		return this._keccak.sumIn();
	}
	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		this._keccak.reset();
		if (this._keccak.suffix === cShake_suffix) {
			this._keccak.write(
				bytePad(
					this.pad,
					encodeString(this.functionName),
					encodeString(this.customization)
				)
			);
		}
	}
	/**
	 * Create an empty IHash using the same algorithm
	 */
	newEmpty(): IHash {
		return new CShake(
			this.cap,
			this.pad,
			this.size,
			this.functionName,
			this.customization
		);
	}
	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): CShake {
		const ret = new CShake(
			this.cap,
			this.pad,
			this.size,
			this.functionName,
			this.customization
		);
		this._cloneHelp(ret);
		return ret;
	}
	protected _cloneHelp(ret: CShake): void {
		ret._keccak = this._keccak.clone();
	}
	/**
	 * Digest size in bytes
	 */
	get size(): number {
		return this._keccak.size;
	}
	/**
	 * Block size in bytes
	 */
	get blockSize(): number {
		return this._keccak.blockSize;
	}
}
export class CShake128 extends CShake {
	/**
	 * Build a new cShake 128bit generator
	 * @param digestSize Output digest size (bytes) (aka L)
	 * @param functionName Function-name string (aka N)
	 * @param customization Customization string (aka S)
	 */
	constructor(
		digestSize: number,
		functionName = '',
		customization?: Uint8Array | string
	) {
		super(cap128, pad128, digestSize, functionName, customization);
	}
}
export class CShake256 extends CShake {
	/**
	 * Build a new cShake 256bit generator
	 * @param digestSize Output digest size (bytes) (aka L)
	 * @param functionName Function-name string (aka N)
	 * @param customization Customization string (aka S)
	 */
	constructor(digestSize: number, functionName = '', customization = '') {
		super(cap256, pad256, digestSize, functionName, customization);
	}
}

class KmacCore extends CShake {
	// KMAC(K,X,L,S) K=key, X=inputString,L=digestSize (bits),S=customization
	constructor(
		/** Whether size should be appended on sum */
		private appendSize: boolean,
		cap: number,
		pad: number,
		digestSize: number,
		key?: Uint8Array | string,
		customization?: Uint8Array | string
	) {
		super(cap, pad, digestSize, kMacFn, customization);
		this.write(bytePad(pad, encodeString(key)));
	}
	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 * Use if you won't need the obj again (for performance)
	 */
	sumIn(): Uint8Array {
		super.write(rightEncode(this.appendSize ? this.size << 3 : 0));
		return super.sumIn();
	}
	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): KmacCore {
		const ret = new KmacCore(
			this.appendSize,
			this.cap,
			this.pad,
			this.size,
			this.functionName,
			this.customization
		);
		super._cloneHelp(ret);
		return ret;
	}
}
export class Kmac128 extends KmacCore {
	/**
	 * Build a new KMAC 128bit generator
	 * - Key SHOULD NOT be less than digestSize (32 by default) per SP800-185
	 * @param digestSize Digest size in bytes, 32 by default (128bit)
	 * @param key Optional key a string (will be utf8 encoded) or in bytes
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(
		digestSize = 32,
		key?: Uint8Array | string,
		customization?: Uint8Array | string
	) {
		super(true, cap128, pad128, digestSize, key, customization);
	}
}
export class Kmac256 extends KmacCore {
	/**
	 * Build a new KMAC 256bit generator
	 * - Key SHOULD NOT be less than digestSize (32 by default) per SP800-185
	 * @param digestSize Digest size in bytes, 64 by default
	 * @param key Optional key a string (will be utf8 encoded) or in bytes
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(
		digestSize = 64,
		key?: Uint8Array | string,
		customization?: Uint8Array | string
	) {
		super(true, cap256, pad256, digestSize, key, customization);
	}
}
export class KmacXof128 extends KmacCore {
	/**
	 * Build a new KMACXOF 128bit generator
	 * @param digestSize Digest size in bytes
	 * @param key Optional key a string (will be utf8 encoded) or in bytes
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(
		digestSize: number,
		key?: Uint8Array | string,
		customization?: Uint8Array | string
	) {
		super(false, cap128, pad128, digestSize, key, customization);
	}
}
export class KmacXof256 extends KmacCore {
	/**
	 * Build a new KMACXOF 256bit generator
	 * @param digestSize Digest size in bytes
	 * @param key Optional key a string (will be utf8 encoded) or in bytes
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(
		digestSize: number,
		key?: Uint8Array | string,
		customization?: Uint8Array | string
	) {
		super(false, cap256, pad256, digestSize, key, customization);
	}
}

class TupleHashCore extends CShake {
	// TupleHash(K,L,S) X=input sets, L=digestSize(bits), S=customization
	constructor(
		/** Whether size should be appended on sum */
		private appendSize: boolean,
		cap: number,
		pad: number,
		digestSize: number,
		customization?: Uint8Array | string
	) {
		super(cap, pad, digestSize, tupleHashFn, customization);
	}
	/**
	 * Write data to the hash (can be called multiple times)
	 * ! Careful write(a), write(b) is not the same as write(ab)
	 * @param data
	 */
	write(data: Uint8Array): void {
		super.write(encodeString(data));
	}
	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 * Use if you won't need the obj again (for performance)
	 */
	sumIn(): Uint8Array {
		super.write(rightEncode(this.appendSize ? this.size << 3 : 0));
		return super.sumIn();
	}
	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): TupleHashCore {
		const ret = new TupleHashCore(
			this.appendSize,
			this.cap,
			this.pad,
			this.size,
			this.customization
		);
		super._cloneHelp(ret);
		return ret;
	}
}
export class TupleHash128 extends TupleHashCore {
	/**
	 * Build a new TupleHash 128bit generator
	 * @param digestSize Digest size in bytes, 32 by default (128bit)
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(digestSize = 32, customization?: Uint8Array | string) {
		super(true, cap128, pad128, digestSize, customization);
	}
}
export class TupleHash256 extends TupleHashCore {
	/**
	 * Build a new TupleHash 256bit generator
	 * @param digestSize Digest size in bytes, 64 by default (256bit)
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(digestSize = 64, customization?: Uint8Array | string) {
		super(true, cap256, pad256, digestSize, customization);
	}
}
export class TupleHashXof128 extends TupleHashCore {
	/**
	 * Build a new TupleHashXof 128bit generator
	 * @param digestSize Digest size in bytes
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(digestSize: number, customization?: Uint8Array | string) {
		super(false, cap128, pad128, digestSize, customization);
	}
}
export class TupleHashXof256 extends TupleHashCore {
	/**
	 * Build a new TupleHashXof 256bit generator
	 * @param digestSize Digest size in bytes
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(digestSize: number, customization?: Uint8Array | string) {
		super(false, cap256, pad256, digestSize, customization);
	}
}

class ParallelHashCore extends CShake {
	//ParallelHash(X, B, L, S) X=input, B=blockSize(Bytes), L=digestSize(bits), S=customization
	readonly #outBlock: Uint8Array;
	private _subHash: CShake;
	private _obPos = 0;
	private _obCount = 0;

	constructor(
		/** Whether size should be appended on sum */
		private appendSize: boolean,
		cap: number,
		pad: number,
		blockSize: number,
		digestSize: number,
		customization?: Uint8Array | string
	) {
		super(cap, pad, digestSize, parallelHashFn, customization);
		this.#outBlock = new Uint8Array(blockSize);
		this._subHash = new CShake(cap, pad, digestSize, '', '');
		super.write(leftEncode(blockSize));
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		let nToWrite = data.length;
		let dPos = 0;
		let space = this.#outBlock.length - this._obPos;
		while (nToWrite > 0) {
			//Note this is >, so if there's exactly space this won't trigger
			// (ie bPos will always be some distance away from max allowing at least 1 byte write)
			if (space > nToWrite) {
				//More space than data, copy in verbatim
				this.#outBlock.set(data.subarray(dPos), this._obPos);
				//Update pos
				this._obPos += nToWrite;
				return;
			}
			this.#outBlock.set(
				data.subarray(dPos, dPos + this.#outBlock.length),
				this._obPos
			);
			this._obPos += space;

			//Instead of hash, we subhash, write that result, and rely on the original write (cShake)
			// to merge things together
			this._subHash.reset();
			this._subHash.write(this.#outBlock);
			super.write(this._subHash.sum());
			this._obPos = 0;
			this._obCount++;

			dPos += space;
			nToWrite -= space;
			space = this.#outBlock.length;
		}
	}
	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 * Use if you won't need the obj again (for performance)
	 */
	sumIn(): Uint8Array {
		if (this._obPos > 0) {
			this._subHash.reset();
			this._subHash.write(this.#outBlock.subarray(0, this._obPos));
			super.write(this._subHash.sum());
		}
		super.write(rightEncode(this._obCount));
		super.write(rightEncode(this.appendSize ? this.size << 3 : 0));
		return super.sumIn();
	}

	/**
	 * Set hash state. Any past writes will be forgotten
	 */
	reset(): void {
		super.reset();
		super.write(leftEncode(this.#outBlock.length));
		this.#outBlock.fill(0);
		this._obPos = 0;
		this._obCount = 0;
	}
	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): ParallelHashCore {
		const ret = new ParallelHashCore(
			this.appendSize,
			this.cap,
			this.pad,
			this.#outBlock.length,
			this.size,
			this.customization
		);
		this._cloneHelp(ret);
		return ret;
	}
	protected _cloneHelp(ret: ParallelHashCore): void {
		super._cloneHelp(ret);
		ret.#outBlock.set(this.#outBlock);
		ret._subHash = this._subHash.clone();
		ret._obPos = this._obPos;
		ret._obCount = this._obCount;
	}
}
export class ParallelHash128 extends ParallelHashCore {
	/**
	 * Build a new ParallelHash 128bit generator
	 * @param blockSize Block size in bytes
	 * @param digestSize Digest size in bytes, 32 by default (128bit)
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(
		blockSize: number,
		digestSize = 32,
		customization?: Uint8Array | string
	) {
		super(true, cap128, pad128, blockSize, digestSize, customization);
	}
}
export class ParallelHash256 extends ParallelHashCore {
	/**
	 * Build a new ParallelHash 256bit generator
	 * @param blockSize Block size in bytes
	 * @param digestSize Digest size in bytes, 64 by default (256bit)
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(
		blockSize: number,
		digestSize = 64,
		customization?: Uint8Array | string
	) {
		super(true, cap256, pad256, blockSize, digestSize, customization);
	}
}
export class ParallelHashXof128 extends ParallelHashCore {
	/**
	 * Build a new ParallelHashXof 128bit generator
	 * @param blockSize Block size in bytes
	 * @param digestSize Digest size in bytes
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(
		blockSize: number,
		digestSize: number,
		customization?: Uint8Array | string
	) {
		super(false, cap128, pad128, blockSize, digestSize, customization);
	}
}
export class ParallelHashXof256 extends ParallelHashCore {
	/**
	 * Build a new ParallelHashXof 256bit generator
	 * @param blockSize Block size in bytes
	 * @param digestSize Digest size in bytes
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(
		blockSize: number,
		digestSize: number,
		customization?: Uint8Array | string
	) {
		super(false, cap256, pad256, blockSize, digestSize, customization);
	}
}

export class TurboShake128 extends KeccakCore {
	//https://eprint.iacr.org/2023/342.pdf
	/**
	 * Build a new TurboShake 128bit XOF generator
	 * @param digestSize Output digest size (bytes)
	 * @param domainSep Domain separation byte 01-7F
	 */
	constructor(digestSize: number, domainSep = 0x1f) {
		super(domainSep, digestSize, 16 /*128/8*/, k12RoundStart);
		//console.log(`${this.blockSize}`);
	}
}
export class TurboShake256 extends KeccakCore {
	//https://eprint.iacr.org/2023/342.pdf
	/**
	 * Build a new TurboShake 256bit XOF generator
	 * @param digestSize Output digest size (bytes)
	 * @param domainSep Domain separation byte 01-7F
	 */
	constructor(digestSize: number, domainSep = 0x1f) {
		super(domainSep, digestSize, 32 /*128/8*/, k12RoundStart);
		//console.log(`${this.blockSize}`);
	}
}

/**Almost the same as Keccak rightEncode except 0=[0] (vs 0=[0,0]) */
function k12LengthEncode(w: number): Uint8Array {
	//The max number we can hold is 2^51 because of JS
	//So we only require 7 bytes to represent that (size+6)
	const ret = new Uint8Array(7);
	let ptr = 5;
	while (w > 0) {
		ret[ptr--] = w;
		w = Math.floor(w / 256);
	}
	ret[6] = 5 - ptr;
	return ret.subarray(ptr + 1);
}

export class KangarooTwelve extends KeccakCore {
	// KangarooTwelve( M, C, L ) m=message (bytes), c=customization (bytes) l=digestSize
	readonly maxChunkSize = 8192;
	protected readonly customization: Uint8Array;
	private _chunks: TurboShake128[] = [];
	private _ingestBlockBytes = 0;

	/**
	 * Build a new KangarooTwelve XOF generator
	 * @param digestSize Output digest size (bytes)
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(digestSize: number, customization?: Uint8Array | string) {
		super(0x07, digestSize, 16, k12RoundStart);
		this.customization =
			customization == undefined
				? new Uint8Array(0)
				: customization instanceof Uint8Array
				? customization
				: utf8.toBytes(customization);
	}

	/**
	 * Write data to the hash (can be called multiple times)
	 * @param data
	 */
	write(data: Uint8Array): void {
		//We have to override this because we redirect writing when the (cumulative) data size
		// exceeds maxChunkSize
		if (this._ingestBlockBytes + data.length > this.maxChunkSize) {
			const eat = this.maxChunkSize - this._ingestBlockBytes;
			if (this._chunks.length === 0) {
				super.write(data.subarray(0, eat));
			} else {
				this._chunks[this._chunks.length - 1].write(data.subarray(0, eat));
			}
			//Build the next chunk
			this._chunks[this._chunks.length] = new TurboShake128(32, 0x0b);
			this._ingestBlockBytes = 0;
			//Recurse
			this.write(data.subarray(eat));
		} else if (this._chunks.length === 0) {
			this._ingestBlockBytes += data.length;
			super.write(data);
		} else {
			this._ingestBlockBytes += data.length;
			this._chunks[this._chunks.length - 1].write(data);
		}
	}

	protected xorSuffix(): void {
		//We have to override to allow appending of customization (unlike cShake where
		// it's written at the start)
		// Further we may need to do final block preparation if input exceeded maxChunkSize
		this.write(this.customization);
		this.write(k12LengthEncode(this.customization.length));

		if (this._chunks.length > 0) {
			//All these features go into the "main" chunk (so cannot use this.write)
			super.write(Uint8Array.of(3, 0, 0, 0, 0, 0, 0, 0));
			for (let i = 0; i < this._chunks.length; i++) {
				//Append CV_(i+1)
				super.write(this._chunks[i].sum());
			}
			super.write(k12LengthEncode(this._chunks.length));
			super.write(Uint8Array.of(0xff, 0xff));
			this.block[this.bPos] ^= 6;
		} else {
			this.block[this.bPos] ^= 7;
		}
	}

	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): KangarooTwelve {
		const ret = new KangarooTwelve(this.size, this.customization);
		this._cloneHelp(ret);
		return ret;
	}
	protected _cloneHelp(ret: KangarooTwelve): void {
		super._cloneHelp(ret);
		ret._chunks = this._chunks; //It's ok that these are sharing memory
		ret._ingestBlockBytes = this._ingestBlockBytes;
	}
}

// MarsupilamiFourteen seems to have been deprecated
// 		https://keccak.team
//		https://github.com/XKCP/XKCP,
// 		https://datatracker.ietf.org/doc/draft-irtf-cfrg-kangarootwelve/
// There's vague references (=K12 /w 14 rounds, and twice the capacity bites)
// but no official test vectors.

export class HopMac extends KangarooTwelve {
	//HopMAC(Key, M, C, L) key=secret, m=message, c=customization, l=digestSize
	//This is the "inner" hash
	private _outerSize: number;
	//get size():number {return this.size;}
	readonly #key: Uint8Array;

	/**
	 * Build a new HopMAC generator
	 * @param digestSize Digest size in bytes
	 * @param key String (will be utf8 encoded) or bytes
	 * @param customization Optional customization string (will be utf8 encoded) or in bytes
	 */
	constructor(
		digestSize: number,
		key: Uint8Array | string,
		customization?: Uint8Array | string
	) {
		super(32, customization);
		this._outerSize = digestSize;
		this.#key = key instanceof Uint8Array ? key : utf8.toBytes(key);
	}

	get size(): number {
		return this._outerSize;
	}

	/**
	 * Sum the hash - mutates internal state, but avoids memory alloc.
	 * Use if you won't need the obj again (for performance)
	 */
	sumIn(): Uint8Array {
		//Sum inner as normal =K12(M,C,32)
		const inner = super.sumIn();
		//Build an outer K12 using inner as the customization
		const outer = new KangarooTwelve(this._outerSize, inner);
		//Add key as the message
		outer.write(this.#key);
		//And return the sum
		return outer.sumIn();
	}
	// clone - inheritance issues
	/**
	 * Create a copy of the current context (uses different memory)
	 * @returns
	 */
	clone(): HopMac {
		const ret = new HopMac(this._outerSize, this.#key, this.customization);
		this._cloneHelp(ret);
		return ret;
	}
}
