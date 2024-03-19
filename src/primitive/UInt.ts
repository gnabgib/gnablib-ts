/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { hex } from '../codec/Hex.js';
import { asBE, asLE } from '../endian/platform.js';
import { NotEnoughSpaceError } from '../error/NotEnoughSpaceError.js';
import { safety } from './Safety.js';

const maxU32 = 0xffffffff;
const maxU32Plus1 = maxU32 + 1;
const maxU16 = 0xffff;
const maxU16Plus1 = maxU16 + 1;

function fromBytesBE(
	source: Uint8Array,
	u32Count: number,
	pos = 0
): Uint32Array {
	//Clone the source (we don't want to mangle the original data)
	const cpy = source.slice(pos, pos + u32Count * 4);
	//Fix the endianness of each u32
	asBE.i32(cpy, 0, u32Count);
	//Map to c32
	const c32 = new Uint32Array(cpy.buffer);
	c32.reverse();
	return c32;
}
function fromBytesLE(
	source: Uint8Array,
	u32Count: number,
	pos = 0
): Uint32Array {
	//Clone the source (we don't want to mangle the original data)
	const cpy = source.slice(pos, pos + u32Count * 4);
	//Fix the endianness of each u32
	asLE.i32(cpy, 0, u32Count);
	//Map to c32
	const c32 = new Uint32Array(cpy.buffer);
	//No need to swap bytes
	return c32;
}

export class UInt {
	protected constructor(
		protected arr: Uint32Array,
		readonly size: number,
		protected pos = 0
	) {}

	protected _setValue(b: UInt): void {
		if (this.size < b.size) {
			throw new NotEnoughSpaceError('size', b.size, this.size);
		}
		for (let i = 0; i < b.size; i++) {
			this.arr[this.pos + i] = b.arr[b.pos + i];
		}
	}
	protected _xorEq(b: UInt): void {
		//xor 0 is a nop, so no need to deal with size-mismatch
		let n = this.size;
		if (b.size < n) n = b.size;
		for (let i = 0; i < n; i++) this.arr[this.pos + i] ^= b.arr[b.pos + i];
	}
	protected _orEq(b: UInt): void {
		//or 0 is a nop, so no need to deal with size-mismatch
		let n = this.size;
		if (b.size < n) n = b.size;
		for (let i = 0; i < n; i++) this.arr[this.pos + i] |= b.arr[b.pos + i];
	}
	protected _andEq(b: UInt): void {
		//and 0 sets to zero, so we have to be careful of size-mismatch
		const n = this.size;
		let i = 0;
		if (b.size < n) {
			for (; i < b.size; i++) this.arr[this.pos + i] &= b.arr[b.pos + i];
			//zero any remainder
			this.arr.fill(0, this.pos + i, this.pos + this.size);
		} else {
			for (; i < n; i++) this.arr[this.pos + i] &= b.arr[b.pos + i];
		}
	}
	protected _not() {
		for (let i = 0; i < this.size; i++)
			this.arr[this.pos + i] = ~this.arr[this.pos + i];
	}
	protected _addEq(b: UInt): number {
		let carry = 0;
		let n = this.size;
		if (b.size < n) n = b.size;
		for (let i = 0; i < n; i++) {
			const add = this.arr[this.pos + i] + b.arr[b.pos + i] + carry;
			//Carry can only be 0/1
			carry = add > maxU32 ? 1 : 0;
			//Add will get truncated to 32 bits
			this.arr[this.pos + i] = add;
		}
		return carry;
	}
	protected _neg(): void {
		let add = 1;
		for (let i = 0; i < this.size; i++) {
			//Not
			this.arr[this.pos + i] = ~this.arr[this.pos + i] + add;
			//If not overflow (went to zero) continue add
			if (this.arr[this.pos + i] != 0) add = 0;
		}
	}
	protected _subEq(b: UInt) {
		if (b.size > this.size) throw new Error("b is oversized.. it's funny");

		//We need b to be the same size as a for proper negation
		const b2 = b.cloneSize(this.size);
		b2._neg();
		this._addEq(b2);
	}
	protected _mulEq(b: UInt, full = false): UInt {
		//Long multiplication
		// FFFF*FFFF (biggest possible uint16s) = FFFE0001
		// FFFFFFFF*FFFFFFFF (biggest possible uint32s) = FFFFFFFE00000001

		const a16 = new Uint16Array(this.size * 2);
		const b16 = new Uint16Array(b.size * 2);

		//Copy a into 16bit blocks
		let aPosPtr = this.pos;
		for (let i = 0; i < a16.length; aPosPtr++) {
			//Low bits
			a16[i++] = this.arr[aPosPtr];
			//High bits
			a16[i++] = this.arr[aPosPtr] >>> 16;
		}
		//Copy b into 16bit blocks
		let bPosPtr = b.pos;
		for (let i = 0; i < b16.length; bPosPtr++) {
			//Low bits
			b16[i++] = b.arr[bPosPtr];
			//High bits
			b16[i++] = b.arr[bPosPtr] >>> 16;
		}

		//Mul - notice we're using number (uint51) to deal with
		// overflow FFFFxFFFF + FFFFxFFFF > FFFFFFFF
		const longest = Math.max(a16.length, b16.length);
		const m = new Array<number>(full ? longest * 2 : a16.length).fill(0);
		for (aPosPtr = 0; aPosPtr < a16.length; aPosPtr++) {
			for (bPosPtr = 0; bPosPtr < b16.length; bPosPtr++) {
				if (aPosPtr + bPosPtr >= m.length) break;
				m[aPosPtr + bPosPtr] += a16[aPosPtr] * b16[bPosPtr];
			}
		}

		//Move carry and put into a
		let carry = 0;
		for (let i = 0, aPosPtr = 0; i < a16.length; ) {
			//Calc low 16
			m[i] += carry;
			carry = (m[i] / maxU16Plus1) | 0;
			const low = m[i++] & maxU16;

			//Calc high 16
			m[i] += carry;
			carry = (m[i] / maxU16Plus1) | 0;
			const high = m[i++] << 16;

			//Set
			this.arr[aPosPtr++] = low | high;
		}
		//Todo: deal with full (generate a second UInt with remainder)
		return UInt.zeroSize(this.size);
	}

	/**
	 * @param b
	 * @returns `this` ⊕ `b`
	 */
	xor(b: UInt): UInt {
		const ret = this.clone();
		ret._xorEq(b);
		return ret;
	}

	/**
	 * @param b
	 * @returns `this` ∨ `b`
	 */
	or(b: UInt): UInt {
		const ret = this.clone();
		ret._orEq(b);
		return ret;
	}

	/**
	 * @param b
	 * @returns `this` ∧ `b`
	 */
	and(b: UInt): UInt {
		const ret = this.clone();
		ret._andEq(b);
		return ret;
	}

	/**
	 * @returns ¬ `this`
	 */
	not(): UInt {
		const ret = this.clone();
		ret._not();
		return ret;
	}

	//lShift, lRot, rShift, rRot

	/**
	 * @param b
	 * @returns `this` + `b`
	 */
	add(b: UInt): UInt {
		const ret = this.clone();
		ret._addEq(b);
		return ret;
	}

	/**
	 * @param b
	 * @returns `this` - `b`
	 */
	sub(b: UInt): UInt {
		const ret = this.clone();
		ret._subEq(b);
		return ret;
	}

	/**
	 *
	 * @param b
	 * @returns `this` * `b`
	 */
	mul(b: UInt): UInt {
		const ret = this.clone();
		ret._mulEq(b);
		return ret;
	}

	/**
	 * a and b will be zero-padded to the same size, so U64(5).eq(U128(5))==true
	 * @param b
	 * @returns `this`==`b`
	 */
	eq(b: UInt): boolean {
		let zero = 0;
		let i = 0;
		if (this.size <= b.size) {
			for (; i < this.size; i++)
				zero |= this.arr[this.pos + i] ^ b.arr[b.pos + i];
			for (; i < b.size; i++) zero |= b.arr[b.pos + i];
		} else {
			for (; i < b.size; i++) zero |= this.arr[this.pos + i] ^ b.arr[b.pos + i];
			for (; i < this.size; i++) zero |= this.arr[this.pos + i];
		}
		return zero === 0;
	}

	// gt lt gte lte

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 */
	toBytesBE(): Uint8Array {
		const r32 = this.arr.slice(this.pos, this.pos + this.size);
		r32.reverse();
		const ret = new Uint8Array(r32.buffer);
		asBE.i32(ret, 0, this.size);
		return ret;
	}

	/**
	 * Value as a stream of bytes (little-endian order) COPY
	 * @returns Uint8Array[16]
	 */
	toBytesLE(): Uint8Array {
		const r32 = this.arr.slice(this.pos, this.pos + this.size);
		const ret = new Uint8Array(r32.buffer);
		asLE.i32(ret, 0, this.size);
		return ret;
	}

	/**
	 * Create a memory copy
	 * @returns
	 */
	clone(): UInt {
		return new UInt(
			this.arr.slice(this.pos, this.pos + this.size),
			this.size,
			0
		);
	}

	/**
	 * Create a memory copy of a new size (truncate or expand)
	 * @param size
	 * @returns
	 */
	cloneSize(size: number): UInt {
		const a = new Uint32Array(size);
		const cloneLen = Math.min(size, this.size);
		a.set(this.arr.subarray(this.pos, this.pos + cloneLen));
		return new UInt(a, size, 0);
	}

	/**
	 * Mutate - create a new {@link UIntMut} with a copy of this value
	 * @returns
	 */
	mut(): UIntMut {
		return UIntMut.fromArray(
			this.arr.slice(this.pos, this.pos + this.size),
			this.size,
			0
		);
	}

	/**
	 * String version of this value, in big endian
	 * @returns
	 */
	toString(): string {
		//8=<<3, 4<<2 = <<5
		return `u${this.size << 5}{` + hex.fromBytes(this.toBytesBE()) + '}';
	}

	/**
	 * Get the least significant byte
	 * @param idx 0-15 (%15)
	 * @returns
	 */
	lsb(idx = 0): number {
		//NOTE: This relies on numbers always being reported as Big Endian
		// no matter the platform endianness
		idx &= 15;
		//The MSB indicates which byte to access
		const shift = idx >> 2; // divide by 4
		//Limit IDX to 0-3 (&3) and then switch to bits (<<3)
		idx = (idx & 3) << 3;
		return (this.arr[this.pos + shift] >>> idx) & 0xff;
	}

	static maxSize(size: number): UInt {
		const a = new Uint32Array(size);
		a.fill(maxU32);
		return new UInt(a, size);
	}

	static minSize(size: number): UInt {
		return new UInt(new Uint32Array(size), size);
	}

	static zeroSize(size: number): UInt {
		return new UInt(new Uint32Array(size), size);
	}

	/**
	 * Build from an integer - not JS can only support up to 51bit ints
	 * @param uint51 0-Number.MAX_SAFE_INT
	 * @param size Number of U32 elements 1-? (2=U64, 4=U128, 8=U256)
	 */
	static fromIntUnsafe(uint51: number, size: number): UInt {
		const a = new Uint32Array(size);
		a[0] = uint51;
		a[1] = uint51 / maxU32Plus1;
		return new UInt(a, size);
	}

	/**
	 * Build from an integer - not JS can only support up to 51bit ints
	 * @param uint51 0-Number.MAX_SAFE_INT
	 * @param size Number of U32 elements 1-? (2=U64, 4=U128, 8=U256)
	 */
	static fromInt(uint51: number, size: number): UInt {
		safety.intGte(uint51, 0, 'uint51');
		const a = new Uint32Array(size);
		a[0] = uint51;
		a[1] = uint51 / maxU32Plus1;
		return new UInt(a, size);
	}

	/**
	 * Build from a set of integers, each truncated to 32 bits
	 * @param set
	 * @returns
	 */
	static fromUint32Set(...set: number[]): UInt {
		return new UInt(Uint32Array.from(set), set.length);
	}

	/**
	 * Created a "view" into an existing Uint32Array
	 * **NOTE** the memory is shared, changing a value in @param source will mutate the state
	 * @param source
	 * @param size Number of U32 elements 1-?
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(source: Uint32Array, size: number, pos = 0): UInt {
		return new UInt(source, size, pos);
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in big endian order
	 * @param src Source to use bytes from
	 * @param size Number of U32 to consume (4* number of bytes)
	 * @param pos Starting position
	 * @returns
	 */
	static fromBytesBE(src: Uint8Array, size: number, pos = 0): UInt {
		return new UInt(fromBytesBE(src, size, pos), size, 0);
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in little endian order
	 * @param src Source to use bytes from
	 * @param size Number of U32 to consume (4* number of bytes)
	 * @param pos Starting position
	 * @returns
	 */
	static fromBytesLE(src: Uint8Array, size: number, pos = 0): UInt {
		return new UInt(fromBytesLE(src, size, pos), size, 0);
	}
}

export class UIntMut extends UInt {
	/**
	 * Update value
	 * @param b
	 * @returns
	 */
	set(b: UInt): UIntMut {
		super._setValue(b);
		return this;
	}

	/**
	 * @see value ⊕= `b`
	 * @param b
	 * @returns this (chainable)
	 */
	xorEq(b: UInt): UIntMut {
		this._xorEq(b);
		return this;
	}

	/**
	 * @see value ∨= `b`
	 * @param b
	 * @returns this (chainable)
	 */
	orEq(b: UInt): UIntMut {
		this._orEq(b);
		return this;
	}

	/**
	 * @see value ∧= `b`
	 * @param b
	 * @returns this (chainable)
	 */
	andEq(b: UInt): UIntMut {
		this._andEq(b);
		return this;
	}

	/**
	 * ¬= @see value
	 * @returns this (chainable)
	 */
	notEq(): UIntMut {
		this._not();
		return this;
	}

	//lShiftEq lRotEq rShiftEq rRotEq

	/**
	 * `this` += `b`
	 * @param b
	 * @returns `this` (chainable)
	 */
	addEq(b: UInt): UIntMut {
		this._addEq(b);
		return this;
	}

	/**
	 * `this` -= `b`
	 * @param b
	 * @returns `this` (chainable)
	 */
	subEq(b: UInt): UIntMut {
		this._subEq(b);
		return this;
	}

	/**
	 * `this` *= `b`
	 * @param b
	 * @returns `this` (chainable)
	 */
	mulEq(b: UInt): UIntMut {
		this._mulEq(b);
		return this;
	}

	/**
	 * Create a copy of this U64Mut
	 * @returns
	 */
	clone(): UIntMut {
		return new UIntMut(
			this.arr.slice(this.pos, this.pos + this.size),
			this.size,
			0
		);
	}

	/**
	 * Create a memory copy of a new size (truncate or expand)
	 * @param size
	 * @returns
	 */
	cloneSize(size: number): UIntMut {
		const a = new Uint32Array(size);
		const cloneLen = Math.min(size, this.size);
		a.set(this.arr.subarray(this.pos, this.pos + cloneLen));
		return new UIntMut(a, size, 0);
	}

	/**
	 * Zero out this value
	 */
	zero(): void {
		this.arr.fill(0, this.pos, this.pos + this.size);
	}

	static zeroSize(size: number): UIntMut {
		return new UIntMut(new Uint32Array(size), size);
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51
	 * @returns
	 */
	static fromIntUnsafe(uint51: number, size: number): UIntMut {
		const a = new Uint32Array(size);
		a[0] = uint51;
		a[1] = uint51 / maxU32Plus1;
		return new UIntMut(a, size);
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51 0-Number.MAX_SAFE_INT
	 * @returns
	 */
	static fromInt(uint51: number, size: number): UIntMut {
		safety.intGte(uint51, 0, 'uint51');
		const a = new Uint32Array(size);
		a[0] = uint51;
		a[1] = uint51 / maxU32Plus1;
		return new UIntMut(a, size);
	}

	/**
	 * Build from a set of integers, each truncated to 32 bits
	 * @param set
	 * @returns
	 */
	static fromUint32Set(...set: number[]): UIntMut {
		return new UIntMut(Uint32Array.from(set), set.length);
	}

	/**
	 * Created a "view" into an existing Uint32Array
	 * **NOTE** the memory is shared, changing a value in @param source will mutate the state,
	 * and changes to to U128Mt will alter `source`
	 *
	 * If you don't need the shared-memory aspect append a `.slice()` to the source (creates a memory copy)
	 * @param source
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(source: Uint32Array, size: number, pos = 0): UIntMut {
		return new UIntMut(source, size, pos);
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in big endian order
	 * @param src Source to use bytes from
	 * @param size Number of U32 to consume (4* number of bytes)
	 * @param pos Starting position
	 * @returns
	 */
	static fromBytesBE(src: Uint8Array, size: number, pos = 0): UIntMut {
		return new UIntMut(fromBytesBE(src, size, pos), size, 0);
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in little endian order
	 * @param src Source to use bytes from
	 * @param size Number of U32 to consume (4* number of bytes)
	 * @param pos Starting position
	 * @returns
	 */
	static fromBytesLE(src: Uint8Array, size: number, pos = 0): UIntMut {
		return new UIntMut(fromBytesLE(src, size, pos), size, 0);
	}
}
