/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { sLen } from '../../safe/safe.js';
import { IUint } from '../interfaces/IUint.js';
import { AInt } from './_AInt.js';

const size8 = 64;
const size32 = 16;
//max: 13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031858186486050853753882811946569946433649006084095

export class U512 extends AInt implements IUint<U512> {
	protected constructor(arr: Uint32Array, pos: number, name = 'U512') {
		super(arr, pos, size32, name);
	}

	//#region Builds
	/**
	 * Build from an integer - note JS can only support up to 52bit ints
	 * @param i52 Integer `[Number.MIN_SAFE_INTEGER - Number.MAX_SAFE_INT]`
	 * @throws Error if i52 is out of range or floating point
	 */
	static fromInt(i52: number) {
		return new U512(AInt._fromInt(size32, i52), 0);
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
		return new U512(arr, 0);
	}

	/**
	 * Create from a **copy** of bytes assuming they are in big endian order
	 * (eg. as humans write)
	 * @param pos Position to start from in `src`
	 * @throws Error if `src` isn't long enough
	 */
	static fromBytesBE(src: Uint8Array, pos = 0) {
		return new U512(this._fromBytesBE(size8, src, pos), 0);
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
		return new U512(arr, pos);
	}
	//#endregion

	clone() {
		return new U512(this._arr.slice(this._pos, this._pos + size32), 0);
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
	xor(o: U512) {
		const ret = this.clone();
		ret._xorEq(o);
		return ret;
	}
	or(o: U512) {
		const ret = this.clone();
		ret._orEq(o);
		return ret;
	}
	and(o: U512) {
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
	add(o: U512) {
		const ret = this.clone();
		ret._addEq(o);
		return ret;
	}
	sub(o: U512) {
		const ret = this.clone();
		ret._subEq(o);
		return ret;
	}
	mul(o: U512) {
		const arr = this._mul(o);
		return new U512(arr, 0);
	}
	//#endregion

	//#region Comparable
	eq(o: U512) {
		return super.eq(o);
	}
	gt(o: U512) {
		return super.gt(o);
	}
	gte(o: U512) {
		return super.gte(o);
	}
	lt(o: U512) {
		return super.lt(o);
	}
	lte(o: U512) {
		return super.lte(o);
	}
	//#endregion

	/** U512(0) */
	static get zero(): U512 {
		return zero;
	}
}
const zero = U512.mount(new Uint32Array(size32), 0);
