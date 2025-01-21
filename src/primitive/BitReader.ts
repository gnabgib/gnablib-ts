/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { sNum } from '../safe/safe.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

const mask = [0, 0x01, 0x03, 0x07, 0x0f, 0x1f, 0x3f, 0x7f];

/**
 * Mount a byte array, and read a series of 1-32 bit numbers from it
 */
export class BitReader {
	private _byte = 0;
	protected constructor(private _buff: Uint8Array, private _bit = 0) {}

	/** Remaining bits in the buffer that haven't been read */
	get unreadBits() {
		return (this._buff.length - this._byte) * 8 - this._bit;
	}

	/**
	 * Set the byte/bit points back to 0
	 *
	 * **Warning** If this reader was mounted with a `startBit` other than zero it'll be lost
	 */
	reset() {
		this._bit = 0;
		this._byte = 0;
	}

	/**
	 * Read up to 32bits of int from the buffer in big-endian.
	 * @param bits Number of bits to read into value [0 - min(32,{@link unreadBits})]
	 * @returns Resulting value
	 * @throws Error If trying to read more bits than available in the buffer
	 */
	readNumberBE(bits: number): number {
		if (bits > this.unreadBits) throw new Error('not enough content');
		//todo: check the dev hasn't asked for >32 bits? Better DX but worse performance

		let ret = 0;
		let byteSpace = 8 - this._bit;
		// /*DEBUG*/ let d=`[${this._buff.length} ~${this._byte}.${this._bit}]read${bits}`;

		//Sub-byte read
		if (bits < byteSpace) {
			byteSpace -= bits;
			this._bit += bits;
			ret = (this._buff[this._byte] >>> byteSpace) & mask[bits];
			// /*DEBUG*/console.log(d+`sub${bits}=${hex.fromI32(ret)}`);
			return ret;
		}
		//Rem-byte read
		if (this._bit > 0) {
			ret = this._buff[this._byte++] & mask[byteSpace];
			bits -= byteSpace;
			this._bit = 0;
			// /*DEBUG*/d += `+^${byteSpace}=${hex.fromI32(ret)},`;
		}
		//Full-byte read
		while (bits >= 8) {
			ret = (ret << 8) | this._buff[this._byte++];
			// /*DEBUG*/d += `+a=${hex.fromI32(ret)},`;
			bits -= 8;
		}
		//start-byte read
		if (bits > 0) {
			ret = (ret << bits) | (this._buff[this._byte] >>> (8 - bits));
			// /*DEBUG*/d += `+v${bits}=${hex.fromI32(ret)}`;
			this._bit = bits;
		}
		// /*DEBUG*/console.log(d);
		return ret;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'BitReader';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `BitReader([${this._buff.length}]@${this._byte}.${this._bit})`;
	}

	/**
	 * Mount a buffer for reading.
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
		return new BitReader(buff, startBit);
	}
}
