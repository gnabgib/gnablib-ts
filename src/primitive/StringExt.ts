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

/**
 * Compare string contents in constant time
 * **NOTE** will immediately exit/false if lengths don't match
 * @param a 
 * @param b 
 */
export function ctEq(a:string,b:string):boolean {
	if (a.length!=b.length) return false;
	let zero=0;
	for(let i=0;i<a.length;i++)
		zero|=a.charCodeAt(i)^b.charCodeAt(i);
	return zero===0;
}

/**
 * Constant time select `a` if `first==true` or `b` if `first==false`
 * **NOTE** This is quite expensive (exploding both strings into codepoints, choosing each, 
 *  and imploding codepoints back to a new string)
 * @param a 
 * @param b 
 * @param first 
 * @throws If strings are different things
 * @returns A clone of a or b
 */
export function ctSelect(a:string,b:string,first:boolean):string {
	// @ts-expect-error: We're casting bool->number on purpose
	const fNum = (first | 0) - 1; //-1 or 0
	const aArr=splitChars(a);
	const bArr=splitChars(b);
	if (aArr.length!=bArr.length) throw new Error('Inputs are of different length');

	//String are immutable, 
	const arr:number[]=[];
	for(let i=0;i<aArr.length;i++) {
		//This will never be null, so stop ESLint complaining
		// eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
		arr.push(((~fNum)&aArr[i].codePointAt(0)!) | (fNum&bArr[i].codePointAt(0)!));
	}
	return String.fromCodePoint(...arr);
}