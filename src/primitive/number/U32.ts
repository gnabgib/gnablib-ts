/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { hex } from '../../codec/Hex.js';
import { asBE, asLE } from '../../endian/platform.js';
import { sNum } from '../../safe/safe.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT_U32 = 'U32';
const DBG_RPT_U32Mut = 'U32Mut';
const DBG_RPT_U32MutArray = 'U32MutArray';
const maxU32 = 0xffffffff;
const maxU16 = 0xffff;
const sizeBytes = 4;
const sizeBits = 32;
const rotMask = 0x1f;

export type U32ish = U32 | Uint32Array | number;

/**
 * U32/U32Mut are designed to be projections down onto a Uint32Array
 * - when built from a number a new one element array is built
 * - when built from a buffer or array, the memory is linked, which brings the risk of external changes, but
 *   the benefit of reduced memory allocation
 *
 * U32 cannot be mutated in place (doesn't support an *Eq methods), however
 *  if it's generated from a buffer or array external process can mutate
 *
 * U32Mut has memory allocation benefits (when using *Eq methods) since it doesn't allocate for each op,
 *  the best pattern is manually cloning (.mut for either, .clone for U32Mut) and the *Eq() methods whereever possible
 */

export class U32 {
	protected arr: Uint32Array;
	protected pos: number;

	protected constructor(arr: Uint32Array, pos = 0) {
		this.arr = arr;
		this.pos = pos;
	}

	get value(): number {
		return this.arr[this.pos];
	}

	/**
	 * Used by U32Mut (notice protection) so we can look inside
	 * @param v
	 * @returns
	 */
	protected _valueOf(v: U32): number {
		return v.arr[v.pos];
	}
	protected static _mulEq(a: Uint32Array, aPos: number, b32: U32): number {
		const b0 = b32.arr[b32.pos] & maxU16;
		const b1 = b32.arr[b32.pos] >>> 16;
		return a[aPos] * b0 + ((a[aPos] * b1) << 16);
	}

	/**
	 * @see value ⊕ @param u32
	 * @param u32
	 * @returns @see value ⊕ @param u32
	 */
	xor(u32: U32): U32 {
		return new U32(Uint32Array.of(this.arr[this.pos] ^ u32.arr[u32.pos]));
	}

	/**
	 * @see value ∨ @param u32
	 * @param u32
	 * @returns @see value ∨ @param u32
	 */
	or(u32: U32): U32 {
		return new U32(Uint32Array.of(this.arr[this.pos] | u32.arr[u32.pos]));
	}

	/**
	 * @see value ∧ @param u32
	 * @param u32
	 * @returns @see value ∧ @param u32
	 */
	and(u32: U32): U32 {
		return new U32(Uint32Array.of(this.arr[this.pos] & u32.arr[u32.pos]));
	}

	/**
	 * ¬ @see value
	 * @returns ¬ @see value
	 */
	not(): U32 {
		return new U32(Uint32Array.of(~this.arr[this.pos]));
	}

	/**
	 * @see value ROL @param by
	 * @param by Integer 0-31
	 * @returns @see value ROL @see param
	 */
	lRot(by: number): U32 {
		by &= 31;
		return new U32(
			Uint32Array.of(
				(this.arr[this.pos] << by) | (this.arr[this.pos] >>> (sizeBits - by))
			)
		);
	}

	/**
	 * @see value << @param by - zeros are brought in
	 * @param by integer 0-31
	 * @returns @see value << @param by
	 */
	lShift(by: number): U32 {
		const arr = new Uint32Array(1);
		arr[by >>> 5] = this.arr[this.pos] << by;
		return new U32(arr);
	}

	/**
	 * @see value ROR @param by
	 * @param by integer 0-31
	 * @returns @see value ROR  @param by
	 */
	rRot(by: number): U32 {
		by &= 31;
		return new U32(
			Uint32Array.of(
				(this.arr[this.pos] >>> by) | (this.arr[this.pos] << (sizeBits - by))
			)
		);
	}

	/**
	 * @see value >> @param by - zeros are brought in
	 * @param by integer 0-31
	 * @returns @see value >> @param by
	 */
	rShift(by: number): U32 {
		const arr = new Uint32Array(1);
		arr[by >>> 5] = this.arr[this.pos] >>> by;
		return new U32(arr);
	}

	/**
	 * @see value + @param u32
	 * @param u32
	 * @returns @see value + @param u32
	 */
	add(u32: U32): U32 {
		return new U32(Uint32Array.of(this.arr[this.pos] + u32.arr[u32.pos]));
	}

	/**
	 * `$value` - `$u32`
	 * @param u32
	 * @returns Subtraction
	 */
	sub(u32: U32): U32 {
		return new U32(Uint32Array.of(this.arr[this.pos] - u32.arr[u32.pos]));
	}

	/**
	 * `$value` *  `$n`
	 * Multiply without going int o floating point (possible if large numbers)
	 * @param n
	 * @returns Product (may overflow)
	 */
	mul(n: U32): U32 {
		return new U32(Uint32Array.of(U32._mulEq(this.arr, this.pos, n)));
	}

	/**
	 * Create a copy of this U32
	 * @returns
	 */
	clone(): U32 {
		return new U32(this.arr.slice(this.pos, this.pos + 1));
	}

	/**
	 * Mutate - create a new Uint32Mut with a copy of this value
	 */
	mut(): U32Mut {
		return U32Mut.fromArray(this.arr.slice(this.pos, this.pos + 1));
	}

	/**
	 * String version of this value, in big endian
	 * @returns
	 */
	toString(): string {
		return hex.fromI32(this.arr[this.pos]);
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array[4]
	 */
	toBytesBE(): Uint8Array {
		const r = new Uint8Array(this.arr.slice(this.pos, this.pos + 1).buffer);
		asBE.i32(r, 0);
		return r;
	}

	/**
	 * Value as a stream of bytes (little-endian order) COPY
	 * @returns Uint8Array[4]
	 */
	toBytesLE(): Uint8Array {
		const r = new Uint8Array(this.arr.slice(this.pos, this.pos + 1).buffer);
		asLE.i32(r, 0);
		return r;
	}

	/**
	 * Get the least significant byte
	 * @param idx 0-3 (%3)
	 */
	lsb(idx = 0): number {
		//NOTE: This relies on numbers always being reported as Big Endian
		// no matter the platform endianness
		idx &= 3; //Only 4 spaces to chose from (zero indexed)
		//Switch idx to bits
		idx <<= 3; //*8
		return (this.arr[this.pos] >>> idx) & 0xff;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT_U32;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT_U32}(${this.toString()})`;
	}

	/**
	 * Build a Uint32 from an integer
	 * @param uint32 Integer 0-0xFFFFFFFF (4294967295)
	 * @throws If uint32 is out of range or not an int
	 * @returns
	 */
	static fromInt(uint32: number): U32 {
		sNum('uint32', uint32).unsigned().atMost(maxU32).throwNot();
		return new U32(Uint32Array.of(uint32));
	}

	/**
	 * Created a "view" into an existing Uint32Array
	 * **NOTE** the memory is shared, changing a value in @param source will mutate the state
	 * @param source
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(source: Uint32Array, pos = 0): U32 {
		return new U32(source, pos);
	}

	/**
	 * Create a view into an `ArrayBuffer`.  Note this relies on platform endian (likely little endian)
	 * **NOTE** Memory is shared (like @see fromArray)
	 * **NOTE** Subject to the same JS limitation that `bytePos` must be a multiple of element-size (4)
	 * @param src
	 * @param bytePos
	 * @returns
	 */
	static fromBuffer(src: ArrayBuffer, bytePos = 0): U32 {
		return new U32(new Uint32Array(src, bytePos, 1));
	}

	/**
	 * A new Uint32 with value 4294967295 (the maximum uint32)
	 */
	static get max(): U32 {
		return max;
	}

	/**
	 * A new Uint32 with value 0 (the minimum uint32)
	 */
	static get min(): U32 {
		return zero;
	}

	/**
	 * A new Uint32 with value 0
	 */
	static get zero(): U32 {
		return zero;
	}

	/**
	 * Given a number create a new Uint32 (will throw if <0 >0xffffffff)
	 * Given a Uint32Array link to the first element (linked memory)
	 * Given a Uint32 return it
	 *
	 * If you have a Uint32Array and want something beyond the first element (index 0)
	 * @see fromArray
	 * @param uint32
	 * @returns
	 */
	static coerce(uint32: U32ish): U32 {
		if (uint32 instanceof U32) {
			return uint32;
		} else if (uint32 instanceof Uint32Array) {
			return new U32(uint32);
		} else {
			sNum('uint32', uint32).unsigned().atMost(maxU32).throwNot();
			return new U32(Uint32Array.of(uint32), 0);
		}
	}

	/**
	 * Treat i32 as a signed/unsigned 32bit number, and rotate left
	 * NOTE: JS will sign the result, (fix by `>>>0`)
	 * NOTE: If you're using with UInt32Array you don't need to worry about sign
	 * @param i32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param by amount to rotate 0-31 (%32 if oversized)
	 * @returns Left rotated number, NOTE you may wish to `>>>0`
	 */
	static rol(i32: number, by: number): number {
		//No need to truncate input (bitwise is only 32bit)
		by &= rotMask;
		return (i32 << by) | (i32 >>> (sizeBits - by));
	}

	/**
	 * Treat i32 as a signed/unsigned 32bit number, and rotate right
	 * NOTE: JS will sign the result, (fix by `>>>0`)
	 * NOTE: If you're using with UInt32Array you don't need to worry about sign
	 * @param i32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param by amount to rotate 0-31 (%32 if oversized)
	 * @returns Right rotated number, NOTE you may wish to `>>>0`
	 */
	static ror(i32: number, by: number): number {
		//No need to truncate input (bitwise is only 32bit)
		by &= rotMask;
		return (i32 >>> by) | (i32 << (sizeBits - by));
	}

	//static mul(a32: number, b32: number): number : use Math.imul instead

	/**
	 * Compare two numbers for equality in constant time
	 * @param a32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @returns
	 */
	static ctEq(a32: number, b32: number): boolean {
		return (a32 ^ b32) === 0;
	}

	/**
	 * ` a32 <= b32` in constant time
	 * **NOTE** Behaviour is undefined if params are int32 (because in 2s compliment negative numbers are > positive)
	 * @param a32 uint32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32, if larger than 32 bits it'll be truncated
	 * @returns
	 */
	static ctLte(a32: number, b32: number): boolean {
		const l = ((a32 & maxU16) - (b32 & maxU16) - 1) >>> 31;
		const h = (((a32 >>> 16) & maxU16) - ((b32 >>> 16) & maxU16) - 1) >>> 31;
		return (l & h) === 1;
	}

	/**
	 * `a32 >= b32` in constant time
	 * **NOTE** Behaviour is undefined if params are int32 (because in 2s compliment negative numbers are > positive)
	 * @param a32 uint32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32, if larger than 32 bits it'll be truncated
	 * @returns
	 */
	static ctGte(a32: number, b32: number): boolean {
		const l = ((b32 & maxU16) - (a32 & maxU16) - 1) >>> 31;
		const h = (((b32 >>> 16) & maxU16) - ((a32 >>> 16) & maxU16) - 1) >>> 31;
		return (l & h) === 1;
	}

	/**
	 * `a32 > b32` in constant time
	 * **NOTE** Behaviour is undefined if params are int32 (because in 2s compliment negative numbers are > positive)
	 * @param a32 uint32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32, if larger than 32 bits it'll be truncated
	 * @returns
	 */
	static ctGt(a32: number, b32: number): boolean {
		const l = ((a32 & maxU16) - (b32 & maxU16) - 1) >>> 31;
		const h = (((a32 >>> 16) & maxU16) - ((b32 >>> 16) & maxU16) - 1) >>> 31;
		return (l & h) === 0;
	}

	/**
	 * `a32 < b32` in constant time
	 * **NOTE** Behaviour is undefined if params are int32 (because in 2s compliment negative numbers are > positive)
	 * @param a32 uint32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32, if larger than 32 bits it'll be truncated
	 * @returns
	 */
	static ctLt(a32: number, b32: number): boolean {
		const l = ((b32 & maxU16) - (a32 & maxU16) - 1) >>> 31;
		const h = (((b32 >>> 16) & maxU16) - ((a32 >>> 16) & maxU16) - 1) >>> 31;
		return (l & h) === 0;
	}

	/**
	 * Constant time select returns a32 if first==true, or b32 if first==false
	 * Result may be negative (`>>>0` to fix)
	 * @param a32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param first
	 * @returns a32 or b32
	 */
	static ctSelect(a32: number, b32: number, first: boolean): number {
		// @ts-expect-error: We're casting bool->number on purpose
		const fNum = (first | 0) - 1; //-1 or 0
		return (~fNum & a32) | (fNum & b32);
	}

	/**
	 * Whether two int32 values have the same sign (both negative, both positive)
	 * @param i64a int32, if larger than 32 bits it'll be truncated 0-2147483647
	 * @param i64b int32, if larger than 32 bits it'll be truncated 0-2147483647
	 */
	static sameSign(i64a: number, i64b: number): boolean {
		//The MSBit is 1 if it's negative, 0 if not.. so if both or neither are ^=0
		// If only one is, then ^=1.  Since MSbit=1 is <0 we can xor the two, and
		// see if it's positive to confirm they're the same sign
		return (i64a ^ i64b) >= 0;
	}

	/**
	 * Get the average of two 32 bit numbers
	 * @param a32 uint32/int32, if larger than 32 bits it'll be truncated
	 * @param b32 uint32/int32, if larger than 32 bits it'll be truncated
	 */
	static average(a32: number, b32: number): number {
		//Either works
		return (a32 | b32) - ((a32 ^ b32) >>> 1);
		//return ((a32^b32)>>1) + (a32&b32)
	}

	/**
	 * Convert 0-4 bytes from @param src starting at @param pos into a u32/i32 in little endian order (smallest byte first)
	 * Zeros will be appended if src is short (ie 0xff will be considered 256)
	 * Result may be negative (`>>>0` to fix)
	 * @param src
	 * @param pos
	 * @returns
	 */
	static iFromBytesLE(src: Uint8Array, pos = 0): number {
		return (
			src[pos] |
			(src[pos + 1] << 8) |
			(src[pos + 2] << 16) |
			(src[pos + 3] << 24)
		);
	}

	/**
	 * Convert 0-4 bytes from @param src starting at @param pos into a u32/i32 in big endian order (smallest byte last)
	 * Zeros will be prepended if src is short (ie 0xff will be considered 256)
	 * Result may be negative (`>>>0` to fix)
	 * @param src
	 * @param pos
	 * @returns
	 */
	static iFromBytesBE(src: Uint8Array, pos = 0): number {
		const rem = sizeBytes - (src.length - pos);
		let ret =
			(src[pos] << 24) |
			(src[pos + 1] << 16) |
			(src[pos + 2] << 8) |
			src[pos + 3];
		//If there's not enough space, downshift the result
		// (sizeBytes+rem) turns the negative number into the amount of byte shifting to do
		// <<3 turns the byte shift into bit shift (aka *8)
		if (rem > 0) ret >>>= rem << 3;
		return ret;
	}

	static toBytesLE(src: number): Uint8Array {
		return Uint8Array.of(src, src >> 8, src >> 16, src >>> 24);
	}

	static toBytesBE(src: number): Uint8Array {
		return Uint8Array.of(src >>> 24, src >> 16, src >> 8, src);
	}
}
const zero = U32.fromArray(Uint32Array.of(0));
const max = U32.fromArray(Uint32Array.of(0xffffffff));

export class U32Mut extends U32 {
	//For some reason we have to redefine the getter here (it doesn't inherit from U32) - can't find an
	// MDN doc that explains this behaviour
	get value(): number {
		return this.arr[this.pos];
	}
	set value(value: number) {
		this.arr[this.pos] = value;
	}

	/**
	 * @see value ⊕= @param u32
	 * @param u32
	 * @returns this (chainable)
	 */
	xorEq(u32: U32): U32Mut {
		this.arr[this.pos] ^= this._valueOf(u32);
		return this;
	}

	/**
	 * @see value ∨= @param u32
	 * @param u32
	 * @returns this (chainable)
	 */
	orEq(u32: U32): U32Mut {
		this.arr[this.pos] |= this._valueOf(u32);
		return this;
	}

	/**
	 * @see value ∧= @param u32
	 * @param u32
	 * @returns this (chainable)
	 */
	andEq(u32: U32): U32Mut {
		this.arr[this.pos] &= this._valueOf(u32);
		return this;
	}

	/**
	 * ¬= @see value
	 * @returns this (chainable)
	 */
	notEq(): U32Mut {
		this.arr[this.pos] = ~this.arr[this.pos];
		return this;
	}

	/**
	 * @see value ROL @param by
	 * @param by integer 0-31
	 * @returns this (chainable)
	 */
	lRotEq(by: number): U32Mut {
		by &= 31;
		this.arr[this.pos] =
			(this.arr[this.pos] << by) | (this.arr[this.pos] >>> (sizeBits - by));
		return this;
	}

	/**
	 * @see value <<= @param by - zeros are brought in
	 * @param by integer 0-31
	 * @returns this (chainable)
	 */
	lShiftEq(by: number): U32Mut {
		const arr = new Uint32Array(1);
		arr[by >>> 5] = this.arr[this.pos] << by;
		this.arr[this.pos] = arr[0];
		return this;
	}

	/**
	 * @see value ROR @param by
	 * @param by integer 0-31
	 * @returns this (chainable)
	 */
	rRotEq(by: number): U32Mut {
		by &= 31;
		this.arr[this.pos] =
			(this.arr[this.pos] >>> by) | (this.arr[this.pos] << (sizeBits - by));
		return this;
	}

	/**
	 * @see value >>>= @param by - zeros are brought in
	 * @param by integer 0-31
	 * @returns this (chainable)
	 */
	rShiftEq(by: number): U32Mut {
		const arr = new Uint32Array(1);
		arr[by >>> 5] = this.arr[this.pos] >>> by;
		this.arr[this.pos] = arr[0];
		return this;
	}

	/**
	 * @see value += @param u32
	 * @param u32
	 * @returns this (chainable)
	 */
	addEq(u32: U32): U32Mut {
		this.arr[this.pos] += this._valueOf(u32);
		return this;
	}

	/**
	 * @see value -= @param u32
	 * @param u32
	 * @returns this (chainable)
	 */
	subEq(u32: U32): U32Mut {
		this.arr[this.pos] -= this._valueOf(u32);
		return this;
	}

	/**
	 * @see value *= @param u32
	 * @param u32
	 * @returns this (chainable)
	 */
	mulEq(u32: U32): U32Mut {
		this.arr[this.pos] = U32._mulEq(this.arr, this.pos, u32);
		return this;
	}

	clone(): U32Mut {
		return new U32Mut(this.arr.slice(this.pos, this.pos + 1));
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT_U32Mut;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT_U32Mut}(${this.toString()})`;
	}

	/**
	 * Build a U32Mut from an integer
	 * @param uint32 Integer 0-0xFFFFFFFF (4294967295)
	 * @throws If uint32 is out of range or not an int
	 * @returns
	 */
	static fromInt(uint32: number): U32Mut {
		sNum('uint32', uint32).unsigned().atMost(maxU32).throwNot();
		return new U32Mut(Uint32Array.of(uint32));
	}

	/**
	 * Created a "view" into an existing Uint32Array
	 * **NOTE** the memory is shared, changing a value in `src` will mutate the state
	 *      AND changes to the result will alter `src`
	 * If you don't need the shared-memory aspect append a `.slice()` to the source (creates a memory copy)
	 * @param src
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(src: Uint32Array, pos = 0): U32Mut {
		return new U32Mut(src, pos);
	}

	/**
	 * Create a view into an `ArrayBuffer`.  Note this relies on platform endian (likely little endian)
	 * **NOTE** Memory is shared (like @see fromArray)
	 * **NOTE** Subject to the same JS limitation that `bytePos` must be a multiple of element-size (4)
	 * @param src
	 * @param bytePos
	 * @returns
	 */
	static fromBuffer(src: ArrayBuffer, bytePos = 0): U32Mut {
		return new U32Mut(new Uint32Array(src, bytePos, 1));
	}

	/**
	 * Given a number create a new U32Mut (will throw if <0 >0xffffffff)
	 * Given a Uint32Array link to the first element (linked memory)
	 * Given a U32 mutate it (memory copy)
	 *
	 * If you have a Uint32Array and want something beyond the first element (index 0)
	 * @see fromArray
	 *
	 * @param uint32
	 * @returns
	 */
	static coerce(uint32: U32ish): U32Mut {
		if (uint32 instanceof U32) {
			return uint32.mut();
		} else if (uint32 instanceof Uint32Array) {
			return new U32Mut(uint32);
		} else {
			sNum('uint32', uint32).unsigned().atMost(maxU32).throwNot();
			return new U32Mut(Uint32Array.of(uint32), 0);
		}
	}
}

export class U32MutArray {
	private buf: Uint32Array;
	private bufPos: number;
	private arr: Array<U32Mut>;

	protected constructor(buf: Uint32Array, bufPos = 0, len?: number) {
		if (len == undefined) {
			len = buf.length - bufPos;
		}
		this.buf = buf;
		this.bufPos = bufPos;
		this.arr = new Array<U32Mut>(len);
		for (let i = 0; i < len; i++)
			this.arr[i] = U32Mut.fromArray(this.buf, this.bufPos + i);

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
	at(idx: number): U32Mut {
		return this.arr[idx];
	}

	/**
	 * Set from `src` starting at `srcOffset` into this array starting at `thisOffset`
	 * @param src
	 * @param thisOffset Called `targetOffset` in TypedArray (default 0)
	 * @param srcOffset (default 0)
	 */
	set(src: U32MutArray, thisOffset = 0, srcOffset = 0): void {
		this.buf.set(
			src.buf.subarray(src.bufPos + srcOffset),
			this.bufPos + thisOffset
		);
	}

	xorEq(b: U32MutArray, thisOffset = 0): void {
		//For all the space of this array
		let n = this.arr.length - thisOffset;
		//OR all the provided array if it's shorter
		if (b.length < n) n = b.length;

		//Adjust n for the buffer position
		n += this.bufPos + thisOffset;
		for (let i = this.bufPos + thisOffset, j = b.bufPos; i < n; i++, j++) {
			this.buf[i] ^= b.buf[j];
		}
	}

	zero(thisOffset = 0): void {
		this.buf.fill(0, this.bufPos + thisOffset);
	}

	clone(): U32MutArray {
		return new U32MutArray(
			this.buf.slice(this.bufPos, this.bufPos + this.length)
		);
	}

	toString(): string {
		return 'len=' + this.length;
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array
	 */
	toBytesBE(): Uint8Array {
		const r = new Uint8Array(
			this.buf.slice(this.bufPos, this.bufPos + this.arr.length).buffer
		);
		asBE.i32(r, 0, this.arr.length);
		return r;
	}

	/**
	 * Value as a stream of bytes (little-endian order) COPY
	 * @returns Uint8Array
	 */
	toBytesLE(): Uint8Array {
		const r = new Uint8Array(
			this.buf.slice(this.bufPos, this.bufPos + this.arr.length).buffer
		);
		asLE.i32(r, 0, this.arr.length);
		return r;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT_U32MutArray;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT_U32MutArray}(${this.toString()})`;
	}

	static fromLen(len: number): U32MutArray {
		return new U32MutArray(new Uint32Array(len));
	}

	/**
	 * Build from a byte array (shared memory)
	 * NOTE: Bytes must be in platform-endian order
	 *  - Platform-LE: 0,1,2,3
	 *  - Platform-BE: 3,2,1,0
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
	): U32MutArray {
		if (byteLen == undefined) {
			byteLen = buffer.byteLength - bytePos;
		}
		byteLen >>= 2; //div 4 - make it u32-element count rather than byte count
		return new U32MutArray(new Uint32Array(buffer, bytePos, byteLen));
	}
}
