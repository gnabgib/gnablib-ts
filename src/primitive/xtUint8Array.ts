/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { NotEnoughSpaceError } from '../error/NotEnoughSpaceError.js';
import { sNum } from '../safe/safe.js';

export const uint8ArrayExt = {
	/**
	 * Encode arbitrary binary data as a set of bytes, the first byte indicating how
	 * many bytes follow.
	 * @param input A series of bytes 0-255 in length
	 * @param start Where in the input stream to start (default: beginning)
	 * @param len How many bytes to include
	 * @returns Encoded form (will be 1 byte longer than `input`)
	 * @throws {Error} Expected len as integer, got: typeof($len)=$len
	 * @throws {Error} len should be 0<=x<=255, got: $len
	 */
	toSizedBytes: function (
		input: Uint8Array,
		start = 0,
		len?: number
	) {
		if (len == undefined) len = input.length - start;
		else sNum('len', len).unsigned().atMost(255).throwNot();
		const ret = new Uint8Array(len + 1);
		ret[0] = len;
		ret.set(input.subarray(start, start + len), 1);
		return ret;
	},

	/**
	 * Compare byte array contents in constant time
	 * **NOTE** will immediately exit/false if array lengths don't match
	 * @param a
	 * @param b
	 * @returns Whether equal
	 */
	ctEq: function (a: Uint8Array, b: Uint8Array): boolean {
		if (a.length != b.length) return false;
		let zero = 0;
		for (let i = 0; i < a.length; i++) zero |= a[i] ^ b[i];
		return zero === 0;
	},

	/**
	 * Constant time select `a` if `first==true` or `b` if `first==false`
	 * @param a
	 * @param b
	 * @param first
	 * @throws If arrays are different things
	 * @returns A clone of a or b
	 */
	ctSelect: function (
		a: Uint8Array,
		b: Uint8Array,
		first: boolean
	): Uint8Array {
		if (a.length != b.length) throw new Error('Inputs are of different length');
		// @ts-expect-error: We're casting bool->number on purpose
		const fNum = (first | 0) - 1; //-1 or 0
		const ret = new Uint8Array(a.length);
		for (let i = 0; i < a.length; i++) {
			ret[i] = (~fNum & a[i]) | (fNum & b[i]);
		}
		return ret;
	},

	pushInt: function (
		value: number,
		bitSize: number,
		bytes: Uint8Array,
		currentBitPos: number
	): number {
		const finalBitPos = currentBitPos + bitSize;
		const bitLen = bytes.length << 3;
		sNum('bitSize', bitSize).unsigned().atMost(32).throwNot();
		if (bitSize < 1) return currentBitPos;
		if (finalBitPos > bitLen)
			throw new NotEnoughSpaceError('bytes', currentBitPos + bitSize, bitLen);

		let bitPos = currentBitPos & 7;
		let bytePos = currentBitPos >> 3;
		//const lastBytePos = (currentBitPos + bitSize - 1) >> 3;

		//0 [________][________] s<<1      [sssssss_][________]
		//1 [x_______][________] s<<0      [xsssssss][________]
		//2 [xx______][________] s>>1      [xxssssss][s_______]
		//3 [xxx_____][________] s>>2,s<<6 [xxxsssss][ss______]
		//4 [xxxx____][________] s>>3,s<<5 [xxxxssss][sss_____]
		//5 [xxxxx___][________] s>>4,s<<4 [xxxxxsss][ssss____]
		//6 [xxxxxx__][________] s>>5,s<<3 [xxxxxxss][sssss___]
		//7 [xxxxxxx_][________] s>>6,s<<2 [xxxxxxxs][ssssss__]
		do {
			const bitSizeOffset = bitSize & 7;
			const shift = 8 - bitSizeOffset - bitPos;
			if (shift < 0) {
				bytes[bytePos] |= value >>> -shift;
				bitSize += shift;
			} else {
				bytes[bytePos] |= value << shift;
				bitSize -= 8 - bitSizeOffset;
			}
			bitPos = 0;
			bytePos += 1;
		} while (bitSize > 0);

		return finalBitPos;
	},

	/**
	 * Increment an arbitrarily large set of bytes in big-endian by one with overflow/wrap around
	 * @param b Bytes to increment in place
	 */
	incrBE: function (b: Uint8Array): void {
		let ptr = b.length - 1;
		while (true) {
			b[ptr] += 1;
			//Detect byte-overflow
			if (b[ptr] == 0 && b.length > 1) {
				ptr = (ptr - 1) % b.length;
			} else break;
		}
	},

	/**
	 * Left-shift an arbitrarily large set of bytes by `by`
	 * @param b
	 * @param by
	 */
	lShiftEq: function (b: Uint8Array, by: number): void {
		const dist = 0 | (by / 8);
		const shift = by % 8;
		const iShift = 8 - shift;
		const n = b.length - dist;
		let i = 0;
		for (; i < n; i++) {
			b[i] = (b[i + dist] << shift) | (b[i + dist + 1] >>> iShift);
		}
		for (; i < b.length; i++) b[i] = 0;
	},

	/**
	 * Xor an arbitrarily large set of bytes `x` into arbitrarily large set of bytes `b`
	 * @param b Bytes to xor x into
	 * @param x Bytes to xor in
	 */
	xorEq: function (b: Uint8Array, x: Uint8Array): void {
		let n = b.length;
		if (x.length < n) n = x.length;
		for (let i = 0; i < n; i++) b[i] ^= x[i];
	},
};
