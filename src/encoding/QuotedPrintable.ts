/*! Copyright 2023 gnabgib MPL-2.0 */

import { ContentError } from '../primitive/ErrorExt.js';
import { inRangeInclusive } from '../primitive/IntExt.js';
import * as hex from './Hex.js';

interface EncodeOpts {
	/**
	 * 3-998 (Default=76)
	 * Length of each encoded line, RFC2045 requires this be 76 or less,
	 * RFC6532 allows it to be 998 or less
	 */
	lineLength: number;
}

//https://en.wikipedia.org/wiki/Quoted-printable
//https://datatracker.ietf.org/doc/html/rfc2045#section-6.7

/**
 * Convert an array of bytes to QuotedPrintable text
 * @param bytes
 * @param opts
 * @returns
 */
export function fromBytes(bytes: Uint8Array, opts?: EncodeOpts): string {
	let maxLineLength: number;
	if (opts?.lineLength !== undefined) {
		//Lower bound is 3 because a single char can encode to 3 chars (eg 61)
		inRangeInclusive(opts.lineLength, 3, 998, 'lineLength');
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
}

/**
 * Convert quote printable text into bytes
 * @param quotedPrintable
 * @param opts
 * @returns
 */
export function toBytes(quotedPrintable: string): Uint8Array {
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
			} catch (e) {
				//Not a pair, invalid hex chars
				throw new ContentError(
					'Quoted printable',
					'invalid escape',
					'=' + pair
				);
			}
		} else {
			const ord = char.charCodeAt(0);
			if (ord <= 0xff) ret[outPtr++] = ord;
			else
				throw new ContentError(
					'Quoted printable',
					'invalid character',
					String.fromCodePoint(ord)
				);
		}
	}
	return ret.slice(0, outPtr);
}
