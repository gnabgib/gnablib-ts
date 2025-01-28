/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { sInt } from '../safe/safe.js';

export abstract class AByteWriter {
	protected _ptr = 0;
	protected constructor(protected _buff: Uint8Array) {}

	/** Whether the internal buffer is full */
	get full() {
		return this._ptr >= this._buff.length;
	}

	/** Remaining buffer space in bytes */
	get space() {
		return this._buff.length - this._ptr;
	}

	/**
	 * Skip ahead a number of bytes (without modifying the buffer)
	 * @param count Number of bytes to skip `[0 - {@link space}]`
	 * @throws Error if there's not enough space
	 */
	skip(count: number) {
		sInt('count', count)
			.unsigned()
			.atMost(this._buff.length - this._ptr)
			.throwNot();
		this._ptr += count;
	}
}
