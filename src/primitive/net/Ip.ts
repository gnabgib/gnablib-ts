/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { U32 } from '../number/U32.js';
import { UInt } from '../number/index.js';
import { somewhatSafe } from '../../safe/safe.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'IpV4';

export class IpV4 {
	readonly bytes: Uint8Array;

	constructor(bytes: Uint8Array) {
		somewhatSafe.len.exactly('bytes',bytes,4);
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
		somewhatSafe.int.inRangeInc('first part', p0, 0, 255);
		somewhatSafe.int.inRangeInc('second part', p1, 0, 255);
		somewhatSafe.int.inRangeInc('third part', p2, 0, 255);
		somewhatSafe.int.inRangeInc('fourth part', p3, 0, 255);
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
		somewhatSafe.len.exactly('parts',parts,4);

		const p0 = UInt.parseDec(parts[0]);
		const p1 = UInt.parseDec(parts[1]);
		const p2 = UInt.parseDec(parts[2]);
		const p3 = UInt.parseDec(parts[3]);
		return IpV4.fromParts(p0, p1, p2, p3);
	}

	static fromInt(value: number): IpV4 {
		return new IpV4(U32.toBytesBE(value));
	}
}
