import * as littleEndian from '../endian/little';
import { Uint64 } from '../primitive/Uint64';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as hex from '../encoding/Hex';
import { SizeError } from '../primitive/ErrorExt';
import {
	iv,
	sigmas,
	fanOutSequential,
	maxDepthSequential,
	leafMaxLenSequential,
	nodeOffsetSequential,
	nodeDepthSequential,
	innerLenSequential
} from './_blake2';

//https://en.wikipedia.org/wiki/BLAKE_(hash_function)
//https://www.blake2.net/
//https://www.blake2.net/blake2.pdf
//https://datatracker.ietf.org/doc/html/rfc7693

const blockSizeBytes = 128; //1024 bits
const maxDigestSizeBytes = blockSizeBytes >> 1; //512 bits
const maxKeySizeBytes = blockSizeBytes >> 1; //512 bits
const saltPersonalizeSizeBytes = 16;
const rounds = 12;
const rRot1 = 32;
const rRot2 = 24;
const rRot3 = 16;
const rRot4 = 63;

export class Parameters2b {
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
		this.data = new Uint8Array(64);
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
		littleEndian.u32IntoBytesUnsafe(leafLen, this.data, 4);
		littleEndian.u64IntoBytesUnsafe(nodeOffset, this.data, 8);
		this.data[16] = nodeDepth;
		this.data[17] = innerLen;
		//18-31 Reserved for future use/app specific use
		if (salt && salt.length !== 0) {
			if (salt.length !== saltPersonalizeSizeBytes)
				throw new SizeError('salt', salt.length, saltPersonalizeSizeBytes);
			this.data.set(salt, 32);
		}
		if (personalization && personalization.length !== 0) {
			if (personalization.length !== saltPersonalizeSizeBytes)
				throw new SizeError('personalization', personalization.length, saltPersonalizeSizeBytes);
			this.data.set(personalization, 48);
		}
	}

	static Sequential(
		digestSizeBytes: number,
		key?: Uint8Array,
		salt?: Uint8Array,
		personalization?: Uint8Array
	): Parameters2b {
		return new Parameters2b(
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
	get h0(): Uint64 {
		return littleEndian.u64FromBytes(this.data, 0);
	}
	get h1(): Uint64 {
		return littleEndian.u64FromBytes(this.data, 8);
	}
	get h2(): Uint64 {
		return littleEndian.u64FromBytes(this.data, 16);
	}
	get h3(): Uint64 {
		return littleEndian.u64FromBytes(this.data, 24);
	}
	get h4(): Uint64 {
		return littleEndian.u64FromBytes(this.data, 32);
	}
	get h5(): Uint64 {
		return littleEndian.u64FromBytes(this.data, 40);
	}
	get h6(): Uint64 {
		return littleEndian.u64FromBytes(this.data, 48);
	}
	get h7(): Uint64 {
		return littleEndian.u64FromBytes(this.data, 56);
	}
}

class Ctx {
	readonly bytes: Uint8Array; //b
	readonly h: Uint64[];
	readonly countHigh = new Uint64(0); //In JS can never be >0
	countLow: Uint64; //t
	ptr = 0; //c
	readonly digestSizeBytes: number; //outlen

	constructor(opts: Parameters2b) {
		this.bytes = new Uint8Array(blockSizeBytes);

		this.h = new Array<Uint64>(8);
		this.h[0] = new Uint64(iv[1], iv[0]).xor(opts.h0);
		this.h[1] = new Uint64(iv[3], iv[2]).xor(opts.h1);
		this.h[2] = new Uint64(iv[5], iv[4]).xor(opts.h2);
		this.h[3] = new Uint64(iv[7], iv[6]).xor(opts.h3);
		this.h[4] = new Uint64(iv[9], iv[8]).xor(opts.h4);
		this.h[5] = new Uint64(iv[11], iv[10]).xor(opts.h5);
		this.h[6] = new Uint64(iv[13], iv[12]).xor(opts.h6);
		this.h[7] = new Uint64(iv[15], iv[14]).xor(opts.h7);

		this.countLow = new Uint64(0);
		this.digestSizeBytes = opts.digestSizeBytes;
		if (opts.key.length > 0) this.update(opts.key);
	}

	private mix(
		i: number,
		b: number,
		c: number,
		d: number,
		v: Uint64[],
		m: Uint64[],
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
		v[a] = v[a].add(v[b]).add(mj); //a ← a + b + m[j]
		v[d] = v[d].xor(v[a]).rRot(rRot1); //d ← (d ⊕ a) >>> 32
		//Step 2
		v[c] = v[c].add(v[d]); //c ← c + d
		v[b] = v[b].xor(v[c]).rRot(rRot2); //b ← (b ⊕ c) >>> 24
		//Step 3
		v[a] = v[a].add(v[b]).add(mk); //a ← a + b + m[k]
		v[d] = v[d].xor(v[a]).rRot(rRot3); //d ← (d ⊕ a) >>> 16
		//Step 4
		v[c] = v[c].add(v[d]); //c ← c + d
		v[b] = v[b].xor(v[c]).rRot(rRot4); //b ← (b ⊕ c) >>> 63
	}

	private compress(last: boolean): void {
		const v = new Array<Uint64>(16);
		let i = 0;
		for (; i < 8; i++) {
			v[i] = this.h[i];
			v[i + 8] = new Uint64(iv[i * 2 + 1], iv[i * 2]);
		}
		v[12] = v[12].xor(this.countLow);
		//No need to xor v13, countHigh is always 0
		if (last) {
			v[14] = v[14].not();
		}
		const m = new Array<Uint64>(16);
		littleEndian.u64IntoArrFromBytes(m, 0, 16, this.bytes);

		// console.log(`m=${hex.fromU64s(m,' ')}`);
		// console.log(`vi=${hex.fromU64s(v,' ')}`);
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

		for (i = 0; i < 8; i++) {
			this.h[i] = this.h[i].xor(v[i]).xor(v[i + 8]);
		}
	}

	update(input: Uint8Array): void {
		for (let i = 0; i < input.length; i++) {
			if (this.ptr === blockSizeBytes) {
				this.countLow = this.countLow.add(Uint64.fromNumber(this.ptr));
				this.compress(false);
				this.ptr = 0;
			}
			this.bytes[this.ptr++] = input[i];
		}
	}

	finalize(): Uint8Array {
		this.countLow = this.countLow.addNumber(this.ptr);
		//Zero pad the rest of the buffer
		if (this.ptr != blockSizeBytes) {
			const zeros = new Uint8Array(blockSizeBytes - this.ptr);
			this.bytes.set(zeros, this.ptr);
		}
		this.compress(true);

		const ret = new Uint8Array(maxDigestSizeBytes);
		//We can use unsafe because we just sized it accurately
		littleEndian.u64ArrIntoBytesUnsafe(this.h, ret);
		return ret.slice(0, this.digestSizeBytes);
	}
}

/**
 * Perform a blake2b hash with 12 rounds (aka Blake2)
 * @param bytes Data to hash
 * @param optsOrDigestSizeBytes Parameters2b configuration, or number of bytes 1-64
 * @returns hash Uint8Array[@param digestSizeBytes]
 */
export function blake2b(
	bytes: Uint8Array,
	optsOrDigestSizeBytes: Parameters2b | number
): Uint8Array {
	let ret: Ctx;
	if (optsOrDigestSizeBytes instanceof Parameters2b) {
		ret = new Ctx(optsOrDigestSizeBytes);
	} else {
		ret = new Ctx(Parameters2b.Sequential(optsOrDigestSizeBytes));
	}
	ret.update(bytes);
	return ret.finalize();
}
