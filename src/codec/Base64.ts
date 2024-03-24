/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */
import { ContentError } from '../error/ContentError.js';

const pad = '=';
const last6Bits = 0b111111;
const byteEat = 3;

/** Base 64 encoder/decoder using a table */
class Base64 {
	private readonly _decode: Uint8Array;
	constructor(
		/** Encoding table */
		private readonly tbl: string,
		/** Whether padding is required (when not specified explicity) @private */
		private readonly reqPad: boolean
	) {
		this._decode = this.buildDecode();
	}
	private buildDecode(): Uint8Array {
		//We only need to set the first 127 places, since they're ASCII
		// The first 32 aren't printable, but we'd have to branch to compensate, so let's waste a little memory
		// to avoid
		const code = new Uint8Array(127);
		//Set equals sign pos to 65 (padding indicator)
		code[pad.charCodeAt(0)] = 65;
		for (let i = 0; i < 64; ) {
			//Generally codePointAt is better, but we know this ASCII (no UTF16 vs UTF32 troubles)
			// and charCodeAt will always return a number, while codePointAt may return undefined (if you're mid-rune)
			//OFFSET by 1 (since 0 is used as bad indicator)
			code[this.tbl.charCodeAt(i++)] = i;
		}
		//For every byte value, the return is either 1-64 (valid char), 65 (padding), or 0 (invalid)
		// note this also exploits the rule that out of range access will also return o (eg code[4000]==0)
		return code;
	}
	fromBytes(src: Uint8Array, addPad?: boolean): string {
		if (addPad == undefined) addPad = this.reqPad;
		let ret = '';
		let pos = byteEat - 1;

		//We can eat 3 bytes at a time (=4 base64 chars) = 24 bits
		for (; pos < src.length; pos += byteEat) {
			const u24 = (src[pos - 2] << 16) | (src[pos - 1] << 8) | src[pos];
			ret +=
				this.tbl.charAt(u24 >>> 18) +
				this.tbl.charAt((u24 >>> 12) & last6Bits) +
				this.tbl.charAt((u24 >>> 6) & last6Bits) +
				this.tbl.charAt(u24 & last6Bits);
		}

		//We can have 1 or 2 bytes not encoded at this point
		switch (src.length - pos + byteEat - 1) {
			case 1:
				//NOTE `pos` is 2 after `bytes.length`, so `pos-1` `pos` are invalid
				//8 bits = [aaaaaa][aa0000]==
				ret +=
					this.tbl.charAt(src[pos - 2] >>> 2) +
					this.tbl.charAt((src[pos - 2] << 4) & last6Bits);
				//Pad if requested
				if (addPad) ret += pad + pad;
				break;

			case 2:
				//NOTE `pos` is 1 after `bytes.length`, `pos` is invalid
				//16 bits=[aaaaaa][aabbbb][bbbb00]=
				ret +=
					this.tbl.charAt(src[pos - 2] >>> 2) +
					this.tbl.charAt(
						((src[pos - 2] << 4) | (src[pos - 1] >>> 4)) & last6Bits
					) +
					this.tbl.charAt((src[pos - 1] << 2) & last6Bits);
				//Pad if requested
				if (addPad) ret += pad;
				break;
		}
		return ret;
	}
	toBytes(src: string, requirePad?: boolean): Uint8Array {
		const name = 'toBytes';
		const ret = new Uint8Array(Math.ceil((src.length * 3) / 4)); //Note it may be shorter if no pad, or ignored chars

		let padCount = 0;
		let retPtr = 0;
		let carry = 0;
		let carrySize = 0;
		for (let i = 0; i < src.length; i++) {
			const dec = this._decode[src.charCodeAt(i)];
			//If 0, invalid
			if (dec === 0)
				throw new ContentError('Unknown char', name, src.charAt(i));
			if (dec === 65) {
				padCount++;
				continue;
			}
			if (padCount > 0)
				throw new ContentError('Found after padding', name, src.charAt(i));
			//Otherwise decoded char is off by 1
			carry = (carry << 6) | (dec - 1);
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
				throw new ContentError('Not enough characters', name, '');

			case 4:
				//+2 char -1 byte
				// Expect 2 padding chars, or 0 (if opt padding)
				if (padCount == 0 && !requirePad) break;
				if (padCount != 2)
					throw new ContentError(
						'Bad padding, expecting 2 got',
						name,
						padCount
					);
				break;

			case 2:
				// Expect 1 padding char, or 0 (if opt padding)
				if (padCount == 0 && !requirePad) break;
				if (padCount != 1)
					throw new ContentError(
						'Bad padding, expecting 1 got',
						name,
						padCount
					);
				break;

			case 0:
				//Don't allow spurious padding
				if (padCount > 0)
					throw new ContentError(
						'Bad padding, expecting 0 got',
						name,
						padCount
					);
		}

		return ret.subarray(0, retPtr);
	}
}

/**
 * # [Base 64](https://en.wikipedia.org/wiki/Base64)
 *
 * [RFC 4648](https://datatracker.ietf.org/doc/html/rfc4648), with padding default **on**
 *
 * Text will be composed of the characters:
 * `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`
 *
 * @namespace
 */
export const base64: {
	/**
	 * Convert an array of bytes into encoded text.
	 *
	 * Text will be composed of the characters:
	 * `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`
	 *
	 * @param src Bytes to encode
	 * @param addPad Whether to include padding
	 * @returns Encoded string - at most `Ceil(src.length*4/3)` in length
	 *
	 * @example
	 * ```js
	 * import { base64, hex } from 'gnablib/codec';
	 *
	 * base64.fromBytes(hex.toBytes('DEADBEEF'));
	 * ```
	 */
	fromBytes(src: Uint8Array, addPad?: boolean): string;
	/**
	 * Decode text into an array of bytes
	 *
	 * @param src Encoded data
	 * @param requirePad Whether padding is required (overrides default) - if required and missing, may throw
	 * @returns Decoded bytes
	 *
	 * @throws {@link error.ContentError ContentError}
	 * Bad source character/Not enough characters
	 *
	 * @throws {@link error.ContentError ContentError}
	 * Content after padding/Padding missing/Padding inadequate
	 *
	 * @example
	 * ```js
	 * import { base64, utf8 } from 'gnablib/codec';
	 *
	 * utf8.fromBytes(base64.toBytes('SGVsbG8h'));
	 * ```
	 */
	toBytes(src: string, requirePad?: boolean): Uint8Array;
} = new Base64(
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
	true
);

/**
 * # Base 64 Url
 *
 * [RFC 4648](https://datatracker.ietf.org/doc/html/rfc4648), with padding default **off**
 *
 * Text will be composed of the characters:
 * `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_`
 *
 * @namespace
 */
export const base64url: {
	/**
	 * Convert an array of bytes into encoded text.
	 *
	 * Text will be composed of the characters:
	 * `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_`
	 *
	 * @param src Bytes to encode
	 * @param addPad Whether to include padding
	 * @returns Encoded string - at most `Ceil(src.length*4/3)` in length
	 *
	 * @example
	 * ```js
	 * import { base64url, hex } from 'gnablib/codec';
	 *
	 * base64url.fromBytes(hex.toBytes('DEADBEEF'));
	 * ```
	 */
	fromBytes(src: Uint8Array, addPad?: boolean): string;
	/**
	 * Decode text into an array of bytes
	 *
	 * @param src Encoded data
	 * @param requirePad Whether padding is required (overrides default) - if required and missing, may throw
	 * @returns Decoded bytes
	 *
	 * @throws {@link error.ContentError ContentError}
	 * Bad source character/Not enough characters
	 *
	 * @throws {@link error.ContentError ContentError}
	 * Content after padding/Padding missing/Padding inadequate
	 *
	 * @example
	 * ```js
	 * import { base64url, utf8 } from 'gnablib/codec';
	 *
	 * utf8.fromBytes(base64url.toBytes('SGVsbG8h'));
	 * ```
	 */
	toBytes(src: string, requirePad?: boolean): Uint8Array;
} = new Base64(
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
	false
);

/**
 * # Sortable base 64
 *
 * Unix-Crypt/GEDCOM, with default padding **off**
 *
 * Text will be composed of the characters:
 * `./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`
 *
 * @namespace
 */
export const b64: {
	/**
	 * Convert an array of bytes into encoded text.
	 *
	 * Text will be composed of the characters:
	 * `./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`
	 *
	 * @param src Bytes to encode
	 * @param addPad Whether to include padding
	 * @returns Encoded string - at most `Ceil(src.length*4/3)` in length
	 *
	 * @example
	 * ```js
	 * import { b64, hex } from 'gnablib/codec';
	 *
	 * b64.fromBytes(hex.toBytes('DEADBEEF'));
	 * ```
	 */
	fromBytes(src: Uint8Array, addPad?: boolean): string;
	/**
	 * Decode text into an array of bytes
	 *
	 * @param src Encoded data
	 * @param requirePad Whether padding is required (overrides default) - if required and missing, may throw
	 * @returns Decoded bytes
	 *
	 * @throws {@link error.ContentError ContentError}
	 * Bad source character/Not enough characters
	 *
	 * @throws {@link error.ContentError ContentError}
	 * Content after padding/Padding missing/Padding inadequate
	 *
	 * @example
	 * ```js
	 * import { b64, utf8 } from 'gnablib/codec';
	 *
	 * utf8.fromBytes(b64.toBytes('SGVsbG8h'));
	 * ```
	 */
	toBytes(src: string, requirePad?: boolean): Uint8Array;
} = new Base64(
	'./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	false
);
