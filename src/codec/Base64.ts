/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { ContentError } from '../primitive/ErrorExt.js';
import { IBase64 } from './interfaces/IBase64.js';
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

//[Wiki: Base64](https://en.wikipedia.org/wiki/Base64)
//[RFC-4648: The Base16, Base32, and Base64 Data Encodings](https://datatracker.ietf.org/doc/html/rfc4648)
const pad = '=';
/**
 * Mask for last 6 bits (when used with &)
 */
const last6Bits = 0x3f; // 00111111
const byteEat=3;

/**
 * Base 64 encoder/decoder
 */
class Base64 {
	readonly #decode: Uint8Array;
	constructor(
		/**
		 * Encoding table
		 */
		readonly tbl: string,
		/**
		 * Whether padding is required (when not specified on @see fromBytes, @see toBytes)
		 */
		readonly reqPad: boolean
	) {
		this.#decode = this.buildDecode();
	}

	private buildDecode(): Uint8Array {
		//We only need to set the first 127 places, since they're ASCII 
		// The first 32 aren't printable, but we'd have to branch to compensate, so let's waste a little memory
		// to avoid
		const code = new Uint8Array(127);
		//Set equals sign pos to 65 (padding indicator)
		code[pad.charCodeAt(0)] = 65;
		for (let i = 0; i < 64;) {
			//Generally codePointAt is better, but we know this ASCII (no UTF16 vs UTF32 troubles)
			// and charCodeAt will always return a number, while codePointAt may return undefined (if you're mid-rune)
			//OFFSET by 1 (since 0 is used as bad indicator)
			code[this.tbl.charCodeAt(i++)] = i;
		}
		//For every byte value, the return is either 1-64 (valid char), 65 (padding), or 0 (invalid)
		// note this also exploits the rule that out of range access will also return o (eg code[4000]==0)
		return code;
	}

	/**
	 * Convert an array of bytes into encoded text
	 * @remarks 24=6bits*4 = 8bits*3
	 * @param bytes Bytes to encode
	 * @param addPad Whether to include padding (default @see reqPad)
	 * @returns encoded string
	 */
	fromBytes(bytes: Uint8Array, addPad?: boolean): string {
		if (addPad === undefined) addPad = this.reqPad;
		let ret = '';
		let pos = byteEat-1;

		//We can eat 3 bytes at a time (=4 base64 chars) = 24 bits
		for (; pos < bytes.length; pos += byteEat) {
			const u24 = (bytes[pos - 2] << 16) | (bytes[pos - 1] << 8) | bytes[pos];
			ret +=
				this.tbl.charAt(u24 >>> 18) +
				this.tbl.charAt((u24 >>> 12) & last6Bits) +
				this.tbl.charAt((u24 >>> 6) & last6Bits) +
				this.tbl.charAt(u24 & last6Bits);
		}

		//We can have 1 or 2 bytes not encoded at this point
		switch (bytes.length - pos + byteEat -1) {
			case 1:
				//NOTE `pos` is 2 after `bytes.length`, so `pos-1` `pos` are invalid
				//8 bits = [aaaaaa][aa0000]==
				ret +=
					this.tbl.charAt(bytes[pos - 2] >>> 2) +
					this.tbl.charAt((bytes[pos - 2] << 4) & last6Bits);
				//Pad if requested
				if (addPad) ret += pad + pad;
				break;

			case 2:
				//NOTE `pos` is 1 after `bytes.length`, `pos` is invalid
				//16 bits=[aaaaaa][aabbbb][bbbb00]=
				ret +=
					this.tbl.charAt(bytes[pos - 2] >>> 2) +
					this.tbl.charAt(
						((bytes[pos - 2] << 4) | (bytes[pos - 1] >>> 4)) & last6Bits
					) +
					this.tbl.charAt((bytes[pos - 1] << 2) & last6Bits);
				//Pad if requested
				if (addPad) ret += pad;
				break;
		}
		return ret;
	}

	/**
	 * Convert encoded text into an array of bytes
	 * @param base64 encoded data
	 * @param requirePad Whether padding is required (default @see reqPad) - if required and missing, may throw
	 * @throws {ContentError} Bad character|Content after padding|padding missing
	 */
	toBytes(base64: string, requirePad?: boolean): Uint8Array {
		const name = 'toBytes';
		const ret = new Uint8Array(Math.ceil((base64.length * 3) / 4)); //Note it may be shorter if no pad, or ignored chars

		let padCount = 0;
		let retPtr = 0;
		let carry = 0;
		let carrySize = 0;
		for (let i = 0; i < base64.length; i++) {
			const dec = this.#decode[base64.charCodeAt(i)];
			//If 0, invalid
			if (dec===0)
				throw new ContentError(name, 'Unknown char', base64.charAt(i));
			if (dec === 65) {
				padCount++;
				continue;
			}
			if (padCount > 0)
				throw new ContentError(name, 'Found after padding', base64.charAt(i));
			//Otherwise decoded char is off by 1
			carry = (carry << 6) | (dec-1);
			carrySize += 6;
			if (carrySize >= 8) {
				carrySize -= 8;
				ret[retPtr++] = carry >> carrySize;
			}
		}

		switch (carrySize) {
			//Can only be even because +6 -8, so 0,2,4,6 (8 is consumed)
			case 6:
				//+1 char
				// single base64 char isn't decode-able (minimum 2)
				throw new ContentError(name, 'Not enough characters');

			case 4:
				//+2 char -1 byte
				// Expect 2 padding chars, or 0 (if opt padding)
				if (padCount == 0 && !requirePad) break;
				if (padCount != 2)
					throw new ContentError(
						name,
						'Bad padding, expecting 2 got',
						padCount
					);
				break;

			case 2:
				// Expect 1 padding char, or 0 (if opt padding)
				if (padCount == 0 && !requirePad) break;
				if (padCount != 1)
					throw new ContentError(
						name,
						'Bad padding, expecting 1 got',
						padCount
					);
				break;

			case 0:
				//Don't allow spurious padding
				if (padCount > 0)
					throw new ContentError(
						name,
						'Bad padding, expecting 0 got',
						padCount
					);
		}

		return ret.subarray(0, retPtr);
	}
}

/**
 * RFC 4648 base 64 (padding default on)
 */
export const base64:IBase64 = new Base64(
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
	true
);

/**
 * RFC 4648 URL/file safe base 64 (padding default off)
 */
export const base64url:IBase64 = new Base64(
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
	false
);

/**
 * Sortable base 64, (Unix-Crypt/GEDCOM) (padding default off)
 */
export const b64:IBase64 = new Base64(
	'./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	false
);
