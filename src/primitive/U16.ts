/*! Copyright 2023 gnabgib MPL-2.0 */

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

    static toBytesLE(src:number):Uint8Array {
        return Uint8Array.of(src,src>>8);
    }

    static toBytesBE(src:number):Uint8Array {
        return Uint8Array.of(src>>8,src);
    }
}
