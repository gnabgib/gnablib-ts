/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { ContentError } from '../error/ContentError.js';
import { hex } from './Hex.js';
import { IQuotedPrintableEncodeOpts } from './interfaces/IQuotedPrintableEncodeOpts.js';
import { sNum } from '../safe/safe.js';

//https://en.wikipedia.org/wiki/Quoted-printable
//https://datatracker.ietf.org/doc/html/rfc2045#section-6.7

/** @namespace */
export const quotedPrintable = {
	/**
	 * Convert an array of bytes to QuotedPrintable text
	 * @param bytes
	 * @param opts
	 * @returns
	 */
	fromBytes: function (
		bytes: Uint8Array,
		opts?: IQuotedPrintableEncodeOpts
	): string {
		let maxLineLength: number;
		if (opts?.lineLength != undefined) {
			//Lower bound is 3 because a single char can encode to 3 chars (eg 61)
			sNum('opts.lineLength', opts.lineLength)
				.atLeast(3)
				.atMost(998)
				.throwNot();
			maxLineLength = opts.lineLength;
		} else {
			maxLineLength = 76;
		}
		let ret = '';
		let lineLen = 0;

		function pushStr(str: string) {
			if (lineLen + str.length >= maxLineLength) {
				ret += '=\r\n';
				lineLen = 0;
			}
			ret += str;
			lineLen += str.length;
		}

		for (const byte of bytes) {
			if (byte === 61) {
				pushStr('=3D');
			} else if (byte === 9) {
				pushStr('\t');
			} else if (byte >= 32 && byte <= 127) {
				pushStr(String.fromCodePoint(byte));
			} else {
				pushStr('=' + hex.fromByte(byte));
			}
		}
		return ret;
	},

	/**
	 * Convert quote printable text into bytes
	 * @param quotedPrintable
	 * @returns
	 */
	toBytes: function (quotedPrintable: string): Uint8Array {
		const ret = new Uint8Array(quotedPrintable.length); //May be shorter
		let inPtr = 0;
		let outPtr = 0;

		while (inPtr < quotedPrintable.length) {
			const char = quotedPrintable[inPtr++];
			if (char === '=') {
				const pair = quotedPrintable.substring(inPtr, inPtr + 2);
				inPtr += 2;
				//Eat escaped newlines
				if (pair === '\r\n') continue;
				try {
					ret[outPtr++] = hex.toByte(pair);
				} catch {
					//Not a pair, invalid hex chars
					throw new ContentError(
						'invalid escape',
						'Quoted printable',
						'=' + pair
					);
				}
			} else {
				const ord = char.charCodeAt(0);
				if (ord <= 0xff) ret[outPtr++] = ord;
				else
					throw new ContentError(
						'invalid character',
						'Quoted printable',
						String.fromCodePoint(ord)
					);
			}
		}
		return ret.slice(0, outPtr);
	},
};
