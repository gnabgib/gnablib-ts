/*! Copyright 2023 gnabgib MPL-2.0 */

import { bitConverter } from './_bitConverter.js';

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

const tbl = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ord_A = 65;
const ord_0 = 48;
const ord_9 = 57;

interface DecodeOpts {
	/**
	 * Characters to ignore (default=-)
	 */
	ignore?: string;
}

/**
 * Convert an integer [0-31] into a crockford 32 character
 * @param int
 * @returns
 */
function intToCrockford32Char(int: number): string {
	return tbl.substring(int, int + 1);
}

/**
 * Convert a crockford 32 char into an integer [0-31]
 * @param char
 * @returns 0-31 or -1 if invalid char
 */
function crockford32CharToInt(char: string): number {
	let ord = char.charCodeAt(0);
	// 0-9 = 48-57
	if (ord < ord_0) return -1;
	if (ord <= ord_9) return ord - ord_0;

	//Fold lower over upper
	ord &= 0x5f; //1011111 = ord('_');

	//ABCDEFGH(I)JK(L)MN(O)PQRST(U)VWXYZ
	ord = ord - ord_A; //A=0 .. Z=26
	if (ord < 0 || ord > 25) return -1;
	// i=9th, l=12th, o=15th, u=21
	if (ord < 8) return ord + 10; //a-h
	if (ord === 8) return 1; //i=1
	if (ord < 11) return ord + 9; //j,k
	if (ord === 11) return 1; //l=1
	if (ord < 14) return ord + 8; //m,n
	if (ord === 14) return 0; //o=0
	if (ord < 20) return ord + 7; //p-t
	if (ord === 20) return -1; //u is invalid
	return ord + 6; //v-z
}

export const crockford32 = {
	/**
	 * Convert an array of bytes into crockford32 text
	 * @param bytes
	 * @param opts
	 * @returns
	 */
	fromBytes: function (bytes: Uint8Array): string {
		return bitConverter.fromBytes(bytes, 5, intToCrockford32Char);
	},

	/**
	 * Convert crockford 32 text into an array of bytes
	 * @param base32
	 * @param opts
	 * @throws ContentError - Bad options, Bad content, bad padding
	 * @returns
	 */
	toBytes: function (crockford32: string, opts?: DecodeOpts): Uint8Array {
		const ignore = opts?.ignore ?? '-';

		const isWhitespace = (c: string) => ignore.indexOf(c) >= 0;
		const isPadding = () => false;

		const arr = new Uint8Array(Math.ceil((crockford32.length * 5) / 8)); //Note it may be shorter if ignored chars
		const arrPtr = bitConverter.toBytes(
			crockford32,
			5,
			isWhitespace,
			isPadding,
			crockford32CharToInt,
			arr
		);
		return arr.slice(0, arrPtr);
	},
};
