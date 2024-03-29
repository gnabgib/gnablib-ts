/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { sLen } from '../safe/safe.js';

const mask = [0xff, 0x7f, 0x3f, 0x1f, 0xf, 0x7, 0x3, 0x1];

export class BitReader {
	private _buff: Uint8Array;
	private _bitPtr = 0;

	/** Note meddling with the buffer from outside will cause unpredictable results */
	constructor(buffer: Uint8Array | ArrayBuffer) {
		if (buffer instanceof Uint8Array) {
			this._buff = buffer;
		} else {
			this._buff = new Uint8Array(buffer);
		}
	}

	/** Position in the current byte */
	get bitPos(): number {
		return this._bitPtr & 7; //msb=0
	}

	/** Number of bits read */
	get bitCount(): number {
		return this._bitPtr;
	}

	/** Number of bytes read */
	get byteCount(): number {
		//For any bitPos other than 0, bitPtr+7 will go to the next byte (po' man's Math.ceil)
		return (this._bitPtr + 7) >>> 3;
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
		const byteCountNeeded = (this._bitPtr + bitCount + 7) >>> 3;
		sLen('(internal)buffer', this._buff).atLeast(byteCountNeeded).throwNot();

		let byteBitSpace = 8 - this.bitPos;
		let ptr = this._bitPtr >>> 3;
		//Unaligned read
		if (bitCount <= byteBitSpace) {
			const ret =
				(this._buff[ptr] & mask[this.bitPos]) >>> (byteBitSpace - bitCount);
			this._bitPtr += bitCount;
			return ret;
		}
		let value = 0;
		while (bitCount > 0) {
			let newValue = this._buff[ptr] & mask[this.bitPos];
			let bitsToRead = byteBitSpace;
			if (bitCount < byteBitSpace) {
				newValue >>>= byteBitSpace - bitCount;
				bitsToRead = bitCount;
			}
			value = (value << bitsToRead) | newValue;
			ptr++;
			this._bitPtr += bitsToRead;
			byteBitSpace = 8;
			bitCount -= bitsToRead;
		}
		return value;
	}
}
