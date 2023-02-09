/*! Copyright 2023 gnabgib MPL-2.0 */

import * as bigEndian from '../endian/big.js';
import * as bitExt from '../primitive/BitExt.js';

//https://en.wikipedia.org/wiki/SHA-1
//https://datatracker.ietf.org/doc/html/rfc3174
const digestSizeBytes = 20; //160 bits
const sha1BlockSizeBytes = 64; //512 bits
//const maxLen = Number.MAX_SAFE_INTEGER; //Limit is 2^64, but JS only allows 2^53.  TODO consider BigInt (timing attack+processing cost)

//Encode RFC 3174 in JS

/**
 * Pad out the starting amount to be a multiple of @see blockSizeBytes including the bit count
 * @param bytes
 * @param blockSizeBytes
 * @returns
 */
export function pad(bytes: Uint8Array, blockSizeBytes: number): Uint8Array {
	const reqSpace = bitExt.size64Bytes;
	const len =
		bytes.length +
		reqSpace +
		blockSizeBytes -
		((bytes.length + reqSpace) % blockSizeBytes);
	const padBytes = new Uint8Array(len);
	padBytes.set(bytes, 0);
	padBytes[bytes.length] = 0x80;
	//Basically the same as MD4(+5+RipeMD) except bigEndian
	bigEndian.u32IntoBytes(
		bytes.length / 0x20000000,
		padBytes,
		len - bitExt.size64Bytes
	);
	//bigEndian.u32IntoBytes(bytes.length / 0x1fffffff, paddedBytes, len - bitExt.i64SizeBytes);
	//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
	bigEndian.u32IntoBytes(bytes.length << 3, padBytes, len - bitExt.size32Bytes);
	return padBytes;
}

export function sha1(bytes: Uint8Array): Uint8Array {
	const paddedBytes = pad(bytes, sha1BlockSizeBytes);

	//RFC3174-Section5 defines these constants
	//Prettier broke the case, despite violation of RFC4648
	const k0 = 0x5a827999; //0-19
	const k1 = 0x6ed9eba1; //20-39
	const k2 = 0x8f1bbcdc; //40-59
	const k3 = 0xca62c1d6; //60-79

	//RFC3174-Section6.1 defines these constants
	//Prettier broke the case, despite violation of RFC4648
	const v = new Uint32Array(5);
	v[0] = 0x67452301;
	v[1] = 0xefcdab89;
	v[2] = 0x98badcfe;
	v[3] = 0x10325476;
	v[4] = 0xc3d2e1f0;
	const w = new Uint32Array(80);
	let t: number;
	for (let i = 0; i < paddedBytes.length; i += sha1BlockSizeBytes) {
		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3],
			e = v[4];

		let j = 0;
		for (; j < 16; j++) {
			w[j] = bigEndian.u32FromBytes(paddedBytes, i + bitExt.size32Bytes * j);
			// (b&c)|((~b)&d) - Same as MD4-r1
			t = bitExt.rotLeft32(a, 5) + (d ^ (b & (c ^ d))) + e + w[j] + k0;
			//Rare use of comma!  Make it clear there's a 5 stage swap going on
			(e = d), (d = c), (c = bitExt.rotLeft32(b, 30)), (b = a), (a = t);
		}
		for (; j < 20; j++) {
			w[j] = bitExt.rotLeft32(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
			// (b&c)|((~b)&d) - Same as MD4-r1
			t = bitExt.rotLeft32(a, 5) + (d ^ (b & (c ^ d))) + e + w[j] + k0;
			(e = d), (d = c), (c = bitExt.rotLeft32(b, 30)), (b = a), (a = t);
		}
		for (; j < 40; j++) {
			w[j] = bitExt.rotLeft32(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
			//Same as MD4-r3
			t = bitExt.rotLeft32(a, 5) + (b ^ c ^ d) + e + w[j] + k1;
			(e = d), (d = c), (c = bitExt.rotLeft32(b, 30)), (b = a), (a = t);
		}
		for (; j < 60; j++) {
			w[j] = bitExt.rotLeft32(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
			//Same as MD4-r2
			t = bitExt.rotLeft32(a, 5) + (((b | c) & d) | (b & c)) + e + w[j] + k2;
			(e = d), (d = c), (c = bitExt.rotLeft32(b, 30)), (b = a), (a = t);
		}
		for (; j < 80; j++) {
			w[j] = bitExt.rotLeft32(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
			//Same as MD4-r3
			t = bitExt.rotLeft32(a, 5) + (b ^ c ^ d) + e + w[j] + k3;
			(e = d), (d = c), (c = bitExt.rotLeft32(b, 30)), (b = a), (a = t);
		}

		(v[0] += a), (v[1] += b), (v[2] += c), (v[3] += d), (v[4] += e);
	}

	const ret = new Uint8Array(digestSizeBytes);
	bigEndian.u32ArrIntoBytes(v, ret, 0);
	return ret;
}
