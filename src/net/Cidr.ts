/*! Copyright 2023 gnabgib MPL-2.0 */

import * as intExt from '../primitive/IntExt.js';
import * as bitExt from '../primitive/BitExt.js';
import * as objExt from '../primitive/ObjExt.js';
import * as ip from './Ip.js';
import { ContentError, SizeError } from '../primitive/ErrorExt.js';

export class Cidr {
	/**
	 * Starting IP (first/lowest)
	 */
	readonly startIp: ip.V4;
	private readonly dist: number;
	private readonly bitMask: number;
	readonly mask: number;

	constructor(ipv4: ip.V4, mask: number) {
		intExt.inRangeInclusive(mask, 0, 32);
		const ipv4Int = ipv4.toInt();
		this.bitMask = bitExt.lsbs(32 - mask);
		const startInt = (ipv4Int & ~this.bitMask) >>> 0;
		this.dist = ipv4Int - startInt;
		this.startIp = ip.V4.fromInt(startInt);

		this.mask = mask;
	}

	/**
	 * Number of addresses within this CIDR
	 */
	get count(): number {
		const not32 = 1 - ((this.mask >> 5) & 1); //32=0, >31=1
		return ((not32 * 0xffffffff) >>> this.mask) + 1;
	}

	/**
	 * Whether the IP used to build the Cidr was the starting IP or
	 * (imperfectly) somewhere in the range
	 *
	 * You probably only care about this if you're giving feedback to a user
	 */
	get normalForm(): boolean {
		return this.dist === 0;
	}

	/**
	 * End IP (last/highest)
	 */
	get endIp(): ip.V4 {
		return ip.V4.fromInt(this.startIp.toInt() | this.bitMask);
	}

	/**
	 * Whether the given IP is within this CIDR
	 * @param ipv4
	 */
	containsIp(ipv4: ip.V4): boolean {
		return (ipv4.toInt() & ~this.bitMask) === this.startIp.toInt();
	}

	//Is this needed?  Superset, subset (this) and overlap might all be considered
	//containsCidr(cidr:Cidr):boolean {}

	/**
	 * Whether two CIDR are equal (ignoring if either was built form abnormal form)
	 * @param other
	 * @returns
	 */
	equals(other: Cidr): boolean {
		//We only consider normal form (so 10.10.10.10/24===10.10.10.0/24)
		objExt.notNull(other, 'Cidr.equals(other)');
		return (
			this.mask === other.mask && this.startIp.toInt() === other.startIp.toInt()
		);
	}

	/**
	 * IP/mask form
	 * @returns
	 */
	toString(): string {
		return this.startIp.toString() + '/' + this.mask;
	}

	/**
	 * Convert a CIDR in string form into an object
	 * @throws SizeError (expecting two parts separated by /)
	 * @throws SizeError (IP: expecting four parts separated by .)
	 * @throws EnforceTypeError (mask/IP part not an integer)
	 * @throws OutOfRangeError (IP part <0 >255)
	 * @throws OutOfRangeError (mask <0 >32)
	 * @throws ContentError (invalid mask string value)
	 * @param value
	 * @returns
	 */
	static fromString(value: string): Cidr {
		const parts = value.split('/');
		if (parts.length != 2) throw new SizeError('Part count', parts.length, 2);
		const ipv4 = ip.V4.fromString(parts[0]);
		const mask = intExt.strictParseDecUint(parts[1]);
		if (mask === undefined)
			throw new ContentError('Mask', 'Expecting integer 0-32', parts[1]);

		return new this(ipv4, mask);
	}
}
