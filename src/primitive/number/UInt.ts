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
