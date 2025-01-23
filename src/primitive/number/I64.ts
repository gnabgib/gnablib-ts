/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { sInt, sLen } from '../../safe/safe.js';
import {
	IInt,
	IIntMut,
} from '../interfaces/IUint.js';
import { AInt } from './_AInt.js';

const size8 = 8;
const size32 = 2;

export class I64 extends AInt implements IInt<I64> {
	protected constructor(arr: Uint32Array, pos: number, name = 'I64') {
		super(arr, pos, size32, name);
	}
	//#region Builds
	/**
	 * Build from an integer - note JS can only support up to 52bit ints
	 * @param i52 Integer `[Number.MIN_SAFE_INTEGER - Number.MAX_SAFE_INT]`
	 * @throws Error if i52 is out of range or floating point
	 */
	static fromInt(i52: number) {
		sInt('i52', i52)
			.atLeast(Number.MIN_SAFE_INTEGER)
			.atMost(Number.MAX_SAFE_INTEGER)
			.throwNot();
		return new I64(AInt._fromInt(size32, i52), 0);
	}

	/**
	 * Build from a series of Int32 numbers,
	 * each will be truncated to 32 bits.
	 * Assumes little endian order.
	 * Assumes unspecified values are 0/-1 (depending on MSB of final number)
	 * @throws Error if too many numbers are provided.
	 */
	static fromI32s(...ns: number[]) {
		const arr = AInt._fromSignedSet(size32, ns);
		return new I64(arr, 0);
	}

	/**
	 * Create from a **copy** of bytes assuming they are in big endian order
	 * (eg. as humans write)
	 * @param pos Position to start from in `src`
	 * @throws Error if `src` isn't long enough
	 */
	static fromBytesBE(src: Uint8Array, pos = 0) {
		return new I64(this._fromBytesBE(size8, src, pos), 0);
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
		return new I64(arr, pos);
	}
	//#endregion

	clone() {
		return new I64(this._arr.slice(this._pos, this._pos + size32), 0);
	}

	/** Create a clone of this value, with mutable state */
	mut(): I64Mut {
		const arr = this._arr.slice(this._pos, this._pos + size32);
		return I64Mut.mount(arr, 0);
	}

	//#region ShiftOps
	lShift(by: number) {
		const ret = this.clone();
		ret._lShiftEq(by);
		return ret;
	}
	rShift(by: number) {
		const ret = this.clone();
		//Note because this is I64, we /might/ shift in 1s (if neg)
		ret._rShiftEq(by, this.negative ? -1 : 0);
		return ret;
	}
	lRot(by: number) {
		const ret = this.clone();
		ret._lRotEq(by);
		return ret;
	}
	rRot(by: number) {
		const ret = this.clone();
		ret._lRotEq(64 - by);
		return ret;
	}
	//#endregion

	//#region LogicOps
	xor(o: I64) {
		const ret = this.clone();
		ret._xorEq(o);
		return ret;
	}
	or(o: I64) {
		const ret = this.clone();
		ret._orEq(o);
		return ret;
	}
	and(o: I64) {
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
	add(o: I64) {
		const ret = this.clone();
		ret._addEq(o);
		return ret;
	}
	sub(o: I64) {
		const ret = this.clone();
		ret._subEq(o);
		return ret;
	}
	mul(o: I64) {
		const arr = this._mul(o);
		return new I64(arr, 0);
	}
	get negative() {
		return this._arr[this._pos + this.size32 - 1] >>> 31 === 1;
	}
	abs() {
		const ret = this.clone();
		if (this.negative) ret._negEq();
		return ret;
	}
	//#endregion

	//#region Comparable
	eq(o: I64) {
		return super.eq(o);
	}
	gt(o: I64) {
		//When we have mismatched signs, the positive wins
		if (this.negative !== o.negative) return o.negative;
		return super.gt(o);
	}
	gte(o: I64) {
		//When we have mismatched signs, the positive wins
		if (this.negative !== o.negative) return o.negative;
		return super.gte(o);
	}
	lt(o: I64) {
		if (this.negative !== o.negative) return this.negative;
		return super.lt(o);
	}
	lte(o: I64) {
		if (this.negative !== o.negative) return this.negative;
		return super.lte(o);
	}
	//#endregion

	/** I64(0x0000000000000000) */
	static get zero(): I64 {
		return zero;
	}
}

const zero = I64.mount(new Uint32Array(2),0);

export class I64Mut extends I64 implements IIntMut<I64Mut, I64> {
	protected constructor(arr: Uint32Array, pos: number) {
		super(arr, pos, 'I64Mut');
	}

	set(v: I64): I64Mut {
		super._setValue(v);
		return this;
	}

	zero(): I64Mut {
		super._setZero();
		return this;
	}

	//#region Builds
	/**
	 * Build from an integer - note JS can only support up to 52bit ints
	 * @param i52 Integer `[Number.MIN_SAFE_INTEGER - Number.MAX_SAFE_INT]`
	 * @throws Error if i52 is out of range or floating point
	 */
	static fromInt(i52: number) {
		sInt('i52', i52)
			.atLeast(Number.MIN_SAFE_INTEGER)
			.atMost(Number.MAX_SAFE_INTEGER)
			.throwNot();
		return new I64Mut(AInt._fromInt(size32, i52), 0);
	}

	/**
	 * Build from a series of Int32 numbers,
	 * each will be truncated to 32 bits.
	 * Assumes little endian order.
	 * Assumes unspecified values are 0/-1 (depending on MSB of final number)
	 * @throws Error if too many numbers are provided.
	 */
	static fromI32s(...ns: number[]) {
		const arr = AInt._fromSignedSet(size32, ns);
		return new I64Mut(arr, 0);
	}

	/**
	 * Create from a *copy* of bytes assuming they are in big endian order
	 * (eg. as humans write)
	 * @param pos Position to start from in `src`
	 * @throws Error if `src` isn't long enough
	 */
	static fromBytesBE(src: Uint8Array, pos = 0) {
		return new I64Mut(this._fromBytesBE(size8, src, pos), 0);
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
		return new I64Mut(arr, pos);
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
		this._rShiftEq(by, this.negative ? -1 : 0);
		return this;
	}
	rRotEq(by: number) {
		this._lRotEq(64 - by);
		return this;
	}
	//#endregion

	//#region LogicEqOps
	xorEq(o: I64) {
		this._xorEq(o);
		return this;
	}
	orEq(o: I64) {
		this._orEq(o);
		return this;
	}
	andEq(o: I64) {
		this._andEq(o);
		return this;
	}
	notEq() {
		this._notEq();
		return this;
	}
	//#endregion

	//#region ArithmeticEqOps
	addEq(o: I64) {
		this._addEq(o);
		return this;
	}
	subEq(o: I64) {
		this._subEq(o);
		return this;
	}
	mulEq(o: I64) {
		const arr = this._mul(o);
		this._arr.set(arr, this._pos);
		return this;
	}
	absEq() {
		if (this.negative) this._negEq();
		return this;
	}
	//#endregion
}
