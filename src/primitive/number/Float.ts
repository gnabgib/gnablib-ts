/*! Copyright 2024 the gnablib contributors MPL-1.1 */

/**
 * Parse string content as a base10 form of a floating point number.  Much stricter than
 * [Number.parseFloat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat),
 * this *only* allows:
 * - Leading whitespace
 * - One or more digits
 * - An optional period and one or more digits
 * - Trailing whitespace
 *
 * Scientific notation won't parse.
 *
 * @param input A string integer, leading/trailing whitespace is ignored
 * @returns Integer or NaN
 */
export function parseDec(input: string): number {
	if (/^\s*[-+]?\d+(?:\.\d+)?\s*$/.test(input)) {
		return Number.parseFloat(input);
	}
	return Number.NaN;
}
