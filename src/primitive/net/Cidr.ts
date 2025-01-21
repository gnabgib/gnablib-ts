/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { lsbMask } from '../BitExt.js';
import { IpV4 } from './Ip.js';
import { ContentError } from '../../error/ContentError.js';
import { UInt } from '../number/index.js';
import { sLen, sNum } from '../../safe/safe.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Cidr';

export class Cidr {
	/**
	 * Starting IP (first/lowest)
	 */
	readonly startIp: IpV4;
	private readonly dist: number;
	private readonly bitMask: number;
	readonly mask: number;

	constructor(ipv4: IpV4, mask: number) {
		sNum('mask', mask).unsigned().atMost(32).throwNot();
		const ipv4Int = ipv4.valueOf();
		this.bitMask = lsbMask(32-mask);
		const startInt = (ipv4Int & ~this.bitMask) >>> 0;
		this.dist = ipv4Int - startInt;
		this.startIp = IpV4.fromInt(startInt);

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
	get endIp(): IpV4 {
		return IpV4.fromInt(this.startIp.valueOf() | this.bitMask);
	}

	/**
	 * Whether the given IP is within this CIDR
	 * @param ipv4
	 */
	containsIp(ipv4: IpV4): boolean {
		return (ipv4.valueOf() & ~this.bitMask) === this.startIp.valueOf();
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
		return (
			this.mask === other.mask &&
			this.startIp.valueOf() === other.startIp.valueOf()
		);
	}

	/**
	 * IP/mask form
	 * @returns
	 */
	toString(): string {
		return this.startIp.toString() + '/' + this.mask;
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
		sLen('parts', parts).exactly(2).throwNot();
		const ipv4 = IpV4.fromString(parts[0]);
		const mask = UInt.parseDec(parts[1]);
		if (mask == undefined)
			throw new ContentError('Expecting integer 0-32', 'Mask', parts[1]);

		return new this(ipv4, mask);
	}
}
