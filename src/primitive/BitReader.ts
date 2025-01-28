/*! Copyright 2024-2025 the gnablib contributors MPL-1.1 */

import { sInt } from '../safe/safe.js';
import { AByteReader } from './_AByteReader.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

const mask = [0, 0x01, 0x03, 0x07, 0x0f, 0x1f, 0x3f, 0x7f];

/** Mount a byte array, and read a series of 1-32 bit numbers from it */
export class BitReader extends AByteReader {
	private _bitPtr = 0;

	/** Remaining bits in the buffer that haven't been read */
	get unreadBits() {
		return (this._buff.length - this._ptr) * 8 - this._bitPtr;
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
		let byteSpace = 8 - this._bitPtr;
		// /*DEBUG*/ let d=`[${this._buff.length} ~${this._byte}.${this._bit}]read${bits}`;

		//Sub-byte read
		if (bits < byteSpace) {
			byteSpace -= bits;
			this._bitPtr += bits;
			ret = (this._buff[this._ptr] >>> byteSpace) & mask[bits];
			// /*DEBUG*/console.log(d+`sub${bits}=${hex.fromI32(ret)}`);
			return ret;
		}
		//Rem-byte read
		if (this._bitPtr > 0) {
			ret = this._buff[this._ptr++] & mask[byteSpace];
			bits -= byteSpace;
			this._bitPtr = 0;
			// /*DEBUG*/d += `+^${byteSpace}=${hex.fromI32(ret)},`;
		}
		//Full-byte read
		while (bits >= 8) {
			ret = (ret << 8) | this._buff[this._ptr++];
			// /*DEBUG*/d += `+a=${hex.fromI32(ret)},`;
			bits -= 8;
		}
		//start-byte read
		if (bits > 0) {
			ret = (ret << bits) | (this._buff[this._ptr] >>> (8 - bits));
			// /*DEBUG*/d += `+v${bits}=${hex.fromI32(ret)}`;
			this._bitPtr = bits;
		}
		// /*DEBUG*/console.log(d);
		return ret;
	}

	/**
	 * Skip ahead a number of bits
	 * @param count Number of bits to skip `[0 - {@link unreadBits}]`
	 * @throws Error if there's not enough content
	 */
	skipBits(count: number) {
		sInt('count', count).unsigned().atMost(this.unreadBits).throwNot();
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
		return 'BitReader';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `BitReader([${this._buff.length}]@${this._ptr}.${this._bitPtr})`;
	}

	/**
	 * Mount a buffer for reading.
	 *
	 * If you wish to start at a byte beyond the first, or use less than all the bytes, use
	 * [Uint8Array.subarray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/subarray)
	 * to mount a shared portion
	 */
	static mount(buff: Uint8Array) {
		return new BitReader(buff);
	}
}
