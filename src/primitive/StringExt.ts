/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { escape } from '../regexp/index.js';

//codePointAt >> charCodeAt
// - charCodeAt is constrained to UTF16 0-65535 values, while codePointAt allows any UTF32/UTF8 character
// - Most of the time codePointAt is a more accurate "character" because UTF16 has more surrogate pairs, however
//  codePointAt may still only provide part, when for example it's a composed emoji (a sequence of emoji rendered as one)

/** Separate a string into individual code points (emoji etc are represented by individual elements) */
export function splitChars(src: string): string[] {
	return Array.from(src);
}

/**
 * Separate a string into a series of pieces of given size, in code points.  That is 1 emoji=1 letter
 * Split a string into pieces of given size, no consideration for source-content is given
 * like splitting at whitespace.  This is more useful for text protocols or text encoding
 * of data which must not exceed a certain length.
 *
 * @param size Width to split at, all but the last piece will be this size
 */
export function splitLen(src: string, size: number): string[] {
	const ret: string[] = [];
	let cur = '';
	let i = 0;
	for (const codePoint of src) {
		cur += codePoint;
		i++;
		if (i == size) {
			ret.push(cur);
			cur = '';
			i = 0;
		}
	}
	if (i > 0) ret.push(cur);
	return ret;
}

/** Reverse characters in a string, UCS2 & emoji aware */
export function reverse(src: string) {
	return splitChars(src).reverse().join('');
}

/**
 * Pad the start of `src` with copies of `fill` until it's at least `len` characters long
 * 
 * If `src.length>len`, or `fill.length==0` nothing happens.  
 * Otherwise append one or more copies of `fill` until the length is at least `len`
 * and then trim starting characters back until the result is `len` in length.
 */
export function padStart(src: string, len: number, fill = ' '): string {
	const dist = len - src.length;
	//If source is already long enough, or fill isn't going to help.. bail
	if (dist <= 0 || fill.length === 0) {
		return src;
	}

	//Note int round-up
	// - If fill is 2 and dist is 1: 2+1-1/2=1
	// - If fill is 2 and dist is 2: 2+2-1/2=1 (when int truncated)
	// - If fill is 2 and dist is 3: 2+3-1/2=2
	const fillCount = (fill.length + dist - 1) / fill.length;
	let ret = fill.repeat(fillCount).concat(src);
	const over = ret.length - len;
	if (over > 0) ret = ret.substring(over);
	return ret;
}

/**
 * Remove characters specified by ignore from the source string
 * @param src
 * @param ignore Characters to remove
 * @param replace What to replace the characters with
 */
export function filter(
	src: string,
	ignore: string | RegExp,
	replace?: string
): string {
	if (typeof ignore === 'string')
		ignore = new RegExp('[' + escape(ignore) + ']+', 'g');
	replace = replace ?? '';
	return src.replace(ignore, replace);
}

/**
 * Compare string contents of two strings, in constant time
 * *Note:* Will fast-exit if the lengths don't match.
 *
 * Does not:
 * - Consider UTF8 alternate encodings into account (eg. combining characters vs pure)
 * - Consider similar looking characters equal (eg. uppercase:K vs kelvin sign:K)
 * - Ignore invisible characters
 */
export function ctEq(a: string, b: string) {
	if (a.length != b.length) return false;
	let zero = 0;
	//Even though we prefer codePointAt, charCodeAt is fine for equality checking
	// (because we're looking for exact-match)
	for (let i = 0; i < a.length; i++) zero |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return zero === 0;
}

/**
 * Select `a` if `first` or `b` otherwise, in constant time.
 * **NOTE** This is quite expensive (exploding both strings into codepoints, choosing each,
 *  and imploding codepoints back to a new string)
 * @param first Choose a (true) or b (false)
 * @returns A clone of a or b
 * @throws If strings are different lengths
 */
export function ctSelect(a: string, b: string, first: boolean): string {
	// @ts-expect-error: We're casting bool->number on purpose
	const fNum = (first | 0) - 1; //-1 or 0
	const aArr = splitChars(a);
	const bArr = splitChars(b);
	if (aArr.length != bArr.length)
		throw new Error('Inputs are of different length');

	//String are immutable,
	const arr: number[] = [];
	for (let i = 0; i < aArr.length; i++) {
		//This will never be null, so stop ESLint complaining
		arr.push(
			(~fNum & aArr[i].codePointAt(0)!) | (fNum & bArr[i].codePointAt(0)!)
		);
	}
	return String.fromCodePoint(...arr);
}
