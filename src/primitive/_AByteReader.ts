/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { sInt } from '../safe/safe.js';

export abstract class AByteReader {
	protected _ptr = 0;
	protected constructor(protected _buff: Uint8Array) {}

	/** Remaining bytes in the buffer that haven't been read */
	get unread() {
		return this._buff.length - this._ptr;
	}

	/**
	 * Skip ahead a number of bytes
	 * @param count Number of bytes to skip `[0 - {@link unread}]`
	 * @throws Error if there's not enough content
	 */
	skip(count: number) {
		sInt('count', count)
			.unsigned()
			.atMost(this._buff.length - this._ptr)
			.throwNot();
		this._ptr += count;
	}
}
