/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { hex } from '../../codec/Hex.js';
import { asBE, asLE } from '../../endian/platform.js';
import { sNum } from '../../safe/safe.js';
import { U64, U64MutArray } from './U64.js';

//Todo: docs

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT_U256 = 'U256';
const sizeBytes = 32;
const sizeU32 = 8;
const maxU32Plus1 = 0x100000000;

function fromBytesBE(source: Uint8Array, pos = 0): Uint32Array {
	//Clone the source (we don't want to mangle the original data)
	const cpy = source.slice(pos, pos + sizeBytes);
	//Fix the endianness of each u32
	asBE.i32(cpy, 0, sizeU32);
	//Map to c32
	const c32 = new Uint32Array(cpy.buffer);
	let t = c32[0];
	c32[0] = c32[7];
	c32[7] = t;

	t = c32[1];
	c32[1] = c32[6];
	c32[6] = t;

	t = c32[2];
	c32[2] = c32[5];
	c32[5] = t;

	t = c32[3];
	c32[3] = c32[4];
	c32[4] = t;
    
	return c32;
}

function fromBytesLE(source: Uint8Array, pos = 0): Uint32Array {
	const cpy = source.slice(pos, pos + sizeBytes);
	asLE.i32(cpy, 0, sizeU32);
	const c32 = new Uint32Array(cpy.buffer);
	//No need to swap bytes
	return c32;
}

export class U256 {
	protected arr: Uint32Array;
	protected pos: number;

	/**
	 * Uint32 is platform ordered, but the first number is low, and the last high
	 * [pos]=lowest32 ..  [pos+7]=highest32
	 *
	 * On LE systems this means it's true LE (bytes: 0..31, 32..63, 64..95, 96..127..), on BE systems
	 * this means it's a form of middle (31..0, 63..32, 64..95, 127..96..)
	 * @param arr
	 * @param pos
	 */
	protected constructor(arr: Uint32Array, pos = 0) {
		this.arr = arr;
		this.pos = pos;
	}

	/**
	 * Mutate - create a new @see {@link U64MutArray} with a copy of this value
	 */
	mut64(): U64MutArray {
		return U64MutArray.fromBytes(
			this.arr.buffer,
			this.arr.byteOffset + this.pos * 4,
			sizeBytes
		);
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array[8]
	 */
	toBytesBE(): Uint8Array {
		//Invert l/h & project into bytes
		const r = new Uint8Array(
			Uint32Array.of(
				this.arr[this.pos + 7],
				this.arr[this.pos + 6],
				this.arr[this.pos + 5],
				this.arr[this.pos + 4],
				this.arr[this.pos + 3],
				this.arr[this.pos + 2],
				this.arr[this.pos + 1],
				this.arr[this.pos]
			).buffer
		);
		asBE.i32(r, 0, sizeU32);
		return r;
	}

	/**
	 * String version of this value, in big endian
	 * @returns
	 */
	toString(): string {
		return hex.fromBytes(this.toBytesBE());
	}

	/**
	 * Value as a stream of bytes (little-endian order) COPY
	 * @returns Uint8Array[8]
	 */
	toBytesLE(): Uint8Array {
		const r8 = new Uint8Array(
			this.arr.slice(this.pos, this.pos + sizeU32).buffer
		);
		asLE.i32(r8, 0, sizeU32);
		return r8;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT_U256;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT_U256}(${this.toString()})`;
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51
	 * @returns
	 */
	static fromIntUnsafe(uint51: number): U256 {
		return new U256(
			Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0, 0, 0, 0, 0)
		);
	}

	/**
	 * Build from an integer - note JS can only support up to 51bit ints
	 * @param uint51 0-Number.MAX_SAFE_INT
	 * @returns
	 */
	static fromInt(uint51: number): U256 {
		sNum('uint51', uint51).unsigned().throwNot();
		return new U256(
			Uint32Array.of(uint51 << 0, uint51 / maxU32Plus1, 0, 0, 0, 0, 0, 0)
		);
	}

	/**
	 * Build from eight U32 integers
	 */
	static fromUint32Octo(
		zero: number,
		one: number,
		two: number,
		three: number,
		four: number,
		five: number,
		six: number,
		seven: number
	): U256 {
		return new U256(
			Uint32Array.of(zero, one, two, three, four, five, six, seven)
		);
	}

	/**
	 * Build from four U64 integers
	 * @param u64low
	 * @param u64high
	 * @returns
	 */
	static fromU64Quad(zero: U64, one: U64, two: U64, three: U64): U256 {
		return new U256(
			Uint32Array.of(
				zero.low,
				zero.high,
				one.low,
				one.high,
				two.low,
				two.high,
				three.low,
				three.high
			)
		);
	}

    	/**
	 * Created a "view" into an existing Uint32Array
	 * **NOTE** the memory is shared, changing a value in @param source will mutate the state
	 * @param source
	 * @param pos Position to link (default 0), note this is an array-position not bytes
	 * @returns
	 */
	static fromArray(source: Uint32Array, pos = 0): U256 {
		return new U256(source, pos);
	}
    
    /**
	 * Create from a copy of `src` assuming the bytes are in big endian order
	 * @param src
	 * @param pos
	 * @returns
	 */
	static fromBytesBE(src: Uint8Array, pos = 0): U256 {
		return new U256(fromBytesBE(src, pos));
	}

	/**
	 * Create from a copy of `src` assuming the bytes are in little endian order
	 * @param src
	 * @param pos
	 * @returns
	 */
	static fromBytesLE(src: Uint8Array, pos = 0): U256 {
		return new U256(fromBytesLE(src, pos));
	}

	/**
	 * Create a view into an `ArrayBuffer`. Note this relies on platform endian
	 * **NOTE** Memory is shared (like @see fromArray)
	 * **NOTE** Subject to the same JS limitation that `bytePos` must be a multiple of element-size (8)
	 * **NOTE** The first 4* bytes must be in platform-endian order, and LOW, the second 4* bytes=high
	 * 	- Platform-LE, bytes should be in LE order: 0,1,2,3,4,5,6,7
	 *  - Platform-BE, bytes should be in mixed: 3,2,1,0,7,6,5,4
	 * **USE WITH CAUTION**
	 * @param src
	 * @param bytePos
	 * @returns
	 */
	static fromBuffer(src: ArrayBuffer, bytePos = 0): U256 {
		return new U256(new Uint32Array(src, bytePos, sizeU32));
	}

	/**
	 * A U256 with value 115792089237316195423570985008687907853269984665640564039457584007913129639935 (the maximum Uint64)
	 */
	static get max(): U256 {
		return max;
	}

	/**
	 * A U256 with value 0 (the minimum Uint256)
	 */
	static get min(): U256 {
		return zero;
	}

	/**
	 * A U256 with value 0
	 */
	static get zero(): U256 {
		return zero;
	}
}

const zero = U256.fromUint32Octo(0, 0, 0, 0, 0, 0, 0, 0);
const max = U256.fromUint32Octo(
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff
);