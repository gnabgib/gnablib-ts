import * as intExt from './IntExt.js';
import * as hex from '../encoding/Hex.js';
import { asBE, asLE } from '../endian/platform.js';

const maxU32 = 0xffffffff;
const maxU16 = 0xffff;
const maxU32Plus1 = 0x100000000;
const sizeBytes = 8;
const rotMask64 = 0x3f;
const rotMask32 = 0x1f;

export type U64ish = U64 | number;

function add(a: Uint32Array, aPos: number, b: Uint32Array, bPos: number) {
	const l = a[aPos] + b[bPos];
	//Carry can only be 0/1
	const c = l > maxU32 ? 1 : 0;
	a[aPos] = l;
	a[aPos + 1] += b[bPos + 1] + c;
}
function mul(a: Uint32Array, aPos: number, b: Uint32Array, bPos: number) {
	//Long multiplication!
	// FFFF*FFFF (biggest possible uint16s) = FFFE0001
	// FFFFFFFF*FFFFFFFF (biggest possible uint32s) = FFFFFFFE00000001
	const this0 = a[aPos] & maxU16;
	const this1 = a[aPos] >>> 16;
	const this2 = a[aPos + 1] & maxU16;
	const this3 = a[aPos + 1] >>> 16;
	const num0 = b[bPos] & maxU16;
	const num1 = b[bPos] >>> 16;
	const num2 = b[bPos + 1] & maxU16;
	const num3 = b[bPos + 1] >>> 16;

	const m0 = this0 * num0;
	const c0 = m0 >>> 16;
	const m1 = this0 * num1 + this1 * num0 + c0;
	const c1 = (m1 / 0x10000) | 0; //Can be >32bits
	const m2 = this0 * num2 + this1 * num1 + this2 * num0 + c1;
	const c2 = (m2 / 0x10000) | 0; //Can be >32bits
	const m3 = this0 * num3 + this1 * num2 + this2 * num1 + this3 * num0 + c2; //(m2>>>16);
	//Note there are 3 more stages if we had space)
	a[aPos] = (m0 & maxU16) | ((m1 & maxU16) << 16);
	a[aPos + 1] = (m2 & maxU16) | ((m3 & maxU16) << 16);
}
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
	const t = c32[0]; c32[0] = c32[1]; c32[1] = t;
	return c32;
}

export class U64 {
	protected arr: Uint32Array;
	protected pos: number;

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

	/**
	 * @see value ⊕ @param b
	 * @param b
	 * @returns @see value ⊕ @param b
	 */
	xor(b: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		arr[0] ^= b.arr[b.pos];
		arr[1] ^= b.arr[b.pos + 1];
		return new U64(arr);
	}

	/**
	 * @see value ∨ @param b
	 * @param b
	 * @returns @see value ∨ @param b
	 */
	or(b: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		arr[0] |= b.arr[b.pos];
		arr[1] |= b.arr[b.pos + 1];
		return new U64(arr);
	}

	/**
	 * @see value ∧ @param b
	 * @param b
	 * @returns @see value ∧ @param b
	 */
	and(b: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		arr[0] &= b.arr[b.pos];
		arr[1] &= b.arr[b.pos + 1];
		return new U64(arr);
	}

	/**
	 * ¬ @see value
	 * @returns ¬ @see value
	 */
	not(): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		arr[0] = ~arr[0];
		arr[1] = ~arr[1];
		return new U64(arr);
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
	 * @see value + @param b
	 * @param b
	 * @returns @see value + @param b
	 */
	add(b: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		add(arr, 0, b.arr, b.pos);
		return new U64(arr, 0);
	}

	/**
	 * @see value * @param b
	 * @param b
	 * @returns @see value * @param b
	 */
	mul(b: U64): U64 {
		const arr = this.arr.slice(this.pos, this.pos + 2);
		mul(arr, 0, b.arr, b.pos);
		return new U64(arr);
	}

	/**
	 * Whether @see other has the same value as this
	 * @param other
	 * @returns
	 */
	equals(other: U64): boolean {
		const l = this.arr[this.pos] == other.arr[other.pos];
		const h = this.arr[this.pos + 1] == other.arr[other.pos + 1];
		//non-constant time (fast exit on h===false):
		return h && l;
	}

	/**
	 * Whether this is > @param other
	 * @param other
	 * @returns
	 */
	gt(other: U64): boolean {
		//Compare high
		const hgt = this.arr[this.pos + 1] > other.arr[other.pos + 1];
		const heq = this.arr[this.pos + 1] === other.arr[other.pos + 1];
		const lgt = this.arr[this.pos] > other.arr[other.pos];
		//Not constant time, fast exit on hgt===true
		return hgt || (heq && lgt);
	}

	/**
	 * Whether this < @param other
	 * @param other
	 * @returns
	 */
	lt(other: U64): boolean {
		// this<other is the same as other>this
		return other.gt(this);
	}

	/**
	 * Whether this >= @param other
	 * @param other
	 * @returns
	 */
	gte(other: U64): boolean {
		// this>=other is the same as !other<this
		return !this.lt(other);
	}

	/**
	 * Whether this <= @param other
	 * @param other
	 * @returns
	 */
	lte(other: U64): boolean {
		//this<=other is the same as !this>other
		return !this.gt(other);
	}

	/**
	 * Create a copy of this Uint64 (also possible with `Uint64.coerce(this)`)
	 * @returns
	 */
	clone(): U64 {
		const cpy = this.arr.slice(this.pos, this.pos + 2);
		return new U64(cpy);
	}

	/**
	 * Mutate - create a new Uint64Mut with a copy of this value
	 */
	mut(): U64Mut {
		return U64Mut.fromArray(this.arr.slice(this.pos, this.pos + 2));
	}

	toString(): string {
		//We write in big endian, so we need to convert storage
		return 'u64{' + hex.fromBytes(this.toBytesBE()) + '}';
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array[8]
	 */
	toBytesBE(): Uint8Array {
		//Invert l/h
		const r32 = Uint32Array.of(this.arr[this.pos + 1], this.arr[this.pos]);
		//Project to bytes
		const r = new Uint8Array(r32.buffer);
		asBE.i32(r, 0);
		asBE.i32(r, 4);
		return r;
	}

	/**
	 * Get the least significant byte
	 * @returns
	 */
	lsb(idx=0): number {
		idx&=7;//Only 8 spaces to chose from (zero indexed)
		//The MSB indicates which byte to access
		const shift=idx>>2;
		//Limit IDX to 0-3 (&3) and then switch to bits (<<3)
		idx=(idx&3)<<3;
		return (this.arr[this.pos+shift]>>>idx) & 0xff;
	}

	/**
	 * This is only used by U64Mut (notice it's protected), so we can look inside v.arr
	 * @param v
	 */
	protected set(v: U64): void {
		this.arr[this.pos] = v.arr[v.pos];
		this.arr[this.pos + 1] = v.arr[v.pos + 1];
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
		intExt.isGreaterThanEqual(uint51, 0, 'uint51');
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

	static fromBytesBE(source: Uint8Array, pos = 0): U64 {
		return new U64(fromBytesBE(source, pos));
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
			intExt.isGreaterThanEqual(uint64, 0, 'uint64');
			return new U64(Uint32Array.of(uint64 << 0, uint64 / maxU32Plus1));
		}
	}
}
const zero = U64.fromIntUnsafe(0);
const max = U64.fromUint32Pair(0xffffffff, 0xffffffff);

export class U64Mut extends U64 {
	/**
	 * @see value ⊕= @param b
	 * @param b
	 * @returns this (chainable)
	 */
	xorEq(b: U64Mut): U64Mut {
		this.arr[this.pos] ^= b.arr[b.pos];
		this.arr[this.pos + 1] ^= b.arr[b.pos + 1];
		return this;
	}

	/**
	 * @see value ∨= @param b
	 * @param b
	 * @returns this (chainable)
	 */
	orEq(b: U64Mut): U64Mut {
		this.arr[this.pos] |= b.arr[b.pos];
		this.arr[this.pos + 1] |= b.arr[b.pos + 1];
		return this;
	}

	/**
	 * @see value ∧= @param b
	 * @param b
	 * @returns this (chainable)
	 */
	andEq(b: U64Mut): U64Mut {
		this.arr[this.pos] &= b.arr[b.pos];
		this.arr[this.pos + 1] &= b.arr[b.pos + 1];
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
	addEq(b: U64Mut): U64Mut {
		add(this.arr, this.pos, b.arr, b.pos);
		return this;
	}

	/**
	 * @see value *= @param b
	 * @param b
	 * @returns @see value * @param b
	 */
	mulEq(b: U64Mut): U64Mut {
		mul(this.arr, this.pos, b.arr, b.pos);
		return this;
	}

	/**
	 * Set to a new (provided) value
	 * @param v 
	 * @returns 
	 */
	set(v: U64): U64Mut {
		super.set(v);
		return this;
	}

	/**
	 * Zero out this value
	 */
	zero():void {
		this.arr.fill(0,this.pos,this.pos+2);
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
	 * @returns
	 */
	static fromInt(uint51: number): U64Mut {
		intExt.isGreaterThanEqual(uint51, 0, 'uint51');
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
	 * **NOTE** the memory is shared, changing a value in @param source will mutate the return, and
	 *  changes to the Uint32Mut will alter the @param source
	 * If you don't need the shared-memory aspect append a `.slice()` to the source (creates a memory copy)
	 * @param source
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(source: Uint32Array, pos = 0): U64Mut {
		return new U64Mut(source, pos);
	}
	static fromArrayBE(source: Uint32Array, pos = 0): U64Mut {
		const cpy = source.slice(pos, pos + 2);
		cpy[0] = cpy[1];
		cpy[1] = source[pos];
		return new U64Mut(cpy, 0);
	}

	static fromBytesBE(source: Uint8Array, pos = 0): U64Mut {
		return new U64Mut(fromBytesBE(source, pos));
	}

	/**
	 * Given a number create a new U64Mut (will throw if <0)
	 * Given a U64 mutate it (memory copy)
	 * Given a U64Mut mutate it (memory copy)
	 *
	 * @param uint64
	 * @returns
	 */
	static coerce(uint64: U64ish): U64Mut {
		if (uint64 instanceof U64) {
			return uint64.mut();
		} else {
			intExt.isGreaterThanEqual(uint64, 0, 'uint64');
			return new U64Mut(Uint32Array.of(uint64 << 0, uint64 / maxU32Plus1));
		}
	}
}

export class U64MutArray {
	private buf: Uint32Array;
	private pos: number;
	private arr: Array<U64Mut>;

	protected constructor(buf: Uint32Array, pos = 0, len?: number) {
		//Default to rest of the array (will round down if uneven)
		if (len === undefined) {
			len = (buf.length - pos) >> 1; //div 2 - we need two u32 per u64
		}
		this.buf = buf;
		this.pos = pos;
		this.arr = new Array<U64Mut>(len);
		for (let i = 0; i < len; i++)
			this.arr[i] = U64Mut.fromArray(this.buf, this.pos + i + i);

		//While a proxy is nice to have, it causes some pretty wicked slowdown in ANY access to this
		// object (.. I mean, it's in the name).  Even if you're accessing a valid element it still
		// goes through the proxy (see: prop in target) so for high performance, we drop
	}

	get length(): number {
		return this.arr.length;
	}

	/**
	 * Get the item at given index, if negative it's used as the distance
	 * back from the end (-1 will return the last element).
	 * @param idx -length - length-1
	 * @returns Element at position, or undefined if `index` is out of range
	 */
	at(idx: number): U64Mut {
		//if (idx < 0) idx += this.length;
		//if (idx < 0 || idx >= this.length) return undefined;
		return this.arr[idx];
		//return U64Mut.fromArray(this.buf,this.pos + idx+ idx);
	}

	/**
	 * Set an array of values starting at @param startAt in this
	 * @param b 
	 * @param startAt 
	 */
	set(b: U64MutArray, startAt = 0): void {
		this.buf.set(b.buf.subarray(b.pos+ startAt + startAt), this.pos);
	}

	/**
	 * XorEq @param b with this array.  Starting at @param startAt position in this array
	 * and running until there's no more space (in this array) or the other array runs out
	 * @param b 
	 * @param startAt 
	 */
	xorEq(b:U64MutArray,startAt=0):void {
		let n=this.arr.length-startAt;
		if (b.length<n) n=b.length;
		//Adjust for N in 64 not 32, and for run over this buf
		n+=n+this.pos+startAt+startAt;
		for(let i=this.pos+startAt+startAt,j=b.pos;i<n;i++,j++) {
			this.buf[i]^=b.buf[j];
		}
	}

	zero(startAt=0):void {
		let n=this.arr.length-startAt;
		n+=n;
		for(let i=this.pos+startAt+startAt;i<n;i++) {
			this.buf[i]=0;
		}
	}

	clone(): U64MutArray {
		return new U64MutArray(
			this.buf.slice(this.pos, this.pos + this.length + this.length),
			0
		);
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array[8]
	 */
	toBytesBE(): Uint8Array {
		const r32 = this.buf.slice(this.pos, this.pos + this.length + this.length);
		const r8 = new Uint8Array(r32.buffer);
		let i8 = 0;
		for (let i = 0; i < r32.length; i += 2) {
			//U32 swap
			const t = r32[i]; r32[i] = r32[i + 1]; r32[i + 1] = t;
			//byte fix (maybe)
			asBE.i32(r8, i8);
			i8 += 4;
			asBE.i32(r8, i8);
			i8 += 4;
		}
		return r8;
	}
	toBytesLE():Uint8Array {
		const r32 = this.buf.slice(this.pos, this.pos + this.length + this.length);
		const r8 = new Uint8Array(r32.buffer);
		for (let i=0;i<r8.length;i+=4) {
			asLE.i32(r8,i);
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
	 * Build from a byte array
	 * NOTE: Bytes must be in LE order
	 * @param buffer
	 * @param bytePos
	 * @param len
	 * @returns
	 */
	static fromBytes(
		buffer: ArrayBuffer,
		bytePos = 0,
		len?: number
	): U64MutArray {
		//if (!(buffer instanceof ArrayBuffer)) throw TypeError('Expecting ArrayBuffer');
		if (len === undefined) {
			len = buffer.byteLength - bytePos;
		}
		len >>= 2; //div 4 - make it u32-element count rather than byte count
		return new U64MutArray(new Uint32Array(buffer, bytePos, len), 0);
	}
}
