/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from "../safe/index.js";

const mask=[0xFF,0x7f,0x3f,0x1f,0xf,0x7,0x3,0x1];

export class BitWriter {
	#buff: Uint8Array;
	#bitCount = 0; //msb=0

	constructor(bufferLength: number) {
		this.#buff = new Uint8Array(bufferLength);
	}

	/** Position in the current byte */
	get bitPos(): number {
		return this.#bitCount & 7; //msb=0
	}

	/** Number of bits stored */
	get bitCount(): number {
		return this.#bitCount;
	}

	/** Number of bytes used for storage */
	get byteCount(): number {
		//For any bitPos other than 0, bitCount+7 will go to the next byte (po' man's Math.ceil)
		return (this.#bitCount + 7) >>> 3;
	}

	/**
	 * Write up to 32 bits of int/uint
	 * - Can write u32/i32, u16/i16, u8/i8, even a bit
	 *
	 * Why max 32? Because JS bit logic maxes out at 32 bits
	 * @param value i32/u32, note value will be truncated to 32 bits
	 * @param bitCount Number of bits to write 1-32
	 */
	writeNumber(value: number, bitCount: number): void {
		safe.int.is(value);
		safe.int.inRangeInc(bitCount, 1, 32);

		//for a bitPos offset of anything but 0, we need one extra byte
		// 0 + 2 + 7 /8 = 1 	0 + 8 + 7 /8 = 1
		// 2 + 6 + 7 /8 = 1	 	0 + 9 + 7 /8 = 2
		//console.log(`t.bc=${this.#bitCount} bc=${bitCount}`);
		const byteCountNeed = (this.#bitCount + bitCount + 7) >>> 3;
		safe.lengthAtLeast('(internal)buffer',this.#buff, byteCountNeed);

		let ptr=this.#bitCount>>>3;
		let byteBitSpace=8-this.bitPos;
		if (bitCount <= byteBitSpace) {
			//It'll all fit in the current byte
			const shift=byteBitSpace - bitCount;
			const shiftValue = value << shift;
			const shiftMask=mask[this.bitPos];
			this.#buff[ptr] |= (shiftMask & shiftValue);
			//console.log(`bbs=${byteBitSpace} sl=${shift}, sv=${shiftValue} sm=${shiftMask} p=${ptr} ${this.#buff}`);
			this.#bitCount+=bitCount;
			return;
		} 
		while (bitCount>0) {
			const bitsToWrite=bitCount > byteBitSpace ? byteBitSpace: bitCount;
			const shift=bitCount - byteBitSpace;
			const shiftValue = shift > 0 ? value >>> shift : value << (-shift);
			const shiftMask = mask[this.bitPos];
			this.#buff[ptr++] |= (shiftMask & shiftValue);
			//console.log(`bbs=${byteBitSpace} sr=${shift} sv=${shiftValue} sm=${shiftMask} p=${ptr} ${this.#buff}`);
			this.#bitCount+=bitsToWrite;
			bitCount-=bitsToWrite;
			byteBitSpace=8;
		}
	}

	/** Get a copy of the current encoded data */
	getBytes():Uint8Array {
		return this.#buff.slice(0,this.byteCount);
	}
}

