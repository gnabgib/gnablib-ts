/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { hex } from '../../codec/Hex.js';
import { asBE, asLE } from '../../endian/platform.js';
import { sLen } from '../../safe/safe.js';
import { ICtComparable, IUint, IUintMut } from '../interfaces/IUint.js';
import { AInt } from './_AInt.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

const size8 = 8;
const size32 = 2;

// max=  18446744073709551615

export class U64 extends AInt implements IUint<U64>, ICtComparable<U64> {
	protected constructor(arr: Uint32Array, pos: number, name = 'U64') {
		super(arr, pos, size32, name);
	}

	//#region Builds
	/**
	 * Build from an integer - note JS can only support up to 52bit ints
	 * @param i52 Integer `[Number.MIN_SAFE_INTEGER - Number.MAX_SAFE_INT]`
	 * @throws Error if i52 is out of range or floating point
	 */
	static fromInt(i52: number) {
		return new U64(AInt._fromInt(size32, i52), 0);
	}

	/**
	 * Build from a series of Uint32 numbers, each will be truncated to 32 bits.
	 * Assumes little endian order.
	 * Assumes unspecified values are 0
	 * @throws Error if too many numbers are provided.
	 */
	static fromI32s(...ns: number[]) {
		const arr = AInt._fromSet(size32, ns);
		return new U64(arr, 0);
	}

	/**
	 * Create from a **copy** of bytes assuming they are in big endian order
	 * (eg. as humans write)
	 * @param pos Position to start from in `src`
	 * @throws Error if `src` isn't long enough
	 */
	static fromBytesBE(src: Uint8Array, pos = 0) {
		return new U64(this._fromBytesBE(size8, src, pos), 0);
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
		return new U64(arr, pos);
	}
	//#endregion

	/** Bottom 32 bits (1-32)  of 64 bit int */
	get low() {
		return this._arr[this._pos];
	}

	/** Top 32 bits (33-64)  of 64 bit int */
	get high() {
		return this._arr[this._pos + 1];
	}

	clone() {
		return new U64(this._arr.slice(this._pos, this._pos + size32), 0);
	}

	/** Create a clone of this value, with mutable state */
	mut(): U64Mut {
		const arr = this._arr.slice(this._pos, this._pos + size32);
		return U64Mut.mount(arr, 0);
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
	xor(o: U64) {
		const ret = this.clone();
		ret._xorEq(o);
		return ret;
	}

	or(o: U64) {
		const ret = this.clone();
		ret._orEq(o);
		return ret;
	}

	and(o: U64) {
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
	add(o: U64) {
		const ret = this.clone();
		ret._addEq(o);
		return ret;
	}

	sub(o: U64) {
		const ret = this.clone();
		ret._subEq(o);
		return ret;
	}

	mul(o: U64) {
		const arr = this._mul(o);
		return new U64(arr, 0);
	}
	//#endregion

	//#region Comparable
	eq(o: U64) {
		return super.eq(o);
	}

	gt(o: U64) {
		return super.gt(o);
	}

	gte(o: U64) {
		return super.gte(o);
	}

	lt(o: U64) {
		return super.lt(o);
	}

	lte(o: U64) {
		return super.lte(o);
	}
	//#endregion

	//#region Constant time
	ctEq(o: U64) {
		const zero =
			(this._arr[this._pos] ^ o._arr[o._pos]) |
			(this._arr[this._pos + 1] ^ o._arr[o._pos + 1]);
		return zero === 0;
	}

	ctGt(o: U64) {
		const ll = (this._arr[this._pos] & 0xffff) - (o._arr[o._pos] & 0xffff) - 1;
		const lh = (this._arr[this._pos] >>> 16) - (o._arr[o._pos] >>> 16) - 1;
		const hl =
			(this._arr[this._pos + 1] & 0xffff) - (o._arr[o._pos + 1] & 0xffff) - 1;
		const hh =
			(this._arr[this._pos + 1] >>> 16) - (o._arr[o._pos + 1] >>> 16) - 1;
		return (ll & lh & hl & hh) >>> 31 === 0;
	}

	ctGte(o: U64): boolean {
		const ll = (o._arr[o._pos] & 0xffff) - (this._arr[this._pos] & 0xffff) - 1;
		const lh = (o._arr[o._pos] >>> 16) - (this._arr[this._pos] >>> 16) - 1;
		const hl =
			(o._arr[o._pos + 1] & 0xffff) - (this._arr[this._pos + 1] & 0xffff) - 1;
		const hh =
			(o._arr[o._pos + 1] >>> 16) - (this._arr[this._pos + 1] >>> 16) - 1;
		return (ll & lh & hl & hh) >>> 31 === 1;
	}

	ctLt(o: U64) {
		const ll = (o._arr[o._pos] & 0xffff) - (this._arr[this._pos] & 0xffff) - 1;
		const lh = (o._arr[o._pos] >>> 16) - (this._arr[this._pos] >>> 16) - 1;
		const hl =
			(o._arr[o._pos + 1] & 0xffff) - (this._arr[this._pos + 1] & 0xffff) - 1;
		const hh =
			(o._arr[o._pos + 1] >>> 16) - (this._arr[this._pos + 1] >>> 16) - 1;
		return (ll & lh & hl & hh) >>> 31 === 0;
	}

	ctLte(o: U64) {
		const ll = (this._arr[this._pos] & 0xffff) - (o._arr[o._pos] & 0xffff) - 1;
		const lh = (this._arr[this._pos] >>> 16) - (o._arr[o._pos] >>> 16) - 1;
		const hl =
			(this._arr[this._pos + 1] & 0xffff) - (o._arr[o._pos + 1] & 0xffff) - 1;
		const hh =
			(this._arr[this._pos + 1] >>> 16) - (o._arr[o._pos + 1] >>> 16) - 1;
		return (ll & lh & hl & hh) >>> 31 === 1;
	}

	ctSwitch(o: U64, other: boolean) {
		// @ts-expect-error: We're casting bool->number on purpose
		const oNum = (other | 0) - 1; //-1 or 0
		return U64.fromI32s(
			(~oNum & o._arr[o._pos]) | (oNum & this._arr[this._pos]),
			(~oNum & o._arr[o._pos + 1]) | (oNum & this._arr[this._pos + 1])
		);
	}
	//#endregion

	/** U64(0) */
	static get zero(): U64 {
		return zero;
	}
}
const zero = U64.mount(new Uint32Array(size32), 0);

export class U64Mut extends U64 implements IUintMut<U64Mut, U64> {
	protected constructor(arr: Uint32Array, pos: number) {
		super(arr, pos, 'U64Mut');
	}

	set(v: U64): U64Mut {
		super._setValue(v);
		return this;
	}

	zero(): U64Mut {
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
		return new U64Mut(AInt._fromInt(size32, i52), 0);
	}

	/**
	 * Build from a series of Uint32 numbers, each will be truncated to 32 bits.
	 * Assumes little endian order.
	 * Assumes unspecified values are 0
	 * @throws Error if too many numbers are provided.
	 */
	static fromI32s(...ns: number[]) {
		const arr = AInt._fromSignedSet(size32, ns);
		return new U64Mut(arr, 0);
	}

	/**
	 * Create from a *copy* of bytes assuming they are in big endian order
	 * (eg. as humans write)
	 * @param pos Position to start from in `src`
	 * @throws Error if `src` isn't long enough
	 */
	static fromBytesBE(src: Uint8Array, pos = 0) {
		return new U64Mut(this._fromBytesBE(size8, src, pos), 0);
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
		return new U64Mut(arr, pos);
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
	xorEq(o: U64) {
		this._xorEq(o);
		return this;
	}
	orEq(o: U64) {
		this._orEq(o);
		return this;
	}
	andEq(o: U64) {
		this._andEq(o);
		return this;
	}
	notEq() {
		this._notEq();
		return this;
	}
	//#endregion

	//#region ArithmeticEqOps
	addEq(o: U64) {
		this._addEq(o);
		return this;
	}
	subEq(o: U64) {
		this._subEq(o);
		return this;
	}
	mulEq(o: U64) {
		const arr = this._mul(o);
		this._arr.set(arr, this._pos);
		return this;
	}
	//#endregion
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
		if (len == undefined) {
			len = (buf.length - bufPos) >> 1; //div 2 - we need two u32 per u64
		}
		this.buf = buf;
		this.bufPos = bufPos;
		this.arr = new Array<U64Mut>(len);
		for (let i = 0; i < len; i++) {
			this.arr[i] = U64Mut.mount(this.buf, this.bufPos + i + i);
		}

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

	clone(): U64MutArray {
		return new U64MutArray(
			this.buf.slice(this.bufPos, this.bufPos + this.length + this.length),
			0
		);
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array
	 */
	toBytesBE(): Uint8Array {
		const r32 = this.buf.slice(this.bufPos, this.bufPos + this.arr.length * 2);
		const r8 = new Uint8Array(r32.buffer);
		let i = 1;
		do {
			//Fix each r32 pair, swap order
			const t = r32[i - 1];
			r32[i - 1] = r32[i];
			r32[i] = t;
			//And possibly fix byte-order
			asBE.i32(r8, i * 4 - 4, 2);
			i += 2;
		} while (i < r32.length);
		return r8;
	}

	/**
	 * Value as a stream of bytes (little-endian order) COPY
	 * @returns Uint8Array
	 */
	toBytesLE(): Uint8Array {
		const r = new Uint8Array(
			this.buf.slice(this.bufPos, this.bufPos + this.arr.length * 2).buffer
		);
		asLE.i32(r, 0, this.arr.length);
		return r;
	}

	toString() {
		return hex.fromBytes(this.toBytesBE());
		//return hex.fromU64a(this);//,' ');
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'U64MutArray';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `U64MutArray(${this.toString()})`;
	}

	static fromLen(len: number): U64MutArray {
		return new U64MutArray(new Uint32Array(len * 2), 0, len);
	}

	/** Build an array from a series of U64 numbers */
	static fromU64s(...u64s: U64[]) {
		const arr = new Uint32Array(u64s.length * 2);
		for (let i = 0, j = 0; i < u64s.length; i++) {
			arr[j++] = u64s[i].low;
			arr[j++] = u64s[i].high;
		}
		return new U64MutArray(arr, 0);
	}

	static mount(arr: Uint32Array, pos = 0, len = 0) {
		if (len == 0) len = (arr.length - pos) / 2;
		else
			sLen('arr', arr)
				.atLeast(2 * len + pos)
				.throwNot();
		return new U64MutArray(arr, pos, len);
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
		if (byteLen == undefined) {
			byteLen = buffer.byteLength - bytePos;
		}
		byteLen >>= 2; //div 4 - make it u32-element count rather than byte count
		return new U64MutArray(new Uint32Array(buffer, bytePos, byteLen), 0);
	}
}
