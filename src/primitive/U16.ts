/*! Copyright 2023 the gnablib contributors MPL-1.1 */

const sizeBytes = 2;
const sizeBits = 16;
const i16Mask = 0xffff;
const rotMask = 0xf;

export class U16 {
	static get max(): number {
		return i16Mask;
	}
	static get min(): number {
		return 0;
	}
	static get zero(): number {
		return 0;
	}

	/**
	 * Treat i16 as a signed/unsigned 16bit number, and rotate left
	 * @param i16 uint16/int16, if larger than 16 bits it'll be truncated
	 * @param by amount to rotate 0-15 (%16 if oversized)
	 * @returns Left rotated number
	 */
	static rol(i16: number, by: number): number {
		i16 &= i16Mask;
		by &= rotMask;
		return ((i16 << by) | (i16 >>> (sizeBits - by))) & i16Mask;
	}

	/**
	 * Treat i16 as a signed/unsigned 16bit number, and rotate right
	 * @param i16 uint16/int16, if larger than 16 bits it'll be truncated
	 * @param by amount to rotate 0-15 (%16 if oversized)
	 * @returns Right rotated number
	 */
	static ror(i16: number, by: number): number {
		i16 &= i16Mask;
		by &= rotMask;
		return ((i16 >>> by) | (i16 << (sizeBits - by))) & i16Mask;
	}

	//mul is handled by JS natively

	/**
	 * Compare two numbers for equality in constant time
	 * @param a16 uint16/int16, if larger than 16 bits it'll be truncated
	 * @param b16 uint16/int16, if larger than 16 bits it'll be truncated
	 * @returns
	 */
	static ctEq(a16: number, b16: number): boolean {
		a16 &= i16Mask;
		b16 &= i16Mask;
		return (a16 ^ b16) === 0;
	}

	/**
	 * ` a16 <= b16` in constant time
	 * **NOTE** Behaviour is undefined if params are int16 (because in 2s compliment negative numbers are > positive)
	 * @param a16 uint16, if larger than 16 bits it'll be truncated
	 * @param b16 uint16, if larger than 16 bits it'll be truncated
	 * @returns
	 */
	static ctLte(a16: number, b16: number): boolean {
		const l = ((a16 & i16Mask) - (b16 & i16Mask) - 1) >>> 31;
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
		const l = ((b16 & i16Mask) - (a16 & i16Mask) - 1) >>> 31;
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
		const l = ((a16 & i16Mask) - (b16 & i16Mask) - 1) >>> 31;
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
		const l = ((b16 & i16Mask) - (a16 & i16Mask) - 1) >>> 31;
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
		const fNum = (first | 0) - 1; //-1 or 0
		return ((~fNum & a16) | (fNum & b16)) & i16Mask;
	}

	/**
	 * Convert 0-2 bytes from @param src starting at @param pos into a u16/i16 in little endian order (smallest byte first)
	 * Zeros will be appended if src is short (ie 0xff will be considered 256)
	 * @param src
	 * @param pos
	 * @returns
	 */
	static iFromBytesLE(src: Uint8Array, pos = 0): number {
		return src[pos] | (src[pos + 1] << 8);
	}

	/**
	 * Convert 0-2 bytes from @param src starting at @param pos into a u16/i16 in big endian order (smallest byte last)
	 * Zeros will be prepended if src is short (ie 0xff will be considered 256)
	 * @param src
	 * @param pos
	 * @returns
	 */
	static iFromBytesBE(src: Uint8Array, pos = 0): number {
		const rem = src.length - pos - sizeBytes;
		let ret = (src[pos] << 8) | src[pos + 1];
		//If there's not enough space, downshift the result
		// (sizeBytes+rem) turns the negative number into the amount of byte shifting to do
		// <<3 turns the byte shift into bit shift (aka *8)
		if (rem < 0) ret >>>= (sizeBytes + rem) << 3;
		return ret;
	}

	static toBytesLE(src: number): Uint8Array {
		return Uint8Array.of(src, src >> 8);
	}

	static toBytesBE(src: number): Uint8Array {
		return Uint8Array.of(src >> 8, src);
	}
}
