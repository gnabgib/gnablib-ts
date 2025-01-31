/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { hex } from '../../codec/Hex.js';
import { asBE, asLE } from '../../endian/platform.js';
import { sInt } from '../../safe/safe.js';
import { IUint, IUintMut } from '../interfaces/IUint.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

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

export class U32 implements IUint<U32> {
	readonly size32 = 1;
	protected constructor(
		protected _arr: Uint32Array,
		protected _pos = 0,
		protected readonly _name = 'U32'
	) {}

	get value(): number {
		return this._arr[this._pos];
	}
	protected _value(v: U32 | number): number {
		return v instanceof U32 ? v._arr[v._pos] : v;
	}

	//#region Builds
	/**
	 * Build from an integer
	 * @param uint32 Unsigned integer `[0 - 4294967295]`
	 * @throws If uint32 is out of range or not an int
	 */
	static fromInt(uint32: number): U32 {
		sInt('uint32', uint32).unsigned().atMost(4294967295).throwNot();
		return new U32(Uint32Array.of(uint32));
	}
	//fromI32s - see fromInt
	//fromBytesBE - see fromInt(U32Static.fromBytesBE(src,pos))
	//fromBytesLE - see fromInt(U32Static.fromBytesLE(src,pos))

	// /**
	//  * Create from a **copy** of bytes assuming they are in big endian order
	//  * (eg. as humans write)
	//  * @param pos Position to start from in `src`
	//  * @throws Error if `src` isn't long enough
	//  */
	// static fromBytesBE(src: Uint8Array, pos = 0) {
	// 	const cpy = src.slice(pos, pos + 4);
	// 	asBE.i32(cpy, 0, 1);
	// 	return new U32(new Uint32Array(cpy.buffer), 0);
	// }

	// /**
	//  * Create from a **copy** of bytes assuming they are in little endian order
	//  * (eg. as humans write)
	//  * @param pos Position to start from in `src`
	//  * @throws Error if `src` isn't long enough
	//  */
	// static fromBytesLE(src: Uint8Array, pos = 0) {
	// 	const cpy = src.slice(pos, pos + 4);
	// 	asLE.i32(cpy, 0, 1);
	// 	return new U32(new Uint32Array(cpy.buffer), 0);
	// }

	/**
	 * Mount an existing array, note this **shares** memory with the array,
	 * changing a value in `arr` will mutate this state.
	 *
	 * @param pos Position to link from
	 */
	static mount(arr: Uint32Array, pos = 0): U32 {
		return new U32(arr, pos);
	}
	//#endregion

	/** Create a **copy** of this element */
	clone() {
		return new U32(this._arr.slice(this._pos, this._pos + 1));
	}

	clone32() {
		return this._arr.slice(this._pos, this._pos + 1);
	}

	/** Create a clone of this value, with mutable state */
	mut(): U32Mut {
		const arr = this._arr.slice(this._pos, this._pos + 1);
		return U32Mut.mount(arr, 0);
	}

	//#region ShiftOps
	lShift(by: number) {
		const arr = new Uint32Array(1);
		arr[by >>> 5] = this._arr[this._pos] << by;
		return new U32(arr);
	}
	rShift(by: number) {
		const arr = new Uint32Array(1);
		arr[by >>> 5] = this._arr[this._pos] >>> by;
		return new U32(arr);
	}
	lRot(by: number) {
		by &= 31;
		return new U32(
			Uint32Array.of(
				(this._arr[this._pos] << by) | (this._arr[this._pos] >>> (32 - by))
			)
		);
	}
	rRot(by: number) {
		by &= 31;
		return new U32(
			Uint32Array.of(
				(this._arr[this._pos] >>> by) | (this._arr[this._pos] << (32 - by))
			)
		);
	}
	//#endregion

	//#region LogicOps
	xor(o: U32) {
		return new U32(Uint32Array.of(this._arr[this._pos] ^ o._arr[o._pos]));
	}
	or(o: U32) {
		return new U32(Uint32Array.of(this._arr[this._pos] | o._arr[o._pos]));
	}
	and(o: U32) {
		return new U32(Uint32Array.of(this._arr[this._pos] & o._arr[o._pos]));
	}
	not() {
		return new U32(Uint32Array.of(~this._arr[this._pos]));
	}
	//#endregion

	//#region ArithmeticOps
	add(o: U32) {
		return new U32(Uint32Array.of(this._arr[this._pos] + o._arr[o._pos]));
	}
	sub(o: U32) {
		return new U32(Uint32Array.of(this._arr[this._pos] - o._arr[o._pos]));
	}
	mul(o: U32) {
		return new U32(
			Uint32Array.of(Math.imul(this._arr[this._pos], o._arr[o._pos]))
		);
	}
	//#endregion

	//#region Comparable
	eq(o: U32 | number) {
		const o2 = o instanceof U32 ? o._arr[o._pos] : o;
		return this._arr[this._pos] == o2;
	}
	gt(o: U32 | number) {
		const o2 = o instanceof U32 ? o._arr[o._pos] : o;
		return this._arr[this._pos] > o2;
	}
	gte(o: U32 | number) {
		const o2 = o instanceof U32 ? o._arr[o._pos] : o;
		return this._arr[this._pos] >= o2;
	}
	lt(o: U32 | number) {
		const o2 = o instanceof U32 ? o._arr[o._pos] : o;
		return this._arr[this._pos] < o2;
	}
	lte(o: U32 | number) {
		const o2 = o instanceof U32 ? o._arr[o._pos] : o;
		return this._arr[this._pos] <= o2;
	}
	//#endregion

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array[4]
	 */
	toBytesBE(): Uint8Array {
		const r = new Uint8Array(this._arr.slice(this._pos, this._pos + 1).buffer);
		asBE.i32(r, 0);
		return r;
	}

	/**
	 * Value as a stream of bytes (little-endian order) COPY
	 * @returns Uint8Array[4]
	 */
	toBytesLE(): Uint8Array {
		const r = new Uint8Array(this._arr.slice(this._pos, this._pos + 1).buffer);
		asLE.i32(r, 0);
		return r;
	}

	/**
	 * Get the least significant byte
	 * @param byteIdx 0-3 (%3)
	 */
	getByte(byteIdx = 0): number {
		sInt('byteIdx', byteIdx).unsigned().atMost(3).throwNot();
		//NOTE: This relies on numbers always being reported as Big Endian
		// no matter the platform endianness
		const low = 8 * byteIdx; //(0,8,16,24)
		return (this._arr[this._pos] >>> low) & 0xff;
	}

	/** String version of this value, as hex, in big endian */
	toString(): string {
		return hex.fromI32(this._arr[this._pos]);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return this._name;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${this._name}(${this.toString()})`;
	}

	/** U32(0) */
	static get zero(): U32 {
		return zero;
	}
}
const zero = U32.mount(Uint32Array.of(0));

export class U32Mut extends U32 implements IUintMut<U32Mut, U32> {
	protected constructor(arr: Uint32Array, pos: number) {
		super(arr, pos, 'U32Mut');
	}

	set(v: U32 | number) {
		const v2 = v instanceof U32 ? v.value : v;
		this._arr[this._pos] = v2;
		return this;
	}

	zero() {
		this._arr[this._pos] = 0;
		return this;
	}

	//#region Build
	/**
	 * Build from an integer
	 * @param uint32 Unsigned integer `[0 - 4294967295]`
	 * @throws If uint32 is out of range or not an int
	 */
	static fromInt(uint32: number): U32Mut {
		sInt('uint32', uint32).unsigned().atMost(4294967295).throwNot();
		return new U32Mut(Uint32Array.of(uint32), 0);
	}

	/**
	 * Mount an existing array, note this **shares** memory with the array,
	 * changing a value in `arr` will mutate this state.
	 *
	 * @param pos Position to link from
	 */
	static mount(src: Uint32Array, pos = 0): U32Mut {
		return new U32Mut(src, pos);
	}
	//#endregion

	//#region ShiftEqOps
	lShiftEq(by: number) {
		const arr = new Uint32Array(1);
		arr[by >>> 5] = this._arr[this._pos] << by;
		this._arr[this._pos] = arr[0];
		return this;
	}
	lRotEq(by: number) {
		by &= 31;
		this._arr[this._pos] =
			(this._arr[this._pos] << by) | (this._arr[this._pos] >>> (32 - by));
		return this;
	}
	rShiftEq(by: number) {
		const arr = new Uint32Array(1);
		arr[by >>> 5] = this._arr[this._pos] >>> by;
		this._arr[this._pos] = arr[0];
		return this;
	}
	rRotEq(by: number) {
		by &= 31;
		this._arr[this._pos] =
			(this._arr[this._pos] >>> by) | (this._arr[this._pos] << (32 - by));
		return this;
	}
	//#endregion

	//#region LogicEqOps
	xorEq(o: U32 | number) {
		this._arr[this._pos] ^= this._value(o);
		return this;
	}
	orEq(o: U32 | number) {
		this._arr[this._pos] |= this._value(o);
		return this;
	}
	andEq(o: U32 | number) {
		this._arr[this._pos] &= this._value(o);
		return this;
	}
	notEq() {
		this._arr[this._pos] = ~this._arr[this._pos];
		return this;
	}
	//#endregion

	//#region ArithmeticEqOps
	addEq(o: U32 | number) {
		this._arr[this._pos] += this._value(o);
		return this;
	}
	subEq(o: U32 | number) {
		this._arr[this._pos] -= this._value(o);
		return this;
	}
	mulEq(o: U32 | number) {
		this._arr[this._pos] = Math.imul(this._arr[this._pos], this._value(o));
		return this;
	}
	//#endregion
}

