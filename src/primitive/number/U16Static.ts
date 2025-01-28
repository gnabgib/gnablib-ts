/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IWriter } from '../interfaces/IWriter.js';

export class U16 {
	static readonly size8 = 2;

	/**
	 * Treat i16 as a signed/unsigned 16bit number, and rotate left
	 * @param i16 uint16/int16, if larger than 16 bits it'll be truncated
	 * @param by amount to rotate 0-15 (%16 if oversized)
	 * @returns Left rotated number
	 */
	static lRot(i16: number, by: number): number {
		by &= 0xf;
		return ((i16 << by) | ((i16 & 0xffff) >>> (16 - by))) & 0xffff;
	}

	/**
	 * Treat i16 as a signed/unsigned 16bit number, and rotate right
	 * @param i16 uint16/int16, if larger than 16 bits it'll be truncated
	 * @param by amount to rotate 0-15 (%16 if oversized)
	 * @returns Right rotated number
	 */
	static rRot(i16: number, by: number): number {
		by &= 0xf;
		return (((i16 & 0xffff) >>> by) | (i16 << (16 - by))) & 0xffff;
	}

	/** Read 2 bytes from the array as a u16 little endian number */
	static fromBytesLE(src: Uint8Array, pos = 0): number {
		return src[pos] | (src[pos + 1] << 8);
	}

	/** Read 2 bytes from the array as a u16 big endian number */
	static fromBytesBE(src: Uint8Array, pos = 0): number {
		//When src is short, you need late-shifting (see U32Static.fromBytesBE comments)
		return (src[pos] << 8) | src[pos + 1];
	}

	/**
	 * Project `src` as a little-endian stream of bytes
	 * @throws If there's not enough space ({@link size8} bytes) in target
	 */
	static intoBytesLE(src: number, target: IWriter) {
		target.write(Uint8Array.of(src, src >> 8));
	}

	/**
	 * Project `src` as a big-endian stream of bytes
	 * @throws If there's not enough space ({@link size8} bytes) in target
	 */
	static intoBytesBE(src: number, target: IWriter) {
		target.write(Uint8Array.of(src >> 8, src));
	}

	//#region Constant time
	/**
	 * Compare two numbers for equality in constant time
	 * @param a16 uint16/int16, if larger than 16 bits it'll be truncated
	 * @param b16 uint16/int16, if larger than 16 bits it'll be truncated
	 * @returns
	 */
	static ctEq(a16: number, b16: number): boolean {
		return ((a16 ^ b16) & 0xffff) === 0;
	}

	/**
	 * ` a16 <= b16` in constant time
	 * **NOTE** Behaviour is undefined if params are int16 (because in 2s compliment negative numbers are > positive)
	 * @param a16 uint16, if larger than 16 bits it'll be truncated
	 * @param b16 uint16, if larger than 16 bits it'll be truncated
	 * @returns
	 */
	static ctLte(a16: number, b16: number): boolean {
		const l = ((a16 & 0xffff) - (b16 & 0xffff) - 1) >>> 31;
		return l === 1;
	}

	/**
	 * `a16 >= b16` in constant time
	 * **NOTE** Behaviour is undefined if params are int16 (because in 2s compliment negative numbers are > positive)
	 * @param a16 uint16, if larger than 16 bits it'll be truncated
	 * @param b16 uint16, if larger than 16 bits it'll be truncated
	 * @returns
	 */
	static ctGte(a16: number, b16: number): boolean {
		const l = ((b16 & 0xffff) - (a16 & 0xffff) - 1) >>> 31;
		return l === 1;
	}

	/**
	 * `a16 > b16` in constant time
	 * **NOTE** Behaviour is undefined if params are int16 (because in 2s compliment negative numbers are > positive)
	 * @param a16 uint16, if larger than 16 bits it'll be truncated
	 * @param b16 uint16, if larger than 16 bits it'll be truncated
	 * @returns
	 */
	static ctGt(a16: number, b16: number): boolean {
		const l = ((a16 & 0xffff) - (b16 & 0xffff) - 1) >>> 31;
		return l === 0;
	}

	/**
	 * `a16 < b16` in constant time
	 * **NOTE** Behaviour is undefined if params are int16 (because in 2s compliment negative numbers are > positive)
	 * @param a16 uint16, if larger than 16 bits it'll be truncated
	 * @param b16 uint16, if larger than 16 bits it'll be truncated
	 * @returns
	 */
	static ctLt(a16: number, b16: number): boolean {
		const l = ((b16 & 0xffff) - (a16 & 0xffff) - 1) >>> 31;
		return l === 0;
	}

	/**
	 * Constant time select returns `a16` if `first==true`, or `b16` if `first==false`
	 * Result may be negative (`>>>0` to fix)
	 * @param a16 uint16/int16, if larger than 16 bits it'll be truncated
	 * @param b16 uint16/int16, if larger than 16 bits it'll be truncated
	 * @param first
	 * @returns a16 or b16
	 */
	static ctSelect(a16: number, b16: number, first: boolean): number {
		// @ts-expect-error: We're casting bool->number on purpose
		const fNum = ((first | 0) - 1) & 0xffff; //-1 or 0
		return (~fNum & a16) | (fNum & b16);
	}
	//#endregion
}
