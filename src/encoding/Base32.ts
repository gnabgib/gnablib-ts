import { ContentError } from '../primitive/ErrorExt.js';
import * as bconv from './_bitConverter.js';
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

export const whitespace = '\t\n\f\r ';
export const tbl = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ord_A = 65;
const ord_Z = 90;
const ord_2 = 50;
const ord_7 = 55;
const padding = '=';

interface EncodeOpts {
	/**
	 * Whether padding should be Added (default=true)
	 */
	pad?: boolean;
}

interface DecodeOpts {
	/**
	 * Whether padding must be present
	 */
	padRequired?: boolean;
	/**
	 * Characters to ignore (default=\t\n\f\r )
	 */
	ignore?: string;
}

/**
 * Convert an integer [0-31] into a base 32 character
 * @param int
 * @returns
 */
function intToBase32Char(int: number): string {
	return tbl.substring(int, int + 1);
	// //A-Z
	// if (int < 26) return String.fromCharCode(ord_A + int);
	// //2-7
	// return String.fromCharCode(ord_7 - 31 + int);
}

/**
 * Convert a base 32 char into an integer [0-31]
 * @param char
 * @returns 0-31 or -1 if invalid char
 */
function base32CharToInt(char: string): number {
	let ord = char.charCodeAt(0);
	//Notice the screwy order (thanks base32 inventors)
	// 0-9 = 48-57
	if (ord < ord_2) return -1;
	if (ord <= ord_7) return ord - ord_2 + 26;

	//Fold lower over upper
	ord &= 0x5f; //1011111 = ord('_');

	// A-Z = 65-90
	if (ord < ord_A) return -1;
	if (ord <= ord_Z) return ord - ord_A;
	return -1;
}

/**
 * Convert an array of bytes into base32 text
 * @param bytes
 * @param opts
 * @returns
 */
export function fromBytes(bytes: Uint8Array, opts?: EncodeOpts): string {
	const ret = bconv.fromBytes(bytes, 5, intToBase32Char);
	let pad = false;
	if (opts?.pad !== false) {
		//For undefined, null, or true set pad to true
		pad = true;
	}

	if (pad && ret.length > 0) {
		return ret + '='.repeat(8 - (((ret.length - 1) % 8) + 1));
	}
	return ret;
}

/**
 * Convert base32 text into an array of bytes
 * @param base32
 * @param opts
 * @throws InvalidItem - Character after padding, incomplete padding
 * @returns
 */
export function toBytes(base32: string, opts?: DecodeOpts): Uint8Array {
	//Ignore whitespace by default
	let ignore = whitespace;
	if (opts?.ignore) {
		ignore = opts.ignore;
	}

	const isWhitespace = (c: string) => ignore.indexOf(c) >= 0;
	const isPadding = (c: string) => c == padding;

	const arr = new Uint8Array(Math.ceil((base32.length * 5) / 8)); //Note it may be shorter if no pad, or ignored chars
	const arrPtr = bconv.toBytes(
		base32,
		5,
		isWhitespace,
		isPadding,
		base32CharToInt,
		arr
	);
	if (opts?.padRequired && arrPtr % 8 != 0)
		throw new ContentError('base32', 'Incomplete padding');
	return arr.slice(0, arrPtr);
}
