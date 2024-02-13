/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { WindowStr } from '../WindowStr.js';
import { ContentError } from '../error/ContentError.js';
import { LessThanError } from '../error/LessThanError.js';
import { NegativeError } from '../error/NegativeError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Duration';
const usPerS = 1000000; //        1000000
const usPerM = usPerS * 60; //   60000000
const usPerH = usPerM * 60; // 3600000000
const usPerD = usPerH * 24; //86400000000 //more than 2^32
const maxU32 = 4294967295;
const maxU32p1 = maxU32 + 1;

export interface IDurationParts {
	/** Days >0*/
	d?: number;
	/** Hours >0*/
	h?: number;
	/** Minutes >0*/
	m?: number;
	/** Seconds >0*/
	s?: number;
	/** Microseconds >0*/
	us?: number;
}

/**
 * An exact duration, with microsecond accuracy.  Unsigned
 *
 * Range: 0 - ~45K years
 */
export class Duration implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 8;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 64;
	readonly #us: number;

	protected constructor(us: number, public readonly day: number) {
		this.#us = us;
	}

	/** Zero duration */
	public static get zero(): Duration {
		return zero;
	}

	/** Hours (0 - 24)  */
	public get hour(): number {
		return (this.#us / usPerH) | 0;
	}
	/** Minutes (0 - 59) */
	public get minute(): number {
		return ((this.#us / usPerM) | 0) % 60;
	}
	/** Seconds (0 - 59) */
	public get second(): number {
		return ((this.#us / usPerS) | 0) % 60;
	}
	/** Microseconds (0 - 999999) */
	public get microsecond(): number {
		return this.#us % usPerS;
	}

	/**
	 * Compose a string of this duration, cycling through d/h/m/s. Where `s`
	 * includes a decimal component to show microseconds, but all others are integers.
	 * If any component is zero it's dropped from the output, including microseconds.

    * (nd)(nh)(nm)(n.nnnnnns) blanks can be dropped, including micro-seconds */
	public toString(): string {
		let ret = '';
		if (this.day > 0) ret += this.day + 'd';
		else if (this.#us == 0) {
			//Catch zero duration
			return '0s';
		}

		let v = this.#us;
		const u = v % 1000000;
		v = (v / 1000000) | 0;
		const s = v % 60;
		v = (v / 60) | 0;
		const m = v % 60;
		v = (v / 60) | 0;

		if (v > 0) ret += v + 'h';
		if (m > 0) ret += m + 'm';
		if (s > 0) {
			ret += s;
			if (u > 0) {
				const uBit = u.toString();
				ret += '.' + ('000000' + uBit).substring(uBit.length);
			}
			ret += 's';
		} else if (u > 0) {
			const uBit = u.toString();
			ret += '0.' + ('000000' + uBit).substring(uBit.length) + 's';
		}
		return ret;
	}

	/**
	 * Slightly more verbose than our default {@link toString}, ISO8601 durations
	 * start with a `P` (for period) marker, cycle through Y/M/D then include an
	 * `T` (for time) marker, cycling through H/M/S.  Note `M` appears twice for both
	 * month and minute, the `T` marker disambiguates.  Unit markers are uppercase
	 * @returns
	 */
	public toIso8601(): string {
		const dBit = this.day ? this.day + 'D' : '';
		//retLeft+='T';
		let tBit = '';
		if (this.#us > 0) {
			tBit = 'T';
			let v = this.#us;
			const u = v % 1000000;
			v = (v / 1000000) | 0;
			const s = v % 60;
			v = (v / 60) | 0;
			const m = v % 60;
			v = (v / 60) | 0;

			if (v > 0) tBit += v + 'H';
			if (m > 0) tBit += m + 'M';
			if (s > 0) {
				tBit += s;
				if (u > 0) {
					const uBit = u.toString();
					tBit += '.' + ('000000' + uBit).substring(uBit.length);
				}
				tBit += 'S';
			} else if (u > 0) {
				const uBit = u.toString();
				tBit += '0.' + ('000000' + uBit).substring(uBit.length) + 'S';
			}
		} else if (this.day == 0) {
			return 'P0D';
		}
		return 'P' + dBit + tBit;
	}

	toJSON(): string {
		return this.toString();
	}

	/**
	 * Looking like a time this outputs `h:m:s.u` leading zeroed elements are dropped, if u is missing .u is dropped
	 */
	public toTimeLike(): string {
		let v = this.#us;
		const u = v % 1000000;
		v = (v / 1000000) | 0;
		const s = v % 60;
		v = (v / 60) | 0;
		const m = v % 60;
		v = (v / 60) | 0;
		const h = v + this.day * 24;

		const sStr = s.toString();

		let ret = '';
		if (h > 0) {
			const mStr = m.toString();
			ret =
				h +
				':' +
				('00' + mStr).substring(mStr.length) +
				':' +
				('00' + sStr).substring(sStr.length);
		} else if (m > 0) {
			ret = m + ':' + ('00' + sStr).substring(sStr.length);
		} else {
			ret = sStr;
		}
		if (u > 0) {
			const uStr = u.toString();
			ret += '.' + ('000000' + uStr).substring(uStr.length);
		}
		return ret;
	}

	/** Serialize into target  - 38 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.day, 24);
		//todo: update bitwriter/bitreader to support > 32 bit ops
		//Because of 32bit limit, split high into 8 + 32 parts
		const uHigh = (this.#us / maxU32) | 0;
		//Convert to unsigned 32 bit
		const uLow = this.#us >>> 0;
		target.writeNumber(uHigh, 8);
		target.writeNumber(uLow, 32);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return Duration.serialBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Duration {
		// `us` can be invalid since it maxes at 86400000000/x141DD76000
		safe.int.inRangeInc('us', this.#us, 0, usPerD - 1);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	public static fromUs(us: number): Duration {
		if (us<0) throw new NegativeError('microseconds',us);
		const usp = us % usPerD;
		const d = (us / usPerD) | 0;
		return new Duration(usp, d);
	}

	public static new(parts: IDurationParts): Duration {
		let usp = 0;
		if (parts.d) {
			if (parts.d<0) throw new NegativeError('days',parts.d);
			usp += parts.d * usPerD;
		}
		if (parts.h) {
			if (parts.h<0) throw new NegativeError('hours',parts.h);
			usp += parts.h * usPerH;
		}
		if (parts.m) {
			if (parts.m<0) throw new NegativeError('minutes',parts.m);
			usp += parts.m * usPerM;
		}
		if (parts.s) {
			if (parts.s<0) throw new NegativeError('seconds',parts.s);
			usp += parts.s * usPerS;
		}
		//Round to nearest us, to help with floating point error eg 1.001 s = 1.0009999999
		usp = Math.round(usp);
		if (parts.us) {
			if (parts.us<0) throw new NegativeError('microseconds',parts.us);
			usp += parts.us | 0;
		}
		return new Duration(usp % usPerD, (usp / usPerD) | 0);
	}

	public static fromTimeLike(timeLike: string): Duration {
		const splits = timeLike.split(':');
		const parts: IDurationParts = { m: 0, s: 0 };
		switch (splits.length) {
			case 1:
				parts.s = Number.parseFloat(splits[0]);
				break;
			case 2:
				parts.m = Number.parseInt(splits[0], 10);
				parts.s = Number.parseFloat(splits[1]);
				break;
			case 3:
				parts.h = Number.parseInt(splits[0], 10);
				parts.m = Number.parseInt(splits[1], 10);
				parts.s = Number.parseFloat(splits[2]);
				break;
			default:
				throw new ContentError(
					'Expecting h*:mm:ss.uuuuuu',
					'time-like',
					timeLike
				);
		}
		//Unlike new, we don't accept s/m being >=60
		//@ts-expect-error: m is either 0 or set by case 2/3, so fuck off TS
		if (parts.m >= 60) throw new LessThanError('minutes', parts.m, 60);
		if (parts.s >= 60) throw new LessThanError('seconds', parts.s, 60);
		return Duration.new(parts);
	}

	public static parse(input: WindowStr): Duration {
		let str = input.toString().trim().toLowerCase();
		const parts = { d: 0, h: 0, m: 0, s: 0 };
		const delimD = str.indexOf('d');
		if (delimD > 0) {
			parts.d = Number.parseInt(str.substring(0, delimD));
			str = str.substring(delimD + 1);
		}
		const delimH = str.indexOf('h');
		if (delimH > 0) {
			parts.h = Number.parseInt(str.substring(0, delimH));
			str = str.substring(delimH + 1);
		}
		const delimM = str.indexOf('m');
		if (delimM > 0) {
			parts.m = Number.parseInt(str.substring(0, delimM));
			str = str.substring(delimM + 1);
		}
		const delimS = str.indexOf('s');
		if (delimS > 0) {
			parts.s = Number.parseFloat(str.substring(0, delimS));
			str = str.substring(delimS + 1);
		}
		if (str.length > 0) {
			throw new ContentError('Expecting dhms components', 'duration', input);
		}
		input.shrink(input.length);
		return Duration.new(parts);
	}

	/**
	 * Deserialize next 64 bits into duration
	 * Throws if:
	 * - There's not 64 bits remaining in $source.buffer
	 * @param source Source to read bits from
	 * @returns
	 */
	public static deserialize(source: BitReader): Duration {
		const d = source.readNumber(24);
		const usHigh = source.readNumber(8);
		const usLow = source.readNumber(32) >>> 0;
		return new Duration(usHigh * maxU32p1 + usLow, d);
	}
}
const zero = Duration.fromUs(0);
