/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { hex } from '../../codec/Hex.js';
import { asBE, asLE } from '../../endian/platform.js';
import { sNum } from '../../safe/safe.js';
import { U64, U64MutArray } from './U64.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT_U128 = 'U128';
const DBG_RPT_U128Mut = 'U128Mut';
const maxU32 = 0xffffffff;
const maxU16 = 0xffff;
const sizeBytes = 16;
const sizeU32 = 4;
const maxU32Plus1 = 0x100000000;

function fromBytesBE(source: Uint8Array, pos = 0): Uint32Array {
	//Clone the source (we don't want to mangle the original data)
	const cpy = source.slice(pos, pos + sizeBytes);
	//Fix the endianness of each u32
	asBE.i32(cpy, 0, sizeU32);
	//Map to c32
	const c32 = new Uint32Array(cpy.buffer);
	//Swap the position (we store L,H BE would be H,L)
	//note if you inspect these they may have strange values (depending on platform endianness)
	let t = c32[0];
	c32[0] = c32[3];
	c32[3] = t;
	t = c32[1];
	c32[1] = c32[2];
	c32[2] = t;
	return c32;
}

function fromBytesLE(source: Uint8Array, pos = 0): Uint32Array {
	const cpy = source.slice(pos, pos + sizeBytes);
	asLE.i32(cpy, 0, sizeU32);
	const c32 = new Uint32Array(cpy.buffer);
	//No need to swap bytes
	return c32;
}

function notEq(arr: Uint32Array, pos: number) {
	arr[pos] = ~arr[pos];
	arr[pos + 1] = ~arr[pos + 1];
	arr[pos + 2] = ~arr[pos + 2];
	arr[pos + 3] = ~arr[pos + 3];
}

export class U128 {
	protected arr: Uint32Array;
	protected pos: number;

	/**
	 * Bottom 32 bits (0-31) of 128 bit int
	 */
	get lowLow(): number {
		return this.arr[this.pos];
	}

	/**
	 * Second 32 bits (32-63) of 128 bit int
	 */
	get lowHigh(): number {
		return this.arr[this.pos + 1];
	}

	/**
	 * Third 32 bits (64-95) of 128 bit int
	 */
	get highLow(): number {
		return this.arr[this.pos + 2];
	}

	/**
	 * Top 32 bits (96-127)  of 128 bit int
	 */
	get highHigh(): number {
		return this.arr[this.pos + 3];
	}

	/**
	 * Uint32 is platform ordered, but the first number is low, and the last high
	 * [pos]=lowLow32, [pos+1]=lowHigh32, [pos+2]=highLow32, [pos+3]=highHigh32
	 *
	 * On LE systems this means it's true LE (bytes: 0..31, 32..63, 64..95, 96..127), on BE systems
	 * this means it's a form of middle (31..0, 63..32, 64..95, 127..96)
	 * @param arr
	 * @param pos
	 */
	protected constructor(arr: Uint32Array, pos = 0) {
		this.arr = arr;
		this.pos = pos;
	}

	//_valueOf doesn't work with U128 (except as a 4 part Uint32array)
	/**
	 * This is only used by U64Mut (notice it's protected), so we can look inside v.arr
	 * @param v
	 */
	protected _setValue(v: U128): void {
		this.arr[this.pos] = v.arr[v.pos];
		this.arr[this.pos + 1] = v.arr[v.pos + 1];
		this.arr[this.pos + 2] = v.arr[v.pos + 2];
		this.arr[this.pos + 3] = v.arr[v.pos + 3];
	}
	protected _xorEq(a: Uint32Array, aPos: number, b: U128) {
		a[aPos] ^= b.arr[b.pos];
		a[aPos + 1] ^= b.arr[b.pos + 1];
		a[aPos + 2] ^= b.arr[b.pos + 2];
		a[aPos + 3] ^= b.arr[b.pos + 3];
	}
	protected _orEq(a: Uint32Array, aPos: number, b: U128) {
		a[aPos] |= b.arr[b.pos];
		a[aPos + 1] |= b.arr[b.pos + 1];
		a[aPos + 2] |= b.arr[b.pos + 2];
		a[aPos + 3] |= b.arr[b.pos + 3];
	}
	protected _andEq(a: Uint32Array, aPos: number, b: U128) {
		a[aPos] &= b.arr[b.pos];
		a[aPos + 1] &= b.arr[b.pos + 1];
		a[aPos + 2] &= b.arr[b.pos + 2];
		a[aPos + 3] &= b.arr[b.pos + 3];
	}
	protected _addEq(a: Uint32Array, aPos: number, b: U128) {
		let sum = a[aPos] + b.arr[b.pos];
		let carry = sum > maxU32 ? 1 : 0;
		a[aPos] = sum;

		sum = a[aPos + 1] + b.arr[b.pos + 1] + carry;
		carry = sum > maxU32 ? 1 : 0;
		a[aPos + 1] = sum;

		sum = a[aPos + 2] + b.arr[b.pos + 2] + carry;
		carry = sum > maxU32 ? 1 : 0;
		a[aPos + 2] = sum;

		//Don't need to carry check the last element
		a[aPos + 3] += b.arr[b.pos + 3] + carry;
	}
	protected static _negEq(a: U128Mut) {
		notEq(a.arr, a.pos);
		a.arr[a.pos] += 1;
		//If overflow add to next block
		if (a.arr[a.pos] == 0) {
			a.arr[a.pos + 1] += 1;
			if (a.arr[a.pos + 1] == 0) {
				a.arr[a.pos + 2] += 1;
				if (a.arr[a.pos + 2] == 0) {
					a.arr[a.pos + 3] += 1;
				}
			}
		}
	}
	protected _subEq(a: Uint32Array, aPos: number, b: U128) {
		const b2 = b.mut();
		U128._negEq(b2);
		this._addEq(a, aPos, b2);
	}
	protected _mulEq(a: Uint32Array, aPos: number, b: U128) {
		//Long multiplication!
		// FFFF*FFFF (biggest possible uint16s) = FFFE0001
		// FFFFFFFF*FFFFFFFF (biggest possible uint32s) = FFFFFFFE00000001
		// - We can't multiple U32 because JS only goes to U51 before switching
		// to floating point
		const a0 = a[aPos] & maxU16;
		const a1 = a[aPos] >>> 16;
		const a2 = a[aPos + 1] & maxU16;
		const a3 = a[aPos + 1] >>> 16;
		const a4 = a[aPos + 2] & maxU16;
		const a5 = a[aPos + 2] >>> 16;
		const a6 = a[aPos + 3] & maxU16;
		const a7 = a[aPos + 3] >>> 16;

		const b0 = b.arr[b.pos] & maxU16;
		const b1 = b.arr[b.pos] >>> 16;
		const b2 = b.arr[b.pos + 1] & maxU16;
		const b3 = b.arr[b.pos + 1] >>> 16;
		const b4 = b.arr[b.pos + 2] & maxU16;
		const b5 = b.arr[b.pos + 2] >>> 16;
		const b6 = b.arr[b.pos + 3] & maxU16;
		const b7 = b.arr[b.pos + 3] >>> 16;

		const m0 = a0 * b0;
		let carry = m0 >>> 16;
		const m1 = a0 * b1 + a1 * b0 + carry;
		carry = (m1 / 0x10000) | 0; //Can be >32bits
		const m2 = a0 * b2 + a1 * b1 + a2 * b0 + carry;
		carry = (m2 / 0x10000) | 0; //Can be >32bits
		const m3 = a0 * b3 + a1 * b2 + a2 * b1 + a3 * b0 + carry; //(m2>>>16);
		carry = (m3 / 0x10000) | 0; //Can be >32bits
		const m4 = a0 * b4 + a1 * b3 + a2 * b2 + a3 * b1 + a4 * b0 + carry;
		carry = (m4 / 0x10000) | 0; //Can be >32bits
		const m5 =
			a0 * b5 + a1 * b4 + a2 * b3 + a3 * b2 + a4 * b1 + a5 * b0 + carry;
		carry = (m5 / 0x10000) | 0; //Can be >32bits
		const m6 =
			a0 * b6 +
			a1 * b5 +
			a2 * b4 +
			a3 * b3 +
			a4 * b2 +
			a5 * b1 +
			a6 * b0 +
			carry;
		carry = (m6 / 0x10000) | 0; //Can be >32bits
		const m7 =
			a0 * b7 +
			a1 * b6 +
			a2 * b5 +
			a3 * b4 +
			a4 * b3 +
			a5 * b2 +
			a6 * b1 +
			a7 * b0 +
			carry;
		//Note there are more stages if we had space

		a[aPos] = (m0 & maxU16) | ((m1 & maxU16) << 16);
		a[aPos + 1] = (m2 & maxU16) | ((m3 & maxU16) << 16);
		a[aPos + 2] = (m4 & maxU16) | ((m5 & maxU16) << 16);
		a[aPos + 3] = (m6 & maxU16) | ((m7 & maxU16) << 16);
	}

	/**
	 * `this` ⊕ `u128`
	 * @param u128
	 * @returns
	 */
	xor(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + sizeU32);
		this._xorEq(arr, 0, u128);
		return new U128(arr);
	}

	/**
	 * `this` ∨ `u128`
	 * @param u128
	 * @returns
	 */
	or(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + sizeU32);
		this._orEq(arr, 0, u128);
		return new U128(arr);
	}

	/**
	 * `this` ∧ `u128`
	 * @param u128
	 * @returns
	 */
	and(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + sizeU32);
		this._andEq(arr, 0, u128);
		return new U128(arr);
	}

	/**
	 * ¬ `this`
	 * @returns
	 */
	not(): U128 {
		const arr = this.arr.slice(this.pos, this.pos + sizeU32);
		notEq(arr, 0);
		return new U128(arr);
	}

	protected shift(by: number): Uint32Array {
		const by32 = by & 0x1f; //aka mod 32
		let byPos = by >>> 5; //&3; //aka divide by 32,then capped to 0-3
		const invBy32 = 32 - by32; //Inverse (for the second shift)

		// Detect by32 being 0, or more accurately invBy32 being 32.. which is treated
		// as 0 in JS and leads to elements ORing and merging (a right mess) - we need
		// to zero the shift in that case.
		const zeroRshift = 1 - (invBy32 >>> 5);

		const ret = new Uint32Array(8);

		ret[byPos] = this.arr[this.pos] << by32;
		ret[byPos + 1] =
			(this.arr[this.pos + 1] << by32) |
			((zeroRshift * this.arr[this.pos]) >>> invBy32);
		ret[byPos + 2] =
			(this.arr[this.pos + 2] << by32) |
			((zeroRshift * this.arr[this.pos + 1]) >>> invBy32);
		ret[byPos + 3] =
			(this.arr[this.pos + 3] << by32) |
			((zeroRshift * this.arr[this.pos + 2]) >>> invBy32);
		ret[byPos + 4] = (zeroRshift * this.arr[this.pos + 3]) >>> invBy32;
		return ret;
	}

	/**
	 * Shift bits left by `by` places zeros are brought in
	 * (Same as <<)
	 * @param by integer 0-128
	 * @returns shifted value
	 */
	lShift(by: number): U128 {
		const s = this.shift(by);
		return new U128(s.subarray(0, 4));
	}

	/**
	 * Rotate bits left by `by`, bringing the outgoing bits in on the right
	 * @param by integer 0-127
	 * @returns shifted value
	 */
	lRot(by: number): U128 {
		const s = this.shift(by & 127);
		s[0] |= s[4];
		s[1] |= s[5];
		s[2] |= s[6];
		s[3] |= s[7];
		return new U128(s.subarray(0, 4));
	}

	/**
	 * Shift bits right by `by` places, zeros are brought in (sign unaware)
	 * (same as >>>)
	 * @param by number 0-128
	 * @returns shifted value
	 */
	rShift(by: number): U128 {
		const s = this.shift(128 - by);
		return new U128(s.subarray(4));
	}

	/**
	 * Rotate bits right by `by` places, bringing the outgoing bits in on the left
	 * @param by number 0-127
	 * @returns rotated value
	 */
	rRot(by: number): U128 {
		const s = this.shift(128 - (by & 127));
		s[0] |= s[4];
		s[1] |= s[5];
		s[2] |= s[6];
		s[3] |= s[7];
		return new U128(s.subarray(0, 4));
	}

	/**
	 * `this` + `u128`
	 * @param u128
	 * @returns
	 */
	add(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + sizeU32);
		this._addEq(arr, 0, u128);
		return new U128(arr, 0);
	}

	/**
	 * `this` - `u128`
	 * @param u128
	 * @returns
	 */
	sub(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + sizeU32);
		this._subEq(arr, 0, u128);
		return new U128(arr, 0);
	}

	/**
	 * `this` * `u128`
	 * @param u128
	 * @returns
	 */
	mul(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + sizeU32);
		this._mulEq(arr, 0, u128);
		return new U128(arr);
	}

	/**
	 * Whether `this`==`u128`
	 * @param u128
	 * @returns
	 */
	eq(u128: U128): boolean {
		//Will fast exit if lows don't match (not constant)
		return (
			this.arr[this.pos] == u128.arr[u128.pos] &&
			this.arr[this.pos + 1] == u128.arr[u128.pos + 1] &&
			this.arr[this.pos + 2] == u128.arr[u128.pos + 2] &&
			this.arr[this.pos + 3] == u128.arr[u128.pos + 3]
		);
	}

	/**
	 * Whether `this` is > `u128`
	 * @param u128
	 * @returns
	 */
	gt(u128: U128): boolean {
		//If hh doesn't match - it dictates
		if (this.arr[this.pos + 3] != u128.arr[u128.pos + 3]) {
			return this.arr[this.pos + 3] > u128.arr[u128.pos + 3];
		}
		//hh are eq
		if (this.arr[this.pos + 2] != u128.arr[u128.pos + 2]) {
			return this.arr[this.pos + 2] > u128.arr[u128.pos + 2];
		}
		//hh+hl are eq
		if (this.arr[this.pos + 1] != u128.arr[u128.pos + 1]) {
			return this.arr[this.pos + 1] > u128.arr[u128.pos + 1];
		}
		//hh+hl+lh are eq
		return this.arr[this.pos] > u128.arr[u128.pos];
	}

	/**
	 * Whether `this` < `u128`
	 * @param u128
	 * @returns
	 */
	lt(u128: U128): boolean {
		//If hh doesn't match - it dictates
		if (this.arr[this.pos + 3] != u128.arr[u128.pos + 3]) {
			return this.arr[this.pos + 3] < u128.arr[u128.pos + 3];
		}
		//hh are eq
		if (this.arr[this.pos + 2] != u128.arr[u128.pos + 2]) {
			return this.arr[this.pos + 2] < u128.arr[u128.pos + 2];
		}
		//hh+hl are eq
		if (this.arr[this.pos + 1] != u128.arr[u128.pos + 1]) {
			return this.arr[this.pos + 1] < u128.arr[u128.pos + 1];
		}
		//hh+hl+lh are eq
		return this.arr[this.pos] < u128.arr[u128.pos];
	}

	/**
	 * Whether `this` >= `u128`
	 * @param u128
	 * @returns
	 */
	gte(u128: U128): boolean {
		//If hh doesn't match - it dictates
		if (this.arr[this.pos + 3] != u128.arr[u128.pos + 3]) {
			return this.arr[this.pos + 3] > u128.arr[u128.pos + 3];
		}
		//hh are eq
		if (this.arr[this.pos + 2] != u128.arr[u128.pos + 2]) {
			return this.arr[this.pos + 2] > u128.arr[u128.pos + 2];
		}
		//hh+hl are eq
		if (this.arr[this.pos + 1] != u128.arr[u128.pos + 1]) {
			return this.arr[this.pos + 1] > u128.arr[u128.pos + 1];
		}
		//hh+hl+lh are eq
		return this.arr[this.pos] >= u128.arr[u128.pos];
	}

	/**
	 * Whether `this` <= `u128`
	 * @param u128
	 * @returns
	 */
	lte(u128: U128): boolean {
		//If hh doesn't match - it dictates
		if (this.arr[this.pos + 3] != u128.arr[u128.pos + 3]) {
			return this.arr[this.pos + 3] < u128.arr[u128.pos + 3];
		}
		//hh are eq
		if (this.arr[this.pos + 2] != u128.arr[u128.pos + 2]) {
			return this.arr[this.pos + 2] < u128.arr[u128.pos + 2];
		}
		//hh+hl are eq
		if (this.arr[this.pos + 1] != u128.arr[u128.pos + 1]) {
			return this.arr[this.pos + 1] < u128.arr[u128.pos + 1];
		}
		//hh+hl+lh are eq
		return this.arr[this.pos] <= u128.arr[u128.pos];
	}

	/**
	 * Whether `this` == `u128`
	 * CONSTANT TIME
	 * @param u128
	 * @returns
	 */
	ctEq(u128: U128): boolean {
		const zero =
			(this.arr[this.pos] ^ u128.arr[u128.pos]) |
			(this.arr[this.pos + 1] ^ u128.arr[u128.pos + 1]) |
			(this.arr[this.pos + 2] ^ u128.arr[u128.pos + 2]) |
			(this.arr[this.pos + 3] ^ u128.arr[u128.pos + 3]);
		return zero === 0;
	}

	// /**
	//  * Whether `this` <= `u64`
	//  * CONSTANT TIME
	//  * @param u64
	//  * @returns
	//  */
	// ctLte(u64: U64): boolean {
	// 	const ll =
	// 		((this.arr[this.pos] & maxU16) - (u64.arr[u64.pos] & maxU16) - 1) >>> 31;
	// 	const lh =
	// 		(((this.arr[this.pos] >>> 16) & maxU16) -
	// 			((u64.arr[u64.pos] >>> 16) & maxU16) -
	// 			1) >>>
	// 		31;
	// 	const hl =
	// 		((this.arr[this.pos + 1] & maxU16) -
	// 			(u64.arr[u64.pos + 1] & maxU16) -
	// 			1) >>>
	// 		31;
	// 	const hh =
	// 		(((this.arr[this.pos + 1] >>> 16) & maxU16) -
	// 			((u64.arr[u64.pos + 1] >>> 16) & maxU16) -
	// 			1) >>>
	// 		31;
	// 	return (ll & lh & hl & hh) === 1;
	// }

	// /**
	//  * Whether `this` is >= `u64`
	//  * CONSTANT TIME
	//  * @param u64
	//  * @returns
	//  */
	// ctGte(u64: U64): boolean {
	// 	const ll =
	// 		((u64.arr[u64.pos] & maxU16) - (this.arr[this.pos] & maxU16) - 1) >>> 31;
	// 	const lh =
	// 		(((u64.arr[u64.pos] >>> 16) & maxU16) -
	// 			((this.arr[this.pos] >>> 16) & maxU16) -
	// 			1) >>>
	// 		31;
	// 	const hl =
	// 		((u64.arr[u64.pos + 1] & maxU16) -
	// 			(this.arr[this.pos + 1] & maxU16) -
	// 			1) >>>
	// 		31;
	// 	const hh =
	// 		(((u64.arr[u64.pos + 1] >>> 16) & maxU16) -
	// 			((this.arr[this.pos + 1] >>> 16) & maxU16) -
	// 			1) >>>
	// 		31;
	// 	return (ll & lh & hl & hh) === 1;
	// }

	// /**
	//  * Whether `this` > `u64`
	//  * CONSTANT TIME
	//  * @param u64
	//  * @returns
	//  */
	// ctGt(u64: U64): boolean {
	// 	const ll =
	// 		((this.arr[this.pos] & maxU16) - (u64.arr[u64.pos] & maxU16) - 1) >>> 31;
	// 	const lh =
	// 		(((this.arr[this.pos] >>> 16) & maxU16) -
	// 			((u64.arr[u64.pos] >>> 16) & maxU16) -
	// 			1) >>>
	// 		31;
	// 	const hl =
	// 		((this.arr[this.pos + 1] & maxU16) -
	// 			(u64.arr[u64.pos + 1] & maxU16) -
	// 			1) >>>
	// 		31;
	// 	const hh =
	// 		(((this.arr[this.pos + 1] >>> 16) & maxU16) -
	// 			((u64.arr[u64.pos + 1] >>> 16) & maxU16) -
	// 			1) >>>
	// 		31;
	// 	return (ll & lh & hl & hh) === 0;
	// }

	// /**
	//  * Whether `this` < `u64`
	//  * CONSTANT TIME
	//  * @param u64
	//  * @returns
	//  */
	// ctLt(u64: U64): boolean {
	// 	const ll =
	// 		((u64.arr[u64.pos] & maxU16) - (this.arr[this.pos] & maxU16) - 1) >>> 31;
	// 	const lh =
	// 		(((u64.arr[u64.pos] >>> 16) & maxU16) -
	// 			((this.arr[this.pos] >>> 16) & maxU16) -
	// 			1) >>>
	// 		31;
	// 	const hl =
	// 		((u64.arr[u64.pos + 1] & maxU16) -
	// 			(this.arr[this.pos + 1] & maxU16) -
	// 			1) >>>
	// 		31;
	// 	const hh =
	// 		(((u64.arr[u64.pos + 1] >>> 16) & maxU16) -
	// 			((this.arr[this.pos + 1] >>> 16) & maxU16) -
	// 			1) >>>
	// 		31;
	// 	return (ll & lh & hl & hh) === 0;
	// }

	// /**
	//  * Constant time switch to `u64` if `yes` (`true`) or stay the the same (`false`)
	//  * @param u64
	//  * @param yes Whether to switch
	//  * @returns this or u64
	//  */
	// ctSwitch(u64: U64, yes: boolean): U64 {
	// 	// @ts-expect-error: We're casting bool->number on purpose
	// 	const yNum = (yes | 0) - 1; //-1 or 0
	// 	const y64 = U64.fromUint32Pair(yNum, yNum);
	// 	return y64.not().and(u64).or(y64.and(this));
	// }

	// /**
	//  * Constant time select returns `a64` if `first` (`true`), or `b64` (`false`)
	//  * @param a64
	//  * @param b64
	//  * @param first
	//  * @returns `a64` or `b64`
	//  */
	// static ctSelect(a64: U64, b64: U64, first: boolean): U64 {
	// 	// @ts-expect-error: We're casting bool->number on purpose
	// 	const fNum = (first | 0) - 1; //-1 or 0
	// 	const f64 = U64.fromUint32Pair(fNum, fNum);
	// 	return f64.not().and(a64).or(f64.and(b64));
	// }

	/**
	 * Create a memory copy
	 * @returns
	 */
	clone(): U128 {
		return new U128(this.arr.slice(this.pos, this.pos + sizeU32));
	}

	/**
	 * Mutate - create a new @see {@link U128Mut} with a copy of this value
	 */
	mut(): U128Mut {
		return U128Mut.fromArray(this.arr.slice(this.pos, this.pos + sizeU32));
	}

	/**
	 * Mutate - create a copy of the Uint32Array within
	 */
	mut32(): Uint32Array {
		return this.arr.slice(this.pos, this.pos + sizeU32);
	}

	/**
	 * Mutate - create a new @see {@link U64MutArray} with a copy of this value
	 */
	mut64(): U64MutArray {
		const cpy = this.arr.slice(this.pos, this.pos + sizeU32);
		return U64MutArray.fromBytes(cpy.buffer, cpy.byteOffset, sizeBytes);
	}

	/**
	 * String version of this value, in big endian
	 * @returns
	 */
	toString(): string {
		return hex.fromBytes(this.toBytesBE());
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array[8]
	 */
	toBytesBE(): Uint8Array {
		//Invert l/h & project into bytes
		const r = new Uint8Array(
			Uint32Array.of(
				this.arr[this.pos + 3],
				this.arr[this.pos + 2],
				this.arr[this.pos + 1],
				this.arr[this.pos]
			).buffer
		);
		asBE.i32(r, 0, sizeU32);
		return r;
	}

	/**
	 * Value as a minimum stream of bytes (big-endian order)
	 * Drops leading zero-bytes (a minimum of 1 byte will always be returned)
	 * **NOTE** while the content is a copy of internal state, the return is shared memory (with all 8 bytes)
	 * @returns 1-8 bytes
	 */
	toMinBytesBE(): Uint8Array {
		const ret = this.toBytesBE();
		let i = 0;
		while (i < sizeBytes) {
			if (ret[i++] !== 0) break;
		}
		return ret.subarray(i - 1);
	}

	/**
	 * Value as a stream of bytes (little-endian order) COPY
	 * @returns Uint8Array[8]
	 */
	toBytesLE(): Uint8Array {
		const r8 = new Uint8Array(
			this.arr.slice(this.pos, this.pos + sizeU32).buffer
		);
		asLE.i32(r8, 0, sizeU32);
		return r8;
	}

	/**
	 * Value as a minimum stream of bytes (little-endian order)
	 * Drops trailing zero-bytes (a minimum of 1 byte will always be returned)
	 * **NOTE** while the content is a copy of internal state, the return is shared memory (with all 8 bytes)
	 * @returns 1-8 bytes
	 */
	toMinBytesLE(): Uint8Array {
		const ret = this.toBytesLE();
		let i = sizeBytes;
		while (i > 0) {
			if (ret[--i] !== 0) break;
		}
		return ret.subarray(0, i + 1);
	}

	/**
	 * Get the least significant byte
	 * @param idx 0-15 (%15)
	 * @returns
	 */
	lsb(idx = 0): number {
		//NOTE: This relies on numbers always being reported as Big Endian
		// no matter the platform endianness
		idx &= 15; //Only 15 spaces to chose from (zero indexed)
		//The MSB indicates which byte to access
		const shift = idx >> 2;
		//Limit IDX to 0-3 (&3) and then switch to bits (<<3)
		idx = (idx & 3) << 3;
		return (this.arr[this.pos + shift] >>> idx) & 0xff;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT_U128;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT_U128}(${this.toString()})`;
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51
	 * @returns
	 */
	static fromIntUnsafe(uint51: number): U128 {
		return new U128(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51 0-Number.MAX_SAFE_INT
	 * @returns
	 */
	static fromInt(uint51: number): U128 {
		sNum('uint51', uint51)
			.unsigned()
			.atMost(Number.MAX_SAFE_INTEGER)
			.throwNot();
		return new U128(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
	}

	/**
	 * Build from four integers, each truncated to 32 bits
	 * @param uint32low
	 * @param uint32high
	 * @returns
	 */
	static fromUint32Quad(
		uint32lowLow: number,
		uint32lowHigh: number,
		uint32highLow: number,
		uint32highHigh: number
	): U128 {
		return new U128(
			Uint32Array.of(uint32lowLow, uint32lowHigh, uint32highLow, uint32highHigh)
		);
	}
	/**
	 * Build from two 64bit unsigned ints
	 * @param u64low
	 * @param u64high
	 * @returns
	 */
	static fromU64Pair(u64low: U64, u64high: U64): U128 {
		return new U128(
			Uint32Array.of(u64low.low, u64low.high, u64high.low, u64high.high)
		);
	}

	/**
	 * Created a "view" into an existing Uint32Array
	 * **NOTE** the memory is shared, changing a value in @param source will mutate the state
	 * @param source
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(source: Uint32Array, pos = 0): U128 {
		return new U128(source, pos);
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in big endian order
	 * @param src
	 * @param pos
	 * @returns
	 */
	static fromBytesBE(src: Uint8Array, pos = 0): U128 {
		return new U128(fromBytesBE(src, pos));
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in little endian order
	 * @param src
	 * @param pos
	 * @returns
	 */
	static fromBytesLE(src: Uint8Array, pos = 0): U128 {
		return new U128(fromBytesLE(src, pos));
	}

	/**
	 * Create a view into an `ArrayBuffer`. Note this relies on platform endian
	 * **NOTE** Memory is shared (like @see fromArray)
	 * **NOTE** Subject to the same JS limitation that `bytePos` must be a multiple of element-size (8)
	 * **NOTE** The first 4* bytes must be in platform-endian order, and LOW, the second 4* bytes=high
	 * 	- Platform-LE, bytes should be in LE order: 0,1,2,3,4,5,6,7
	 *  - Platform-BE, bytes should be in mixed: 3,2,1,0,7,6,5,4
	 * **USE WITH CAUTION**
	 * @param src
	 * @param bytePos
	 * @returns
	 */
	static fromBuffer(src: ArrayBuffer, bytePos = 0): U128 {
		return new U128(new Uint32Array(src, bytePos, sizeU32));
	}

	/**
	 * A U64 with value 18446744073709551616 (the maximum Uint64)
	 */
	static get max(): U128 {
		return max;
	}

	/**
	 * A U64 with value 0 (the minimum Uint64)
	 */
	static get min(): U128 {
		return zero;
	}

	/**
	 * A U64 with value 0
	 */
	static get zero(): U128 {
		return zero;
	}
}
const zero = U128.fromUint32Quad(0, 0, 0, 0);
const max = U128.fromUint32Quad(0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff);

export class U128Mut extends U128 {
	/**
	 * @see value ⊕= `u128`
	 * @param u128
	 * @returns this (chainable)
	 */
	xorEq(u128: U128): U128Mut {
		this._xorEq(this.arr, this.pos, u128);
		return this;
	}

	/**
	 * @see value ∨= `u128`
	 * @param u128
	 * @returns this (chainable)
	 */
	orEq(u128: U128): U128Mut {
		this._orEq(this.arr, this.pos, u128);
		return this;
	}

	/**
	 * @see value ∧= `u128`
	 * @param u128
	 * @returns this (chainable)
	 */
	andEq(u128: U128): U128Mut {
		this._andEq(this.arr, this.pos, u128);
		return this;
	}

	/**
	 * ¬= @see value
	 * @returns this (chainable)
	 */
	notEq(): U128Mut {
		notEq(this.arr, this.pos);
		return this;
	}

	/**
	 * @see value ROL @param by
	 * @param by integer 0-128
	 * @returns this (chainable)
	 */
	lShiftEq(by: number): U128Mut {
		const s = this.shift(by);
		this.arr[this.pos] = s[0];
		this.arr[this.pos + 1] = s[1];
		this.arr[this.pos + 2] = s[2];
		this.arr[this.pos + 3] = s[3];
		return this;
	}

	/**
	 * Rotate bits left by @see by, bringing the outgoing bits in on the right
	 * @param by integer 0-127
	 * @returns this (chainable)
	 */
	lRotEq(by: number): U128Mut {
		const s = this.shift(by & 127);
		this.arr[this.pos] = s[0] | s[4];
		this.arr[this.pos + 1] = s[1] | s[5];
		this.arr[this.pos + 2] = s[2] | s[6];
		this.arr[this.pos + 3] = s[3] | s[7];
		return this;
	}

	/**
	 * Shift bits right by @see by places, zeros are brought in (sign unaware)
	 * (same as >>>)
	 * @param by number 0-128
	 * @returns shifted value
	 */
	rShiftEq(by: number): U128Mut {
		const s = this.shift(128 - by);
		this.arr[this.pos] = s[4];
		this.arr[this.pos + 1] = s[5];
		this.arr[this.pos + 2] = s[6];
		this.arr[this.pos + 3] = s[7];
		return this;
	}

	/**
	 * @see value ROR @param by
	 * @param by integer 0-127
	 * @returns this (chainable)
	 */
	rRotEq(by: number): U128Mut {
		const s = this.shift(128 - (by & 127));
		this.arr[this.pos] = s[0] | s[4];
		this.arr[this.pos + 1] = s[1] | s[5];
		this.arr[this.pos + 2] = s[2] | s[6];
		this.arr[this.pos + 3] = s[3] | s[7];
		return this;
	}

	/**
	 * @see value += @param b
	 * @param b
	 * @returns @see value + @param b
	 */
	addEq(b: U128): U128Mut {
		this._addEq(this.arr, this.pos, b);
		return this;
	}

	/**
	 * @see value -= @param b
	 * @param b
	 * @returns @see value -= @param b
	 */
	subEq(b: U128): U128Mut {
		this._subEq(this.arr, this.pos, b);
		return this;
	}

	/**
	 * @see value *= @param b
	 * @param b
	 * @returns @see value * @param b
	 */
	mulEq(b: U128): U128Mut {
		this._mulEq(this.arr, this.pos, b);
		return this;
	}

	/**
	 * Create a copy of this U128Mut
	 * @returns
	 */
	clone(): U128Mut {
		return new U128Mut(this.arr.slice(this.pos, this.pos + sizeU32));
	}

	/**
	 * Update value
	 * @param u128
	 * @returns
	 */
	set(u128: U128): U128Mut {
		super._setValue(u128);
		return this;
	}

	/**
	 * Zero out this value
	 */
	zero(): void {
		this.arr.fill(0, this.pos, this.pos + sizeU32);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT_U128Mut;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT_U128Mut}(${this.toString()})`;
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51
	 * @returns
	 */
	static fromIntUnsafe(uint51: number): U128Mut {
		return new U128Mut(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51 0-Number.MAX_SAFE_INT
	 * @returns
	 */
	static fromInt(uint51: number): U128Mut {
		sNum('uint51', uint51)
			.unsigned()
			.atMost(Number.MAX_SAFE_INTEGER)
			.throwNot();
		return new U128Mut(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
	}

	/**
	 * Build from four 32bit unsigned integers (truncated if oversized)
	 * @param uint32low
	 * @param uint32high
	 * @returns
	 */
	static fromUint32Quad(
		uint32lowLow: number,
		uint32lowHigh: number,
		uint32highLow: number,
		uint32highHigh: number
	): U128Mut {
		return new U128Mut(
			Uint32Array.of(uint32lowLow, uint32lowHigh, uint32highLow, uint32highHigh)
		);
	}

	/**
	 * Build from two 64bit unsigned ints
	 * @param u64low
	 * @param u64high
	 * @returns
	 */
	static fromU64Pair(u64low: U64, u64high: U64): U128Mut {
		return new U128Mut(
			Uint32Array.of(u64low.low, u64low.high, u64high.low, u64high.high)
		);
	}

	/**
	 * Created a "view" into an existing Uint32Array
	 * **NOTE** the memory is shared, changing a value in @param source will mutate the state
	 * @param source
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(source: Uint32Array, pos = 0): U128Mut {
		return new U128Mut(source, pos);
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in big endian order
	 * @param src
	 * @param pos
	 * @returns
	 */
	static fromBytesBE(src: Uint8Array, pos = 0): U128Mut {
		return new U128Mut(fromBytesBE(src, pos));
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in little endian order
	 * @param src
	 * @param pos
	 * @returns
	 */
	static fromBytesLE(src: Uint8Array, pos = 0): U128Mut {
		return new U128Mut(fromBytesLE(src, pos));
	}
}
