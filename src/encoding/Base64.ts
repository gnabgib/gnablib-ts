/*! Copyright 2023 gnabgib MPL-2.0 */

import { ContentError, Grievous } from '../primitive/ErrorExt.js';
/**
 * Support: (Uint8Array)
 * Chrome, Android webview, ChromeM >=38
 * Edge >=12
 * Firefox, FirefoxM >=4
 * IE: 10
 * Opera: 11.6
 * OperaM: 12
 * Safari: >=5.1
 * SafariM: 4.2
 * Samsung: >=1.0
 * Node: >=1.0
 * Deno: >=0.10
 */

/**
 * Characters considered whitespace (ignore) in base64 encoding
 */
export const whitespace = '\t\n\f\r ';
export const tbl =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const defC63 = '+';
const defC64 = '/';
const defCPad = '=';
/**
 * Mask for last 6 bits (when used with &)
 */
const last6Bits = 0x3f; // 00111111

const ord_A = 65;
const ord_Z = 90;
const ord_a = 97;
const ord_z = 122;
const ord_0 = 48;
const ord_9 = 57;

//const table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; //Requires c63, c64 to be appended
// A-Z = 65-90
// a-z = 97-122
// 0-9 = 48-57
// + = 43 | uri - = 45
// / = 47 | uri _ = 95
// Note the bad order choice (for sorting)

interface Base64Opts {
	/**
	 * 63rd character to use (default='+'), must be single ASCII char and unique
	 */
	c63?: string;
	/**
	 * 64th character to use (default='/'), must be single ASCII char and unique
	 */
	c64?: string;
}

/**
 * Options for Base64 encoding
 */
export interface EncodeOpts extends Base64Opts {
	/**
	 * string: Padding character to use (default='='), must be single ASCII char and unique
	 * bool: true - pad using '=' char, false (default) don't pad length to multiple of 4
	 */
	cPad?: string | boolean;
}

export interface DecodeOpts extends Base64Opts {
	/**
	 * Character to consider padding (default='='), must be single ASCII char and unique
	 */
	cPad?: string;
	/**
	 * Whether padding must be present in base64
	 */
	padRequired?: boolean;
	/**
	 * Characters to ignore (default=\t\n\f\r )
	 */
	ignore?: string;
}

/**
 * Assert `char` is a single ASCII character, and not already included in the b64 space
 * @param item Name of item (for exception)
 * @param char Value to check
 * @param others Other used values (eg 63rd, 64th and paddings chars)
 * @throws InvalidItem
 */
function validAsciiNotDupe(
	item: string,
	char: string,
	...others: string[]
): void {
	// @ts-expect-error: Apparently this statement fools the static processor (codePointAt(0) cannot be undefined)
	if (char.length != 1 || char.codePointAt(0) > 0x7f)
		throw new ContentError(item, 'Needs to be a single ASCII char', char);
	if (
		(char >= 'A' && char <= 'Z') ||
		(char >= 'a' && char <= 'z') ||
		(char >= '0' && char <= '9') ||
		others.indexOf(char) >= 0
	)
		throw new ContentError(item, 'duplicates another char', char);
}

/**
 * Convert an integer [0-63] into a base 64 character, note c63 and c64 need to
 * be injected at call
 * @param int
 * @param c63
 * @param c64
 * @returns
 */
function mapIntToBase64Char(int: number, c63: string, c64: string): string {
	//A-Z
	if (int < 26) return String.fromCharCode(ord_A + int);
	//a-z
	if (int < 52) return String.fromCharCode(ord_a + int - 26);
	//0-9
	if (int < 62) return String.fromCharCode(ord_0 + int - 52);
	if (int === 62) return c63;
	return c64;
	//Note if <0 or >64 this will not work - trusted callers only
}

/**
 * Convert a base 64 char into an integer [0-63], note c63 and c64 need to be
 * injected at call
 * @param char
 * @param c63
 * @param c64
 * @returns 0-63 or -1 if invalid char
 */
function mapBase64CharToInt(char: string, c63: string, c64: string): number {
	if (char == c63) return 62;
	if (char == c64) return 63;

	const ord = char.charCodeAt(0);
	//Notice the screwy order (thanks base64 inventors)
	// 0-9 = 48-57
	if (ord < ord_0) return -1;
	if (ord <= ord_9) return ord - ord_0 + 52;
	// A-Z = 65-90
	if (ord < ord_A) return -1;
	if (ord <= ord_Z) return ord - ord_A;
	// a-z = 97-122
	if (ord < ord_a) return -1;
	if (ord <= ord_z) return ord - ord_a + 26;
	return -1;
}

/**
 * Convert an array of bytes into base64 text
 * @param bytes
 * @param opts
 * @throws InvalidItem - Bad options
 * @returns
 */
export function fromBytes(bytes: Uint8Array, opts?: EncodeOpts): string {
	let c63 = defC63;
	let c64 = defC64;
	let cPad: string | undefined = undefined;
	if (opts?.c63) {
		validAsciiNotDupe('c63', opts.c63);
		c63 = opts.c63;
	}
	if (opts?.c64) {
		validAsciiNotDupe('c64', opts.c64, c63);
		c64 = opts.c64;
	}
	if (opts?.cPad === true) {
		cPad = defCPad;
	} else if (opts?.cPad) {
		validAsciiNotDupe('cPad', opts.cPad, c63, c64);
		cPad = opts.cPad;
	}

	function bitMonster() {
		//Turns as many bits in the carry into base64-characters as possible
		while (carrySize >= 6) {
			carrySize -= 6;
			const b64 = (carry >>> carrySize) & last6Bits;
			ret += mapIntToBase64Char(b64, c63, c64);
		}
	}

	let ret = '';
	let carry = 0;
	let carrySize = 0;
	for (const byte of bytes) {
		carry = (carry << 8) | byte;
		carrySize += 8;
		bitMonster();
	}
	bitMonster();
	//Padding time, we have 3 outcomes (3 bytes->4 b64s):
	//  1 byte,  rem=2 (8%6), pad=2
	//  2 bytes, rem=4 (16%6), pad=1
	//  3 bytes, rem=0 (24%6), pad=0
	switch (carrySize) {
		case 2:
			ret += mapIntToBase64Char((carry << 4) & last6Bits, c63, c64);
			//Pad if defined
			if (cPad) ret += cPad + cPad;
			break;

		case 4:
			ret += mapIntToBase64Char((carry << 2) & last6Bits, c63, c64);
			//Pad if defined
			ret += cPad;
			break;

		case 0:
			//Nothing to do, but don't want exception
			break;

		default:
			throw new Grievous(`${carrySize} bits left = ${carry}`);
	}

	return ret;
}

/**
 * Convert base64 text into an array of bytes
 * @param base64
 * @param opts
 * @throw ContentError - Bad options, Bad content, bad padding
 * @returns
 */
export function toBytes(base64: string, opts?: DecodeOpts): Uint8Array {
	opts = opts || {};
	if (opts.c63) validAsciiNotDupe('c63', opts.c63);
	else opts.c63 = defC63;
	if (opts.c64) validAsciiNotDupe('c64', opts.c64, opts.c63);
	else opts.c64 = defC64;
	if (opts.cPad) validAsciiNotDupe('cPad', opts.cPad, opts.c63, opts.c64);
	else opts.cPad = defCPad;
	//Ignore whitespace by default
	opts.ignore = opts.ignore ?? whitespace;

	const arr = new Uint8Array(Math.ceil((base64.length * 3) / 4)); //Note it may be shorter if no pad, or ignored chars
	let arrPtr = 0;
	let carry = 0;
	let carrySize = 0;
	let padCount = 0;
	let charCount = 0;
	for (const char of base64) {
		if (opts.ignore.indexOf(char) >= 0) continue;
		const idx = mapBase64CharToInt(char, opts.c63, opts.c64);
		if (idx < 0) {
			if (char == opts.cPad) {
				padCount++;
				continue;
			}
			throw new ContentError('Base64', 'Unknown char', char);
		}
		charCount++;
		if (padCount > 0)
			throw new ContentError('Base64', 'Char found after padding', char);
		carry = (carry << 6) | idx; //Overflow ok
		carrySize += 6;
		if (carrySize >= 8) {
			carrySize -= 8;
			arr[arrPtr++] = (carry >>> carrySize) & 0xff;
		}
	}
	switch (carrySize) {
		case 8:
			arr[arrPtr++] = carry & 0xff;
			if (padCount > 0)
				throw new ContentError(
					'Base4',
					'Bad padding, expecting 0 got',
					padCount
				);
			break;

		case 6:
			// single base64 char isn't decodeable (minimum 2)
			throw new ContentError('Base64', 'Not enough characters', undefined);

		case 4:
			// Expect 2 padding chars, or 0 (if opt padding)
			if (padCount == 0 && !opts.padRequired) break;
			if (padCount != 2)
				throw new ContentError(
					'Base64',
					'Bad padding, expecting 2 got',
					padCount
				);
			break;

		case 2:
			// Expect 1 padding char, or 0 (if opt padding)
			if (padCount == 0 && !opts.padRequired) break;
			if (padCount != 1)
				throw new ContentError(
					'Base64',
					'Bad padding, expecting 1 got',
					padCount
				);
			break;
	}
	// if (carrySize==8) {
	//     arr[arrPtr++]=carry&0xff;
	// }
	if (opts.padRequired && (charCount + padCount) % 4 != 0)
		throw new ContentError('Base64', 'Incomplete padding');
	return arr.slice(0, arrPtr);
}
