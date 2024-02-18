/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { somewhatSafe as safe } from "../safe/index.js";

const mask=[0xFF,0x7f,0x3f,0x1f,0xf,0x7,0x3,0x1];

export class BitReader {
	#buff: Uint8Array;
	#bitPtr = 0;

	/** Note meddling with the buffer from outside will cause unpredictable results */
	constructor(buffer: Uint8Array | ArrayBuffer) {
		if (buffer instanceof Uint8Array) {
			this.#buff = buffer;
		} else {
			this.#buff = new Uint8Array(buffer);
		}
	}

	/** Position in the current byte */
	get bitPos(): number {
		return this.#bitPtr & 7; //msb=0
	}

	/** Number of bits read */
	get bitCount(): number {
		return this.#bitPtr;
	}

	/** Number of bytes read */
	get byteCount(): number {
		//For any bitPos other than 0, bitPtr+7 will go to the next byte (po' man's Math.ceil)
		return (this.#bitPtr + 7) >>> 3;
	}

	/**
	 * Read up to 32 bits of int/uint
	 * - Can read u32/i32, u16/i16, u8/i8 (byte), even a bit
	 *
	 * Why 32? Because JS bit logic maxes out at 32 bits
	 * @param bitCount Number of bits to read into value 1-32
	 */
	readNumber(bitCount: number): number {
		//Make sure there's data in the buffer
		const byteCountNeeded = (this.#bitPtr + bitCount + 7) >>> 3;
		safe.len.atLeast('(internal)buffer',this.#buff, byteCountNeeded);

		let byteBitSpace = 8 - this.bitPos;
		let ptr = this.#bitPtr >>> 3;
		//Unaligned read
		if (bitCount <= byteBitSpace) {
			const ret = (this.#buff[ptr] & mask[this.bitPos]) >>> (byteBitSpace - bitCount);
			this.#bitPtr += bitCount;
			return ret;
		}
		let value=0;
		while (bitCount>0) {
			let newValue = (this.#buff[ptr] & mask[this.bitPos]);
			let bitsToRead = byteBitSpace;
			if (bitCount < byteBitSpace) {
				newValue >>>= (byteBitSpace - bitCount);
				bitsToRead = bitCount;
			}
			value = (value << bitsToRead) | newValue;
			ptr++;
			this.#bitPtr+=bitsToRead;
			byteBitSpace=8;
			bitCount-=bitsToRead;
		}
		return value;
	}
}
