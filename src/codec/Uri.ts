/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { ContentError } from '../error/ContentError.js';
import { hex } from './Hex.js';
import { IUriDecodeOpts } from './interfaces/IUriDecodeOpts.js';
import { utf8 } from './Utf8.js';
//https://datatracker.ietf.org/doc/html/rfc3986#page-11
const ord_dash = 45; //ASCII -
const ord_tilde = 126; //ASCII ~

// prettier-ignore
const tbl=[
	//   45                 50
		'-','.','','0','1','2','3','4','5','6',
		'7','8','9','','','','','','','',
		'A','B','C','D','E','F','G','H','I','J',
		'K','L','M','N','O','P','Q','R','S','T',
		'U','V','W','X','Y','Z','','','','',
		'_','','a','b','c','d','e','f','g','h',
		'i','j','k','l','m','n','o','p','q','r',
		's','t','u','v','w','x','y','z','','',
		'','~'];

export const uri = {
	/**
	 * Convert an array of bytes to URLEncoded text
	 * @param bytes
	 */
	fromBytes: function (bytes: Uint8Array): string {
		let ret = '';
		for (const byte of bytes) {
			if (byte >= ord_dash && byte <= ord_tilde) {
				const c = tbl[byte - 45];
				if (c !== '') {
					ret += c;
					continue;
				}
			}
			ret += '%' + hex.fromByte(byte);
		}
		return ret;
	},

	/**
	 * Convert URI encoded data into (utf8) bytes
	 * @param uriEncoded
	 */
	toBytes: function (uriEncoded: string, opts?: IUriDecodeOpts): Uint8Array {
		opts = opts || { invalid: 'throw', overProvisionOutput: 8 };
		opts.overProvisionOutput = opts.overProvisionOutput ?? 8;
		const ret = new Uint8Array(uriEncoded.length + opts.overProvisionOutput); //May be shorter
		let inPtr = 0;
		let outPtr = 0;

		function throwInvalid(ord: number) {
			throw new ContentError(
				'invalid character',
				'URI encoding',
				String.fromCodePoint(ord)
			);
		}

		function ignoreInvalid() {}

		function copyInvalid(ord: number) {
			const bytes = utf8.bytesFromCodePoint(ord);
			for (const b of bytes) ret[outPtr++] = b;
		}
		const invalidChar =
			opts.invalid === 'throw'
				? throwInvalid
				: opts.invalid === 'ignore'
				? ignoreInvalid
				: copyInvalid;

		while (inPtr < uriEncoded.length) {
			const char = uriEncoded[inPtr++];
			if (char === '%') {
				const pair = uriEncoded.substring(inPtr, inPtr + 2);
				try {
					ret[outPtr++] = hex.toByte(pair);
				} catch {
					//Not a pair, invalid hex chars
					throw new ContentError('invalid escape', 'URI encoding', '%' + pair);
				}
				inPtr += 2;
			} else {
				const ord = char.charCodeAt(0);
				if (ord <= 0xff) ret[outPtr++] = ord;
				else invalidChar(ord);
			}
		}
		return ret.slice(0, outPtr);
	},
};
