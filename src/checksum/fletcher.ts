/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { asBE, asLE } from '../endian/platform.js';
import { U16 } from '../primitive/number/U16Static.js';
import { U32 } from '../primitive/number/U32Static.js';

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
			asLE.i16(bytes, ptr);
			c0 += U16.fromBytesLE(bytes, ptr);
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
	while (ptr < bytes.length) {
		//JS doesn't overflow until 53 bits we we've got lots of space here
		// (0xffff * 0xffffffff (max byte) still fits in 2^48 bits)
		const safeLen = Math.min(0xffff, bytes.length);
		for (; ptr < safeLen; ptr += 4) {
			asLE.i32(bytes, ptr);
			c0 += U32.fromBytesLE(bytes, ptr) >>> 0;
			c1 += c0;
		}
		c0 %= mod;
		c1 %= mod;
	}
	const r8=new Uint8Array(8);
	const r32=new Uint32Array(r8.buffer);
	r32[0]=c1;
	r32[1]=c0;
	asBE.i32(r8,0,2);
	return r8;
}
