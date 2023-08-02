/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { hex } from '../encoding/Hex.js';
import { asBE, asLE } from '../endian/platform.js';
import { safety } from './Safety.js';

const maxU32 = 0xffffffff;
const maxU16 = 0xffff;
const maxU32Plus1 = maxU32+1;
const u32Count=4;
const sizeBytes=16;

function fromBytesBE(source: Uint8Array, pos = 0): Uint32Array {
	//Clone the source (we don't want to mangle the original data)
	const cpy = source.slice(pos, pos + sizeBytes);
	//Fix the endianness of each u32
	asBE.i32(cpy, 0, u32Count);
	//Map to c32
	const c32 = new Uint32Array(cpy.buffer);

    //note if you inspect these they may have strange values (depending on platform endianness)
	let t = c32[0];
	c32[0] = c32[3];
	c32[3] = t;
	
    t = c32[1];
	c32[1] = c32[2];
	c32[2] = t;

	return c32;
}
function fromBytesLE(source: Uint8Array, pos = 0): Uint32Array {
	//Clone the source (we don't want to mangle the original data)
	const cpy = source.slice(pos, pos + sizeBytes);
	//Fix the endianness of each u32
	asLE.i32(cpy, 0, u32Count);
	//Map to c32
	const c32 = new Uint32Array(cpy.buffer);
    //No need to swap bytes
	return c32;
}




export class U128 {
	protected arr: Uint32Array;
	protected pos: number;

	/**
	 * Uint32 is platform ordered, but the U32 are in LE order
	 * [pos]=low32, [pos+1]=highLow32, [pos+2]=lowHigh32, [pos+3]=high32
	 *
	 * On LE systems this means it's true LE (bytes: 0..31, 32..63, 64..95, 96..127),
	 * on BE systems this means it's a form of middle (31..0, 63..32, 95..64, 127..96)
	 * @param arr
	 * @param pos
	 */
	protected constructor(arr: Uint32Array, pos = 0) {
		this.arr = arr;
		this.pos = pos;
	}

    /**
	 * This is only used by U128Mut (notice it's protected), so we can look inside v.arr
	 * @param v
	 */
	protected _setValue(v: U128): void {
		this.arr[this.pos] = v.arr[v.pos];
		this.arr[this.pos + 1] = v.arr[v.pos + 1];
        this.arr[this.pos + 2] = v.arr[v.pos + 2];
        this.arr[this.pos + 3] = v.arr[v.pos + 3];
	}
	protected _xorEq(a: Uint32Array, aPos: number, b: U128) {
        a[aPos] ^= b.arr[b.pos];
        a[aPos+1] ^= b.arr[b.pos+1];
        a[aPos+2] ^= b.arr[b.pos+2];
        a[aPos+3] ^= b.arr[b.pos+3];
	}
	protected _orEq(a: Uint32Array, aPos: number, b: U128) {
        a[aPos] |= b.arr[b.pos];
        a[aPos+1] |= b.arr[b.pos+1];
        a[aPos+2] |= b.arr[b.pos+2];
        a[aPos+3] |= b.arr[b.pos+3];
	}
	protected _andEq(a: Uint32Array, aPos: number, b: U128) {
        a[aPos] &= b.arr[b.pos];
        a[aPos+1] &= b.arr[b.pos+1];
        a[aPos+2] &= b.arr[b.pos+2];
        a[aPos+3] &= b.arr[b.pos+3];
	}
	protected _addEqU(a: Uint32Array, aPos: number, b: U128):number {
        let add = a[aPos] + b.arr[b.pos];
		//Carry can only be 0/1
		let carry = add > maxU32 ? 1 : 0;
		a[aPos] = add;

        add=a[aPos+1]+b.arr[b.pos+1]+carry;
        carry = add > maxU32 ? 1 : 0;
        a[aPos+1] = add;

        add=a[aPos+2]+b.arr[b.pos+2]+carry;
        carry = add > maxU32 ? 1 : 0;
        a[aPos+2] = add;

        add=a[aPos+3]+b.arr[b.pos+3]+carry;
        carry = add > maxU32 ? 1 : 0;
        a[aPos+3] = add;
        return carry;
	}
    protected static _addEqA(a: Uint32Array, aPos: number, b: Uint32Array, bPos:number):number {
        let add = a[aPos] + b[bPos];
		//Carry can only be 0/1
		let carry = add > maxU32 ? 1 : 0;
		a[aPos] = add;

        add=a[aPos+1]+b[bPos+1]+carry;
        carry = add > maxU32 ? 1 : 0;
        a[aPos+1] = add;

        add=a[aPos+2]+b[bPos+2]+carry;
        carry = add > maxU32 ? 1 : 0;
        a[aPos+2] = add;

        add=a[aPos+3]+b[bPos+3]+carry;
        carry = add > maxU32 ? 1 : 0;
        a[aPos+3] = add;
        return carry;
	}
    protected static _negEq(a: Uint32Array, aPos:number) {
        //Not
        a[aPos]=~a[aPos];
        a[aPos+1]=~a[aPos+1];
        a[aPos+2]=~a[aPos+2];
        a[aPos+3]=~a[aPos+3];

        //Add one
        a[aPos]+=1;
        //If overflow add to next block
        if (a[aPos]==0) {
            a[aPos+1]+=1;
            //If overflow add to next block
            if (a[aPos+1]==0) {
                a[aPos+2]+=1;
                //If overflow add to next block
                if (a[aPos+2]==0) {
                    a[aPos+3]+=1;
                }
            }
        }
    }
	protected _subEq(a: Uint32Array, aPos: number, b: U128) {
        const bArr=b.arr.slice(b.pos,b.pos+u32Count);
        U128._negEq(bArr,0);
        U128._addEqA(a,aPos,bArr,0);
	}
	protected _mulEq(a: Uint32Array, aPos: number, b: U128):number {
		//Long multiplication!
        //128 bits = 8 U16, 4 U32, 2 U64
        // a0 1 2 3 4 5 6 7
        // b0 1 2 3 4 5 6 7
        // m = 00, 01+10, 02+11+20, 03+12+21+30
        //     04+13+22+31+40, 

		// FFFF*FFFF (biggest possible uint16s) = FFFE0001
		// FFFFFFFF*FFFFFFFF (biggest possible uint32s) = FFFFFFFE00000001
		const a0 = a[aPos] & maxU16;
		const a1 = a[aPos] >>> 16;
		const a2 = a[aPos + 1] & maxU16;
		const a3 = a[aPos + 1] >>> 16;
		const a4 = a[aPos + 2] & maxU16;
		const a5 = a[aPos + 2] >>> 16;
		const a6 = a[aPos + 3] & maxU16;
		const a7 = a[aPos + 3] >>> 16;

        const b0 = b.arr[b.pos] & maxU16;
		const b1 = b.arr[b.pos] >>> 16;
		const b2 = b.arr[b.pos + 1] & maxU16;
		const b3 = b.arr[b.pos + 1] >>> 16;
		const b4 = b.arr[b.pos + 2] & maxU16;
		const b5 = b.arr[b.pos + 2] >>> 16;
		const b6 = b.arr[b.pos + 3] & maxU16;
		const b7 = b.arr[b.pos + 3] >>> 16;

		const m0 = a0 * b0;
		const c0 = m0 >>> 16;

		const m1 = a0 * b1 + a1 * b0 + c0;
		const c1 = (m1 / 0x10000) | 0; //Can be >32bits (because of c)

		const m2 = a0 * b2 + a1 * b1 + a2 * b0 + c1;
		const c2 = (m2 / 0x10000) | 0;//Can be >32bits (because of addition)

		const m3 = a0 * b3 + a1 * b2 + a2 * b1 + a3 * b0 + c2;
        const c3 = (m3 / 0x10000) | 0;

        const m4 = a0 * b4 + a1 * b3 + a2 * b2 + a3 * b1 + a4 * b0 + c3;
        const c4 = (m4 / 0x10000) | 0;

        const m5 = a0 * b5 + a1 * b4 + a2 * b3 + a3 * b2 + a4 * b1 + a5 * b0 + c4;
        const c5 = (m5 / 0x10000) | 0;

        const m6 = a0 * b6 + a1 * b5 + a2 * b4 + a3 * b3 + a4 * b2 + a5 * b1 + a6 * b0 + c5;
        const c6 = (m6 / 0x10000) | 0;

        const m7 = a0 * b7 + a1 * b6 + a2 * b5 + a3 * b4 + a4 * b3 + a5 * b2 + a6 * b1 + a7 * b0 + c6;
        const c7 = (m7 / 0x10000) | 0;

        a[aPos] = (m0 & maxU16) | ((m1 & maxU16) << 16);
		a[aPos + 1] = (m2 & maxU16) | ((m3 & maxU16) << 16);
		a[aPos + 2] = (m4 & maxU16) | ((m5 & maxU16) << 16);
		a[aPos + 3] = (m6 & maxU16) | ((m7 & maxU16) << 16);
        return c7;
	}

    /**
	 * `this` ⊕ `u128`
	 * @param u128
	 * @returns
	 */
	xor(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + u32Count);
		this._xorEq(arr, 0, u128);
		return new U128(arr);
	}

	/**
	 * `this` ∨ `u128`
	 * @param u128
	 * @returns
	 */
	or(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + u32Count);
		this._orEq(arr, 0, u128);
		return new U128(arr);
	}

	/**
	 * `this` ∧ `u128`
	 * @param u128
	 * @returns
	 */
	and(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + u32Count);
		this._andEq(arr, 0, u128);
		return new U128(arr);
	}

	/**
	 * ¬ `this`
	 * @returns
	 */
	not(): U128 {
        const arr=new Uint32Array(4);
        arr[0]= ~this.arr[this.pos];
        arr[1]= ~this.arr[this.pos+1];
        arr[2]= ~this.arr[this.pos+2];
        arr[3]= ~this.arr[this.pos+3];

		return new U128(arr);
	}

    //lShift, lRot, rShift, rRot

    /**
	 * `this` + `u128`
	 * @param u128
	 * @returns
	 */
	add(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + u32Count);
        this._addEqU(arr, 0, u128);
		return new U128(arr, 0);
	}

	/**
	 * `this` - `u128`
	 * @param u128
	 * @returns
	 */
	sub(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + u32Count);
		this._subEq(arr, 0, u128);
		return new U128(arr, 0);
	}

	/**
	 * `this` * `u128`
	 * @param u128
	 * @returns
	 */
	mul(u128: U128): U128 {
		const arr = this.arr.slice(this.pos, this.pos + u32Count);
		this._mulEq(arr, 0, u128);
		return new U128(arr);
	}

    /**
	 * Whether `this`==`u128`
	 * @param u128
	 * @returns
	 */
	eq(u128: U128): boolean {
		//Will fast exit if lows don't match (not constant)
		return (
			this.arr[this.pos] == u128.arr[u128.pos] &&
			this.arr[this.pos + 1] == u128.arr[u128.pos + 1] &&
            this.arr[this.pos + 2] == u128.arr[u128.pos + 2] &&
            this.arr[this.pos + 3] == u128.arr[u128.pos + 3] 
		);
	}

    // gt lt gte lte


	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array[16]
	 */
	toBytesBE(): Uint8Array {
		//Invert l/h & project into bytes
		const r = new Uint8Array(
			Uint32Array.of(
				this.arr[this.pos + 3],
				this.arr[this.pos + 2],
				this.arr[this.pos + 1],
				this.arr[this.pos]
			).buffer
		);
		asBE.i32(r, 0, 4);
		return r;
	}

    /**
	 * Create a memory copy
	 * @returns
	 */
	clone(): U128 {
		return new U128(this.arr.slice(this.pos, this.pos + u32Count));
	}

	/**
	 * Mutate - create a new {@link U128Mut} with a copy of this value
	 */
	mut(): U128Mut {
		return U128Mut.fromArray(this.arr.slice(this.pos, this.pos + u32Count));
	}

	/**
	 * String version of this value, in big endian
	 * @returns
	 */
	toString(): string {
		return 'u128{' + hex.fromBytes(this.toBytesBE()) + '}';
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
		const shift = idx >> 2;
		//Limit IDX to 0-3 (&3) and then switch to bits (<<3)
		idx = (idx & 3) << 3;
		return (this.arr[this.pos + shift] >>> idx) & 0xff;
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51
	 * @returns
	 */
	static fromIntUnsafe(uint51: number): U128 {
		return new U128(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51 0-Number.MAX_SAFE_INT
	 * @returns
	 */
	static fromInt(uint51: number): U128 {
		safety.intGte(uint51, 0, 'uint51');
		return new U128(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
	}

	/**
	 * Build from four integers, each truncated to 32 bits
	 * @param u32LowLow
	 * @param u32LowHigh
	 * @param u32HighLow
	 * @param u32HighHigh
	 */
	static fromUint32Quad(
		u32LowLow: number,
		u32LowHigh: number,
		u32HighLow: number,
		u32HighHigh: number
	): U128 {
		return new U128(
			Uint32Array.of(u32LowLow, u32LowHigh, u32HighLow, u32HighHigh)
		);
	}

	/**
	 * Created a "view" into an existing Uint32Array
	 * **NOTE** the memory is shared, changing a value in @param source will mutate the state
	 * @param source
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(source: Uint32Array, pos = 0): U128 {
		return new U128(source, pos);
	}

    /**
	 * Create from a copy of `src`
	 * @param src
	 * @param pos
	 * @returns
	 */
	static fromBytesBE(src: Uint8Array, pos = 0): U128 {
		return new U128(fromBytesBE(src, pos));
	}

    /**
	 * Create from a copy of `src`
	 * @param src
	 * @param pos
	 * @returns
	 */
	static fromBytesLE(src: Uint8Array, pos = 0): U128 {
		return new U128(fromBytesLE(src, pos));
	}

	/**
	 * A U128 with value 340,282,366,920,938,463,463,374,607,431,768,211,455 (the maximum Uint128)
	 */
	static get max(): U128 {
		return max;
	}

	/**
	 * A U128 with value 0 (the minimum Uint128)
	 */
	static get min(): U128 {
		return zero;
	}

	/**
	 * A U128 with value 0
	 */
	static get zero(): U128 {
		return zero;
	}
}
const zero = U128.fromIntUnsafe(0);
const max = U128.fromUint32Quad(maxU32,maxU32,maxU32,maxU32);

export class U128Mut extends U128 {
    /**
	 * @see value ⊕= `u128`
	 * @param u128
	 * @returns this (chainable)
	 */
	xorEq(u128: U128): U128Mut {
		this._xorEq(this.arr, this.pos, u128);
		return this;
	}

	/**
	 * @see value ∨= `u128`
	 * @param u128
	 * @returns this (chainable)
	 */
	orEq(u128: U128): U128Mut {
		this._orEq(this.arr, this.pos, u128);
		return this;
	}

	/**
	 * @see value ∧= `u128`
	 * @param u128
	 * @returns this (chainable)
	 */
	andEq(u128: U128): U128Mut {
		this._andEq(this.arr, this.pos, u128);
		return this;
	}

	/**
	 * ¬= @see value
	 * @returns this (chainable)
	 */
	notEq(): U128Mut {
		this.arr[this.pos] = ~this.arr[this.pos];
		this.arr[this.pos + 1] = ~this.arr[this.pos + 1];
        this.arr[this.pos + 2] = ~this.arr[this.pos + 2];
        this.arr[this.pos + 3] = ~this.arr[this.pos + 3];
		return this;
	}

    //lShiftEq lRotEq rShiftEq rRotEq

    /**
	 * @see value += @param b
	 * @param b
	 * @returns @see value + @param b
	 */
	addEq(b: U128): U128Mut {
		this._addEqU(this.arr, this.pos, b);
		return this;
	}

	/**
	 * @see value -= @param b
	 * @param b
	 * @returns @see value -= @param b
	 */
	subEq(b: U128): U128Mut {
		this._subEq(this.arr, this.pos, b);
		return this;
	}

	/**
	 * @see value *= @param b
	 * @param b
	 * @returns @see value * @param b
	 */
	mulEq(b: U128): U128Mut {
		this._mulEq(this.arr, this.pos, b);
		return this;
	}

	/**
	 * Create a copy of this U64Mut
	 * @returns
	 */
	clone(): U128Mut {
		return new U128Mut(this.arr.slice(this.pos, this.pos + u32Count));
	}

	/**
	 * Zero out this value
	 */
	zero(): void {
		this.arr.fill(0, this.pos, this.pos + 4);
	}

    /**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51
	 * @returns
	 */
	static fromIntUnsafe(uint51: number): U128Mut {
		return new U128Mut(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51 0-Number.MAX_SAFE_INT
	 * @returns
	 */
	static fromInt(uint51: number): U128Mut {
		safety.intGte(uint51, 0, 'uint51');
		return new U128Mut(Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0));
	}

	/**
	 * Build from four integers, each truncated to 32 bits
	 * @param u32LowLow
	 * @param u32LowHigh
	 * @param u32HighLow
	 * @param u32HighHigh
	 */
	static fromUint32Quad(
		u32LowLow: number,
		u32LowHigh: number,
		u32HighLow: number,
		u32HighHigh: number
	): U128Mut {
		return new U128Mut(
			Uint32Array.of(u32LowLow, u32LowHigh, u32HighLow, u32HighHigh)
		);
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
	static fromArray(source: Uint32Array, pos = 0): U128Mut {
		return new U128Mut(source, pos);
	}
}
