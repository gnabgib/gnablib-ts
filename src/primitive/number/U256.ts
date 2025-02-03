/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { sLen } from '../../safe/safe.js';
import { IUint } from '../interfaces/IUint.js';
import { AInt } from './_AInt.js';

const size8 = 32;
const size32 = 8;
//max: 115792089237316195423570985008687907853269984665640564039457584007913129639935

export class U256 extends AInt implements IUint<U256> {
	protected constructor(arr: Uint32Array, pos: number, name = 'U256') {
		super(arr, pos, size32, name);
	}

	//#region Builds
	/**
	 * Build from an integer - note JS can only support up to 52bit ints
	 * @param i52 Integer `[Number.MIN_SAFE_INTEGER - Number.MAX_SAFE_INT]`
	 * @throws Error if i52 is out of range or floating point
	 */
	static fromInt(i52: number) {
		return new U256(AInt._fromInt(size32, i52), 0);
	}

	/**
	 * Build from a series of Int32 numbers,
	 * each will be truncated to 32 bits.
	 * Assumes little endian order.
	 * Assumes unspecified values are 0
	 * @throws Error if too many numbers are provided.
	 */
	static fromI32s(...ns: number[]) {
		const arr = AInt._fromSet(size32, ns);
		return new U256(arr, 0);
	}

	/**
	 * Create from a **copy** of bytes assuming they are in big endian order
	 * (eg. as humans write)
	 * @param pos Position to start from in `src`
	 * @throws Error if `src` isn't long enough
	 */
	static fromBytesBE(src: Uint8Array, pos = 0) {
		return new U256(this._fromBytesBE(size8, src, pos), 0);
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
		return new U256(arr, pos);
	}
	//#endregion

	clone() {
		return new U256(this._arr.slice(this._pos, this._pos + size32), 0);
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
	xor(o: U256) {
		const ret = this.clone();
		ret._xorEq(o);
		return ret;
	}
	or(o: U256) {
		const ret = this.clone();
		ret._orEq(o);
		return ret;
	}
	and(o: U256) {
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
	add(o: U256) {
		const ret = this.clone();
		ret._addEq(o);
		return ret;
	}
	sub(o: U256) {
		const ret = this.clone();
		ret._subEq(o);
		return ret;
	}
	mul(o: U256) {
		const arr = this._mul(o);
		return new U256(arr, 0);
	}
	//#endregion

	//#region Comparable
	eq(o: U256) {
		return super.eq(o);
	}
	gt(o: U256) {
		return super.gt(o);
	}
	gte(o: U256) {
		return super.gte(o);
	}
	lt(o: U256) {
		return super.lt(o);
	}
	lte(o: U256) {
		return super.lte(o);
	}
	//#endregion

	/** U256(0) */
	static get zero() {
		return zero;
	}
}
const zero = U256.mount(new Uint32Array(size32), 0);
