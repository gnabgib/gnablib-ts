/*! Copyright 2023 gnabgib MPL-2.0 */

import { safety } from '../primitive/Safety.js';
import { ScalingUint8Array } from '../primitive/TypedArrayExt.js';

// const tbl = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstu';
const defLineLength = 79;

interface EncodeOpts {
	/**
	 * 1-MAXINT (Default=78)
	 * Length of each encoded line
	 */
	lineLength?: number;
	/**
	 * Default=false
	 * Whether output should be padded (btoa style) or not (Adobe style)
	 */
	pad?: boolean;
}

export const ascii85 = {
	/**
	 * Convert from an array of bytes to ASCII85 text (btoa or adobe compat)
	 * @param bytes
	 */
	fromBytes: function (bytes: Uint8Array, opts?: EncodeOpts): string {
		let lineLength = defLineLength;
		if (opts?.lineLength) {
			safety.intGte(opts.lineLength,1,'opts.lineLength');
			lineLength = opts.lineLength;
		}
		let pad = false;
		if (opts?.pad) pad = true;

		let ret = '';
		let linePos = 0;

		function intToChar(value: number): string {
			return String.fromCodePoint(value + 33);
		}

		function encode(b0: number, b1: number, b2: number, b3: number): string {
			let num = (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
			//Encoded
			const u4 = num % 85;
			num = (num / 85) | 0;
			const u3 = num % 85;
			num = (num / 85) | 0;
			const u2 = num % 85;
			num = (num / 85) | 0;
			const u1 = num % 85;
			num = (num / 85) | 0;
			const u0 = num % 85;
			return (
				intToChar(u0) +
				intToChar(u1) +
				intToChar(u2) +
				intToChar(u3) +
				intToChar(u4)
			);
		}

		function addToLine(chunk: string) {
			if (chunk === '!!!!!') chunk = 'z';
			const space = lineLength - linePos;
			if (space > 5) {
				ret += chunk;
				linePos += 5;
			} else if (space === 5) {
				ret += chunk + '\r\n';
				linePos = 0;
			} else {
				ret += chunk.substring(0, space) + '\r\n' + chunk.substring(space);
				linePos = 5 - space;
			}
		}

		let i = 0;
		const safeLen = bytes.length - 3; //We eat 4 bytes
		while (i < safeLen) {
			addToLine(encode(bytes[i++], bytes[i++], bytes[i++], bytes[i++]));
		}
		if (i < bytes.length) {
			const left = bytes.length - i + 1;
			const chunk = encode(
				bytes[i++],
				i < bytes.length ? bytes[i++] : 0,
				i < bytes.length ? bytes[i++] : 0,
				0
			);
			if (pad) addToLine(chunk);
			else addToLine(chunk.substring(0, left));
		}
		return ret;
	},

	/**
	 * Convert from ASCII85 text to an array of bytes
	 * @param ascii85 
	 * @returns 
	 */
	toBytes: function (ascii85: string): Uint8Array {
		//const ret = new Uint8Array(ascii85.length + 8); //small risk if there's lots of z (=4bytes) this will be too small, but white space and general 4:5 should be fine
		const ret = new ScalingUint8Array(ascii85.length + 8);
		let inPtr = 0;
		let outPtr = 0;

		function charToInt(char: string): number {
			return char.charCodeAt(0) - 33;
		}
		function nextChar(): string | undefined {
			let c = ascii85[inPtr++];
			do {
				if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f') {
					c = ascii85[inPtr++];
				} else {
					return c;
				}
			} while (inPtr < ascii85.length);
			return undefined;
		}

		const safeLen = ascii85.length - 4;
		while (inPtr < safeLen) {
			const c0 = nextChar()!;
			if (c0 === 'z') {
				ret[outPtr++] = 0;
				ret[outPtr++] = 0;
				ret[outPtr++] = 0;
				ret[outPtr++] = 0;
				continue;
			}
			let num = charToInt(c0) * 85;
			num = (num + charToInt(nextChar()!)) * 85;
			num = (num + charToInt(nextChar()!)) * 85;
			num = (num + charToInt(nextChar()!)) * 85;
			num += charToInt(nextChar()!);
			ret[outPtr++] = num >>> 24;
			ret[outPtr++] = (num >> 16) & 0xff;
			ret[outPtr++] = (num >> 8) & 0xff;
			ret[outPtr++] = num & 0xff;
		}
		while (inPtr < ascii85.length) {
			const c0 = nextChar()!;
			if (c0 === 'z') {
				ret[outPtr++] = 0;
				ret[outPtr++] = 0;
				ret[outPtr++] = 0;
				ret[outPtr++] = 0;
				continue;
			}
			const remain = ascii85.length - inPtr;
			let num = charToInt(c0) * 85;
			num = (num + charToInt(nextChar() ?? 'u')) * 85;
			num = (num + charToInt(nextChar() ?? 'u')) * 85;
			num = (num + charToInt(nextChar() ?? 'u')) * 85;
			num += charToInt(nextChar() ?? 'u');
			ret[outPtr++] = num >>> 24;
			ret[outPtr++] = (num >> 16) & 0xff;
			ret[outPtr++] = (num >> 8) & 0xff;
			ret[outPtr++] = num & 0xff;
			outPtr -= 4 - remain;
		}
		return ret.clone(0, outPtr) as Uint8Array;
	},
};
