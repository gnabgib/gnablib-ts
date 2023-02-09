/*! Copyright 2023 gnabgib MPL-2.0 */

import * as littleEndian from '../endian/little.js';
import * as bigEndian from '../endian/big.js';

//http://www.zlib.net/maxino06_fletcher-adler.pdf -> Lower cpu and Adler and mostly more effective (in their tests)
//https://datatracker.ietf.org/doc/html/rfc1146 (Appendix I)

/**
 * Fletcher checksum algorithm per byte
 * @param bytes
 * @returns 16 bit checksum
 */
export function fletcher16(bytes: Uint8Array): number {
	let c0 = 0;
	let c1 = 0;
	const mod = 0xff; //2^8-1
	let ptr = 0;
	while (ptr < bytes.length) {
		//JS doesn't overflow until 53 bits we we've got lots of space here
		// (0xffffffff * 0xff (max byte) still fits in 2^40 bits)
		const safeLen = Math.min(0xffffffff, bytes.length - ptr);
		for (; ptr < safeLen; ptr++) {
			c0 += bytes[ptr];
			c1 += c0;
		}
		c0 %= mod;
		c1 %= mod;
	}
	return (c1 << 8) | c0;
}

//https://datatracker.ietf.org/doc/html/rfc1146 (Appendix 2)
/**
 * Fletcher checksum algorithm per int16/word (2 bytes)
 * @param bytes
 * @returns 32 bit checksum
 */
export function fletcher32(bytes: Uint8Array): number {
	//We should add trailing 0 to bytes, but JS allows us to ask for
	// bytes beyond the end (and get back undefined, which coerces to zero)
	let c0 = 0;
	let c1 = 0;
	const mod = 0xffff; //2^16-1
	let ptr = 0;
	while (ptr < bytes.length) {
		//JS doesn't overflow until 53 bits we we've got lots of space here
		// (0xffffffff * 0xffff (max byte) still fits in 2^48 bits)
		const safeLen = Math.min(0xffffffff, bytes.length);
		for (; ptr < safeLen; ptr += 2) {
			c0 += littleEndian.u16FromBytesUnsafe(bytes, ptr);
			c1 += c0;
		}
		//The mod operation (%) is in math(53bit max) not bit(32bit max)
		c0 %= mod;
		c1 %= mod;
	}
	return ((c1 << 16) | c0) >>> 0;
}

/**
 * Fletcher checksum algorithm per int32/dword (4 bytes)
 * @param bytes
 * @returns 64 bit checksum (8 bytes)
 */
export function fletcher64(bytes: Uint8Array): Uint8Array {
	//We should add trailing 0 to bytes, but JS allows us to ask for
	// bytes beyond the end (and get back undefined, which coerces to zero)
	let c0 = 0;
	let c1 = 0;
	const mod = 0xffffffff; //2^32-1
	let ptr = 0;
	const ret = new Uint8Array(8);
	while (ptr < bytes.length) {
		//JS doesn't overflow until 53 bits we we've got lots of space here
		// (0xffff * 0xffffffff (max byte) still fits in 2^48 bits)
		const safeLen = Math.min(0xffff, bytes.length);
		for (; ptr < safeLen; ptr += 4) {
			c0 += littleEndian.u32FromBytesUnsafe(bytes, ptr);
			c1 += c0;
		}
		c0 %= mod;
		c1 %= mod;
	}
	bigEndian.u32IntoBytes(c1, ret, 0);
	bigEndian.u32IntoBytes(c0, ret, 4);
	return ret;
}
