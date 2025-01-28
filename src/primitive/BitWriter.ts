/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { sInt } from '../safe/safe.js';
import { AByteWriter } from './_AByteWriter.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

/**
 * Mount a byte array, and write a series of 1-32 bit numbers into it
 */
export class BitWriter extends AByteWriter {
	protected _bitPtr = 0;

	/** Remaining buffer space in bits */
	get spaceBits() {
		return (this._buff.length - this._ptr) * 8 - this._bitPtr;
	}

	/**
	 * Write up to 32bits of int/uint into the buffer in big-endian
	 * @param n32 Value to write, truncated to 32bits
	 * @param bits Number of bits to write 1-32 (0 accepted but pointless)
	 * @returns Whether entire number fit
	 */
	pushNumberBE(n32: number, bits: number): boolean {
		let share = this._bitPtr == 0 ? 0 : this._buff[this._ptr];
		// /*DEBUG*/let d = `[${this._buff.length} ~${this._byte}.${this._bit}]b32=/${hex.fromI32(n32)},${bits}/sh=/${hex.fromByte(share)}/`;

		//Make sure there's at least a byte's space
		if (bits == 0) return true;
		if (this._ptr == this._buff.length) return false;

		//Write aligned bytes
		let byteSpace = 8 - this._bitPtr;
		while (bits >= byteSpace) {
			bits -= byteSpace;
			this._buff[this._ptr] = share | (n32 >>> bits);
			this._bitPtr = 0;
			byteSpace = 8;
			share = 0;
			// /*DEBUG*/d += `s${bits}[${hex.fromByte(this._buff[this._byte])}]`;
			if (++this._ptr == this._buff.length) {
				// /*DEBUG*/console.log(d);
				return bits === 0;
			}
		}
		//Write partial byte
		if (bits > 0) {
			this._buff[this._ptr] = share | (n32 << (8 - bits - this._bitPtr));
			// /*DEBUG*/d += `u${8-bits}[${hex.fromByte(share)}]T`;
			this._bitPtr += bits;
		}
		// /*DEBUG*/console.log(d);
		return true;
	}

	/**
	 * Like {@link pushNumberBE} but throws if the number didn't fit
	 * Write up to 32bits of int/uint into the buffer in big-endian
	 * @param n32 Value to write, truncated to 32bits
	 * @param bits Number of bits to write 1-32 (0 accepted but pointless)
	 * @throws Error not enough space in the buffer
	 */
	mustPushNumberBE(n32: number, bits: number) {
		if (!this.pushNumberBE(n32, bits)) throw new Error('not enough space');
	}

	/**
	 * Skip ahead a number of bits (without modifying the buffer)
	 * @param count Number of bits to skip `[0 - {@link spaceBits}]`
	 * @throws Error if there's not enough space
	 */
	skipBits(count: number) {
		sInt('count', count).unsigned().atMost(this.spaceBits).throwNot();
		let c8 = (count / 8) | 0;
		this._bitPtr += count & 7;
		if (this._bitPtr > 7) {
			c8 += 1;
			this._bitPtr -= 8;
		}
		this._ptr += c8;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'BitWriter';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `BitWriter([${this._buff.length}]@${this._ptr}.${this._bitPtr})`;
	}

	/**
	 * Mount a buffer for writing.
	 *
	 * If you wish to start at a byte beyond the first, or use less than all the bytes, use
	 * [Uint8Array.subarray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/subarray)
	 * to mount a shared portion
	 */
	static mount(buff: Uint8Array) {
		return new BitWriter(buff);
	}
}
