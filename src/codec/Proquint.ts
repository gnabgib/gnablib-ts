/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { ContentError } from '../primitive/error/ContentError.js';
import { bitConverter } from './_bitConverter.js';

const tbl_con = 'bdfghjklmnprstvz';
const tbl_vow = 'aiou';
// prettier-ignore
const tbl_conBack = [
  // a  b   c  d   e  f  g  h   i  j  k  l  m  n   o   p   q   r   s   t   u   v   w   x   y   z
	-1, 0, -1, 1, -1, 2, 3, 4, -1, 5, 6, 7, 8, 9, -1, 10, -1, 11, 12, 13, -1, 14, -1, -1, -1, 15
];
const bits_4 = 0xf;
const bits_2 = 0x3;
const ord_A = 65;
const ord_I = 73;
const ord_O = 79;
//const ord_U = 85;
const ord_Z = 90;

/**
 * Convert 4 bits into a consonant
 * @param int
 * @returns
 */
function intToCon(int: number): string {
	return tbl_con[int & bits_4];
}

/**
 * Convert 2 bits into a vowel
 * @param int
 */
function intToVow(int: number): string {
	return tbl_vow[int & bits_2];
}

function conToInt(char: string): number {
	let ord = char.charCodeAt(0);

	//Fold lower over upper
	ord &= 0x5f; //1011111 = ord('_');
	if (ord < ord_A || ord > ord_Z) return -1;
	return tbl_conBack[ord - ord_A];
}

function vowToInt(char: string): number {
	let ord = char.charCodeAt(0);
	//Fold lower over upper
	ord &= 0x5f; //1011111 = ord('_');
	switch (ord) {
		case ord_A:
			return 0;
		case ord_I:
			return 1;
		case ord_O:
			return 2;
		default:
			//case ord_U:
			return 3;
	}
}

/**
 * Convert 16 bits into a quint
 * @param word
 * @returns
 */
function wordToQuint(word: number): string {
	// 4-2-4-2-4 | 12 10 6 4 0
	return (
		intToCon(word >> 12) +
		intToVow(word >> 10) +
		intToCon(word >> 6) +
		intToVow(word >> 4) +
		intToCon(word) +
		'-'
	);
}

/** @namespace */
export const proquint = {
	/**
	 * Convert a series of bytes into proquint
	 * @param bytes
	 * @returns
	 */
	fromBytes: function (bytes: Uint8Array): string {
		const ret = bitConverter.fromBytes(bytes, 16, wordToQuint);
		return ret.slice(0, ret.length - 1);
	},
	/**
	 * Convert proquint encoded data into bytes
	 * @param proquint
	 * @throws If an unknown character is found or if the content is malformed (wrong length, wrong character in place)
	 * @returns
	 */
	toBytes: function (proquint: string): Uint8Array {
		const arr = new Uint8Array((proquint.length / 5) * 2);
		let outputPtr = 0;
		let carry = 0;
		let pos = 0;
		let dec = 0;
		for (const char of proquint) {
			if (char === '-') continue; //Ignore dashes
			switch (pos++) {
				case 0:
				case 2:
					dec = conToInt(char);
					if (dec < 0) throw new ContentError('unknown', 'Character', char);
					carry = (carry << 4) | dec;
					break;
				case 1:
				case 3:
					dec = vowToInt(char);
					if (dec < 0) throw new ContentError('unknown', 'Character', char);
					carry = (carry << 2) | dec;
					break;

				case 4:
					dec = conToInt(char);
					if (dec < 0) throw new ContentError('unknown', 'Character', char);
					carry = (carry << 4) | dec;

					arr[outputPtr++] = (carry >> 8) & 0xff;
					arr[outputPtr++] = carry & 0xff;
					pos = 0;
					break;
			}
		}
		if (pos != 0)
			throw new ContentError(
				'Should be a multiple of 5, have leftovers',
				'Size',
				pos
			);
		return arr;
	},
};
