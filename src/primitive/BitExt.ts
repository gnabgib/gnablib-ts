/*! Copyright 2023 gnabgib MPL-2.0 */

import * as intExt from './IntExt.js';

export const bitsPerByte = 8;
export const size16Bytes = 2;
export const i16SizeBits = size16Bytes * bitsPerByte;
export const size32Bytes = 4;
export const i32SizeBits = size32Bytes * bitsPerByte;
export const size64Bytes = 8;
export const i64SizeBits = size64Bytes * bitsPerByte;

/**
 * Compose a least significant mask off @see bitCount width
 * @param bitCount With of mask
 * @returns Mask
 */
export function lsbs(bitCount: number): number {
	// (1<<bitCount)-1 works for 0-31 bit masks
	//   - JS 32bit limit means 1<<32(=1)-1(=0) isn't the correct mask
	// ((1<<bitCount-1)-1)*2|1 works for 1-32 bit masks
	//   - since the caller asking for a pointless 0 mask, it's behind
	//      an if statement.. hopefully the branch predictor favours the other
	return bitCount > 0 ? ((((1 << (bitCount - 1)) - 1) * 2) | 1) >>> 0 : 0;
}

/**
 * Counter the number of binary 1s in a number (1==a multiple of 2)
 * count1Bits(2)=1
 * count1Bits(3)=2
 * count1Bits(0xf)=4
 * @param value
 */
export function count1Bits(value: number): number {
	value -= (value >>> 1) & 0x55555555;
	value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
	value = (value + (value >>> 4)) & 0x0f0f0f0f;
	value += value >>> 8;
	value += value >>> 16;
	return value & 0x3f;
	// Naive form:
	// let count=0;
	// while(value) {
	//     value&=(value-1);
	//     count++;
	// }
	// return count;
}

/**
 * Rotate the 32 bit int left $by bits, bits that exit stage left join on the right
 * @param i32 32 bit number, can be signed or unsigned (note rot may change)
 * @param by 0-32 integer
 * @throws EnforceTypeError $by not an int
 * @throws OutOfRangeError $by <0 or >32
 * @returns
 */
export function rotLeft32(i32: number, by: number): number {
	intExt.inRangeInclusive(by, 0, i32SizeBits);
	return (i32 << by) | (i32 >>> (i32SizeBits - by));
	// Fails: << can make it negative too: return (i32<<by)|(i32>>>(32-by));
}

export function rotRight32(i32: number, by: number): number {
	intExt.inRangeInclusive(by, 0, i32SizeBits);
	return (i32 >>> by) | (i32 << (i32SizeBits - by));
}

/**
 * Rotate the 16 bit int left $by bits, bits that exit stage left join on the right
 * @param i16 16 bit number, can be signed or unsigned (note rot may change)
 * @param by 0-16 integer
 * @throws EnforceTypeError $by not an int
 * @throws OutOfRangeError $by <0 or >16
 * @returns
 */
export function rotLeft16(i16: number, by: number): number {
	intExt.inRangeInclusive(by, 0, i16SizeBits);
	return ((i16 << by) | (i16 >> (i16SizeBits - by))) & 0xffff;
}

export function rotRight16(i16: number, by: number): number {
	intExt.inRangeInclusive(by, 0, i16SizeBits);
	return (i16 >> by) | ((i16 << (i16SizeBits - by)) & 0xffff);
}

// export function rotLeft(bytes:Uint8Array,by:number):Uint8Array {
//     const max=bytes.length*bitsPerByte;
//     bits.inRangeInclusive(by,0,max);
//     const ret=new Uint8Array(bytes.length);
//     return ret;
// }

/**
 * Accumulate data (will overflow if inSize>16, or outSize>16)
 * JS only makes 32 bits available for bit logic
 */
export class Carrier {
	private _size = 0;
	private _value = 0;
	readonly inSize: number;
	readonly outSize: number;
	private _inMask: number;
	private _outMask: number;

	/**
	 * Build a new carrier
	 * @param inSize Size of bits to accept (will be masked to stop overflow)
	 * @param outSize Size of bits to output
	 */
	constructor(inSize: number, outSize: number) {
		this.inSize = inSize;
		this.outSize = outSize;
		this._inMask = lsbs(inSize);
		this._outMask = lsbs(outSize);
	}

	/**
	 * How many bits are stored within
	 */
	get size(): number {
		return this._size;
	}

	/**
	 * Whether there is nothing stored within (size==0)
	 */
	get empty(): boolean {
		return this._size <= 0;
	}

	/**
	 * Whether there are enough stored bits that dequeue is possible
	 */
	get canDequeue(): boolean {
		return this._size >= this.outSize;
	}

	/**
	 * Add the given @see data to the queue
	 * @param data Data to add (will be masked to stop overflow)
	 */
	enqueue(data: number): void {
		this._size += this.inSize;
		this._value = (this._value << this.inSize) | (data & this._inMask);
	}

	/**
	 * Remove one output value from the queue, always check @see canDequeue
	 * first, if there isn't enough data this will return non-existent data
	 * @returns A number of @see outSize bits
	 */
	dequeue(): number {
		const ret = this.peek();
		this._size -= this.outSize;
		return ret;
	}

	/**
	 * Return an output value if there's enough data, otherwise the remaining
	 * bits in MSB
	 * @returns
	 */
	peek(): number {
		if (this._size >= this.outSize) {
			return (this._value >>> (this._size - this.outSize)) & this._outMask;
		} else {
			return (this._value << (this.outSize - this._size)) & this._outMask;
		}
	}
}
