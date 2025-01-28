/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { U32 } from '../number/U32Static.js';
import { sLen, sNum } from '../../safe/safe.js';
import { parseDec } from '../number/xtUint.js';
import { ByteWriter } from '../ByteWriter.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'IpV4';

export class IpV4 {
	readonly bytes: Uint8Array;

	private constructor(bytes: Uint8Array) {
		this.bytes = bytes;
	}

	/**
	 * Get the address as a dotted decimal string (the normal format)
	 * @returns
	 */
	public toString(): string {
		return this.bytes.join('.');
	}

	/** Value as an integer */
	public valueOf(): number {
		return (
			((this.bytes[0] << 24) |
				(this.bytes[1] << 16) |
				(this.bytes[2] << 8) |
				this.bytes[3]) >>>
			0
		);
	}

	equals(other: IpV4): boolean {
		return other.valueOf() == this.valueOf();
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/**
	 * Create an IPv4 from 4 integers
	 * @throws EnforceTypeError If `part0`,`part1`,`part2`,`part3` not integers
	 * @throws OutOfRangeError If `part0`,`part1`,`part2`,`part3` <0 or >255
	 * @param p0
	 * @param p1
	 * @param p2
	 * @param p3
	 * @returns
	 */
	static fromParts(p0: number, p1: number, p2: number, p3: number): IpV4 {
		sNum('first part', p0).unsigned().atMost(255).throwNot();
		sNum('second part', p1).unsigned().atMost(255).throwNot();
		sNum('third part', p2).unsigned().atMost(255).throwNot();
		sNum('fourth part', p3).unsigned().atMost(255).throwNot();
		return new IpV4(Uint8Array.of(p0, p1, p2, p3));
	}

	/**
	 * Create an IPv4 address from a dotted string value
	 * @throws SizeError If there aren't 4 sections separated by dots
	 * @throws ContentError If any of the parts aren't integer strings
	 * @throws EnforceTypeError If `part0`,`part1`,`part2`,`part3` not integers
	 * @throws OutOfRangeError If `part0`,`part1`,`part2`,`part3` <0 or >255
	 * @param value
	 * @returns
	 */
	static fromString(value: string): IpV4 {
		const parts = value.split('.');
		sLen('parts', parts).exactly(4).throwNot();

		const p0 = parseDec(parts[0]);
		const p1 = parseDec(parts[1]);
		const p2 = parseDec(parts[2]);
		const p3 = parseDec(parts[3]);
		return IpV4.fromParts(p0, p1, p2, p3);
	}

	static fromInt(value: number): IpV4 {
		const b = new Uint8Array(4);
		const bw=ByteWriter.mount(b);
		U32.intoBytesBE(value,bw);
		return new IpV4(b);
	}

	/** Build from a 4 byte array */
	static fromBytes(bytes:Uint8Array):IpV4 {
		sLen('bytes',bytes).exactly(4).throwNot();
		return new IpV4(bytes);
	}
}
