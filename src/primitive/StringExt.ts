/*! Copyright 2023 gnabgib MPL-2.0 */

import { escape } from '../RegExp.js';
import { NullError, OutOfRangeError, VariedRangeError } from './ErrorExt.js';

export function lenInRangeInclusive(test: string, high: number, low = 0): void {
	if (test===undefined || test===null)
		throw new NullError('String');
	if (test.length < low || test.length > high)
		throw new OutOfRangeError('String length', test.length, low, high);
}

export function lenAtLeast(test: string, low:number):void {
	if (test===undefined || test===null)
		throw new NullError('String');
	if (test.length<low)
		throw new OutOfRangeError('String length', test.length, low);
}

export function wrap(source: string, width: number, join?: string): string {
	if (width == 0) throw new VariedRangeError('Width', width, { '>': 0 });
	const ret = [];
	const size = Math.ceil(source.length / width);
	for (let i = 0; i < size; i++) {
		const piece = source.slice(i * width, (i + 1) * width);
		ret.push(piece);
	}
	return ret.join(join ?? '\n');
}

/**
 * Remove characters specified by ignore from the source string
 * @param source
 * @param ignore
 * @param replace
 * @returns
 */
export function filter(
	source: string,
	ignore: string | RegExp,
	replace?: string
): string {
	if (typeof ignore === 'string')
		ignore = new RegExp('[' + escape(ignore) + ']+', 'g');
	replace = replace ?? '';
	return source.replace(ignore, replace);
}

/**
 * Separate a string into individual code points (emoji etc are represented by individual elements)
 * @param source
 */
export function splitChars(source: string): string[] {
	const ret = [];
	//Let for of do the heavy lifting for codePoint traversal
	for (const codePoint of source) {
		ret.push(codePoint);
	}
	return ret;
}

/**
 * Reverse the characters of a string (UCS2 aware)
 * @param source
 * @returns Reversed string
 */
export function reverse(source: string): string {
	return splitChars(source).reverse().join('');
}

/**
 * Pad the start of `source` with 0-n copies of `fill` such that source length is
 * at least `len` characters
 * @param source
 * @param len
 * @param fill
 * @returns Padded string
 */
export function padStart(
	source: string,
	len: number,
	fill = ' '
): string {
	const dist = len - source.length;
	//If source is already long enough, or fill isn't going to help.. bail
	if (dist <= 0 || fill.length === 0) {
		return source;
	}

	//Note int round-up
	// - If fill is 2 and dist is 1: 2+1-1/2=1
	// - If fill is 2 and dist is 2: 2+2-1/2=1 (when int truncated)
	// - If fill is 2 and dist is 3: 2+3-1/2=2
	const fillCount = (fill.length + dist - 1) / fill.length;
	let ret = fill.repeat(fillCount).concat(source);
	const over = len - ret.length;
	if (over > 0) ret = ret.substring(over);
	return ret;
}
