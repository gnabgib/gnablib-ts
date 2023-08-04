/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { ContentError } from '../primitive/ErrorExt.js';
import type { IReadArray } from '../primitive/IRWArray.js';
import type { U64, U64MutArray } from '../primitive/U64.js';
/*
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

//https://datatracker.ietf.org/doc/html/rfc4648#section-8
const tbl = '0123456789ABCDEF';
const ord_A = 65;
const ord_F = 70;
const ord_0 = 48;
const ord_9 = 57;
const whitespace = '\t\n\f\r ';

function mapCharToInt(char: string): number {
	let ord = char.charCodeAt(0);
	if (ord < ord_0) throw new ContentError('hex', 'unknown char', char);
	if (ord <= ord_9) return ord - ord_0;

	//Fold lower over upper
	ord &= 0x5f; //1011111 = ord('_');

	// A-Z = 65-90
	if (ord < ord_A || ord > ord_F)
		throw new ContentError('hex', 'unknown char', char);
	return ord - ord_A + 10;
}

/** @namespace */
export const hex = {
	/**
	 * Convert the 8LSB into two hex chars
	 * @param byte
	 * @returns
	 */
	fromByte: function (byte: number): string {
		return tbl[(byte >> 4) & 0xf] + tbl[byte & 0xf];
	},

	/**
	 * Convert 2 hex digits into a byte 0-255
	 * @param hex
	 * @throws ContentError - if there aren't exactly 2 chars, or either char isn't valid hex
	 * @returns
	 */
	toByte: function(hex: string): number {
		if (hex.length !== 2)
			throw new ContentError('hex', 'need pairs of (zero padded)', hex);
		return (mapCharToInt(hex[0]) << 4) | mapCharToInt(hex[1]);
	},

	/**
	 * Given a large int 0-32 bits, return the hex form, compress
	 * to the least number of pairs of hex bits required.
	 * @param u32
	 * @returns
	 */
	fromI32Compress: function(u32: number): string {
		//2 chars
		let ret = tbl[(u32 >> 4) & 0xf] + tbl[u32 & 0xf];
		if (u32 < 0x100) return ret;

		//4 chars
		ret = tbl[(u32 >> 12) & 0xf] + tbl[(u32 >> 8) & 0xf] + ret;
		if (u32 < 0x10000) return ret;

		//6 chars
		ret = tbl[(u32 >> 20) & 0xf] + tbl[(u32 >> 16) & 0xf] + ret;
		if (u32 < 0x1000000) return ret;

		return tbl[(u32 >>> 28) & 0xf] + tbl[(u32 >> 24) & 0xf] + ret;
	},

	fromI32: function(i32: number): string {
		return (
			tbl[(i32 >>> 28) & 0xf] +
			tbl[(i32 >> 24) & 0xf] +
			tbl[(i32 >> 20) & 0xf] +
			tbl[(i32 >> 16) & 0xf] +
			tbl[(i32 >> 12) & 0xf] +
			tbl[(i32 >> 8) & 0xf] +
			tbl[(i32 >> 4) & 0xf] +
			tbl[i32 & 0xf]
		);
	},

	fromBytes: function(
		bytes:
			| Uint8Array
			| Int8Array
			| IReadArray<Uint8Array>
			| IReadArray<Int8Array>
	): string {
		let ret = '';
		for (const byte of bytes) {
			//rfc4648 defines the table as using A-F, while JS uses a-f
			// it's case insensitive, but let's follow spec
			ret += tbl[byte >> 4] + tbl[byte & 0xf];
		}
		return ret;
	},

	fromU16s: function(
		u16s: Uint16Array | IReadArray<Uint16Array>,
		join = ''
	): string {
		let ret = '';
		for (const u of u16s) {
			ret +=
				tbl[(u >> 12) & 0xf] +
				tbl[(u >> 8) & 0xf] +
				tbl[(u >> 4) & 0xf] +
				tbl[u & 0xf] +
				join;
		}
		return ret;
	},

	fromU32s: function(
		u32s: Uint32Array | IReadArray<Uint32Array>,
		join = ''
	): string {
		let ret = '';
		for (const u of u32s) {
			ret +=
				tbl[(u >> 28) & 0xf] +
				tbl[(u >> 24) & 0xf] +
				tbl[(u >> 20) & 0xf] +
				tbl[(u >> 16) & 0xf] +
				tbl[(u >> 12) & 0xf] +
				tbl[(u >> 8) & 0xf] +
				tbl[(u >> 4) & 0xf] +
				tbl[u & 0xf] +
				join;
		}
		return ret;
	},

	fromU64: function(u64: U64): string {
		const b = u64.toBytesBE();
		return (
			tbl[b[0] >> 4] +
			tbl[b[0] & 0xf] +
			tbl[b[1] >> 4] +
			tbl[b[1] & 0xf] +
			tbl[b[2] >> 4] +
			tbl[b[2] & 0xf] +
			tbl[b[3] >> 4] +
			tbl[b[3] & 0xf] +
			tbl[b[4] >> 4] +
			tbl[b[4] & 0xf] +
			tbl[b[5] >> 4] +
			tbl[b[5] & 0xf] +
			tbl[b[6] >> 4] +
			tbl[b[6] & 0xf] +
			tbl[b[7] >> 4] +
			tbl[b[7] & 0xf]
		);
	},

	fromU64a: function(u64a: U64MutArray, join = ''): string {
		let ret = '';
		for (let i = 0; i < u64a.length; i++) {
			const b = u64a.at(i).toBytesBE();
			ret +=
				tbl[b[0] >> 4] +
				tbl[b[0] & 0xf] +
				tbl[b[1] >> 4] +
				tbl[b[1] & 0xf] +
				tbl[b[2] >> 4] +
				tbl[b[2] & 0xf] +
				tbl[b[3] >> 4] +
				tbl[b[3] & 0xf] +
				tbl[b[4] >> 4] +
				tbl[b[4] & 0xf] +
				tbl[b[5] >> 4] +
				tbl[b[5] & 0xf] +
				tbl[b[6] >> 4] +
				tbl[b[6] & 0xf] +
				tbl[b[7] >> 4] +
				tbl[b[7] & 0xf] +
				join;
		}
		return ret;
	},

	toBytes: function(hex: string, ignore?: string): Uint8Array {
		ignore = ignore ?? whitespace;
		const arr = new Uint8Array(Math.ceil(hex.length / 2));
		let carry = 0;
		let carrySize = 0;
		let arrPtr = 0;
		for (const char of hex) {
			if (ignore.indexOf(char) >= 0) continue;
			const idx = mapCharToInt(char);
			carry = (carry << 4) | idx;
			carrySize += 4;
			if (carrySize >= 8) {
				carrySize -= 8;
				arr[arrPtr++] = (carry >>> carrySize) & 0xff;
			}
		}
		if (carrySize === 4)
			throw new ContentError(
				'hex',
				'need pairs (zero padded) found extra',
				carry & 0xf
			);
		return arr.slice(0, arrPtr);
	},
}
