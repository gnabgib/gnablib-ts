/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { sInt } from '../safe/safe.js';
import { AByteWriter } from './_AByteWriter.js';
import { IWriter } from './interfaces/IWriter.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

/** Mount a byte array, write a series of bytes to it */
export class ByteWriter extends AByteWriter implements IWriter {
    /**
     * Write a byte to the buffer, will be truncated to 8bits
     * @returns Whether write was successful
     */
    tryWriteByte(b:number):boolean {
        if (this._ptr>=this._buff.length) return false;
        this._buff[this._ptr++]=b;
        return true;
    }

	/**
	 * Write a series of bytes to the buffer, will be truncated if there's not enough space
	 * @returns Whether all the data fit, or some was truncated
	 */
	tryWrite(data: Uint8Array): boolean {
		const space = this.space;
		if (data.length > space) {
			this._buff.set(data.subarray(0, space), this._ptr);
			this._ptr = this._buff.length;
			return false;
		}
		this._buff.set(data, this._ptr);
		this._ptr += data.length;
		return true;
	}

    writeByte(b:number) {
		if (this._ptr >= this._buff.length)
			throw new Error('not enough space');
        this._buff[this._ptr++]=b;
    }

	write(data: Uint8Array) {
		if (this._ptr + data.length > this._buff.length)
			throw new Error('not enough space');
		this._buff.set(data, this._ptr);
		this._ptr += data.length;
	}

	/**
	 * Allocate the next `len` bytes to a new writer (which is returned).
	 * The new writer *shares* the same buffer as this, but with a limited view.
	 * This writer forwards to the end of the new writer's block as if it was written/skipped.
	 *
	 * @param len Length of new writer `[0 - {@link space}]`
     * @param share If true, the bytes aren't removed from this writer (shared memory, use with caution)
	 * @throws Error if there's not enough space for requested `len`
	 */
	sub(len: number,share=false): ByteWriter {
		sInt('len', len)
			.unsigned()
			.atMost(this._buff.length - this._ptr)
			.throwNot();
		const ret = new ByteWriter(
			this._buff.subarray(this._ptr, this._ptr + len)
		);
		if (!share) this._ptr += len;
		return ret;
	}

	//todo subBits(bitLen:number):BitWriter

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'ByteWriter';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `ByteWriter([${this._buff.length}]@${this._ptr})`;
	}

	/**
	 * Mount a buffer for writing.
	 *
	 * If you wish to start at a byte beyond the first, or use less than all the bytes, use
	 * [Uint8Array.subarray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/subarray)
	 * to mount a shared portion
	 */
	static mount(buff: Uint8Array) {
		return new ByteWriter(buff);
	}
    
    /** Create a buffer for writing */
    static size(byteCount:number) {
        const buff=new Uint8Array(byteCount);
        return new ByteWriter(buff);
    }
}
