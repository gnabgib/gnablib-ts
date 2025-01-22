/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { ParseProblem } from '../../error/index.js';

/**
 * Parse string content as a base10 form of an unsigned integer.  Much stricter than
 * [Number.parseInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt),
 * this *only* allows:
 * - Leading whitespace
 * - One or more digits
 * - Trailing whitespace
 *
 * Floating point numbers that have only zeros after the decimal won't parse.
 * Scientific notation won't parse.
 *
 * @param input A string integer, leading/trailing whitespace is ignored
 * @returns Integer or NaN
 */
export function parseDec(input: string): number {
	if (/^\s*\d+\s*$/.test(input)) {
		return Number.parseInt(input, 10);
	}
	return Number.NaN;
}

/**
 * Parse string content as a base16 form of an unsigned integer.  Much stricter than
 * [Number.parseInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt),
 * this *only* allows:
 * - Leading whitespace
 * - An optional 0x marker
 * - One or more digits
 * - Trailing whitespace
 *
 * Floating point numbers won't parse.
 * Scientific notation won't parse (but can look like hex)
 * @param input A string hexadecimal integer, leading/trailing whitespace is ignored
 * @returns Integer or NaN
 */
export function parseHex(input: string): number {
	if (/^\s*(?:0x)?([a-fA-F0-9]+)\s*$/.test(input)) {
		return parseInt(input, 16);
	}
	return Number.NaN;
}

/**
 * Convert an 8 bit uint into an int (>127 considered negative)
 * @param input Unsigned integer 0 - 0xFF (truncated if oversized)
 */
export function sign8(input: number): number {
	input &= 0xff;
	if (input > 0x7f) input = ~(0xff - input);
	return input;
}

/**
 * Convert a 16 bit uint into an int (>32767 considered negative)
 * @param input Unsigned integer 0 - 0xFFFF (truncated if oversized)
 */
export function sign16(input: number): number {
	input &= 0xffff;
	if (input > 0x7fff) input = ~(0xffff - input);
	return input;
}

/**
 * Convert a 32 bit uint into an int (>2147483647 considered negative)
 * @param input Unsigned integer 0 - 0xFFFFFFFF (truncated if oversized)
 */
export function sign32(input: number): number {
	return input | 0;
}

/**
 * Determine the number of bytes required to represent an integer in GlScale
 * @param input Unsigned integer 0 - 0xFFFFFFFF (truncated if oversized)
 * @returns Bytes required to serialize
 */
export function glScaleSize(input:number):number {
	if (input<128) return 1;
	if (input<1024) return 2;
	return Math.ceil(Math.log2(input+1)/8)+1;
}

/**
 * Encode an unsigned integer as a minimal set of bytes without a fixed size.
 * When input <128 data is stored in a single byte,
 * when input <1024 data is stored in two bytes,
 * for higher values data is stored in `1 + ceil(log2(input+1)/8)`
 *
 * @param input Unsigned integer 0 - 0xFFFFFFFF (truncated if oversized)
 * @returns Uint8Array of length 1-5 bytes
 */
export function toGlScaleBytes(input: number): Uint8Array {
	//Performance improvement over Scale which always shifted some bits into the first byte
	// (after 10b the numbers don't require bit shifting, although there's still byte shifting)
	//Length improvement over Scale - up to a U512 can be encoded
	const ret = new Uint8Array(5);
	if (input < 128) {
		//0-127 fits in one byte alone
		ret[0] = input;
		return ret.subarray(0, 1);
	}
	if (input < 1024) {
		//BE:
		ret[0] = 0x80 | (input >>> 8);
		ret[1] = input;
		return ret.subarray(0, 2);
	}
	//LE from now on
	let i = 1;
	while (input != 0) {
		//We're definitely writing twice (because >=1024)
		ret[i++] = input;
		input >>>= 8;
	}
	ret[0] = 0xc0 | (i - 3); //-1 first byte is size, -1 single byte encoding is already defined, -1 i> len
	return ret.subarray(0, i);
	//Denorm:
	// 0 = 0x8000 = 0xC00000
}

/* *
 * Decode a series of bytes without a fixed size into an unsigned integer.
 * *Note:* Gscale can encode numbers in excess of U32 space, this will fail if it doesn't fit
 * @param bytes Uint8Array of length 1-5 bytes (can be up to 65)
 */
/**
 * Decode a series of bytes without a fixed size into an unsigned integer.
 * *Note:* Gscale can encode numbers in excess of U32 space, this will fail if it doesn't fit
 * @param bytes Uint8Array of length 1-5 bytes (can be up to 65)
 * @returns
 */
export function fromGlScaleBytes(
	bytes: Uint8Array
): [number, number] | ParseProblem {
	if (bytes.length == 0)
		return new ParseProblem(
			'bytes',
			'not enough content (need at least 1 byte)'
		);
	const marker = bytes[0];
	//<128
	if ((marker & 0x80) == 0) return [marker, 1];
	//<1024 mode
	if ((marker & 0xc0) == 0x80) {
		if (bytes.length < 2)
			return new ParseProblem(
				'bytes',
				`not enough content (need 2 bytes, got ${bytes.length})`
			);
		//Note: we're ignoring the reserved bits - there's an expansion proposal in play for some
		return [((marker & 3) << 8) | bytes[1], 2];
	}
	//LE from now on, marker can only start with 0b11
	const count = (marker & 0x3f) + 2;
	// console.log(count)
	if (count > 4)
		return new ParseProblem(
			'gscale',
			`too much content (need 4 bytes, told ${bytes.length})`
		);
	if (bytes.length <= count)
		return new ParseProblem(
			'bytes',
			`not enough content (need ${count} bytes, got ${bytes.length})`
		);
	let ret = 0;
	for (let i = 0; i < count; i++) {
		ret |= bytes[i + 1] << (8 * i);
		// console.log(`${i}:${bytes[i]} = ${ret} (@${count})`);
	}
	return [ret >>> 0, count + 1];
}
