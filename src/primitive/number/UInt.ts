/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

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
