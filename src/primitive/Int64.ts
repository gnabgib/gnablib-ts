import * as intExt from '../primitive/IntExt.js';
import * as objExt from '../primitive/ObjExt.js';
import * as hex from '../encoding/Hex.js';
import { EnforceTypeError, NotSupported, SizeError } from './ErrorExt.js';

const maxU32 = 0xffffffff;
//const maxI32 = 2147483647; // 0x7fffffff
const minI32 = -2147483648; //0x80000000
const maxU32Plus1 = 0x100000000; //4294967296
const negInd = 0x80000000;
const mask5Bits = 0x1f;
//const mask16Bits = 0xffff;

export class Int64 {
	readonly highU32: number;
	readonly lowU32: number;

	constructor(lowI32: number, highI32: number) {
		//You'd expect the range to be ~ -2M - 2M (int32 range) BUT
		// when using hex for numbers (which we frequently do for readability)
		// JS considers them unsigned, so 0xFFFFFFFF isn't -1, it's +4M so..
		//We allow between ~ -2M and +4M (even though you should choose one or the other range)
		intExt.inRangeInclusive(lowI32, minI32, maxU32);
		intExt.inRangeInclusive(lowI32, minI32, maxU32);
		this.highU32 = highI32 >>> 0;
		this.lowU32 = lowI32 >>> 0;
	}

	get negative(): boolean {
		return (this.highU32 & negInd) >>> 31 === 1;
	}

	abs(): Int64 {
		//Mask will be -1 for negative, and 0 for positive
		// 32^-1=~32, 32^0=32 .. so we get sign sensitive inversion
		const mask = this.highU32 >> 31;
		//For the purpose of adding the mask, consider low a uint
		const newLow = ((mask ^ this.lowU32) >>> 0) - mask;
		const carry = (newLow / maxU32Plus1) | 0; //This will always be zero or 1
		const newHigh = (mask ^ this.highU32) + carry;
		//NOP Bit-shift low to drop the possible 33rd bit (aka carry)
		return new Int64(newLow >> 0, newHigh);
	}

	/**
	 * Per bit, set it to 1 if either are set, zero if both or neither are set
	 * @param num
	 * @returns this^num
	 */
	xor(num: Int64): Int64 {
		objExt.notNull(num, 'xor(num)');
		return new Int64(this.lowU32 ^ num.lowU32, this.highU32 ^ num.highU32);
	}

	/**
	 * Per bit, set it to 1 if either are set, otherwise zero
	 * @param num
	 * @returns this|num
	 */
	or(num: Int64): Int64 {
		objExt.notNull(num, 'or(num)');
		return new Int64(this.lowU32 | num.lowU32, this.highU32 | num.highU32);
	}

	/**
	 * Per bit, keep at 1 if both are set, otherwise zero
	 * @param num
	 * @returns this&num
	 */
	and(num: Int64): Int64 {
		objExt.notNull(num, 'and(num)');
		return new Int64(this.lowU32 & num.lowU32, this.highU32 & num.highU32);
	}

	/**
	 * Invert each bit (0 becomes 1, 1 becomes 0)
	 * @returns ~this
	 */
	not(): Int64 {
		return new Int64(~this.lowU32, ~this.highU32);
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
		const invBy32 = 32 - by32; //Inverse (for the second shift)

		//  Lookup: 0->0, 1..64->1
		// We can achieve this with 1-(((by-1)>>31)&1)
		// NOTE: Because 64 is far less than 2^32 we don't need to worry about other
		//  values also having 2^31 set
		//      0: 1-(((0-1)>>31)&1) = 1-(1&1) = 0
		//      1: 1-(((1-1)>>31)&1) = 1-(0&1) = 1
		//      2: 1-(((2-1)>>31)&1) = 1-(0&1) = 0
		//      64:1-(((64-1)>>31)&1) = 1-(0&1)= 0
		const by32Not0 = 1 - (((by32 - 1) >> 31) & 1);

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
				(byPosEq1 * by32Not0 * (this.highU32 >> invBy32)),
			(byPosEq2 * this.lowU32) |
				(byPosEq1 *
					((this.highU32 << by32) | (by32Not0 * (this.lowU32 >> invBy32)))) |
				(byPosEq0 * by32Not0 * (this.highU32 >> invBy32)),
			(byPosEq1 * (this.lowU32 << by32)) |
				(byPosEq0 *
					((this.highU32 << by32) | (by32Not0 * (this.lowU32 >> invBy32)))),
			byPosEq0 * (this.lowU32 << by32),
		];
	}

	/**
	 * Shift bits left by @see by places zeros are brought in
	 * (Same as <<)
	 * @param by number 0-64
	 * @returns shifted value
	 */
	lShift(by: number): Int64 {
		intExt.inRangeInclusive(by, 0, 64);
		const o = this.lShiftOut(by);
		return new Int64(o[3], o[2]);
	}

	/**
	 * Rotate bits left by @see by places, bringing the outgoing bits in on the right
	 * @param by number 0-64
	 * @returns rotated value
	 */
	lRot(by: number): Int64 {
		intExt.inRangeInclusive(by, 0, 64);
		const o = this.lShiftOut(by);
		return new Int64(o[3] | o[1], o[2] | o[0]);
	}

	/**
	 * Shift bits right by @see by places, zeros are brought in (sign unaware)
	 * @param by number 0-64
	 * @returns shifted value
	 */
	rShift(by: number): Int64 {
		intExt.inRangeInclusive(by, 0, 64);
		//Shifting right can be emulated by using the shift-out registers of
		// a left shift.  eg. In <<1 the outgoing register has 1 bit in it,
		// the same result as >>>63
		const o = this.lShiftOut(64 - by);
		return new Int64(o[1], o[0]);
	}

	/**
	 * Rotate bits right be @see by places, bringing the outgoing bits in on the left
	 * @param by number 0-64
	 * @returns rotated value
	 */
	rRot(by: number): Int64 {
		intExt.inRangeInclusive(by, 0, 64);
		const o = this.lShiftOut(64 - by);
		return new Int64(o[3] | o[1], o[2] | o[0]);
	}

	private addUnsafe(num: Int64): Int64 {
		const low = this.lowU32 + num.lowU32;
		const carry = (low / maxU32Plus1) | 0; //This will always be zero or 1
		//NOTE: high can overflow (but that's ok)
		const high = this.highU32 + num.highU32 + carry;

		return new Int64(low & maxU32, high & maxU32);
	}

	/**
	 * Add @see num to value mod 2^64 (overflows discarded)
	 * NOTE: Won't mutate internal value
	 * @param num
	 * @returns new value
	 */
	add(num: Int64): Int64 {
		objExt.notNull(num, 'add(num)');
		return this.addUnsafe(num);
	}

	/**
	 * Add @param num to value mod 2^64 (overflows discarded)
	 * NOTE: Won't mutate internal value
	 * @param num
	 * @returns new value
	 */
	addNumber(num: number): Int64 {
		return this.addUnsafe(Int64.fromNumber(num));
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	mul(num: Int64): Int64 {
		throw new Error('Not implemented;');
		//todo: MUL https://en.wikipedia.org/wiki/Two%27s_complement#Multiplication
	}

	/**
	 * Whether @see other has the same value as this
	 * NOTE: Not suitable for constant-time comparison
	 * @param other
	 * @returns boolean
	 */
	equals(other: Int64): boolean {
		objExt.notNull(other, 'equals(other)');
		return this.lowU32 === other.lowU32 && this.highU32 === other.highU32;
	}

	/**
	 * Whether this is > @param other
	 * @param {Int64} other
	 * @returns {boolean}
	 */
	gt(other: Int64): boolean {
		//When one is negative, there's a clear winner (no compare required)
		if (this.negative && !other.negative) {
			// if (this.toBigInt()>=other.toBigInt())
			//     console.log(`? ${this.toString()}>${other.toString()}=f`);
			return false;
		}
		if (!this.negative && other.negative) {
			// if (this.toBigInt()<=other.toBigInt())
			//     console.log(`? ${this.toString()}>${other.toString()}=t`);
			return true;
		}
		//Compare high
		if (this.highU32 > other.highU32) {
			// if (this.toBigInt()<=other.toBigInt())
			//     console.log(`? ${this.toString()}>${other.toString()}=t`);
			return true;
		}
		if (this.highU32 < other.highU32) {
			// if (this.toBigInt()>=other.toBigInt())
			//     console.log(`? ${this.toString()}>${other.toString()}=f`);
			return false;
		}
		//If high matches, compare low
		if (this.lowU32 > other.lowU32) {
			// if (this.toBigInt() <= other.toBigInt())
			// 	console.log(`4? ${this.toString()}>${other.toString()}=t`);
			return true;
		}
		// if (this.toBigInt() > other.toBigInt())
		// 	console.log(`5? ${this.toString()}>${other.toString()}=f`);
		return false;
		//return this.lowI32 > other.lowI32;
	}

	/**
	 * Whether this < @param other
	 * @param other
	 * @returns
	 */
	lt(other: Int64): boolean {
		// this<other is the same as other>this
		return other.gt(this);
	}

	/**
	 * Whether this >= @param other
	 * @param other
	 * @returns
	 */
	gte(other: Int64): boolean {
		// this>=other is the same as !other<this
		return !this.lt(other);
	}

	/**
	 * Whether this <= @param other
	 * @param other
	 * @returns
	 */
	lte(other: Int64): boolean {
		//this<=other is the same as !this>other
		return !this.gt(other);
	}

	/**
	 * Value as a stream of bytes (big-endian order)
	 * @returns
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
	 * Output a 0-64 bit signed number as a 1-8 byte array
	 */
	toMinBytes(): Uint8Array {
		const ret = this.toBytes();
		let ptr = 0;
		const maxEat = 7; //We always want at least 1 byte (so only eat up to 7)
		if (this.negative) {
			while (ptr < maxEat && ret[ptr] === 0xff) ptr++;
			//If the last byte doesn't show negative.. back up one
			if ((ret[ptr] & 0x80) !== 0x80) {
				ptr--;
			}
		} else {
			while (ptr < maxEat && ret[ptr] === 0) ptr++;
			//If the last byte appears negative.. back up one
			if ((ret[ptr] & 0x80) === 0x80) ptr--;
		}
		return ret.slice(ptr);
	}

	toBigInt(): bigint {
		throw new NotSupported();
	}

	toString(): string {
		return 'i64{' + hex.fromBytes(this.toBytes()) + '}';
	}

	toSafeInt(): number | undefined {
		if (this.negative) {
			if (this.lt(Int64.minSafe)) {
				return undefined;
			}
			const l = ~this.lowU32 >>> 0;
			const h = ~this.highU32 * maxU32Plus1;
			const n = -h - l - 1;
			return n;
		} else {
			if (this.gt(Int64.maxSafe)) return undefined;
			//Low can be considered unsigned in this case, ie ffffffff=4M not -1
			return (this.lowU32 >>> 0) + this.highU32 * maxU32Plus1;
		}
	}

	//-549755813888 | FFFFFF8000000000

	/**
	 * Build from an integer value
	 * @param number
	 * @returns
	 */
	static fromNumber(number: number): Int64 {
		if (!Number.isInteger(number))
			throw new EnforceTypeError('Integer', number);
		const low = number & maxU32;
		const high = Math.floor(number / maxU32Plus1);
		// let high = 0;
		// if (number > maxU32) {
		// 	high = Math.floor(number / maxU32Plus1);
		// } else if (number < -4294967296) {
		// 	//-4294967296 = FFFFFFFF_00000000, the lowest negative number
		// 	// that can only be encoded in the small part, after that, high part required too
		// 	high = Math.floor(number / maxU32Plus1);
		// } else if (number < 0) {
		// 	high = maxU32;
		// }
		return new Int64(low, high);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	static fromBigInt(num: bigint): Int64 {
		throw new NotSupported();
	}

	static fromBytes(sourceBytes: Uint8Array, sourcePos = 0): Int64 {
		const end = sourcePos + 8;
		if (end > sourceBytes.length)
			throw new SizeError('sourceBytes', sourceBytes.length, end);
		const high =
			(sourceBytes[sourcePos++] << 24) |
			(sourceBytes[sourcePos++] << 16) |
			(sourceBytes[sourcePos++] << 8) |
			sourceBytes[sourcePos++];
		const low =
			(sourceBytes[sourcePos++] << 24) |
			(sourceBytes[sourcePos++] << 16) |
			(sourceBytes[sourcePos++] << 8) |
			sourceBytes[sourcePos++];
		return new Int64(low, high);
	}

	static fromMinBytes(sourceBytes: Uint8Array, sourcePos = 0, len = 8): Int64 {
		intExt.inRangeInclusive(len, 0, 8);
		const end = sourcePos + len;
		if (end > sourceBytes.length)
			throw new SizeError('sourceBytes', sourceBytes.length, end);

		const padded = new Uint8Array(8);
		const minInsertPoint = 8 - len;
		padded.set(sourceBytes.slice(sourcePos, end), minInsertPoint);
		//If there was no source, or it's positive.. zero pad (already done)
		if (len === 0 || (sourceBytes[sourcePos] & 0x80) === 0) {
			return this.fromBytes(padded);
		}
		//Pad for negative (with 0xFF)
		for (let i = 0; i < minInsertPoint; i++) {
			padded[i] = 0xff;
		}
		return this.fromBytes(padded);
	}

	static get max(): Int64 {
		return new Int64(maxU32 >> 0, maxU32 >>> 1);
	}

	static get min(): Int64 {
		return new Int64(0, 0x80000000 >> 0);
	}

	/**
	 * Number.MAX_SAFE_INTEGER in Int64 form
	 * 2^53 - 1 = 9007199254740991
	 */
	static get maxSafe(): Int64 {
		//Number.MAX_SAFE_INT - it's arguable whether this is 2^53 (FP) or 2^53-1 (JS)
		// 9007199254740991 | 001FFFFFFFFFFFFF
		return new Int64(maxU32, 0x1fffff);
	}
	/**
	 * Number.MIN_SAFE_INTEGER in Int64 form
	 * 1(2^53 - 1) = -9007199254740991 - it's arguable whether this is -2^53 (FP) or -(2^53-1) (JS)
	 */
	static get minSafe(): Int64 {
		// -2097152 * 4294967296 +1 = -9007199254740991 | FFE0000000000001
		return new Int64(1, 0xffe00000);
	}
}
