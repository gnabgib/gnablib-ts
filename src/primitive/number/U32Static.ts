/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { IWriter } from '../interfaces/IWriter.js';

export class U32 {
	static readonly size8 = 4;

	/**
	 * Treat i32 as a signed/unsigned 32bit number, and rotate left
	 * NOTE: JS will sign the result, (fix by `>>>0`)
	 * NOTE: If you're using with UInt32Array you don't need to worry about sign
	 * @param i32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param by amount to rotate 0-31 (%32 if oversized)
	 */
	static lRot(i32: number, by: number): number {
		//No need to truncate input (bitwise is only 32bit)
		by &= 0x1f;
		return (i32 << by) | (i32 >>> (32 - by));
	}

	/**
	 * Treat i32 as a signed/unsigned 32bit number, and rotate right
	 * NOTE: JS will sign the result, (fix by `>>>0`)
	 * NOTE: If you're using with UInt32Array you don't need to worry about sign
	 * @param i32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param by amount to rotate 0-31 (%32 if oversized)
	 */
	static rRot(i32: number, by: number): number {
		//No need to truncate input (bitwise is only 32bit)
		by &= 0x1f;
		return (i32 >>> by) | (i32 << (32 - by));
	}

	/**
	 * Read 4 bytes from the array as a u32 little endian number
	 * Result may be negative (`>>>0` to fix)
	 */
	static fromBytesLE(src: Uint8Array, pos = 0): number {
		return (
			src[pos] |
			(src[pos + 1] << 8) |
			(src[pos + 2] << 16) |
			(src[pos + 3] << 24)
		);
	}

	/**
	 * Read 4 bytes from the array as a u32 big endian number
	 * Result may be negative (`>>>0` to fix)
	 */
	static fromBytesBE(src: Uint8Array, pos = 0): number {
		return (
			src[pos + 3] |
			(src[pos + 2] << 8) |
			(src[pos + 1] << 16) |
			(src[pos] << 24)
		);
		// const rem = sizeBytes - (src.length - pos);
		// let ret =
		// 	(src[pos] << 24) |
		// 	(src[pos + 1] << 16) |
		// 	(src[pos + 2] << 8) |
		// 	src[pos + 3];
		// //If there's not enough space, downshift the result
		// // (sizeBytes+rem) turns the negative number into the amount of byte shifting to do
		// // <<3 turns the byte shift into bit shift (aka *8)
		// if (rem > 0) ret >>>= rem << 3;
		// return ret;
	}

	/**
	 * Project `src` as a little-endian stream of bytes
	 * @throws If there's not enough space in target
	 */
	static intoBytesLE(src: number, target: IWriter) {
		target.write(Uint8Array.of(src, src >>> 8, src >>> 16, src >>> 24));
	}

	/**
	 * Project `src` as a big-endian stream of bytes
	 * @throws If there's not enough space in target
	 */
	static intoBytesBE(src: number, target: IWriter) {
		target.write(Uint8Array.of(src >>> 24, src >>> 16, src >>> 8, src));
	}

	/**
	 * Whether two int32 values have the same sign (both negative, both positive)
	 * @param a32 int32, if larger than 32 bits it'll be truncated 0-2147483647
	 * @param b32 int32, if larger than 32 bits it'll be truncated 0-2147483647
	 */
	static sameSign(a32: number, b32: number): boolean {
		//The MSBit is 1 if it's negative, 0 if not.. so if both or neither are ^=0
		// If only one is, then ^=1.  Since MSbit=1 is <0 we can xor the two, and
		// see if it's positive to confirm they're the same sign
		return (a32 ^ b32) >= 0;
	}

	/**
	 * Get the average of two 32 bit numbers
	 * @param a32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32/int32, if larger than 32 bits it'll be truncated
	 */
	static average(a32: number, b32: number): number {
		//Either works
		return (a32 | b32) - ((a32 ^ b32) >>> 1);
		//return ((a32^b32)>>1) + (a32&b32)
	}

	//#region Constant time
	/**
	 * Compare two numbers for equality in constant time
	 * @param a32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @returns
	 */
	static ctEq(a32: number, b32: number): boolean {
		return (a32 ^ b32) === 0;
	}

	/**
	 * ` a32 <= b32` in constant time
	 * **NOTE** Behaviour is undefined if params are int32 (because in 2s compliment negative numbers are > positive)
	 * @param a32 uint32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32, if larger than 32 bits it'll be truncated
	 * @returns
	 */
	static ctLte(a32: number, b32: number): boolean {
		const l = ((a32 & 0xffff) - (b32 & 0xffff) - 1) >>> 31;
		const h = (((a32 >>> 16) & 0xffff) - ((b32 >>> 16) & 0xffff) - 1) >>> 31;
		return (l & h) === 1;
	}

	/**
	 * `a32 >= b32` in constant time
	 * **NOTE** Behaviour is undefined if params are int32 (because in 2s compliment negative numbers are > positive)
	 * @param a32 uint32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32, if larger than 32 bits it'll be truncated
	 * @returns
	 */
	static ctGte(a32: number, b32: number): boolean {
		const l = ((b32 & 0xffff) - (a32 & 0xffff) - 1) >>> 31;
		const h = (((b32 >>> 16) & 0xffff) - ((a32 >>> 16) & 0xffff) - 1) >>> 31;
		return (l & h) === 1;
	}

	/**
	 * `a32 > b32` in constant time
	 * **NOTE** Behaviour is undefined if params are int32 (because in 2s compliment negative numbers are > positive)
	 * @param a32 uint32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32, if larger than 32 bits it'll be truncated
	 * @returns
	 */
	static ctGt(a32: number, b32: number): boolean {
		const l = ((a32 & 0xffff) - (b32 & 0xffff) - 1) >>> 31;
		const h = (((a32 >>> 16) & 0xffff) - ((b32 >>> 16) & 0xffff) - 1) >>> 31;
		return (l & h) === 0;
	}

	/**
	 * `a32 < b32` in constant time
	 * **NOTE** Behaviour is undefined if params are int32 (because in 2s compliment negative numbers are > positive)
	 * @param a32 uint32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32, if larger than 32 bits it'll be truncated
	 * @returns
	 */
	static ctLt(a32: number, b32: number): boolean {
		const l = ((b32 & 0xffff) - (a32 & 0xffff) - 1) >>> 31;
		const h = (((b32 >>> 16) & 0xffff) - ((a32 >>> 16) & 0xffff) - 1) >>> 31;
		return (l & h) === 0;
	}

	/**
	 * Constant time select returns a32 if first==true, or b32 if first==false
	 * Result may be negative (`>>>0` to fix)
	 * @param a32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param first
	 * @returns a32 or b32
	 */
	static ctSelect(a32: number, b32: number, first: boolean): number {
		// @ts-expect-error: We're casting bool->number on purpose
		const fNum = (first | 0) - 1; //-1 or 0
		return (~fNum & a32) | (fNum & b32);
	}
	//#endregion
}
