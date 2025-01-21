/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { sNum } from '../safe/safe.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

/**
 * Mount a byte array, and write a series of 1-32 bit numbers into it
 */
export class BitWriter {
	private _byte = 0;
	protected constructor(private _buff: Uint8Array, private _bit = 0) {}

	/** Whether the internal buffer is full */
	get full() {
		return this._byte >= this._buff.length;
	}

	/** Remaining buffer space in bits */
	get spaceBits() {
		return (this._buff.length - this._byte) * 8 - this._bit;
	}

	/**
	 * Set the byte/bit pointers back to 0 - doesn't erase data written so far
	 *
	 * **Warning** If this writer was mounted with a `startBit` other than zero it'll be lost
	 */
	reset() {
		this._bit = 0;
		this._byte = 0;
	}

	/**
	 * Write up to 32bits of int/uint into the buffer in big-endian
	 * @param n32 Value to write, truncated to 32bits
	 * @param bits Number of bits to write 1-32 (0 accepted but pointless)
	 * @returns Whether entire number fit
	 */
	pushNumberBE(n32: number, bits: number): boolean {
		let share = this._bit == 0 ? 0 : this._buff[this._byte];
		// /*DEBUG*/let d = `[${this._buff.length} ~${this._byte}.${this._bit}]b32=/${hex.fromI32(n32)},${bits}/sh=/${hex.fromByte(share)}/`;

		//Make sure there's at least a byte's space
		if (bits == 0) return true;
		if (this._byte == this._buff.length) return false;

		//Write aligned bytes
		let byteSpace = 8 - this._bit;
		while (bits >= byteSpace) {
			bits -= byteSpace;
			this._buff[this._byte] = share | (n32 >>> bits);
			this._bit = 0;
			byteSpace = 8;
			share = 0;
			// /*DEBUG*/d += `s${bits}[${hex.fromByte(this._buff[this._byte])}]`;
			if (++this._byte == this._buff.length) {
				// /*DEBUG*/console.log(d);
				return bits === 0;
			}
		}
		//Write partial byte
		if (bits > 0) {
			this._buff[this._byte] = share | (n32 << (8 - bits - this._bit));
			// /*DEBUG*/d += `u${8-bits}[${hex.fromByte(share)}]T`;
			this._bit += bits;
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

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'BitWriter';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `BitWriter([${this._buff.length}]@${this._byte}.${this._bit})`;
	}

	/**
	 * Mount a buffer for writing.
	 *
	 * If you wish to start at a byte beyond the first, or use less than all the bytes, use
	 * [Uint8Array.subarray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/subarray)
	 * to mount a shared portion
	 *
	 * @param buff Buffer to mount
	 * @param startBit Bit position to start from [0 - 7] where 0=first bit, and 7=last bit
	 */
	static mount(buff: Uint8Array, startBit = 0) {
		sNum('bit', startBit).unsigned().atMost(7).throwNot();
		return new BitWriter(buff, startBit);
	}
}
