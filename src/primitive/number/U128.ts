/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { sInt, sLen } from '../../safe/safe.js';
import { IUint, IUintMut } from '../interfaces/IUint.js';
import { AInt } from './_AInt.js';
import { U64 } from './U64.js';

const size8 = 16;
const size32 = 4;
// max: 340282366920938463463374607431768211455

export class U128 extends AInt implements IUint<U128> {
	protected constructor(arr: Uint32Array, pos: number, name = 'U128') {
		super(arr, pos, size32, name);
	}

	//#region Builds
	/**
	 * Build from an integer - note JS can only support up to 52bit ints
	 * @param i52 Integer `[Number.MIN_SAFE_INTEGER - Number.MAX_SAFE_INT]`
	 * @throws Error if i52 is out of range or floating point
	 */
	static fromInt(i52: number) {
		return new U128(AInt._fromInt(size32, i52), 0);
	}

	/**
	 * Build from a series of Uint32 numbers, each will be truncated to 32 bits.
	 * Assumes little endian order.
	 * Assumes unspecified values are 0
	 * @throws Error if too many numbers are provided.
	 */
	static fromI32s(...ns: number[]) {
		const arr = AInt._fromSet(size32, ns);
		return new U128(arr, 0);
	}

	/**
	 * Create from a **copy** of bytes assuming they are in big endian order
	 * (eg. as humans write)
	 * @param pos Position to start from in `src`
	 * @throws Error if `src` isn't long enough
	 */
	static fromBytesBE(src: Uint8Array, pos = 0) {
		return new U128(this._fromBytesBE(size8, src, pos), 0);
	}

	/**
	 * Create from a **copy** of bytes assuming they are in little endian order
	 * (eg. as humans write)
	 * @param pos Position to start from in `src`
	 * @throws Error if `src` isn't long enough
	 */
	static fromBytesLE(src: Uint8Array, pos = 0) {
		return new U128(this._fromBytesLE(size8, src, pos), 0);
	}

	/**
	 * Mount an existing array, note this **shares** memory with the array,
	 * changing a value in `arr` will mutate this state.  u32 values are
	 * in little-endian order (least significant value first)
	 *
	 * @param pos Position to link from
	 * @throws Error if `arr` isn't long enough
	 */
	static mount(arr: Uint32Array, pos = 0) {
		sLen('arr', arr)
			.atLeast(pos + size32)
			.throwNot();
		return new U128(arr, pos);
	}
	//#endregion

	clone() {
		return new U128(this._arr.slice(this._pos, this._pos + size32), 0);
	}

	/** Create a clone of this value, with mutable state */
	mut(): U128Mut {
		const arr = this._arr.slice(this._pos, this._pos + size32);
		return U128Mut.mount(arr, 0);
	}

	//#region ShiftOps
	lShift(by: number) {
		const ret = this.clone();
		ret._lShiftEq(by);
		return ret;
	}
	rShift(by: number) {
		const ret = this.clone();
		ret._rShiftEq(by);
		return ret;
	}
	lRot(by: number) {
		const ret = this.clone();
		ret._lRotEq(by);
		return ret;
	}
	rRot(by: number) {
		const ret = this.clone();
		ret._lRotEq(size8 * 8 - by);
		return ret;
	}
	//#endregion

	//#region LogicOps
	xor(o: U128) {
		const ret = this.clone();
		ret._xorEq(o);
		return ret;
	}
	or(o: U128) {
		const ret = this.clone();
		ret._orEq(o);
		return ret;
	}
	and(o: U128) {
		const ret = this.clone();
		ret._andEq(o);
		return ret;
	}
	not() {
		const ret = this.clone();
		ret._notEq();
		return ret;
	}
	//#endregion

	//#region ArithmeticOps
	add(o: U128) {
		const ret = this.clone();
		ret._addEq(o);
		return ret;
	}
	sub(o: U128) {
		const ret = this.clone();
		ret._subEq(o);
		return ret;
	}
	mul(o: U128) {
		const arr = this._mul(o);
		return new U128(arr, 0);
	}
	//#endregion

	//#region Comparable
	eq(o: U128) {
		return super.eq(o);
	}
	gt(o: U128) {
		return super.gt(o);
	}
	gte(o: U128) {
		return super.gte(o);
	}
	lt(o: U128) {
		return super.lt(o);
	}
	lte(o: U128) {
		return super.lte(o);
	}
	//#endregion

	/** U128(0) */
	static get zero(): U128 {
		return zero;
	}
}
const zero = U128.mount(new Uint32Array(size32), 0);

export class U128Mut extends U128 implements IUintMut<U128Mut, U128> {
	protected constructor(arr: Uint32Array, pos: number) {
		super(arr, pos, 'U128Mut');
	}

	set(v: U128): U128Mut {
		super._setValue(v);
		return this;
	}

	zero(): U128Mut {
		super._setZero();
		return this;
	}

	/**
	 * Create a `U64` view into this value, uses **shared** memory (but the return isn't mutable)
	 * @param idx Index, where 0 is the low 64 bits, and 1 the high [0 - 1]
	 * @throws Error if idx <0 or >1
	 */
	u64at(idx = 0): U64 {
		sInt('idx', idx).unsigned().atMost(1).throwNot();
		return U64.mount(this._arr,this._pos+idx*2);
	}

	//#region Builds
	/**
	 * Build from an integer - note JS can only support up to 52bit ints
	 * @param i52 Integer `[Number.MIN_SAFE_INTEGER - Number.MAX_SAFE_INT]`
	 * @throws Error if i52 is out of range or floating point
	 */
	static fromInt(i52: number) {
		return new U128Mut(AInt._fromInt(size32, i52), 0);
	}

	/**
	 * Build from a series of Uint32 numbers, each will be truncated to 32 bits.
	 * Assumes little endian order.
	 * Assumes unspecified values are 0
	 * @throws Error if too many numbers are provided.
	 */
	static fromI32s(...ns: number[]) {
		const arr = AInt._fromSignedSet(size32, ns);
		return new U128Mut(arr, 0);
	}

	/**
	 * Create from a *copy* of bytes assuming they are in big endian order
	 * (eg. as humans write)
	 * @param pos Position to start from in `src`
	 * @throws Error if `src` isn't long enough
	 */
	static fromBytesBE(src: Uint8Array, pos = 0) {
		return new U128Mut(this._fromBytesBE(size8, src, pos), 0);
	}

	/**
	 * Create from a **copy** of bytes assuming they are in little endian order
	 * (eg. as humans write)
	 * @param pos Position to start from in `src`
	 * @throws Error if `src` isn't long enough
	 */
	static fromBytesLE(src: Uint8Array, pos = 0) {
		return new U128Mut(this._fromBytesLE(size8, src, pos), 0);
	}

	/**
	 * Mount an existing array, note this *shares* memory with the array,
	 * changing a value in `src` will mutate this state.  u32 values are
	 * in little-endian order (least significant value first)
	 *
	 * @param pos Position to link from
	 * @throws Error if `arr` isn't long enough
	 */
	static mount(arr: Uint32Array, pos = 0) {
		sLen('arr', arr)
			.atLeast(pos + size32)
			.throwNot();
		return new U128Mut(arr, pos);
	}
	//#endregion

	//#region ShiftEqOps
	lShiftEq(by: number) {
		this._lShiftEq(by);
		return this;
	}
	lRotEq(by: number) {
		this._lRotEq(by);
		return this;
	}
	rShiftEq(by: number) {
		this._rShiftEq(by);
		return this;
	}
	rRotEq(by: number) {
		this._lRotEq(size8 * 8 - by);
		return this;
	}
	//#endregion

	//#region LogicEqOps
	xorEq(o: U128) {
		this._xorEq(o);
		return this;
	}
	orEq(o: U128) {
		this._orEq(o);
		return this;
	}
	andEq(o: U128) {
		this._andEq(o);
		return this;
	}
	notEq() {
		this._notEq();
		return this;
	}
	//#endregion

	//#region ArithmeticEqOps
	addEq(o: U128) {
		this._addEq(o);
		return this;
	}
	subEq(o: U128) {
		this._subEq(o);
		return this;
	}
	mulEq(o: U128) {
		const arr = this._mul(o);
		this._arr.set(arr, this._pos);
		return this;
	}
	//#endregion
}
