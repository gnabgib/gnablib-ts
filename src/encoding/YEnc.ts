/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { ContentError } from '../primitive/ErrorExt.js';
const defLineLength = 128;
const defShiftOffset = 42; //v0-1.2, default
const defEscapeChar = '='; //V0-1.2, default
const newline = '\r\n';

export interface EncodeOpts {
	/**
	 * (Default=128)
	 * Length of each encoded line, the spec suggests 128 or 256 as defaults
	 * however if transporting over email 76 is suggested
	 */
	lineLength?: number;
	/**
	 * (Default=42)
	 * Byte-shift offset
	 */
	offset?: number;
	/**
	 * (Default `=`)
	 * Escape character (will also be escaped)
	 */
	escapeChar?: string;
}

export interface DecodeOpts {
	/**
	 * (Default=42)
	 * Byte-shift offset
	 */
	offset?: number;
	/**
	 * (Default `=`)
	 * Escape character (will also be escaped)
	 */
	escapeChar?: string;
}

/** @namespace */
export const yEnc = {
	/**
	 * Convert an array of bytes to yEnc text
	 * @param bytes
	 * @param opts
	 * @returns
	 */
	fromBytes: function (bytes: Uint8Array, opts?: EncodeOpts): string {
		const lineLength = opts?.lineLength ?? defLineLength;
		const offset = opts?.offset ?? defShiftOffset;
		const escapeChar = opts?.escapeChar ?? defEscapeChar;
		const escapeOrd = escapeChar.codePointAt(0);

		let ret = '';
		let linePos = 0;

		function escape(value: number): string {
			return escapeChar + String.fromCodePoint((value + 64) & 0xff);
		}

		function encode(byte: number, others?: number[]): string {
			const enc = (byte + offset) & 0xff;
			switch (enc) {
				case 0x00: //null
				case 0x0a: //lf
				case 0x0d: //cr
				case escapeOrd:
					return escape(enc);
				default:
					if (others && others.includes(enc)) return escape(enc);
					return String.fromCodePoint(enc);
			}
		}

		let bPos = 0;
		let asStr: string;
		const safeLen = bytes.length - 1;
		while (bPos < safeLen) {
			asStr = encode(bytes[bPos++]);
			if (linePos == 0) {
				if (asStr == ' ' || asStr == '\t' || asStr == '.') {
					//A line should not start with a space or tab
					//Apparently not a dot either (1.2)
					asStr = escape(asStr.codePointAt(0) ?? 0);
				}
				ret += asStr;
				linePos += asStr.length;
				continue;
			}
			if (linePos + asStr.length == lineLength) {
				if (asStr == ' ' || asStr == '\t') {
					//A line should not end with a space or tab
					asStr = escape(asStr.codePointAt(0) ?? 0);
					ret += newline + asStr;
					linePos = asStr.length;
				} else {
					ret += asStr + newline;
					linePos = 0;
				}
				continue;
			}
			if (linePos + asStr.length > lineLength) {
				ret += newline + asStr;
				linePos = asStr.length;
				continue;
			}
			ret += asStr;
			linePos += asStr.length;
		}
		//Get the last character:
		asStr = encode(bytes[safeLen], [0x20, 0x09]);
		if (linePos + asStr.length >= lineLength) {
			ret += newline;
			linePos = 0;
		}
		return ret + asStr;
	},

	/**
	 * Convert yEnc "text" into bytes
	 * @param yEnc
	 */
	toBytes: function (yEnc: string, opts?: DecodeOpts): Uint8Array {
		const offset = opts?.offset ?? defShiftOffset;
		const escapeChar = opts?.escapeChar ?? defEscapeChar;

		const ret = new Uint8Array(yEnc.length); //May be shorter
		let inPtr = 0;
		let outPtr = 0;

		function unescape(char: string): number {
			//Todo confirm valid escapes?
			// codePointAt(0) cannot be undefined, (see usage below) so we null
			// coalesce to zero to stop complaints
			return ((char.codePointAt(0) ?? 0) - 64) & 0xff;
		}

		while (inPtr < yEnc.length) {
			const char = yEnc[inPtr++];
			if (char === escapeChar) {
				const next = yEnc[inPtr++];
				ret[outPtr++] = (unescape(next) - offset) & 0xff;
			} else if (char === '\r') {
				const next = yEnc[inPtr++];
				if (next === '\n') {
					//Ignore newlines
					continue;
				}
				throw new ContentError('yEnc', 'Invalid sequence', char + next);
			} else {
				//Again, char[0] cannot be null, so coalesce to stop TS complaints
				ret[outPtr++] = ((char.codePointAt(0) ?? 0) - offset) & 0xff;
			}
		}
		return ret.slice(0, outPtr);
	},
};
