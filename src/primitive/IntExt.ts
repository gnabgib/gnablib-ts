/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { FromBinResult } from './FromBinResult.js';
import { stringExt } from './StringExt.js';

const mark2Byte = 0x80; //10000000
const mark3Byte = 0xc0; //11000000
const mark4byte = 0xe0; //11100000
const mark5Byte = 0xf0; //11110000
const mark6Byte = 0xf8; //11111000
const mark7Byte = 0xfc; //11111100
const mark8Byte = 0xfe; //11111110
const shift32Bit = 0x100000000;

export const intExt = {
	/**
	 * Convert `value` into a string, and pad the start with zeros such that the length
	 * is at least `len`.  If negative, the sign will appear before any padding.
	 * @param value
	 * @param len
	 * @returns
	 */
	zeroPad: function (value: number, len: number): string {
		if (value < 0) {
			return '-' + stringExt.padStart((0 - value).toString(), len, '0');
		}
		return stringExt.padStart(value.toString(), len, '0');
	},

	/**
	 * Convert an 8 bit uint into an int (>127 considered negative)
	 * @param uint8 Integer 0-0xff (truncated if oversized)
	 * @returns
	 */
	sign8: function (uint8: number): number {
		uint8 = uint8 & 0xff;
		return uint8 <= 0x7f ? uint8 : ~(0xff - uint8);
	},

	/**
	 * Convert a 16 bit uint into an int (>32767 considered negative)
	 * @param uint16 INteger 0-0xffff (truncated if oversized)
	 * @returns
	 */
	sign16: function (uint16: number): number {
		uint16 = uint16 & 0xffff;
		return uint16 <= 0x7fff ? uint16 : ~(0xffff - uint16);
	},

	/**
	 * Convert a 32 bit uint into an int (>2147483647 considered negative)
	 * @param uint32 Integer 0x0xffffffff (truncated if oversized)
	 * @returns
	 */
	sign32(uint32: number): number {
		return uint32 | 0; //ASM.js derived shortcut
	},

	/**
	 * Extended version of parseInt, which still accepts whitespace, but doesn't allow scientific
	 * notation, fractions, other chars in the input.  Signs are allowed only right beside numbers (otherwise
	 * it could be a formula?)
	 * NOTE: NaN could be used here (because number=float) but on most platforms, this would return either
	 *  an INT or null.  Also note +-Infinity ARE NOT INTS (sorry MDN)
	 * @param value
	 * @param base
	 */
	strictParseDecInt: function (value: string): number | undefined {
		if (/^\s*[-+]?(\d+)\s*$/.test(value)) {
			return parseInt(value, 10);
		} else {
			return undefined;
		}
	},

	/**
	 * Extended version of parseInt, still accepts whitespace, but doesn't allow signs (always
	 * positive) unlike @see startParseDecInt
	 * @param value
	 * @returns
	 */
	strictParseDecUint: function (value: string): number | undefined {
		if (/^\s*(\d+)\s*$/.test(value)) {
			return parseInt(value, 10);
		} else {
			return undefined;
		}
	},

	/**
	 * Extended version of parseInt with radix 16, still accepts whitespace, but doesn't allow scientific
	 * notation, fractions or other chars in the input.  Signs are allowed only right beside numbers.
	 * @param value
	 * @returns
	 */
	strictParseHexInt: function (value: string): number | undefined {
		if (/^\s*[-+]?(?:0x)?([a-fA-F\d]+)\s*$/.test(value)) {
			return parseInt(value, 16);
		} else {
			return undefined;
		}
	},

	/**
	 * Encode an unsigned integer as a set of bytes without a fixed size
	 * @param uint Number to encode >=0 <=2^53 (max safe int)
	 * @returns UInt8Array of length 1-8 bytes
	 */
	uintToScaleBytes: function (uint: number): Uint8Array {
		//Largest int is 2^53 bits
		const ret = new Uint8Array(8);
		if (uint <= 0x7f) {
			//Less than 7 bits fits in 1 byte
			ret[0] = uint;
			return ret.slice(0, 1);
		}
		if (uint <= 0x3fff) {
			//Less than 14 bits fits in 2 bytes
			ret[0] = mark2Byte | (uint >>> 8);
			ret[1] = uint;
			return ret.slice(0, 2);
		}
		if (uint <= 0x1fffff) {
			//Less than 21 bits fits in 3 bytes
			ret[0] = mark3Byte | (uint >>> 16);
			ret[1] = uint >> 8;
			ret[2] = uint;
			return ret.slice(0, 3);
		}
		if (uint <= 0xfffffff) {
			//Less than 28 bits fits in 4 bytes
			ret[0] = mark4byte | (uint >>> 24);
			ret[1] = uint >> 16;
			ret[2] = uint >> 8;
			ret[3] = uint;
			return ret.slice(0, 4);
		}
		const high = Math.floor(uint / shift32Bit);
		if (uint <= 0x7ffffffff) {
			//Less than 35 bits fits in 5 bytes
			ret[0] = mark5Byte | high;
			ret[1] = uint >> 24;
			ret[2] = uint >> 16;
			ret[3] = uint >> 8;
			ret[4] = uint;
			return ret.slice(0, 5);
		}
		if (uint <= 0x3ffffffffff) {
			//Less than 42 bits fits in 6 bytes
			ret[0] = mark6Byte | (high >>> 8);
			ret[1] = high;
			ret[2] = uint >> 24;
			ret[3] = uint >> 16;
			ret[4] = uint >> 8;
			ret[5] = uint;
			return ret.slice(0, 6);
		}
		if (uint <= 0x1ffffffffffff) {
			//Less than 49 bits fits in 7 bytes
			ret[0] = mark7Byte | (high >>> 16);
			ret[1] = high >> 8;
			ret[2] = high;
			ret[3] = uint >> 24;
			ret[4] = uint >> 16;
			ret[5] = uint >> 8;
			ret[6] = uint;
			return ret.slice(0, 7);
		}
		//Fits in 8 bytes
		//Less than 56 bits fits in 8 bytes, but max 53
		ret[0] = mark8Byte;
		ret[1] = high >>> 16;
		ret[2] = high >> 8;
		ret[3] = high;
		ret[4] = uint >> 24;
		ret[5] = uint >> 16;
		ret[6] = uint >> 8;
		ret[7] = uint;
		return ret;
	},

	/**
	 * Decode a series of bytes into an unsigned integer
	 * @param bytes Length start+1-start+8 bytes
	 * @param start Position to start at (default 0)
	 * @returns [Decoded uint,count of bytes used]
	 */
	uintFromScaleBytes: function (
		bytes: Uint8Array,
		start = 0
	): FromBinResult<number> {
		//Largest supported value for int is 2^53 bits
		if (bytes.length < start + 1)
			return new FromBinResult<number>(
				0,
				undefined,
				'uintFromScaleBytes missing marker-byte'
			);
		const marker = bytes[start];
		//Mask one size bigger to confirm there's a trailing zero
		if ((marker & mark2Byte) === 0) {
			//1 byte
			return new FromBinResult(1, marker);
		}
		if ((marker & mark3Byte) === mark2Byte) {
			//2 bytes
			if (bytes.length < start + 2)
				return new FromBinResult<number>(
					0,
					undefined,
					`uintFromScaleBytes not enough bytes found (needed 2 got ${
						bytes.length - start
					}`
				);
			const val = ((marker & 0x3f) << 8) | bytes[start + 1];
			return new FromBinResult(2, val);
		}
		if ((marker & mark4byte) === mark3Byte) {
			//3 bytes
			if (bytes.length < start + 2)
				return new FromBinResult<number>(
					0,
					undefined,
					`uintFromScaleBytes not enough bytes found (needed 3 got ${
						bytes.length - start
					}`
				);
			const val =
				((marker & 0x1f) << 16) | (bytes[start + 1] << 8) | bytes[start + 2];
			return new FromBinResult(3, val);
		}
		if ((marker & mark5Byte) === mark4byte) {
			//4 bytes
			if (bytes.length < start + 4)
				return new FromBinResult<number>(
					0,
					undefined,
					`uintFromScaleBytes not enough bytes found (needed 4 got ${
						bytes.length - start
					}`
				);
			const val =
				((marker & 0x0f) << 24) |
				(bytes[start + 1] << 16) |
				(bytes[start + 2] << 8) |
				bytes[start + 3];
			return new FromBinResult(4, val);
		}
		if ((marker & mark6Byte) === mark5Byte) {
			//5 bytes
			if (bytes.length < start + 5)
				return new FromBinResult<number>(
					0,
					undefined,
					`uintFromScaleBytes not enough bytes found (needed 5 got ${
						bytes.length - start
					}`
				);
			const val =
				(marker & 0x07) * shift32Bit +
				(((bytes[start + 1] << 24) |
					(bytes[start + 2] << 16) |
					(bytes[start + 3] << 8) |
					bytes[start + 4]) >>>
					0);
			return new FromBinResult(5, val);
		}
		if ((marker & mark7Byte) === mark6Byte) {
			//6 bytes
			if (bytes.length < start + 6)
				return new FromBinResult<number>(
					0,
					undefined,
					`uintFromScaleBytes not enough bytes found (needed 6 got ${
						bytes.length - start
					}`
				);
			const val =
				(((marker & 0x03) << 8) | bytes[start + 1]) * shift32Bit +
				(((bytes[start + 2] << 24) |
					(bytes[start + 3] << 16) |
					(bytes[start + 4] << 8) |
					bytes[start + 5]) >>>
					0);
			return new FromBinResult(6, val);
		}
		if ((marker & mark8Byte) === mark7Byte) {
			//7 bytes
			if (bytes.length < start + 7)
				return new FromBinResult<number>(
					0,
					undefined,
					`uintFromScaleBytes not enough bytes found (needed 7 got ${
						bytes.length - start
					}`
				);
			const val =
				(((marker & 0x01) << 16) | (bytes[start + 1] << 8) | bytes[start + 2]) *
					shift32Bit +
				(((bytes[start + 3] << 24) |
					(bytes[start + 4] << 16) |
					(bytes[start + 5] << 8) |
					bytes[start + 6]) >>>
					0);
			return new FromBinResult(7, val);
		}
		if (marker === mark8Byte) {
			//8 bytes
			if (bytes.length < start + 8)
				return new FromBinResult<number>(
					0,
					undefined,
					`uintFromScaleBytes not enough bytes found (needed 8 got ${
						bytes.length - start
					}`
				);
			const val =
				((bytes[start + 1] << 16) |
					(bytes[start + 2] << 8) |
					bytes[start + 3]) *
					shift32Bit +
				(((bytes[start + 4] << 24) |
					(bytes[start + 5] << 16) |
					(bytes[start + 6] << 8) |
					bytes[start + 7]) >>>
					0);
			return new FromBinResult(8, val);
		}
		//Never
		return new FromBinResult<number>(
			0,
			undefined,
			`uintFromScaleBytes unknown marker (${marker})`
		);
	},
};
