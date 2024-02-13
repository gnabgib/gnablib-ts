/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { intExt } from '../IntExt.js';
import { safety } from '../Safety.js';
import { U32 } from '../number/U32.js';
import { ContentError } from '../../error/ContentError.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'IpV4';

export class IpV4 {
	readonly bytes: Uint8Array;

	constructor(bytes: Uint8Array) {
		safety.lenExactly(bytes, 4, 'bytes');
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
	 * @param part0
	 * @param part1
	 * @param part2
	 * @param part3
	 * @returns
	 */
	static fromParts(
		part0: number,
		part1: number,
		part2: number,
		part3: number
	): IpV4 {
		safety.intInRangeInc(part0, 0, 0xff, 'part0');
		safety.intInRangeInc(part1, 0, 0xff, 'part1');
		safety.intInRangeInc(part2, 0, 0xff, 'part2');
		safety.intInRangeInc(part3, 0, 0xff, 'part3');
		return new IpV4(Uint8Array.of(part0, part1, part2, part3));
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
		safety.lenExactly(parts, 4, 'part');

		const p0 = intExt.strictParseDecUint(parts[0]);
		if (p0 === undefined)
			throw new ContentError(
				'looking for integer 0-255',
				'First part',
				parts[0]
			);

		const p1 = intExt.strictParseDecUint(parts[1]);
		if (p1 === undefined)
			throw new ContentError(
				'looking for integer 0-255',
				'Second part',
				parts[1]
			);

		const p2 = intExt.strictParseDecUint(parts[2]);
		if (p2 === undefined)
			throw new ContentError(
				'looking for integer 0-255',
				'Third part',
				parts[2]
			);

		const p3 = intExt.strictParseDecUint(parts[3]);
		if (p3 === undefined)
			throw new ContentError(
				'looking for integer 0-255',
				'Fourth part',
				parts[3]
			);

		return IpV4.fromParts(p0, p1, p2, p3);
	}

	static fromInt(value: number): IpV4 {
		return new IpV4(U32.toBytesBE(value));
	}
}
