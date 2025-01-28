/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { sInt } from '../safe/safe.js';
import { AByteReader } from './_AByteReader.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

/** Mount a byte array, and read a series of bytes from it */
export class ByteReader extends AByteReader {
	/**
	 * Read a **copy** of `count` bytes of data from the buffer
	 * @throws Error if trying to read more bytes than available, or for a bad value of count (negative, floating point, etc)
	 */
	read(count: number): Uint8Array {
		sInt('count', count)
			.unsigned()
			.atMost(this._buff.length - this._ptr)
			.throwNot();
		const ret = this._buff.slice(this._ptr, this._ptr + count);
		this._ptr += count;
		return ret;
	}

	/** Read a **copy** of the remaining bytes from the buffer */
	rest(): Uint8Array {
		const ret = this._buff.slice(this._ptr);
		this._ptr = this._buff.length;
		return ret;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'ByteReader';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `ByteReader([${this._buff.length}]@${this._ptr})`;
	}

	/**
	 * Mount a buffer for reading.
	 *
	 * If you wish to start at a byte beyond the first, or use less than all the bytes, use
	 * [Uint8Array.subarray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/subarray)
	 * to mount a shared portion
	 */
	static mount(buff: Uint8Array) {
		return new ByteReader(buff);
	}
}
