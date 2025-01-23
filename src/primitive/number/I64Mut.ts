/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { sInt, sLen } from '../../safe/safe.js';
import { AInt } from './_AInt.js';
import { I64 } from './I64.js';

const size8 = 8;
const size32 = 2;

export class I64Mut extends I64 {
	protected constructor(arr: Uint32Array, pos: number) {
		super(arr, pos, 'I64Mut');
	}

	/**
	 * Update value
	 * @returns Self (chainable)
	 */
	set(v: I64): I64Mut {
		super._setValue(v);
		return this;
	}

	/** Zero this value */
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

	//#region  ShiftEqOps
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

I64.prototype.mut = function () {
	const arr = this._arr.slice(this._pos, this._pos + size32);
	return I64Mut.mount(arr, 0);
};
