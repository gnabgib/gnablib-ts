/*! Copyright 2023 gnabgib MPL-2.0 */

import { ContentError, SizeError } from '../primitive/ErrorExt.js';
import * as intExt from '../primitive/IntExt.js';
import * as objExt from '../primitive/ObjExt.js';

export class V4 {
	readonly bytes: Uint8Array;

	constructor(bytes: Uint8Array) {
		if (bytes.length != 4) throw new SizeError('Bytes', bytes.length, 4);
		this.bytes = bytes;
	}

	/**
	 * Get the address as a dotted decimal string (the normal format)
	 * @returns
	 */
	toString(): string {
		return this.bytes.join('.');
	}

	toInt(): number {
		//>>>0 overrides the sign problems of 32bits
		return (
			((this.bytes[0] << 24) |
				(this.bytes[1] << 16) |
				(this.bytes[2] << 8) |
				this.bytes[3]) >>>
			0
		);
	}

	equals(other: V4): boolean {
		objExt.notNull(other, 'ip.V4.equals(other)');
		return (
			this.bytes[0] === other.bytes[0] &&
			this.bytes[1] === other.bytes[1] &&
			this.bytes[2] === other.bytes[2] &&
			this.bytes[3] === other.bytes[3]
		);
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
	): V4 {
		intExt.inRangeInclusive(part0, 0, 0xff);
		intExt.inRangeInclusive(part1, 0, 0xff);
		intExt.inRangeInclusive(part2, 0, 0xff);
		intExt.inRangeInclusive(part3, 0, 0xff);
		return new V4(Uint8Array.of(part0, part1, part2, part3));
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
	static fromString(value: string): V4 {
		const parts = value.split('.');
		if (parts.length != 4) throw new SizeError('Part count', parts.length, 4);

		const p0 = intExt.strictParseDecUint(parts[0]);
		if (p0 === undefined)
			throw new ContentError(
				'First part',
				'looking for integer 0-255',
				parts[0]
			);

		const p1 = intExt.strictParseDecUint(parts[1]);
		if (p1 === undefined)
			throw new ContentError(
				'Second part',
				'looking for integer 0-255',
				parts[1]
			);

		const p2 = intExt.strictParseDecUint(parts[2]);
		if (p2 === undefined)
			throw new ContentError(
				'Third part',
				'looking for integer 0-255',
				parts[2]
			);

		const p3 = intExt.strictParseDecUint(parts[3]);
		if (p3 === undefined)
			throw new ContentError(
				'Fourth part',
				'looking for integer 0-255',
				parts[3]
			);

		return this.fromParts(p0, p1, p2, p3);
	}

	static fromInt(value: number): V4 {
		return new V4(intExt.int32AsBytes(value));
	}
}
