/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { toGlScaleBytes } from './number/xtUint.js';

/**
 * Encode arbitrary binary data as a set of bytes.  The starting bytes indicate how
 * many bytes of data follow.
 * @param input
 * @returns
 */
export function toGlBytes(input: Uint8Array): Uint8Array {
	const size = toGlScaleBytes(input.length);
	//todo: Once toGlScaleBytes supports filling a buffer, read the size first
	//const ret=new Uint8Array(glScaleSize(input.length)+input.length);
	const ret = new Uint8Array(size.length + input.length);
	ret.set(size);
	ret.set(input, size.length);
	return ret;
}

/**
 * Compare contents of two byte arrays, in constant time
 * *Note:* will fast-exit if the lengths don't match.
 */
export function ctEq(a: Uint8Array, b: Uint8Array) {
	if (a.length != b.length) return false;
	let zero = 0;
	for (let i = 0; i < a.length; i++) zero |= a[i] ^ b[i];
	return zero === 0;
}

/**
 * Select `a` if `first` or `b` otherwise, in constant time.
 * @param first Choose a (true) or b (false)
 * @returns A clone of a or b
 * @throws If inputs are different lengths
 */
export function ctSelect(a: Uint8Array, b: Uint8Array, first: boolean) {
	if (a.length != b.length) throw new Error('Inputs are of different length');
	// @ts-expect-error: We're casting bool->number on purpose
	const fNum = (first | 0) - 1; //-1 or 0
	const ret = new Uint8Array(a.length);
	for (let i = 0; i < a.length; i++) {
		ret[i] = (~fNum & a[i]) | (fNum & b[i]);
	}
	return ret;
}

//pushInt - see BitWriter

/** Increment an arbitrarily large set of bytes in big-endian by one with overflow/wrap around */
export function incrBE(u: Uint8Array) {
	//todo: move this to platform (endian relative)
	let ptr = u.length - 1;
	while (true) {
		u[ptr] += 1;
		//Detect byte-overflow
		if (u[ptr] == 0 && u.length > 1) {
			ptr = (ptr - 1) % u.length;
		} else break;
	}
}

/** Left-shift an arbitrarily large set of bytes */
export function lShiftEq(u: Uint8Array, by: number) {
	const dist = 0 | (by / 8);
	const shift = by % 8;
	const iShift = 8 - shift;
	const n = u.length - dist;
	let i = 0;
	for (; i < n; i++) {
		u[i] = (u[i + dist] << shift) | (u[i + dist + 1] >>> iShift);
	}
	for (; i < u.length; i++) u[i] = 0;
}

/**
 * Xor an arbitrarily large set of bytes into another arbitrarily large set of bytes
 * Will only xor the first n bytes where n=Min(a.length,b.length)
 */
export function xorEq(a: Uint8Array, b: Uint8Array) {
	let n = a.length;
	if (b.length < n) n = b.length;
	for (let i = 0; i < n; i++) a[i] ^= b[i];
}
