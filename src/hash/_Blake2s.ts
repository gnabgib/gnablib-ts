/*! Copyright 2023 gnabgib MPL-2.0 */

import * as littleEndian from '../endian/little.js';
import { Uint64 } from '../primitive/Uint64.js';
import * as bitExt from '../primitive/BitExt.js';
import * as intExt from '../primitive/IntExt.js';

import { SizeError } from '../primitive/ErrorExt.js';
import {
	iv,
	sigmas,
	fanOutSequential,
	maxDepthSequential,
	leafMaxLenSequential,
	nodeOffsetSequential,
	nodeDepthSequential,
	innerLenSequential
} from './_blake2.js';
//import { iv, sigmas } from './_blake';

//https://en.wikipedia.org/wiki/BLAKE_(hash_function)
//https://www.blake2.net/
//https://www.blake2.net/blake2.pdf
//https://datatracker.ietf.org/doc/html/rfc7693

const blockSizeBytes = 64; //512 bits
const maxDigestSizeBytes = blockSizeBytes >> 1; //32 bytes, 256 bits
const maxKeySizeBytes = blockSizeBytes >> 1; //32 bytes, 256 bits
const saltPersonalizeSizeBytes = 8;
const rounds = 10;
const rRot1 = 16;
const rRot2 = 12;
const rRot3 = 8;
const rRot4 = 7;

export class Parameters2s {
	readonly data: Uint8Array;
	readonly key: Uint8Array;

	constructor(
		digestSizeBytes: number,
		fanOut: number,
		depth: number,
		leafLen: number,
		nodeOffset: Uint64,
		nodeDepth: number,
		innerLen: number,
		key?: Uint8Array,
		salt?: Uint8Array,
		personalization?: Uint8Array
	) {
		//todo: this
		this.data = new Uint8Array(32);
		this.data[0] = digestSizeBytes;
		if (key && key.length !== 0) {
			if (key.length != maxKeySizeBytes) throw new SizeError('key', key.length, maxKeySizeBytes);
			this.data[1] = key.length; //Should be maxKeySizeBytes
			this.key = key;
		} else {
			this.key = new Uint8Array(0);
			this.data[1] = 0;
		}
		this.data[2] = fanOut;
		this.data[3] = depth;
		//This is a hack but nodeOffset should only be upto 6 bytes, while we only have tools to write
		// out 8.. so lets write the 8 2 bytes early, and then write leafLen over the top
		if (nodeOffset.gt(Uint64.fromNumber(0xffffffffffff)))
			throw new RangeError(`nodeOffset can only be up to 2^48 got ${nodeOffset.toString()}`);
		littleEndian.u64IntoBytesUnsafe(nodeOffset, this.data, 6);
		littleEndian.u32IntoBytesUnsafe(leafLen, this.data, 4);
		this.data[14] = nodeDepth;
		this.data[15] = innerLen;
		if (salt && salt.length !== 0) {
			if (salt.length !== saltPersonalizeSizeBytes)
				throw new SizeError('salt', salt.length, saltPersonalizeSizeBytes);
			this.data.set(salt, 16);
		}
		if (personalization && personalization.length !== 0) {
			if (personalization.length !== saltPersonalizeSizeBytes)
				throw new SizeError('personalization', personalization.length, saltPersonalizeSizeBytes);
			this.data.set(personalization, 24);
		}
	}

	static Sequential(
		digestSizeBytes: number,
		key?: Uint8Array,
		salt?: Uint8Array,
		personalization?: Uint8Array
	): Parameters2s {
		return new Parameters2s(
			digestSizeBytes,
			fanOutSequential,
			maxDepthSequential,
			leafMaxLenSequential,
			nodeOffsetSequential,
			nodeDepthSequential,
			innerLenSequential,
			key,
			salt,
			personalization
		);
	}

	get digestSizeBytes(): number {
		return this.data[0];
	}
	get keySizeBytes(): number {
		return this.data[1];
	}
	get fanOut(): number {
		return this.data[2];
	}
	get depth(): number {
		return this.data[3];
	}
	get leafLen(): number {
		return littleEndian.u32FromBytes(this.data, 4);
	}
	get nodeOffset(): Uint64 {
		return littleEndian.u64FromBytes(this.data, 8);
	}
	get nodeDepth(): number {
		return this.data[16];
	}
	get innerLen(): number {
		return this.data[17];
	}
	get salt(): Uint8Array {
		return this.data.slice(32, 48);
	}
	get personalization(): Uint8Array {
		return this.data.slice(48);
	}
	get h0(): number {
		return littleEndian.u32FromBytes(this.data, 0);
	}
	get h1(): number {
		return littleEndian.u32FromBytes(this.data, 4);
	}
	get h2(): number {
		return littleEndian.u32FromBytes(this.data, 8);
	}
	get h3(): number {
		return littleEndian.u32FromBytes(this.data, 12);
	}
	get h4(): number {
		return littleEndian.u32FromBytes(this.data, 16);
	}
	get h5(): number {
		return littleEndian.u32FromBytes(this.data, 20);
	}
	get h6(): number {
		return littleEndian.u32FromBytes(this.data, 24);
	}
	get h7(): number {
		return littleEndian.u32FromBytes(this.data, 28);
	}
}

class Ctx {
	readonly bytes: Uint8Array; //b
	readonly h: Uint32Array;
	count: Uint64; //t[0] t[1]
	ptr = 0; //c
	readonly digestSizeBytes: number; //outlen

	constructor(key: Uint8Array, digestSizeBytes: number) {
		this.bytes = new Uint8Array(blockSizeBytes);

		this.h = new Uint32Array(8);
		this.h[0] = iv[0] ^ 0x1010000 ^ ((key.length << 8) | digestSizeBytes);
		this.h[1] = iv[2];
		this.h[2] = iv[4];
		this.h[3] = iv[6];
		this.h[4] = iv[8];
		this.h[5] = iv[10];
		this.h[6] = iv[12];
		this.h[7] = iv[14];

		this.count = new Uint64(0);
		this.digestSizeBytes = digestSizeBytes;
		if (key.length > 0) this.update(key);
	}

	private mix(
		i: number,
		b: number,
		c: number,
		d: number,
		v: Uint32Array,
		m: Uint32Array,
		sigma: number[]
	): void {
		//Also referred to as "g" in docs
		const a = i & 3, //%4
			i2 = i << 1,
			j = sigma[i2],
			k = sigma[i2 + 1],
			mj = m[j],
			mk = m[k];

		//Step 1
		v[a] += v[b] + mj; //a ← a + b + m[j]
		v[d] = bitExt.rotRight32(v[d] ^ v[a], rRot1); //d ← (d ⊕ a) >>> 16
		//Step 2
		v[c] += v[d]; //c ← c + d
		v[b] = bitExt.rotRight32(v[b] ^ v[c], rRot2); //b ← (b ⊕ c) >>> 12
		//Step 3
		v[a] += v[b] + mk; //a ← a + b + m[k]
		v[d] = bitExt.rotRight32(v[d] ^ v[a], rRot3); //d ← (d ⊕ a) >>> 8
		//Step 4
		v[c] += v[d]; //c ← c + d
		v[b] = bitExt.rotRight32(v[b] ^ v[c], rRot4); //b ← (b ⊕ c) >>> 7
	}

	private compress(last: boolean): void {
		const v = new Uint32Array(16);
		v.set(this.h);
		v[8] = iv[0];
		v[9] = iv[2];
		v[10] = iv[4];
		v[11] = iv[6];
		v[12] = iv[8] ^ this.count.lowU32;
		v[13] = iv[10] ^ this.count.highU32;
		v[14] = iv[12];
		v[15] = iv[14];
		if (last) {
			v[14] = ~v[14];
		}
		const m = new Uint32Array(16);
		littleEndian.u32IntoArrFromBytes(m, 0, 16, this.bytes);

		// console.log(`m=${hex.fromU32s(m,' ')}`);
		// console.log(`vi=${hex.fromU32s(v,' ')}`);
		for (let r = 0; r < rounds; r++) {
			const sigma = sigmas[r % 10];
			//column
			this.mix(0, 4, 8, 12, v, m, sigma);
			this.mix(1, 5, 9, 13, v, m, sigma);
			this.mix(2, 6, 10, 14, v, m, sigma);
			this.mix(3, 7, 11, 15, v, m, sigma);

			//diagonal
			this.mix(4, 5, 10, 15, v, m, sigma);
			this.mix(5, 6, 11, 12, v, m, sigma);
			this.mix(6, 7, 8, 13, v, m, sigma);
			this.mix(7, 4, 9, 14, v, m, sigma);
			//console.log(`v${r+1}=${hex.fromU32s(v,' ')}`);
		}

		for (let i = 0; i < 8; i++) {
			this.h[i] ^= v[i] ^ v[i + 8];
		}
	}

	update(input: Uint8Array): void {
		for (let i = 0; i < input.length; i++) {
			if (this.ptr === blockSizeBytes) {
				this.count = this.count.add(Uint64.fromNumber(this.ptr));
				this.compress(false);
				this.ptr = 0;
			}
			this.bytes[this.ptr++] = input[i];
		}
	}

	finalize(): Uint8Array {
		this.count = this.count.addNumber(this.ptr);
		//Zero pad the rest of the buffer
		if (this.ptr != blockSizeBytes) {
			const zeros = new Uint8Array(blockSizeBytes - this.ptr);
			this.bytes.set(zeros, this.ptr);
		}
		this.compress(true);

		const ret = new Uint8Array(maxDigestSizeBytes);
		//We can use unsafe because we just sized it accurately
		//const ret = new Uint8Array(this.digestSizeBytes);
		littleEndian.u32ArrIntoBytesUnsafe(this.h, ret);
		return ret.slice(0, this.digestSizeBytes);
	}
}

/**
 * Perform a blake2s hash with 10 rounds
 * @param bytes Data to hash
 * @param digestSizeBytes 0-32
 * @param key Uint8Array(32)|undefined must be 32 uint8 long if specified (defaults to zeros)
 * @returns hash Uint8Array[@param digestSizeBytes]
 */
export function blake2s(bytes: Uint8Array, digestSizeBytes: number, key?: Uint8Array): Uint8Array {
	intExt.inRangeInclusive(digestSizeBytes, 1, maxDigestSizeBytes);
	if (key) {
		if (key.length != maxKeySizeBytes) throw new SizeError('key', key.length, maxKeySizeBytes);
	} else {
		key = new Uint8Array(0);
	}
	const ret = new Ctx(key, digestSizeBytes);
	ret.update(bytes);
	return ret.finalize();
}
