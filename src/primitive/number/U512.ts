/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { hex } from '../../codec/Hex.js';
import { asBE, asLE } from '../../endian/platform.js';
import { sNum } from '../../safe/safe.js';

//Todo: docs

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT_U512 = 'U512';
const sizeBytes = 64;
const sizeU32 = 16;

export class U512 {
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
	 * Mutate - copy the out into a new Uint32Array
	 */
	mut32(): Uint32Array {
		return this.arr.slice(this.pos, this.pos + sizeU32);
	}

	/**
	 * String version of this value, in big endian
	 * @returns
	 */
	toString(): string {
		return hex.fromBytes(this.toBytesBE());
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array[8]
	 */
	toBytesBE(): Uint8Array {
		//Invert l/h & project into bytes
		const r8 = new Uint8Array(
			this.arr.slice(this.pos, this.pos + sizeU32).reverse().buffer
		);
		asBE.i32(r8, 0, sizeU32);
		return r8;
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
		return DBG_RPT_U512;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT_U512}(${this.toString()})`;
	}

	/**
	 * Build from sixteen U32 integers
	 */
	static fromUint32Hex(
		low: number,
		v1: number,
		v2: number,
		v3: number,
		v4: number,
		v5: number,
		v6: number,
		v7: number,
		v8: number,
		v9: number,
		v10: number,
		v11: number,
		v12: number,
		v13: number,
		v14: number,
		high: number
	): U512 {
		return new U512(
			Uint32Array.of(
				low,
				v1,
				v2,
				v3,
				v4,
				v5,
				v6,
				v7,
				v8,
				v9,
				v10,
				v11,
				v12,
				v13,
				v14,
				high
			)
		);
	}

	/**
	 * A U512 with value
	 * 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
	 * 13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031858186486050853753882811946569946433649006084095
	 */
	static get max(): U512 {
		return max;
	}

	/**
	 * A U512 with value 0 (the minimum Uint256)
	 */
	static get min(): U512 {
		return zero;
	}

	/**
	 * A U512 with value 0
	 */
	static get zero(): U512 {
		return zero;
	}
}
const zero = U512.fromUint32Hex(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
const max = U512.fromUint32Hex(
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff,
	0xffffffff
);
