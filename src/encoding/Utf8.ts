/*! Copyright 2023 gnabgib MPL-2.0 */

import { ContentError } from '../primitive/ErrorExt.js';
/**
 * Support: (TextEncoded.encode, TextDecoder.decode)
 * Chrome, Android webview, ChromeM >=38
 * Edge >=79
 * Firefox, FirefoxM >=19
 * IE: -1
 * Opera, OperaM: 25
 * Safari: >=10.1
 * SafariM: >=10.3
 * Samsung: >=3.0
 * Node: >=10.5
 * Deno: >=1
 */

/**
 * In UTF8 everything but the first byte must start with these two bits
 */
const ind_cont = 0x80; // 10xx xxxx
const ind_2_byte = 0xc0; //110x xxxx
const ind_3_byte = 0xe0; // 1110 xxxx
const ind_4_byte = 0xf0; // 1111 0xxx
/**
 * Get only the data from everything but the first byte
 */
const last_6_bits = 0x3f; // 0011 1111
const last_5_bits = 0x1f; // 0001 1111
const last_4_bits = 0xf; // 0000 1111
const last_3_bits = 0x7; // 0000 0111
/**
 * Converts UCS2 into UTF8 bytes
 * @see utf8.bytesFromCodePoint
 */
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');

export const utf8 = {
	/**
	 * Encode a unicode code-point into a utf8 byte series (1-4B)
	 * https://en.wikipedia.org/wiki/UTF-8#Encoding
	 * https://datatracker.ietf.org/doc/html/rfc3629
	 * @param codePoint integer 0-1114111 (0-0x10ffff)
	 * @returns Array of 1-4 bytes (each value [0-247])
	 * @see [TextEncoder.encode](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encode)
	 */
	bytesFromCodePoint: function (codePoint: number): number[] {
		if (codePoint < 0x80) {
			// eg: $ (u=x24) (8=x24)
			// 0 - 0x7F -> 1 byte 0xxxXxxx (7 bits or less)
			//1 byte rune (ascii)
			return [codePoint];
		}
		if (codePoint < 0x800) {
			// eg: £ (u=x00A3) (8=xC2A3)
			// 0x80 - 0x7FF -> 2 byte 110xXxxx 10xxXxxx (8-11 bits or less)
			//2 byte rune
			return [
				(codePoint >>> 6) | ind_2_byte,
				(codePoint & last_6_bits) | ind_cont,
			];
		}
		if (codePoint < 0x10000) {
			// eg: € (u=x20AC) (8=xE282AC)
			// 0x800 - 0xFFFF -> 3 byte 1110xxxx 10xxXxxx 10xxXxxx (12-16 bits)
			// 3 byte rune
			return [
				(codePoint >>> 12) | ind_3_byte,
				((codePoint >>> 6) & last_6_bits) | ind_cont,
				(codePoint & last_6_bits) | ind_cont,
			];
		}
		if (codePoint < 0x20ffff) {
			//eg: 𐍈 (u=x10348) (8=xF0908D88)
			// 0x10000 - 0x10FFFF -> 4 byte 11110xxx 10xxXxxx 10xxXxxx 10xxXxxx (17-21 bits)
			// 4 byte rune
			return [
				(codePoint >> 18) | ind_4_byte,
				((codePoint >> 12) & last_6_bits) | ind_cont,
				((codePoint >> 6) & last_6_bits) | ind_cont,
				(codePoint & last_6_bits) | ind_cont,
			];
		}
		//Unicode says we only have 21 bits of space
		throw new ContentError('Unicode', 'Only 21 bits of space', codePoint);
	},

	codePointFromBytes: function (bytes: number[]): number {
		if (bytes[0] >> 7 == 0) {
			//1 byte rune (ascii)
			if (bytes.length != 1) return -1;
			return bytes[0];
		} else if (bytes[0] >> 5 == 6) {
			//2 byte rune
			if (bytes.length != 2) return -1;
			return ((bytes[0] & last_5_bits) << 6) | (bytes[1] & last_6_bits);
		} else if (bytes[0] >> 4 == 14) {
			//3 byte rune
			if (bytes.length != 3) return -1;
			return (
				((bytes[0] & last_4_bits) << 12) |
				((bytes[1] & last_6_bits) << 6) |
				(bytes[2] & last_6_bits)
			);
		}
		// else if (bytes[0]>>5!=0x1e) {
		//4 byte rune
		if (bytes.length != 4) return -1;
		return (
			((bytes[0] & last_3_bits) << 18) |
			((bytes[1] & last_6_bits) << 12) |
			((bytes[2] & last_6_bits) << 6) |
			(bytes[3] & last_6_bits)
		);
	},

	/**
	 * Convert a string to an array of utf8 encoded bytes
	 * @param ucs2
	 * @returns
	 */
	toBytes: function (ucs2: string): Uint8Array {
		return textEncoder.encode(ucs2);
	},
	/**
	 * Convert a series of utf8 encoded bytes into a string
	 * @param bytes
	 * @returns
	 */
	fromBytes: function (bytes: Uint8Array): string {
		return textDecoder.decode(bytes);
	},
};
