/*! Copyright 2023 gnabgib MPL-2.0 */

import { safety } from './Safety.js';
import { hex } from '../encoding/Hex.js';
import {
	EnforceTypeError,
	NegativeError,
	NotSupportedError,
} from './ErrorExt.js';

const maxU32 = 0xffffffff;
const maxU32Plus1 = 0x100000000;
const mask5Bits = 0x1f;
const mask16Bits = 0xffff;

export type Uint64ish = Uint64|number;
/**
 * A 64 bit int/uint
 */
export class Uint64 {
	readonly highU32: number;
	readonly lowU32: number;

	constructor(lowU32: number, highU32 = 0) {
		//intExt.inRangeInclusive(lowU32, 0, maxU32);
		//intExt.inRangeInclusive(highU32, 0, maxU32);
		this.highU32 = highU32 >>> 0;
		this.lowU32 = lowU32 >>> 0;
	}

	/**
	 * Per bit, set it to 1 if either are set, zero if both or neither are set
	 * @param num
	 * @returns this^num
	 */
	xor(num: Uint64): Uint64 {
		safety.notNull(num, 'xor(num)');
		return new Uint64(
			(this.lowU32 ^ num.lowU32) >>> 0,
			(this.highU32 ^ num.highU32) >>> 0
		);
	}

	/**
	 * Per bit, set it to 1 if either are set, otherwise zero
	 * @param num
	 * @returns this|num
	 */
	or(num: Uint64): Uint64 {
		safety.notNull(num, 'or(num)');
		return new Uint64(
			(this.lowU32 | num.lowU32) >>> 0,
			(this.highU32 | num.highU32) >>> 0
		);
	}

	/**
	 * Per bit, keep at 1 if both are set, otherwise zero
	 * @param num
	 * @returns this&num
	 */
	and(num: Uint64): Uint64 {
		safety.notNull(num, 'and(num)');
		return new Uint64(
			(this.lowU32 & num.lowU32) >>> 0,
			(this.highU32 & num.highU32) >>> 0
		);
	}

	/**
	 * Invert each bit (0 becomes 1, 1 becomes 0)
	 * @returns ~this
	 */
	not(): Uint64 {
		return new Uint64(~this.lowU32 >>> 0, ~this.highU32 >>> 0);
	}

	private lShiftOut(by: number): number[] {
		//Alright, so there's effort to avoid branching (and therefore branch-stalls)
		// in this code.. which makes it slightly trickier to follow.  Effectively
		// instead of picking the calc to make based on @see by size (branching)
		// we calculate all calcs and zero the ones that are out of scope.

		//JS will only let us shift %32.. so n<<32=n<<0, and n<<33=n<<1
		//This is effectively how JS will treat @see by untouched
		const by32 = by & mask5Bits; //aka mod 32
		const byPos = by >> 5; //aka divide by 32
		const invBy32 = (32 - by32) | 0; //Inverse (for the second shift)

		//  Lookup: 0->0, 1..64->1
		// We can achieve this with 1-(((by-1)>>31)&1)
		// NOTE: Because 64 is far less than 2^32 we don't need to worry about other
		//  values also having 2^31 set
		//      0: 1-(((0-1)>>31)&1) = 1-(1&1) = 0
		//      1: 1-(((1-1)>>31)&1) = 1-(0&1) = 1
		//      2: 1-(((2-1)>>31)&1) = 1-(0&1) = 0
		//      64:1-(((64-1)>>31)&1) = 1-(0&1)= 0
		const by32Not0 = (1 - (((by32 - 1) >> 31) & 1)) | 0;

		//  Lookup: 0->1, 1->0, 2->0
		// We can achieve this with (2-byPos)>>1
		//      0:(2-0)>>1=1
		//      1:(2-1)>>1=0
		//      2:(2-2)>>1=0
		const byPosEq0 = (2 - byPos) >> 1;

		//  Lookup: 0->0, 1->1, 2->0
		// We can achieve this with byPos&1 (the only odd value)
		//      0: 0&1 = 0
		//      1: 1&1 = 1
		//      2: 2&1 = 0
		const byPosEq1 = byPos & 1;

		//  Lookup: 0->0, 1->0, 2->1
		// We can achieve this with (byPos>>1)&1
		// NOTE: We don't need sign-aware shift (or: it doesn't matter)
		//  since by should not be negative (this is actually enforced in the outward
		//  facing methods @see lShift, @see lRot, @see rShift, @see rRot)
		//      0: (0>>1)&1 = 0&1 = 0
		//      1: (1>>1)&1 = 0&1 = 0
		//      2: (2>>1)&1 = 1&1 = 1
		const byPosEq2 = (byPos >> 1) & 1;

		return [
			(byPosEq2 * this.highU32) |
				(byPosEq1 * by32Not0 * (this.highU32 >>> invBy32)),
			(byPosEq2 * this.lowU32) |
				(byPosEq1 *
					((this.highU32 << by32) | (by32Not0 * (this.lowU32 >>> invBy32)))) |
				(byPosEq0 * by32Not0 * (this.highU32 >>> invBy32)),
			(byPosEq1 * (this.lowU32 << by32)) |
				(byPosEq0 *
					((this.highU32 << by32) | (by32Not0 * (this.lowU32 >>> invBy32)))),
			byPosEq0 * (this.lowU32 << by32),
		];
	}

	/**
	 * Shift bits left by @see by places zeros are brought in
	 * (Same as <<)
	 * @param by number 0-64
	 * @returns shifted value
	 */
	lShift(by: number): Uint64 {
		safety.intInRangeInc(by,0,64,'by');
		const o = this.lShiftOut(by);
		return new Uint64(o[3] >>> 0, o[2] >>> 0);
	}

	/**
	 * Rotate bits left by @see by places, bringing the outgoing bits in on the right
	 * @param by number 0-64
	 * @returns rotated value
	 */
	lRot(by: number): Uint64 {
		safety.intInRangeInc(by,0,64,'by');
		const o = this.lShiftOut(by);
		return new Uint64((o[3] | o[1]) >>> 0, (o[2] | o[0]) >>> 0);
	}

	/**
	 * Shift bits right by @see by places, zeros are brought in (sign unaware)
	 * @param by number 0-64
	 * @returns shifted value
	 */
	rShift(by: number): Uint64 {
		safety.intInRangeInc(by,0,64,'by');
		//Shifting right can be emulated by using the shift-out registers of
		// a left shift.  eg. In <<1 the outgoing register has 1 bit in it,
		// the same result as >>>63
		const o = this.lShiftOut(64 - by);
		return new Uint64(o[1] >>> 0, o[0] >>> 0);
	}

	/**
	 * Rotate bits right be @see by places, bringing the outgoing bits in on the left
	 * @param by number 0-64
	 * @returns rotated value
	 */
	rRot(by: number): Uint64 {
		safety.intInRangeInc(by,0,64,'by');
		const o = this.lShiftOut(64 - by);
		return new Uint64((o[3] | o[1]) >>> 0, (o[2] | o[0]) >>> 0);
	}

	private addUnsafe(num: Uint64): Uint64 {
		const low = this.lowU32 + num.lowU32;
		const carry = (low / maxU32Plus1) | 0; //This will always be zero or 1
		//NOTE: high can overflow (but that's ok)
		const high = this.highU32 + num.highU32 + carry;

		//No need to mask to 32bits, since bit operations implicitly do that (and we
		// need unsigned shift to correct sign)
		return new Uint64(low >>> 0, high >>> 0);
	}

	/**
	 * Add @see num to value mod 2^64 (overflows discarded)
	 * NOTE: Won't mutate internal value
	 * @param num
	 * @returns new value
	 */
	add(num: Uint64): Uint64 {
		safety.notNull(num, 'add(num)');
		return this.addUnsafe(num);
	}

	/**
	 * Add @param num to value mod 2^64 (overflows discarded)
	 * NOTE: Won't mutate internal value
	 * @param num
	 * @returns new value
	 */
	addNumber(num: number): Uint64 {
		return this.addUnsafe(Uint64.fromNumber(num));
	}

	mul(num: Uint64): Uint64 {
		//Long multiplication!
		// FFFF*FFFF (biggest possible uint16s) = FFFE0001
		// FFFFFFFF*FFFFFFFF (biggest possible uint32s) = FFFFFFFE00000001
		const this0 = this.lowU32 & mask16Bits;
		const this1 = this.lowU32 >>> 16;
		const this2 = this.highU32 & mask16Bits;
		const this3 = this.highU32 >>> 16;
		const num0 = num.lowU32 & mask16Bits;
		const num1 = num.lowU32 >>> 16;
		const num2 = num.highU32 & mask16Bits;
		const num3 = num.highU32 >>> 16;

		const m0 = this0 * num0;
		const c0 = m0 >>> 16;
		const m1 = this0 * num1 + this1 * num0 + c0;
		const c1 = (m1 / 0x10000) | 0; //Can be >32bits
		const m2 = this0 * num2 + this1 * num1 + this2 * num0 + c1;
		const c2 = (m2 / 0x10000) | 0; //Can be >32bits
		const m3 = this0 * num3 + this1 * num2 + this2 * num1 + this3 * num0 + c2; //(m2>>>16);
		//Note there are 3 more stages if we had space)
		const l = (m0 & mask16Bits) | ((m1 & mask16Bits) << 16);
		const h = (m2 & mask16Bits) | ((m3 & mask16Bits) << 16);
		return new Uint64(l >>> 0, h >>> 0);
	}

	/**
	 * Whether @see other has the same value as this
	 * NOTE: Not suitable for constant-time comparison
	 * @param other
	 * @returns boolean
	 */
	equals(other: Uint64): boolean {
		safety.notNull(other, 'equals(other)');
		return this.lowU32 == other.lowU32 && this.highU32 == other.highU32;
	}

	/**
	 * Whether this is > @param other
	 * @param {Uint64} other
	 * @returns {boolean}
	 */
	gt(other: Uint64): boolean {
		//Compare high
		if (this.highU32 > other.highU32) return true;
		if (this.highU32 < other.highU32) return false;
		//Only need to compare low if high match
		return this.lowU32 > other.lowU32;
	}

	/**
	 * Whether this < @param other
	 * @param other
	 * @returns
	 */
	lt(other: Uint64): boolean {
		// this<other is the same as other>this
		return other.gt(this);
	}

	/**
	 * Whether this >= @param other
	 * @param other
	 * @returns
	 */
	gte(other: Uint64): boolean {
		// this>=other is the same as !other<this
		return !this.lt(other);
	}

	/**
	 * Whether this <= @param other
	 * @param other
	 * @returns
	 */
	lte(other: Uint64): boolean {
		//this<=other is the same as !this>other
		return !this.gt(other);
	}

	/**
	 * Value as a stream of bytes (big-endian order)
	 * @returns Uint8Array[8]
	 */
	toBytes(): Uint8Array {
		const ret = new Uint8Array(8);
		ret[0] = this.highU32 >> 24;
		ret[1] = this.highU32 >> 16;
		ret[2] = this.highU32 >> 8;
		ret[3] = this.highU32;
		ret[4] = this.lowU32 >> 24;
		ret[5] = this.lowU32 >> 16;
		ret[6] = this.lowU32 >> 8;
		ret[7] = this.lowU32;
		return ret;
	}

	/**
	 * Output a 0-64 bit unsigned number a a 1-8 byte array
	 */
	toMinBytes(): Uint8Array {
		const ret = this.toBytes();
		let ptr = 0;
		const maxEat = 7; //We always want at least 1 byte (so only eat up to 7)
		while (ptr < maxEat && ret[ptr] === 0) ptr++;
		return ret.slice(ptr);
	}

	// toScaleBytes(): Uint8Array {
	// 	//todo (IntExt.uintToScaleBytes)
	// }

	toBigInt(): bigint {
		throw new NotSupportedError();
	}

	toString(): string {
		return 'u64{' + hex.fromBytes(this.toBytes()) + '}';
	}

	toSafeInt(): number | undefined {
		if (this.gt(Uint64.maxSafe)) return undefined;
		return this.highU32 * maxU32 + this.lowU32;
	}

	/**
	 * Build from an integer value
	 * @param number
	 * @returns
	 */
	static fromNumber(number: number): Uint64 {
		if (number < 0) throw new NegativeError('number', number);
		if (!Number.isInteger(number))
			throw new EnforceTypeError('Integer', number);
		//Mask the low 32 bits (also stops it being floating point)
		const low = number & maxU32;
		const high = Math.floor(number / maxU32Plus1);
		//We need to calculate the high part if the mask did something
		//const high = number > low ? (number / maxU32Plus1) | 0 : 0;
		return new Uint64(low, high);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static fromBigInt(num: bigint): Uint64 {
		throw new NotSupportedError();
	}

	/**
	 * Output a 64 bit unsigned number from @param sourceBytes at position @param sourcePos
	 * Requires 8 bytes (big-endian order)
	 * @param sourceBytes Source data
	 * @param sourcePos Starting position in @param sourceBytes
	 * @throws {NotInRangeError} if there's not enough data in @param sourceBytes
	 * @returns
	 */
	static fromBytes(sourceBytes: Uint8Array, sourcePos = 0): Uint64 {
		const end = sourcePos + 8;
		safety.numInRangeInc(end,0,sourceBytes.length,'end');
		const high =
			((sourceBytes[sourcePos++] << 24) |
				(sourceBytes[sourcePos++] << 16) |
				(sourceBytes[sourcePos++] << 8) |
				sourceBytes[sourcePos++]) >>>
			0;
		const low =
			((sourceBytes[sourcePos++] << 24) |
				(sourceBytes[sourcePos++] << 16) |
				(sourceBytes[sourcePos++] << 8) |
				sourceBytes[sourcePos++]) >>>
			0;
		return new Uint64(low, high);
	}

	static fromMinBytes(sourceBytes: Uint8Array, sourcePos = 0, len = 8): Uint64 {
		safety.intInRangeInc(len,0,8,'len');
		const end = sourcePos + len;
		safety.numInRangeInc(end,0,sourceBytes.length,'end');

		const padded = new Uint8Array(8);
		const minInsertPoint = 8 - len;
		padded.set(sourceBytes.slice(sourcePos, end), minInsertPoint);
		return this.fromBytes(padded);
	}

	static get max(): Uint64 {
		return new Uint64(maxU32, maxU32);
	}

	static get min(): Uint64 {
		return zero;
	}

	static get zero(): Uint64 {
		return zero;
	}

	/**
	 * Number.MAX_SAFE_INTEGER in Uint64 form
	 * 2^53 - 1 = 9007199254740991
	 */
	static get maxSafe(): Uint64 {
		//Number.MAX_SAFE_INT - it's arguable whether this is 2^53 (FP) or 2^53-1 (JS)
		//9007199254740991
		return new Uint64(maxU32, 0x1fffff);
	}

	/**
	 * Coerce a Uint64 or number into a Uint64 if it isn't already
	 * @param value 
	 * @returns 
	 */
	static coerce(value:Uint64ish):Uint64 {
		if (value instanceof Uint64) {
			return value;
		} else {
			return this.fromNumber(value);
		}
	}

	//minSafe cannot be represented in unsigned int
}
const zero=new Uint64(0,0);


//Uint64.MAX=new Uint64(maxU32,maxU32);
