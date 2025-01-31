/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { asBE, asLE } from "../../endian/platform.js";
import { U32Mut } from "./U32.js";

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

export class U32MutArray {
	private buf: Uint32Array;
	private bufPos: number;
	private arr: Array<U32Mut>;

	protected constructor(buf: Uint32Array, bufPos = 0, len?: number) {
		if (len == undefined) {
			len = buf.length - bufPos;
		}
		this.buf = buf;
		this.bufPos = bufPos;
		this.arr = new Array<U32Mut>(len);
		for (let i = 0; i < len; i++)
			this.arr[i] = U32Mut.mount(this.buf, this.bufPos + i);

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
	at(idx: number): U32Mut {
		return this.arr[idx];
	}

	/**
	 * Set from `src` starting at `srcOffset` into this array starting at `thisOffset`
	 * @param src
	 * @param thisOffset Called `targetOffset` in TypedArray (default 0)
	 * @param srcOffset (default 0)
	 */
	set(src: U32MutArray, thisOffset = 0, srcOffset = 0): void {
		this.buf.set(
			src.buf.subarray(src.bufPos + srcOffset),
			this.bufPos + thisOffset
		);
	}

	xorEq(b: U32MutArray, thisOffset = 0): void {
		//For all the space of this array
		let n = this.arr.length - thisOffset;
		//OR all the provided array if it's shorter
		if (b.length < n) n = b.length;

		//Adjust n for the buffer position
		n += this.bufPos + thisOffset;
		for (let i = this.bufPos + thisOffset, j = b.bufPos; i < n; i++, j++) {
			this.buf[i] ^= b.buf[j];
		}
	}

	zero(thisOffset = 0): void {
		this.buf.fill(0, this.bufPos + thisOffset);
	}

	clone(): U32MutArray {
		return new U32MutArray(
			this.buf.slice(this.bufPos, this.bufPos + this.length)
		);
	}

	toString(): string {
		return 'len=' + this.length;
	}

	/**
	 * Value as a stream of bytes (big-endian order) COPY
	 * @returns Uint8Array
	 */
	toBytesBE(): Uint8Array {
		const r = new Uint8Array(
			this.buf.slice(this.bufPos, this.bufPos + this.arr.length).buffer
		);
		asBE.i32(r, 0, this.arr.length);
		return r;
	}

	/**
	 * Value as a stream of bytes (little-endian order) COPY
	 * @returns Uint8Array
	 */
	toBytesLE(): Uint8Array {
		const r = new Uint8Array(
			this.buf.slice(this.bufPos, this.bufPos + this.arr.length).buffer
		);
		asLE.i32(r, 0, this.arr.length);
		return r;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'U32MutArray';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `U32MutArray(${this.toString()})`;
	}

	static fromLen(len: number): U32MutArray {
		return new U32MutArray(new Uint32Array(len));
	}

	/**
	 * Build from a byte array (shared memory)
	 * NOTE: Bytes must be in platform-endian order
	 *  - Platform-LE: 0,1,2,3
	 *  - Platform-BE: 3,2,1,0
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
	): U32MutArray {
		if (byteLen == undefined) {
			byteLen = buffer.byteLength - bytePos;
		}
		byteLen >>= 2; //div 4 - make it u32-element count rather than byte count
		return new U32MutArray(new Uint32Array(buffer, bytePos, byteLen));
	}
}
