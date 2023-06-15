/*! Copyright 2023 gnabgib MPL-2.0 */

import { hex } from '../encoding/Hex.js';
import { asBE, asLE } from '../endian/platform.js';
import { safety } from './Safety.js';

const maxU32 = 0xffffffff;
const maxU16 = 0xffff;
const maxU32Plus1 = 0x100000000;
const sizeBytes = 8;
const rotMask64 = 0x3f;
const rotMask32 = 0x1f;

export type U64ish = U64 | number;

function fromBytesBE(source: Uint8Array, pos = 0): Uint32Array {
	//Clone the source (we don't want to mangle the original data)
	const cpy = source.slice(pos, pos + sizeBytes);
	//Fix the endianness of each u32
	asBE.i32(cpy, 0);
	asBE.i32(cpy, 4);
	//Map to c32
	const c32 = new Uint32Array(cpy.buffer);
	//Swap the position (we store L,H BE would be H,L)
	//note if you inspect these they may have strange values (depending on platform endianness)
	const t = c32[0];
	c32[0] = c32[1];
	c32[1] = t;
	return c32;
}

function fromBytesLE(source: Uint8Array, pos = 0): Uint32Array {
	const cpy = source.slice(pos, pos + sizeBytes);
	asLE.i32(cpy, 0);
	asLE.i32(cpy, 4);
	const c32 = new Uint32Array(cpy.buffer);
	//No need to swap bytes
	return c32;
}

export class U64 {
	protected arr: Uint32Array;
	protected pos: number;

	/**
	 * Bottom 32 bits (1-32)
	 */
	get low(): number {
		return this.arr[this.pos];
	}

	/**
	 * Top 32 bits (33-64)
	 */
	get high(): number {
		return this.arr[this.pos + 1];
	}

	/**
	 * Uint32 is platform ordered, but the first number is low, and the second high
	 * [pos]=low32, [pos+1]=high32
	 *
	 * On LE systems this means it's true LE (bytes: 0..31, 32..63), on BE systems
	 * this means it's a form of middle (31..0, 63..32)
	 * @param arr
	 * @param pos
	 */
	protected constructor(arr: Uint32Array, pos = 0) {
		this.arr = arr;
		this.pos = pos;
	}

	//_valueOf doesn't work with U64 (except as a 2 part Uint32array or pair of numbers?)
	/**
	 * This is only used by U64Mut (notice it's protected), so we can look inside v.arr
	 * @param v
	 */
	protected _setValue(v: U64): void {
		this.arr[this.pos] = v.arr[v.pos];
		this.arr[this.pos + 1] = v.arr[v.pos + 1];
	}
	protected _xorEq(a: Uint32Array, aPos: number, b: U64) {
		a[aPos] ^= b.arr[b.pos];
		a[aPos + 1] ^= b.arr[b.pos + 1];
	}
	protected _orEq(a: Uint32Array, aPos: number, b: U64) {
		a[aPos] |= b.arr[b.pos];
		a[aPos + 1] |= b.arr[b.pos + 1];
	}
	protected _andEq(a: Uint32Array, aPos: number, b: U64) {
		a[aPos] &= b.arr[b.pos];
		a[aPos + 1] &= b.arr[b.pos + 1];
	}
	protected _addEq(a: Uint32Array, aPos: number, b: U64) {
		const l = a[aPos] + b.arr[b.pos];
		//Carry can only be 0/1
		const c = l > maxU32 ? 1 : 0;
		a[aPos] = l;
		a[aPos + 1] += b.arr[b.pos + 1] + c;
	}
	protected static _negEq(a: U64Mut) {
		//Not
		a.arr[a.pos] = ~a.arr[a.pos];
		a.arr[a.pos + 1] = ~a.arr[a.pos + 1];
		//Add one, we only need to check for one value for carry
		if (a.arr[a.pos] === 0xffffffff) {
			a.arr[a.pos] = 0;
			a.arr[a.pos + 1] += 1;
		} else {
			a.arr[a.pos] += 1;
		}
	}
	protected _subEq(a: Uint32Array, aPos: number, b: U64) {
		const b2 = b.mut();
		U64._negEq(b2);
		this._addEq(a, aPos, b2);
	}
	protected _mulEq(a: Uint32Array, aPos: number, b64: U64) {
		//Long multiplication!
		// FFFF*FFFF (biggest possible uint16s) = FFFE0001
		// FFFFFFFF*FFFFFFFF (biggest possible uint32s) = FFFFFFFE00000001
		const a0 = a[aPos] & maxU16;
		const a1 = a[aPos] >>> 16;
		const a2 = a[aPos + 1] & maxU16;
		const a3 = a[aPos + 1] >>> 16;
		const b0 = b64.arr[b64.pos] & maxU16;
		const b1 = b64.arr[b64.pos] >>> 16;
		const b2 = b64.arr[b64.pos + 1] & maxU16;
		const b3 = b64.arr[b64.pos + 1] >>> 16;

		const m0 = a0 * b0;
		const c0 = m0 >>> 16;
		const m1 = a0 * b1 + a1 * b0 + c0;
		const c1 = (m1 / 0x10000) | 0; //Can be >32bits
		const m2 = a0 * b2 + a1 * b1 + a2 * b0 + c1;
		const c2 = (m2 / 0x10000) | 0; //Can be >32bits
		const m3 = a0 * b3 + a1 * b2 + a2 * b1 + a3 * b0 + c2; //(m2>>>16);
		//Note there are 3 more stages if we had space)
		a[aPos] = (m0 & maxU16) | ((m1 & maxU16) << 16);
		a[aPos + 1] = (m2 & maxU16) | ((m3 & maxU16) << 16);
	}

	/**
	 * @see value ⊕ @param u64
	 * @param u64
	 * @returns @see value ⊕ @param u64
	 */
	xor(u64: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		this._xorEq(arr, 0, u64);
		return new U64(arr);
	}

	/**
	 * @see value ∨ @param u64
	 * @param u64
	 * @returns @see value ∨ @param u64
	 */
	or(u64: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		this._orEq(arr, 0, u64);
		return new U64(arr);
	}

	/**
	 * @see value ∧ @param b
	 * @param b
	 * @returns @see value ∧ @param b
	 */
	and(b: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		this._andEq(arr, 0, b);
		return new U64(arr);
	}

	/**
	 * ¬ @see value
	 * @returns ¬ @see value
	 */
	not(): U64 {
		return new U64(
			Uint32Array.of(~this.arr[this.pos], ~this.arr[this.pos + 1])
		);
	}

	// prettier-ignore
	protected shift(by: number): number[] {
		//Alright, so there's effort to avoid branching (and therefore branch-stalls)
		// in this code.. which makes it slightly trickier to follow.  Effectively
		// instead of picking the calc to make based on @see by size (branching)
		// we calculate all calcs and zero the ones that are out of scope.

		//JS will only let us shift %32.. so n<<32=n<<0, and n<<33=n<<1
		//This is effectively how JS will treat @see by untouched
		const by32 = by & rotMask32; //aka mod 32
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
			(byPosEq2 * this.arr[this.pos + 1]) |
				(byPosEq1 * by32Not0 * (this.arr[this.pos + 1] >>> invBy32)),
			(byPosEq2 * this.arr[this.pos]) |
				(byPosEq1 * ((this.arr[this.pos + 1] << by32) | (by32Not0 * (this.arr[this.pos] >>> invBy32)))) |
				(byPosEq0 * by32Not0 * (this.arr[this.pos + 1] >>> invBy32)),
			(byPosEq1 * (this.arr[this.pos] << by32)) |
				(byPosEq0 * ((this.arr[this.pos + 1] << by32) | (by32Not0 * (this.arr[this.pos] >>> invBy32)))),
			byPosEq0 * (this.arr[this.pos] << by32),
		];
	}

	/**
	 * Shift bits left by @see by places zeros are brought in
	 * (Same as <<)
	 * @param by integer 0-63
	 * @returns shifted value
	 */
	lShift(by: number): U64 {
		const s = this.shift(by);
		// [hh hl lh ll]
		return new U64(Uint32Array.of(s[3], s[2]));
	}

	/**
	 * Rotate bits left by @see by, bringing the outgoing bits in on the right
	 * @param by integer 0-63
	 * @returns shifted value
	 */
	lRot(by: number): U64 {
		const s = this.shift(by & rotMask64);
		// [hh hl lh ll]
		//console.log(hex.fromU32s(s,' '));
		return new U64(Uint32Array.of(s[3] | s[1], s[2] | s[0]));
	}

	/**
	 * Shift bits right by @see by places, zeros are brought in (sign unaware)
	 * (same as >>>)
	 * @param by number 0-63
	 * @returns shifted value
	 */
	rShift(by: number): U64 {
		const s = this.shift(64 - by);
		// [hh hl lh ll]
		return new U64(Uint32Array.of(s[1], s[0]));
	}

	/**
	 * Rotate bits right be @see by places, bringing the outgoing bits in on the left
	 * @param by number 0-64
	 * @returns rotated value
	 */
	rRot(by: number): U64 {
		const s = this.shift(64 - by);
		return new U64(Uint32Array.of(s[3] | s[1], s[2] | s[0]));
	}

	/**
	 * @see value + @param u64
	 * @param u64
	 * @returns @see value + @param u64
	 */
	add(u64: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		this._addEq(arr, 0, u64);
		return new U64(arr, 0);
	}

	/**
	 * @see value - @param u64
	 * @param u64
	 * @returns @see value - @param u64
	 */
	sub(u64: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		this._subEq(arr, 0, u64);
		return new U64(arr, 0);
	}

	/**
	 * @see value * @param u64
	 * @param u64
	 * @returns @see value * @param u64
	 */
	mul(u64: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		this._mulEq(arr, 0, u64);
		return new U64(arr);
	}

	/**
	 * Whether @see other has the same value as this
	 * @param u64
	 * @returns
	 */
	eq(u64: U64): boolean {
		//Will fast exit if lows don't match (not constant)
		return (
			this.arr[this.pos] == u64.arr[u64.pos] &&
			this.arr[this.pos + 1] == u64.arr[u64.pos + 1]
		);
	}

	/**
	 * Whether this is > @param u64
	 * @param u64
	 * @returns
	 */
	gt(u64: U64): boolean {
		//Compare high
		const hGt = this.arr[this.pos + 1] > u64.arr[u64.pos + 1];
		const hEq = this.arr[this.pos + 1] === u64.arr[u64.pos + 1];
		const lGt = this.arr[this.pos] > u64.arr[u64.pos];
		return hGt || (hEq && lGt);
	}

	/**
	 * Whether this < @param u64
	 * @param u64
	 * @returns
	 */
	lt(u64: U64): boolean {
		//Compare high
		const hLt = this.arr[this.pos + 1] < u64.arr[u64.pos + 1];
		const hEq = this.arr[this.pos + 1] === u64.arr[u64.pos + 1];
		const lLt = this.arr[this.pos] < u64.arr[u64.pos];
		return hLt || (hEq && lLt);
	}

	/**
	 * Whether this >= @param u64
	 * @param u64
	 * @returns
	 */
	gte(u64: U64): boolean {
		const hGt = this.arr[this.pos + 1] > u64.arr[u64.pos + 1];
		const hEq = this.arr[this.pos + 1] === u64.arr[u64.pos + 1];
		const lGte = this.arr[this.pos] >= u64.arr[u64.pos];
		return hGt || (hEq && lGte);
	}

	/**
	 * Whether this <= @param u64
	 * @param u64
	 * @returns
	 */
	lte(u64: U64): boolean {
		const hLt = this.arr[this.pos + 1] < u64.arr[u64.pos + 1];
		const hEq = this.arr[this.pos + 1] === u64.arr[u64.pos + 1];
		const lLte = this.arr[this.pos] <= u64.arr[u64.pos];
		return hLt || (hEq && lLte);
	}

	/**
	 * Whether @param u64 has the same value as this
	 * CONSTANT TIME
	 * @param u64
	 * @returns
	 */
	ctEq(u64: U64): boolean {
		const zero =
			(this.arr[this.pos] ^ u64.arr[u64.pos]) |
			(this.arr[this.pos + 1] ^ u64.arr[u64.pos + 1]);
		return zero === 0;
	}

	/**
	 * Whether this is <= @param u64
	 * CONSTANT TIME
	 * @param u64
	 * @returns
	 */
	ctLte(u64: U64): boolean {
		const ll =
			((this.arr[this.pos] & maxU16) - (u64.arr[u64.pos] & maxU16) - 1) >>> 31;
		const lh =
			(((this.arr[this.pos] >>> 16) & maxU16) -
				((u64.arr[u64.pos] >>> 16) & maxU16) -
				1) >>>
			31;
		const hl =
			((this.arr[this.pos + 1] & maxU16) -
				(u64.arr[u64.pos + 1] & maxU16) -
				1) >>>
			31;
		const hh =
			(((this.arr[this.pos + 1] >>> 16) & maxU16) -
				((u64.arr[u64.pos + 1] >>> 16) & maxU16) -
				1) >>>
			31;
		return (ll & lh & hl & hh) === 1;
	}

	/**
	 * Whether this is >= @param u64
	 * CONSTANT TIME
	 * @param u64
	 * @returns
	 */
	ctGte(u64: U64): boolean {
		const ll =
			((u64.arr[u64.pos] & maxU16) - (this.arr[this.pos] & maxU16) - 1) >>> 31;
		const lh =
			(((u64.arr[u64.pos] >>> 16) & maxU16) -
				((this.arr[this.pos] >>> 16) & maxU16) -
				1) >>>
			31;
		const hl =
			((u64.arr[u64.pos + 1] & maxU16) -
				(this.arr[this.pos + 1] & maxU16) -
				1) >>>
			31;
		const hh =
			(((u64.arr[u64.pos + 1] >>> 16) & maxU16) -
				((this.arr[this.pos + 1] >>> 16) & maxU16) -
				1) >>>
			31;
		return (ll & lh & hl & hh) === 1;
	}

	/**
	 * Whether this is > @param u64
	 * CONSTANT TIME
	 * @param u64
	 * @returns
	 */
	ctGt(u64: U64): boolean {
		const ll =
			((this.arr[this.pos] & maxU16) - (u64.arr[u64.pos] & maxU16) - 1) >>> 31;
		const lh =
			(((this.arr[this.pos] >>> 16) & maxU16) -
				((u64.arr[u64.pos] >>> 16) & maxU16) -
				1) >>>
			31;
		const hl =
			((this.arr[this.pos + 1] & maxU16) -
				(u64.arr[u64.pos + 1] & maxU16) -
				1) >>>
			31;
		const hh =
			(((this.arr[this.pos + 1] >>> 16) & maxU16) -
				((u64.arr[u64.pos + 1] >>> 16) & maxU16) -
				1) >>>
			31;
		return (ll & lh & hl & hh) === 0;
	}

	/**
	 * Whether this is < @param u64
	 * CONSTANT TIME
	 * @param u64
	 * @returns
	 */
	ctLt(u64: U64): boolean {
		const ll =
			((u64.arr[u64.pos] & maxU16) - (this.arr[this.pos] & maxU16) - 1) >>> 31;
		const lh =
			(((u64.arr[u64.pos] >>> 16) & maxU16) -
				((this.arr[this.pos] >>> 16) & maxU16) -
				1) >>>
			31;
		const hl =
			((u64.arr[u64.pos + 1] & maxU16) -
				(this.arr[this.pos + 1] & maxU16) -
				1) >>>
			31;
		const hh =
			(((u64.arr[u64.pos + 1] >>> 16) & maxU16) -
				((this.arr[this.pos + 1] >>> 16) & maxU16) -
				1) >>>
			31;
		return (ll & lh & hl & hh) === 0;
	}

	/**
	 * Constatnt time switch to u64 if yes==true or stay the the same (yes==false)
	 * @param u64
	 * @param yes Whether to switch
	 * @returns this or u64
	 */
	ctSwitch(u64: U64, yes: boolean): U64 {
		// @ts-expect-error: We're casting bool->number on purpose
		const yNum = (yes | 0) - 1; //-1 or 0
		const y64 = U64.fromUint32Pair(yNum, yNum);
		return y64.not().and(u64).or(y64.and(this));
	}

	/**
	 * Constant time select returns a64 if first==true, or b64 if first==false
	 * @param a64
	 * @param b64
	 * @param first
	 * @returns a64 or b64
	 */
	static ctSelect(a64: U64, b64: U64, first: boolean): U64 {
		// @ts-expect-error: We're casting bool->number on purpose
		const fNum = (first | 0) - 1; //-1 or 0
		const f64 = U64.fromUint32Pair(fNum, fNum);
		return f64.not().and(a64).or(f64.and(b64));
	}

	/**
	 * Create a copy of this U64
	 * @returns
	 */
	clone(): U64 {
		return new U64(this.arr.slice(this.pos, this.pos + 2));
	}

	/**
	 * Mutate - create a new U64Mut with a copy of this value
	 */
	mut(): U64Mut {
		return U64Mut.fromArray(this.arr.slice(this.pos, this.pos + 2));
	}

	/**
	 * String version of this value, in big endian
	 * @returns
	 */
	toString(): string {
		return 'u64{' + hex.fromBytes(this.toBytesBE()) + '}';
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array[8]
	 */
	toBytesBE(): Uint8Array {
		//Invert l/h & project into bytes
		const r = new Uint8Array(
			Uint32Array.of(this.arr[this.pos + 1], this.arr[this.pos]).buffer
		);
		asBE.i32(r, 0);
		asBE.i32(r, 4);
		return r;
	}

	/**
	 * Value as a minimum stream of bytes (big-endian order)
	 * Drops leading zero-bytes (a minimum of 1 byte will always be returned)
	 * **NOTE** while the content is a copy of internal state, the return is shared memory (with all 8 bytes)
	 * @returns 1-8 bytes
	 */
	toMinBytesBE():Uint8Array {
		const ret=this.toBytesBE();
		let i=0;
		while(i<8) {
			if (ret[i++]!==0) break;
		}
		return ret.subarray(i-1);
	}

	/**
	 * Value as a stream of bytes (little-endian order) COPY
	 * @returns Uint8Array[8]
	 */
	toBytesLE(): Uint8Array {
		const r8 = new Uint8Array(this.arr.slice(this.pos, this.pos + 2).buffer);
		asLE.i32(r8, 0);
		asLE.i32(r8, 4);
		return r8;
	}

	/**
	 * Value as a minimum stream of bytes (little-endian order)
	 * Drops trailing zero-bytes (a minimum of 1 byte will always be returned)
	 * **NOTE** while the content is a copy of internal state, the return is shared memory (with all 8 bytes)
	 * @returns 1-8 bytes
	 */
	toMinBytesLE():Uint8Array {
		const ret=this.toBytesLE();
		let i=8;
		while(i>0) {
			if (ret[--i]!==0) break;	
		}
		return ret.subarray(0,i+1);
	}

	/**
	 * Get the least significant byte
	 * @param idx 0-7 (%7)
	 * @returns
	 */
	lsb(idx = 0): number {
		//NOTE: This relies on numbers always being reported as Big Endian
		// no matter the platform endianness
		idx &= 7; //Only 8 spaces to chose from (zero indexed)
		//The MSB indicates which byte to access
		const shift = idx >> 2;
		//Limit IDX to 0-3 (&3) and then switch to bits (<<3)
		idx = (idx & 3) << 3;
		return (this.arr[this.pos + shift] >>> idx) & 0xff;
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51
	 * @returns
	 */
	static fromIntUnsafe(uint51: number): U64 {
		return new U64(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1));
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51 0-Number.MAX_SAFE_INT
	 * @returns
	 */
	static fromInt(uint51: number): U64 {
		safety.intGte(uint51, 0, 'uint51');
		return new U64(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1));
	}

	/**
	 * Build from a pair of integers, each truncated to 32 bits
	 * @param uint32low
	 * @param uint32high
	 * @returns
	 */
	static fromUint32Pair(uint32low: number, uint32high: number): U64 {
		return new U64(Uint32Array.of(uint32low, uint32high));
	}

	/**
	 * Created a "view" into an existing Uint32Array
	 * **NOTE** the memory is shared, changing a value in @param source will mutate the state
	 * @param source
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(source: Uint32Array, pos = 0): U64 {
		return new U64(source, pos);
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in big endian order
	 * @param src
	 * @param pos
	 * @returns
	 */
	static fromBytesBE(src: Uint8Array, pos = 0): U64 {
		return new U64(fromBytesBE(src, pos));
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in little endian order
	 * @param src 
	 * @param pos 
	 * @returns 
	 */
	static fromBytesLE(src: Uint8Array, pos = 0): U64 {
		return new U64(fromBytesLE(src, pos));
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
	static fromBuffer(src: ArrayBuffer, bytePos = 0): U64 {
		return new U64(new Uint32Array(src, bytePos, 2));
	}

	/**
	 * A new Uint64 with value 18446744073709551616 (the maximum Uint64)
	 */
	static get max(): U64 {
		return max;
	}

	/**
	 * A new Uint64 with value 0 (the minimum Uint64)
	 */
	static get min(): U64 {
		return zero;
	}

	/**
	 * A new Uint64 with value 0
	 */
	static get zero(): U64 {
		return zero;
	}

	/**
	 * Given a number create a new Uint64
	 * Given a U64return it
	 * @param uint64
	 * @returns
	 */
	static coerce(uint64: U64ish): U64 {
		if (uint64 instanceof U64) {
			return uint64;
		} else {
			safety.intGte(uint64, 0, 'uint64');
			return new U64(Uint32Array.of(uint64 << 0, uint64 / maxU32Plus1));
		}
	}
}
const zero = U64.fromIntUnsafe(0);
const max = U64.fromUint32Pair(0xffffffff, 0xffffffff);

export class U64Mut extends U64 {
	/**
	 * @see value ⊕= `u64`
	 * @param u64
	 * @returns this (chainable)
	 */
	xorEq(u64: U64): U64Mut {
		this._xorEq(this.arr, this.pos, u64);
		return this;
	}

	/**
	 * @see value ∨= `u64`
	 * @param u64
	 * @returns this (chainable)
	 */
	orEq(u64: U64): U64Mut {
		this._orEq(this.arr, this.pos, u64);
		return this;
	}

	/**
	 * @see value ∧= `u64`
	 * @param u64
	 * @returns this (chainable)
	 */
	andEq(u64: U64): U64Mut {
		this._andEq(this.arr, this.pos, u64);
		return this;
	}

	/**
	 * ¬= @see value
	 * @returns this (chainable)
	 */
	notEq(): U64Mut {
		this.arr[this.pos] = ~this.arr[this.pos];
		this.arr[this.pos + 1] = ~this.arr[this.pos + 1];
		return this;
	}

	/**
	 * @see value ROL @param by
	 * @param by integer 0-63
	 * @returns this (chainable)
	 */
	lShiftEq(by: number): U64Mut {
		const s = this.shift(by);
		// [hh hl lh ll]
		this.arr[this.pos] = s[3];
		this.arr[this.pos + 1] = s[2];
		return this;
	}

	/**
	 * Rotate bits left by @see by, bringing the outgoing bits in on the right
	 * @param by integer 0-63
	 * @returns this (chainable)
	 */
	lRotEq(by: number): U64Mut {
		const s = this.shift(by & rotMask64);
		// [hh hl lh ll]
		this.arr[this.pos] = s[3] | s[1];
		this.arr[this.pos + 1] = s[2] | s[0];
		return this;
	}

	/**
	 * Shift bits right by @see by places, zeros are brought in (sign unaware)
	 * (same as >>>)
	 * @param by number 0-63
	 * @returns shifted value
	 */
	rShiftEq(by: number): U64Mut {
		const s = this.shift(64 - by);
		// [hh hl lh ll]
		this.arr[this.pos] = s[1];
		this.arr[this.pos + 1] = s[0];
		return this;
	}

	/**
	 * @see value ROR @param by
	 * @param by integer 0-31
	 * @returns this (chainable)
	 */
	rRotEq(by: number): U64Mut {
		const s = this.shift(64 - by);
		this.arr[this.pos] = s[3] | s[1];
		this.arr[this.pos + 1] = s[2] | s[0];
		return this;
	}

	/**
	 * @see value += @param b
	 * @param b
	 * @returns @see value + @param b
	 */
	addEq(b: U64): U64Mut {
		this._addEq(this.arr, this.pos, b);
		return this;
	}

	/**
	 * @see value -= @param b
	 * @param b
	 * @returns @see value -= @param b
	 */
	subEq(b: U64): U64Mut {
		this._subEq(this.arr, this.pos, b);
		return this;
	}

	/**
	 * @see value *= @param b
	 * @param b
	 * @returns @see value * @param b
	 */
	mulEq(b: U64): U64Mut {
		this._mulEq(this.arr, this.pos, b);
		return this;
	}

	/**
	 * Create a copy of this U64Mut
	 * @returns
	 */
	clone(): U64Mut {
		return new U64Mut(this.arr.slice(this.pos, this.pos + 2));
	}

	/**
	 * Update value
	 * @param u64
	 * @returns
	 */
	set(u64: U64): U64Mut {
		super._setValue(u64);
		return this;
	}

	/**
	 * Zero out this value
	 */
	zero(): void {
		this.arr.fill(0, this.pos, this.pos + 2);
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51
	 * @returns
	 */
	static fromIntUnsafe(uint51: number): U64Mut {
		return new U64Mut(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1));
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51 0-Number.MAX_SAFE_INT
	 * @throws If uint51 is out of range or not an int
	 * @returns
	 */
	static fromInt(uint51: number): U64Mut {
		safety.intGte(uint51, 0, 'uint51');
		return new U64Mut(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1));
	}

	/**
	 * Build from a pair of integers, each truncated to 32 bits
	 * @param uint32low
	 * @param uint32high
	 * @returns
	 */
	static fromUint32Pair(uint32low: number, uint32high: number): U64Mut {
		return new U64Mut(Uint32Array.of(uint32low, uint32high));
	}

	/**
	 * Created a "view" into an existing Uint32Array
	 * **NOTE** the memory is shared, changing a value in `src` will mutate the return, and
	 *  changes to the Uint32Mut will alter `src`
	 * **NOTE** The first element is considered LOW, the second HIGH
	 *
	 * If you don't need the shared-memory aspect append a `.slice()` to the source (creates a memory copy)
	 * @param src
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(src: Uint32Array, pos = 0): U64Mut {
		return new U64Mut(src, pos);
	}

	/**
	 * Create from a copy of `src`
	 * @param src
	 * @param pos
	 * @returns
	 */
	static fromBytesBE(src: Uint8Array, pos = 0): U64Mut {
		return new U64Mut(fromBytesBE(src, pos));
	}

	/**
	 * Given a number create a new U64Mut (will throw if <0)
	 * Given a U64 mutate it (memory copy)
	 *
	 * @param uint64
	 * @returns
	 */
	static coerce(uint64: U64ish): U64Mut {
		if (uint64 instanceof U64) {
			return uint64.mut();
		} else {
			safety.intGte(uint64, 0, 'uint64');
			return new U64Mut(Uint32Array.of(uint64 << 0, uint64 / maxU32Plus1));
		}
	}
}

export class U64MutArray {
	private buf: Uint32Array;
	private bufPos: number;
	private arr: Array<U64Mut>;

	/**
	 *
	 * @param buf backing memory
	 * @param bufPos position in backing memory to start at (needs to be uint32 aligned)
	 * @param len number of elements in this array (buf needs to be at least 2x in size)
	 */
	protected constructor(buf: Uint32Array, bufPos = 0, len?: number) {
		//Default to rest of the array (will round down if uneven)
		if (len === undefined) {
			len = (buf.length - bufPos) >> 1; //div 2 - we need two u32 per u64
		}
		this.buf = buf;
		this.bufPos = bufPos;
		this.arr = new Array<U64Mut>(len);
		for (let i = 0; i < len; i++)
			this.arr[i] = U64Mut.fromArray(this.buf, this.bufPos + i + i);

		//While a proxy is nice to have, it causes some pretty wicked slowdown in ANY access to this
		// object (.. I mean, it's in the name).  Even if you're accessing a valid element it still
		// goes through the proxy (see: prop in target) so for high performance, we drop
	}

	get length(): number {
		return this.arr.length;
	}

	/**
	 * Get the item at given index
	 * @param idx 0 - length-1
	 * @returns Element at position, or undefined if `index` is out of range
	 */
	at(idx: number): U64Mut {
		//if (idx < 0) idx += this.length;
		//if (idx < 0 || idx >= this.length) return undefined;
		return this.arr[idx];
		//return U64Mut.fromArray(this.buf,this.pos + idx+ idx);
	}

	/**
	 * Set from `src` starting at `srcOffset` into this array starting at `thisOffset`
	 * @param src
	 * @param thisOffset Called `targetOffset` in TypedArray (default 0)
	 * @param srcOffset (default 0)
	 */
	set(src: U64MutArray, thisOffset = 0, srcOffset = 0): void {
		//Note because the buffers are 2x the size, the offsets need to be doubled (added twice)
		this.buf.set(
			src.buf.subarray(src.bufPos + srcOffset + srcOffset),
			this.bufPos + thisOffset + thisOffset
		);
	}

	/**
	 * XorEq @param b with this array.  Starting at @param startAt position in this array
	 * and running until there's no more space (in this array) or the other array runs out
	 * @param b
	 * @param thisOffset
	 */
	xorEq(b: U64MutArray, thisOffset = 0): void {
		//Offset(el) needs to be doubled for buf
		const bufStart = this.bufPos + thisOffset + thisOffset;
		//For all the space of this array
		let elLen = this.arr.length - thisOffset;
		//OR all the provided array if it's shorter
		if (b.length < elLen) elLen = b.length;
		//Adjust n for the buffer starting position, and double it (buf-len instead of el-len)
		const bufLen = elLen + elLen + bufStart;
		for (let i = bufStart, j = b.bufPos; i < bufLen; i++, j++) {
			this.buf[i] ^= b.buf[j];
		}
	}

	zero(thisOffset = 0): void {
		//Offset(el) needs to be doubled for buf
		const bufStart = this.bufPos + thisOffset + thisOffset;
		//End element We only need to zero this length - thisOffset
		const elLen = this.arr.length - thisOffset;
		//Need to double elEnd for buf
		this.buf.fill(0, bufStart, bufStart + elLen + elLen);
	}

	clone(): U64MutArray {
		return new U64MutArray(
			this.buf.slice(this.bufPos, this.bufPos + this.length + this.length),
			0
		);
	}

	/**
	 * Create a section of this array which SHARES the same memory
	 * NOTE: This is the same semantics as TypedArray.subarray, which feels ambiguous with Go:slices
	 * @param start Starting element to copy from (default 0/first)
	 * @param len
	 */
	span(start?: number, len?: number): U64MutArray {
		if (start === undefined) {
			start = 0;
		}
		start += this.bufPos;
		return new U64MutArray(this.buf, start, len);
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array[8]
	 */
	toBytesBE(): Uint8Array {
		const r32 = this.buf.slice(
			this.bufPos,
			this.bufPos + this.length + this.length
		);
		const r8 = new Uint8Array(r32.buffer);
		let i8 = 0;
		for (let i = 0; i < r32.length; i += 2) {
			//U32 swap
			const t = r32[i];
			r32[i] = r32[i + 1];
			r32[i + 1] = t;
			//byte fix (maybe)
			asBE.i32(r8, i8);
			i8 += 4;
			asBE.i32(r8, i8);
			i8 += 4;
		}
		return r8;
	}
	toBytesLE(): Uint8Array {
		const r32 = this.buf.slice(
			this.bufPos,
			this.bufPos + this.length + this.length
		);
		const r8 = new Uint8Array(r32.buffer);
		for (let i = 0; i < r8.length; i += 4) {
			asLE.i32(r8, i);
		}
		return r8;
	}

	toString(): string {
		return 'u64array{len=' + this.length + '}';
	}

	static fromLen(len: number): U64MutArray {
		const arr = new Uint32Array(len << 1);
		return new U64MutArray(arr, 0, len);
	}

	/**
	 * Build from a byte array (shared memory)
	 * NOTE: The first 4* bytes must be in platform-endian order, and LOW, the second 4* bytes=high
	 * 	- Platform-LE, bytes should be in LE order: 0,1,2,3,4,5,6,7
	 *  - Platform-BE, bytes should be in mixed: 3,2,1,0,7,6,5,4
	 * **USE WITH CAUTION**
	 * @param buffer
	 * @param bytePos
	 * @param byteLen
	 * @returns
	 */
	static fromBytes(
		buffer: ArrayBuffer,
		bytePos = 0,
		byteLen?: number
	): U64MutArray {
		//if (!(buffer instanceof ArrayBuffer)) throw TypeError('Expecting ArrayBuffer');
		if (byteLen === undefined) {
			byteLen = buffer.byteLength - bytePos;
		}
		byteLen >>= 2; //div 4 - make it u32-element count rather than byte count
		return new U64MutArray(new Uint32Array(buffer, bytePos, byteLen), 0);
	}
}
