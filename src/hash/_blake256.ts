/*! Copyright 2023 gnabgib MPL-2.0 */

import * as bigEndian from '../endian/big.js';
import * as bitExt from '../primitive/BitExt.js';
import { SizeError } from '../primitive/ErrorExt.js';
import { iv, n, sigmas } from './_blake.js';

const digestSizeBytes = 32; //256 bits
const block256SizeBytes = 64; //512 bits
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const b32rounds = 10; //Blake32 was submitted with 10 rounds, then increased to 14 and renamed blake256
const b256rounds = 14;

//https://en.wikipedia.org/wiki/BLAKE_(hash_function)
//https://ehash.iaik.tugraz.at/uploads/0/06/Blake.pdf

function pad(bytes: Uint8Array): Uint8Array {
	//Require space is actually 1 more bit than this.. is this going to bite us?
	const reqSpace = bitExt.size64Bytes;
	const len =
		bytes.length + reqSpace + block256SizeBytes - ((bytes.length + reqSpace) % block256SizeBytes);

	const padBytes = new Uint8Array(len);
	padBytes.set(bytes, 0);
	//Add a 1 on the end
	padBytes[bytes.length] = 0x80;
	//And end with a 1
	padBytes[len - bitExt.size64Bytes - 1] |= 1;
	//And append the length
	bigEndian.u32IntoBytes((bytes.length / 0x20000000) | 0, padBytes, len - bitExt.size64Bytes);
	//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
	bigEndian.u32IntoBytes(bytes.length << 3, padBytes, len - bitExt.size32Bytes);
	return padBytes;
}

function g(
	i: number,
	b: number,
	c: number,
	d: number,
	v: Uint32Array,
	m: Uint32Array,
	sigma: number[]
): void {
	const a = i & 3, //%4
		i2 = i << 1,
		j = sigma[i2],
		k = sigma[i2 + 1],
		nj = n[j],
		nk = n[k],
		mj = m[j],
		mk = m[k];

	//Step 1
	v[a] += v[b] + (mj ^ nk); //a ← a + b + (m[j] ⊕ n[k])
	v[d] = bitExt.rotRight32(v[d] ^ v[a], 16); //d ← (d ⊕ a) >>> 16
	//Step 2
	v[c] += v[d]; //c ← c + d
	v[b] = bitExt.rotRight32(v[b] ^ v[c], 12); //b ← (b ⊕ c) >>> 12
	//Step 3
	v[a] += v[b] + (mk ^ nj); //a ← a + b + (m[k] ⊕ n[j])
	v[d] = bitExt.rotRight32(v[d] ^ v[a], 8); //d ← (d ⊕ a) >>> 8
	//Step 4
	v[c] += v[d]; //c ← c + d
	v[b] = bitExt.rotRight32(v[b] ^ v[c], 7); //b ← (b ⊕ c) >>> 7
}

function compress(h: Uint32Array, m: Uint32Array, counter: number, salt: Uint32Array): void {
	const count32a = counter; //We don't need to mask since the uint32array does it for us
	const count32b = (counter / 0x100000000) | 0;
	const v = new Uint32Array(16);
	v.set(h);
	v[8] = n[0] ^ salt[0];
	v[9] = n[1] ^ salt[1];
	v[10] = n[2] ^ salt[2];
	v[11] = n[3] ^ salt[3];
	v[12] = n[4] ^ count32a;
	v[13] = n[5] ^ count32a;
	v[14] = n[6] ^ count32b;
	v[15] = n[7] ^ count32b;

	// console.log(`m=${hex.fromU32s(m,' ')}`);
	// console.log(`vi=${hex.fromU32s(v,' ')}`);
	for (let r = 0; r < b256rounds; r++) {
		const sigma = sigmas[r % 10];
		//column
		g(0, 4, 8, 12, v, m, sigma);
		g(1, 5, 9, 13, v, m, sigma);
		g(2, 6, 10, 14, v, m, sigma);
		g(3, 7, 11, 15, v, m, sigma);

		//diagonal
		g(4, 5, 10, 15, v, m, sigma);
		g(5, 6, 11, 12, v, m, sigma);
		g(6, 7, 8, 13, v, m, sigma);
		g(7, 4, 9, 14, v, m, sigma);
		//console.log(`v${r+1}=${hex.fromU32s(v,' ')}`);
	}

	for (let i = 0; i < 8; i++) {
		h[i] ^= salt[i & 3] ^ v[i] ^ v[i + 8];
	}
}

/**
 * Perform a blake-32 hash with 14 rounds (aka blake-256 hash)
 * @param bytes Uint8Array Data to hash
 * @param salt Uint32Array(4)|undefined must be 4 uint32 long if specified (defaults to zeros)
 * @returns hash Uint8Array[32]
 */
export function blake256(bytes: Uint8Array, salt?: Uint32Array): Uint8Array {
	if (salt) {
		if (salt.length != 4) throw new SizeError('salt', salt.length, 4);
	} else {
		salt = new Uint32Array([0, 0, 0, 0]);
	}
	const ret = new Uint8Array(digestSizeBytes);
	const paddedBytes = pad(bytes);
	//console.log(`pad ${hex.fromBytes(paddedBytes)}`);

	const v = new Uint32Array(8);
	let i = 0;
	for (; i < 8; i++) v[i] = iv[i << 1];

	const lastBlock = paddedBytes.length - block256SizeBytes;
	const bitLen = bytes.length << 3;
	const bitLenMod512 = bitLen & 0x1ff;
	const lastL = bitLenMod512 > 446 || bitLenMod512 === 0 ? 0 : bitLen;
	const m = new Uint32Array(16);
	for (let i = 0; i < paddedBytes.length; i += block256SizeBytes) {
		//Get message
		bigEndian.u32IntoArrFromBytes(m, 0, 16, paddedBytes, i);
		compress(
			v,
			m,
			i == lastBlock ? lastL : Math.min(bytes.length, i + block256SizeBytes) << 3,
			salt
		);
	}
	bigEndian.u32ArrIntoBytes(v, ret, 0);
	return ret;
}
