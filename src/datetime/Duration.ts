/*! Copyright 2024 the gnablib contributors MPL-1.1 */

/**
 * Both DurationExact and Duration have to be in the same file because they use the same core
 * (ADurationCore) which doesn't need to be exported by using the same file.  The benefit of this
 * share is they have access to innards for some ops, but don't expose themselves to lib-users
 */

import { superSafe as safe } from '../safe/index.js';
import { AtMostError } from '../error/AtMostError.js';
import { BitWriter } from '../primitive/BitWriter.js';
import { BitReader } from '../primitive/BitReader.js';
import { ISerializer } from '../primitive/interfaces/ISerializer.js';
import { NegativeError } from '../error/NegativeError.js';
import { ContentError } from '../error/ContentError.js';
import { LTError } from '../error/LTError.js';
import { Float, Int } from '../primitive/number/index.js';
import { WindowStr } from '../primitive/WindowStr.js';
import {
	IDurationExactParts,
	IDurationParts,
} from './interfaces/IDurationParts.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

const dayBytesDe = 4;
const dayBytesDv = 3;
const hourBytes = 1;
const minBytes = 1;
const secBytes = 1;
const microBytes = 3;
const hisuStorageBytes = hourBytes + minBytes + secBytes + microBytes; //6

const daySerBitsDe = 27; //2^27 = 134,217,728 (~367438y)
const daySerBitsDv = 18 + 1; //2^18 = 262,144, just need 146097 the extra bit (waste) is align end hex of DE/D
const hourSerBits = 5; //2^5 = 32
const minSerBits = 6; //2^6 = 64
const secSerBits = 6; //2^6 = 64
const microSerBits = 20; //2^20 = 1048576
const hisuSerialBits = hourSerBits + minSerBits + secSerBits + microSerBits; //37

const hPerDay = 24;
const mPerYear = 12;
const usPerDay = 86400000000; ////24*60*60*1000000 ~~2^37
const usPerHour = 3600000000; //60*60*1000000 ~~2^32
const usPerMin = 60000000; //60*1000000
const usPerSec = 1000000;
const daysPerCD = 146097;
const hPerCD = 3506328; // 146097 * 24
const maxDays = 134117046; //Number of days in 918CD*400 = 367200y
const maxDH = 3218809104; //134117046*24 ~~2^32
//We chose 500 here because that's less than a month of time, but large enough
// for most plausible use-cases for representing time in this format
const maxTimeLikeHours = 500;

const monthFrac = 720;
const mfPerYear = 8640; //720*12
const maxYears = 367200;
const maxYM = 4406400; // 367200*24
const maxYMf = 3172608000; // 4406400*720 ~~2^32
//Note Duration.maxYears == DurationExact.maxDays but when Duration years are less than max years (eg maxYears-1)
// you can provide dhis components that'll EXCEED maxYears (but we cannot tell without having to guess at a y/m<->d conversion)
//It is expected you're EITHER using Duration with days, or with years+months at very large values (allows .gt to work)
const ymSerialBits = 32; //2^32 = 4,294,967,296, we only need 3,172,608,000
const yearStorageBytes = 3;
const monthStorageBytes = 2;

//By using a shared _DurationCore, DurationExact and Duration can share features and code



abstract class ADurationCore {
	protected constructor(
		protected readonly _storage: Uint8Array,
		protected readonly _hPos: number
	) {}

	abstract get day(): number;
	protected abstract _otherHours(): number;

	// bytes: hpos->hmsuuu
	/** Hours (0-23) */
	public get hour(): number {
		return this._storage[this._hPos];
	}
	/** Minutes (0-59) */
	public get minute(): number {
		return this._storage[this._hPos + 1];
	}
	/** Seconds (0-59) */
	get second(): number {
		return this._storage[this._hPos + 2];
	}
	/** Microseconds (0-999999) */
	get microsecond(): number {
		return (
			(this._storage[this._hPos + 3] << 16) |
			(this._storage[this._hPos + 4] << 8) |
			this._storage[this._hPos + 5]
		);
	}

	//0d0h0i0.0s blanks can be dropped, microseconds will be truncated if 0, might be empty string if no elements
	public toString(): string {
		let ret = '';
		const d = this.day;
		const h = this.hour;
		const i = this.minute;
		const s = this.second;
		const u = this.microsecond;
		if (d > 0) ret += d + 'd';
		if (h > 0) ret += h + 'h';
		if (i > 0) ret += i + 'i';

		const uBit = u.toString();
		if (s > 0) {
			ret += s;
			if (u > 0) {
				ret += '.' + ('000000' + uBit).substring(uBit.length);
			}
			ret += 's';
		} else if (u > 0) {
			ret += '0.' + ('000000' + uBit).substring(uBit.length) + 's';
		}
		return ret;
	}

	//0DT0H0M0.0S, no leading P
	public toIso8601(): string {
		const d = this.day;
		const h = this.hour;
		const i = this.minute;
		const s = this.second;
		const u = this.microsecond;

		const dBit = d ? d + 'D' : '';
		let tBit = '';
		if (h > 0) tBit += h + 'H';
		if (i > 0) tBit += i + 'M';
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
		if (tBit.length > 0) tBit = 'T' + tBit;
		return dBit + tBit;
	}

	toJSON(): string {
		return this.toString();
	}

	/**
	 * Output a time-like string in the format `h:m:s.u`
	 * - Leading zeroed elements are dropped (the shortest output is `0`)
	 * - If .u is zero, it's dropped
	 * - Larger units are converted into hours, but hours are capped at 500
	 * - Days are capped at 1000 (~3y) and converted into hours (so the first element can get huge)
	 * - The first non-zero element is as-is, remaining are zero-padded.  `1m30s` would be `1:30` `1h10s` would be `1:00:10`
	 *
	 * This is not intended to represent all durations (hence the hour cap), but provide
	 * a human-readable form for smaller durations (<501h)
	 */
	public toTimeLike(): string {
		const h = this._otherHours() + this.hour;
		const i = this.minute;
		const s = this.second;
		const u = this.microsecond;

		let ret = '';
		const sStr = s.toString();
		if (h > 0) {
			const mStr = i.toString();
			ret =
				(h > maxTimeLikeHours ? maxTimeLikeHours : h) +
				':' +
				('00' + mStr).substring(mStr.length) +
				':' +
				('00' + sStr).substring(sStr.length);
		} else if (i > 0) {
			ret = i + ':' + ('00' + sStr).substring(sStr.length);
		} else {
			ret = sStr;
		}
		if (u > 0) {
			const uStr = u.toString();
			ret += '.' + ('000000' + uStr).substring(uStr.length);
		}
		return ret;
	}

	public serialize(target: BitWriter): void {
		target.writeNumber(this._storage[this._hPos], hourSerBits);
		target.writeNumber(this._storage[this._hPos + 1], minSerBits);
		target.writeNumber(this._storage[this._hPos + 2], secSerBits);
		target.writeNumber(this.microsecond, microSerBits);
	}

	protected _validate(): void {
		safe.int.lt('hour', this._storage[this._hPos], 24);
		safe.int.lt('minute', this._storage[this._hPos + 1], 60);
		safe.int.lt('second', this._storage[this._hPos + 2], 60);
		safe.int.lt('second', this.microsecond, usPerSec);
	}

	//Extract the current value into two integers, both u32
	protected _dh_misu(): [number, number] {
		return [
			this.day * hPerDay + this._storage[this._hPos],
			this._storage[this._hPos + 1] * usPerMin +
				this._storage[this._hPos + 2] * usPerSec +
				this.microsecond,
		];
	}

	//Put h/i/s/u into storage starting at $start
	protected static _loadHISU(
		h: number,
		i: number,
		s: number,
		u: number,
		storage: Uint8Array,
		hPos: number
	): void {
		storage[hPos] = h;
		storage[hPos + 1] = i;
		storage[hPos + 2] = s;
		storage[hPos + 3] = u >> 16;
		storage[hPos + 4] = u >> 8;
		storage[hPos + 5] = u;
	}

	protected static _convertHISUPartsToUs(parts: IDurationExactParts): number {
		let us = 0;
		if (parts.h) {
			if (parts.h < 0) throw new NegativeError('hours', parts.h);
			us += parts.h * usPerHour;
		}
		if (parts.i) {
			if (parts.i < 0) throw new NegativeError('minutes', parts.i);
			us += parts.i * usPerMin;
		}
		if (parts.s) {
			if (parts.s < 0) throw new NegativeError('seconds', parts.s);
			us += parts.s * usPerSec;
		}
		//Round to nearest us, to help with floating point error eg 1.001 s = 1.0009999999
		us = Math.round(us);
		if (parts.us) {
			if (parts.us < 0) throw new NegativeError('microseconds', parts.us);
			us += parts.us | 0;
		}
		return us;
	}

	/**
	 * Parse d/h/i/s parts from a string (note u can also be represented as part of floating-point s)
	 * - Does not vet values (could be negative, could be too large)
	 * - Each value can be floating point
	 * @param input
	 * @returns
	 */
	protected static _parseDHIS(input: WindowStr): IDurationExactParts {
		const reset = input.getReset();

		const parts = { d: 0, h: 0, i: 0, s: 0 };
		// quelle stupid for blanket complaints like this, especially ending in return
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const delimD = input.indexOfAny(['d', 'D']);
			if (delimD > 0) {
				parts.d = Float.parseDec(input.substring(0, delimD));
				if (Number.isNaN(parts.d)) break;
				input.shrink(delimD + 1);
			}
			const delimH = input.indexOfAny(['h', 'H']);
			if (delimH > 0) {
				parts.h = Float.parseDec(input.substring(0, delimH));
				if (Number.isNaN(parts.h)) break;
				input.shrink(delimH + 1);
			}
			const delimI = input.indexOfAny(['i', 'I']);
			if (delimI > 0) {
				parts.i = Float.parseDec(input.substring(0, delimI));
				if (Number.isNaN(parts.i)) break;
				input.shrink(delimI + 1);
			}
			const delimS = input.indexOfAny(['s', 'S']);
			if (delimS > 0) {
				parts.s = Float.parseDec(input.substring(0, delimS));
				if (Number.isNaN(parts.s)) break;
				input.shrink(delimS + 1);
			}
			if (input.trimStart().length > 0) break;
			return parts;
		}
		reset();
		throw new ContentError('Expecting dhis components', 'duration', input);
	}

	protected static _deserHISU(
		source: BitReader,
		storage: Uint8Array,
		hPos: number
	): void {
		const h = source.readNumber(hourSerBits);
		const i = source.readNumber(minSerBits);
		const s = source.readNumber(secSerBits);
		const u = source.readNumber(microSerBits);
		ADurationCore._loadHISU(h, i, s, u, storage, hPos);
	}
}

export class DurationExact extends ADurationCore implements ISerializer {
	static readonly serialBits = daySerBitsDe + hisuSerialBits; //64
	static readonly storageBytes =
		dayBytesDe + //day
		hisuStorageBytes; //10

	public static get zero(): DurationExact {
		return zeroE;
	}
	/** 134117046d */
	public static get max(): DurationExact {
		return maxE;
	}

	/** Days (0 - 134117046) */
	public get day(): number {
		return (
			((this._storage[this._hPos - 4] << 24) |
				(this._storage[this._hPos - 3] << 16) |
				(this._storage[this._hPos - 2] << 8) |
				this._storage[this._hPos - 1]) >>>
			0
		);
	}

	//?support? toDays, toHours, toMinutes, toSeconds, toMicroseconds (max ~285y)

	protected _otherHours(): number {
		return this.day * hPerDay;
	}

	/**
	 * Compose a string of this duration, cycling through d/h/i/s. Where `s`
	 * includes a decimal component to show microseconds, but all others are integers.
	 * If any component is zero it's dropped from the output, including microseconds.
	 *
	 * (nd)(nh)(ni)(n.nnnnnns)
	 */
	public toString(): string {
		const ret = super.toString();
		if (ret.length === 0) return '0s';
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
		let bit = super.toIso8601();
		if (bit.length == 0) bit = '0D';
		return 'P' + bit;
	}

	/**
	 * Extract this duration as a 3-integer array:
	 * - Years & months in months (y*12+m) - always 0 for DurationExact
	 * - Days & hours in hours (d*24+h) - u32 (0 - 3218809104)
	 * - Minutes, seconds & micros ((m*60+s)*1000000+u) - u32 (0 - 3599999999)
	 */
	public toYmDhMiso(): [number, number, number] {
		return [
			0,
			this.day * hPerDay + this._storage[this._hPos],
			this._storage[this._hPos + 1] * usPerMin +
				this._storage[this._hPos + 2] * usPerSec +
				this.microsecond,
		];
	}

	/** Serialize into target  - 38 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.day, daySerBitsDe);
		super.serialize(target);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return DurationExact.serialBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): DurationExact {
		safe.int.lt('day', this.day, maxDays + 1); //maxDays is inclusive
		this._validate();
		//Make sure the combined value isn't GT max
		if (this.gt(maxE)) throw new LTError('duration', this, maxE);
		return this;
	}

	public gt(de: DurationExact): boolean {
		const n = this._hPos + 6;
		for (let i = 0; i < n; i++) {
			if (this._storage[i] > de._storage[i]) return true;
			if (this._storage[i] < de._storage[i]) return false;
		}
		return false; //Would have to be equal at this point..which isn't gt
	}

	/**
	 * Add an exact duration to this
	 * @param de Duration to add
	 * @return A new duration with sum
	 * @pure
	 */
	public add(de: DurationExact): DurationExact {
		let [, dh, misu] = this.toYmDhMiso();
		const [, odh, omisu] = de.toYmDhMiso();
		dh += odh;
		misu += omisu;

		if (misu >= usPerHour) {
			misu -= usPerHour;
			dh += 1;
		}
		//If we exceed max - return max
		if (dh >= maxDH) return maxE;

		const d = (dh / hPerDay) | 0;
		const h = dh % hPerDay;
		const u = misu % usPerSec;
		misu = (misu / usPerSec) | 0;
		const s = misu % 60;
		misu = (misu / 60) | 0;
		const i = misu % 60;

		const stor = new Uint8Array(DurationExact.storageBytes);
		DurationExact._loadDHISU(d, h, i, s, u, stor);
		return new DurationExact(stor, dayBytesDe);
	}

	/**
	 * Subtract duration from this
	 * @param de Duration to subtract
	 * @returns A new duration
	 * @pure
	 */
	public sub(de: DurationExact): DurationExact {
		let [, dh, misu] = this.toYmDhMiso();
		const [, odh, omisu] = de.toYmDhMiso();
		dh -= odh;
		misu -= omisu;
		if (misu < 0) {
			misu += usPerHour;
			dh -= 1;
		}
		if (dh < 0) {
			//Clamp at zero
			return zeroE;
		}

		const d = (dh / hPerDay) | 0;
		const h = dh % hPerDay;
		const u = misu % usPerSec;
		misu = (misu / usPerSec) | 0;
		const s = misu % 60;
		misu = (misu / 60) | 0;
		const i = misu % 60;

		const stor = new Uint8Array(DurationExact.storageBytes);
		DurationExact._loadDHISU(d, h, i, s, u, stor);
		return new DurationExact(stor, dayBytesDe);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'DurationExact';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `DurationExact(${this.toString()})`;
	}

	//Store d-u into storage, range checks must have been done before calling this
	private static _loadDHISU(
		d: number,
		h: number,
		i: number,
		s: number,
		u: number,
		storage: Uint8Array
	) {
		storage[0] = d >> 24;
		storage[1] = d >> 16;
		storage[2] = d >> 8;
		storage[3] = d;
		ADurationCore._loadHISU(h, i, s, u, storage, dayBytesDe);
	}

	/**
	 * Create a duration from parts, d/h/i/s can be floating point.
	 * d/h/i/s/us can exceed their maximum (the values will roll up)
	 * All values are optional, but if specified must be >=0
	 * @param parts
	 * @returns
	 */
	public static new(parts: IDurationExactParts): DurationExact {
		let us = ADurationCore._convertHISUPartsToUs(parts);
		let d = 0;
		if (parts.d) {
			if (parts.d < 0) throw new NegativeError('days', parts.d);
			if (parts.d > maxDays) throw new AtMostError('days', parts.d, maxDays);
			d = parts.d;
		}
		//Catch any fractional days and move them to micros
		const dRem = d % 1;
		if (dRem != 0) {
			us += Math.round(dRem * usPerDay);
			d -= dRem;
		}
		//If more than a day in micros, move to days
		if (us >= usPerDay) {
			d += Math.floor(us / usPerDay);
			us %= usPerDay;
		}
		//Calculate seconds+micros
		const u = us % usPerSec;
		const s = (us / usPerSec) % 60 | 0;
		//Calculate hours+minutes
		const h = (us / usPerHour) | 0;
		const i = ((us / usPerMin) | 0) % 60;

		const stor = new Uint8Array(DurationExact.storageBytes);
		DurationExact._loadDHISU(d, h, i, s, u, stor);
		const ret = new DurationExact(stor, dayBytesDe);
		//Make sure that in total, the value is valid (not >max), we've made sure days can't be
		//>max, we just need to test the equal max case
		if (d == maxDays && us > 0) throw new AtMostError('duration', ret, maxE);
		return ret;
	}

	/**
	 * Create a duration of days/hours/minutes/seconds/microseconds from a microsecond count
	 * @param us range 0 - 9007199254740991 (~105k days/~285 years)
	 */
	public static fromUs(us: number): DurationExact {
		if (us < 0) throw new NegativeError('microseconds', us);
		//Microseconds
		let d = 0,
			h = 0,
			i = 0,
			s = 0,
			u = 0;
		u = us % usPerSec;
		us = Math.floor(us / usPerSec);
		s = us % 60;
		us = Math.floor(us / 60);
		i = us % 60;
		us = Math.floor(us / 60);
		h = us % hPerDay;
		us = Math.floor(us / 24);
		d = us;

		//Days can only exceed max if us was floating point.. which it could have been
		// so make sure we catch that.
		if (d > maxDays) throw new AtMostError('days', d, maxDays);
		const stor = new Uint8Array(DurationExact.storageBytes);
		DurationExact._loadDHISU(d, h, i, s, u, stor);
		return new DurationExact(stor, dayBytesDe);
	}

	public static fromTimeLike(timeLike: string): DurationExact {
		const splits = timeLike.split(':');
		let h = 0,
			i = 0,
			s = 0;
		switch (splits.length) {
			case 1:
				s = Float.parseDec(splits[0]);
				break;
			case 2:
				i = Int.parseDec(splits[0]);
				s = Float.parseDec(splits[1]);
				break;
			case 3:
				h = Int.parseDec(splits[0]);
				i = Int.parseDec(splits[1]);
				s = Float.parseDec(splits[2]);
				break;
			default:
				throw new ContentError(
					'Expecting h*:mm:ss.uuuuuu',
					'time-like',
					timeLike
				);
		}
		if (Number.isNaN(s))
			throw new ContentError('Expecting floating-point', 'seconds', s);
		if (Number.isNaN(i))
			throw new ContentError('Expecting integer', 'minutes', i);
		if (Number.isNaN(h))
			throw new ContentError('Expecting integer', 'hours', h);
		//Like toTimeLike, we require hours to be max 500
		if (h > maxTimeLikeHours)
			throw new AtMostError('hours', h, maxTimeLikeHours);
		//Unlike new, we don't accept s/m being >=60 (no leap seconds)
		if (i > 59) throw new AtMostError('minutes', i, 59);
		//Note the different error/test because seconds is currently floating-point (could be 59.999999 which is ok, but >59)
		if (s >= 60) throw new LTError('seconds', s, 60);
		const d = (h / hPerDay) | 0;
		h = h % hPerDay;
		const u = ((s % 1) * usPerSec) | 0;
		s = s | 0;
		const stor = new Uint8Array(DurationExact.storageBytes);
		DurationExact._loadDHISU(d, h, i, s, u, stor);
		return new DurationExact(stor, dayBytesDe);
	}

	public static parse(input: WindowStr): DurationExact {
		const parts = ADurationCore._parseDHIS(input);
		return DurationExact.new(parts);
	}

	/**
	 * Deserialize next 64 bits into DurationExact. It's recommended you call
	 * {@link validate} after if you don't trust the source.
	 * Throws if:
	 * - There's not 64 bits remaining in $source.buffer
	 * @param source Source to read bits from
	 * @returns
	 */
	public static deserialize(source: BitReader): DurationExact {
		const stor = new Uint8Array(DurationExact.storageBytes);
		const d = source.readNumber(daySerBitsDe);
		stor[0] = d >> 24;
		stor[1] = d >> 16;
		stor[2] = d >> 8;
		stor[3] = d;
		ADurationCore._deserHISU(source, stor, dayBytesDe);
		return new DurationExact(stor, dayBytesDe);
	}
}
const zeroE = DurationExact.fromUs(0);
const maxE = DurationExact.new({ d: maxDays });

/**
 * A duration of years, months, days that vary based on context, with support for hours/minutes/seconds/microseconds
 * (which do not vary, leap seconds are not supported so hour/minute do not vary based on context)
 *
 * Years can be 365-366 days (ie leap years), in one (known) historical case
 * ([1752 in US](https://www.timeanddate.com/calendar/julian-gregorian-switch.html)) the year was 356 days
 *
 * Months can be 28,30 or 31 days long (variance of months), and of course 29 days for February on leap years. Note
 * September 1752 was only 19 days long.
 *
 * Days can be 23-25 hours long (due to daylight savings/summer and winter times).
 * [BDST](https://www.timeanddate.com/time/zone/uk/london?year=1947) was two sequential shifts so still only resulted
 * in 23/25 hour days.  Note a few rare savings timezones are only a 30 minute shift.
 */
export class Duration extends ADurationCore implements ISerializer {
	static readonly serialBits =
		ymSerialBits + //32
		daySerBitsDv + //32+19 = 51
		hisuSerialBits; //32+19+37 = 88
	static readonly storageBytes =
		yearStorageBytes + monthStorageBytes + dayBytesDv + hisuStorageBytes; //14

	public static get zero(): Duration {
		return zeroV;
	}
	public static get max(): Duration {
		return maxV;
	}

	/** Years (0 - 367200) */
	public get year(): number {
		return (
			(this._storage[0] << 16) | (this._storage[1] << 8) | this._storage[2]
		);
	}

	/** Months (limited) floating point (0 - ~11.999) */
	public get month(): number {
		return ((this._storage[3] << 8) | this._storage[4]) / monthFrac;
	}

	/** Days (0 - 146097) */
	public get day(): number {
		return (
			(this._storage[this._hPos - 3] << 16) |
			(this._storage[this._hPos - 2] << 8) |
			this._storage[this._hPos - 1]
		);
	}

	protected _otherHours(): number {
		const ym = this.year * mPerYear + this.month;
		//Shortest month = 28d = 672h so 75% of a month is at least 500h
		if (ym >= 0.75) return 501;
		//However we both can't combine y-months and days (how long is a month etc)

		//We can't accurately measure a day's length (could be 23-25 hours) so we
		// use the same 24 as DurationExact and expect the caller to only be using this
		// with low day counts (probably without year/months too).  Which is
		// somewhat enforced by not implementing fromTimeLike on this type
		return this.day * hPerDay;
		//Effects toTimeLike()
	}

	/**
	 * Compose a string of this duration, cycling through y/m/d/h/i/s.
	 * - `s` can include a decimal component to represent microseconds
	 * - `m` can include a decimal component to represent fractional months
	 * - Other components are integers
	 * - If any component is zero it's dropped from output, including microseconds
	 *
	 * (ny)(n.nm)(nd)(nh)(ni)(n.nnnnnns)
	 */
	public toString(): string {
		let ret = '';
		const y = this.year;
		const m = this.month;
		if (y > 0) ret += y + 'y';
		if (m > 0) ret += m + 'm';

		ret += super.toString();
		if (ret.length === 0) return '0s';
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
		let bit = '';
		const y = this.year;
		const m = this.month;
		if (y > 0) bit += y + 'Y';
		if (m > 0) bit += m + 'M';
		bit += super.toIso8601();
		if (bit.length == 0) bit = '0D';
		return 'P' + bit;
	}

	/** Serialize into target  - 88 bits*/
	public serialize(target: BitWriter): void {
		//Note this is almost the same as .month except it is in whole fracs (720ths)
		const monthFracs =
			((this._storage[3] << 8) | this._storage[4]) + this.year * mfPerYear;
		target.writeNumber(monthFracs, ymSerialBits);
		target.writeNumber(this.day, daySerBitsDv);
		super.serialize(target);
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
		safe.int.lt('year', this.year, maxYears + 1); //maxYears is inclusive
		safe.float.lt('month', this.month, mPerYear);
		safe.int.lt('day', this.day, daysPerCD);
		this._validate();
		return this;
	}

	/**
	 * Extract this duration as a 3-integer array:
	 * - Years & months in months (y*12+m) - float (0 - 4406400)
	 * - Days & hours in hours (d*24+h) - int (0 - 3506328)
	 * - Minutes, seconds & micros ((m*60+s)*1000000+u) - u32 (0 - 3599999999)
	 */
	public toYmDhMiso(): [number, number, number] {
		return [
			this.year * 12 + this.month,
			this.day * hPerDay + this._storage[this._hPos],
			this._storage[this._hPos + 1] * usPerMin +
				this._storage[this._hPos + 2] * usPerSec +
				this.microsecond,
		];
	}

	//Extract current value as three integers, all u32
	private _ymf_dh_misu(): [number, number, number] {
		const ymf =
			this.year * mfPerYear + ((this._storage[3] << 8) | this._storage[4]);
		return [ymf, ...this._dh_misu()];
	}

	/**
	 * Whether this is greater than `d`.  Note no effort is made to shift
	 * years/months into days and vice versa, elements are compared verbatim, and so
	 * 1y1m > 1y32d, which is never true
	 * 1y1m > 1y30d, which is true in some months
	 *
	 * The general use-case is *either* year-month strings with low days, or high
	 * days without years/months (or with years being an exact multiple of 400)
	 * @param d
	 * @returns
	 */
	public gt(d: Duration): boolean {
		const n = this._hPos + 6;
		for (let i = 0; i < n; i++) {
			if (this._storage[i] > d._storage[i]) return true;
			if (this._storage[i] < d._storage[i]) return false;
		}
		return false; //Would have to be equal at this point..which isn't gt
	}

	/**
	 * Add an exact duration to this, note the exactness of the duration will be
	 * compromised, any day/hour components will become context sensitive (a day
	 * being 23-25hours depending on daylight/winter savings, an hour being 0-2
	 * at 2am for the same reason)
	 * @pure
	 */
	public add(d: DurationExact): Duration;
	/**
	 * Add a duration to this
	 * @pure
	 */
	public add(d: Duration): Duration;
	public add(du: ADurationCore): Duration {
		let [ymf, dh, misu] = this._ymf_dh_misu();
		//Diverge: Duration vs Duration Exact
		if (du instanceof Duration) {
			const [oymf, odh, omisu] = du._ymf_dh_misu();
			ymf += oymf;
			dh += odh;
			misu += omisu;
		} else {
			// @ts-expect-error: du is ADurationCore, as we are, and we can see protected properties @@bug (ts2446)
			const [odh, omisu] = du._dh_misu();
			dh += odh;
			misu += omisu;
		}
		//End-diverge
		if (misu >= usPerHour) {
			misu -= usPerHour;
			dh += 1;
		}
		if (dh >= hPerCD) {
			dh -= hPerCD;
			ymf += mfPerYear * 400;
		}
		if (ymf >= maxYMf) return maxV;

		const mf = ymf % mfPerYear;
		const y = (ymf - mf) / mfPerYear;
		const d = (dh / hPerDay) | 0;
		const h = dh % hPerDay;
		const u = misu % usPerSec;
		misu = (misu / usPerSec) | 0;
		const s = misu % 60;
		misu = (misu / 60) | 0;
		const i = misu % 60;

		const stor = new Uint8Array(Duration.storageBytes);
		Duration._loadYMfD(y, mf, d, stor);
		ADurationCore._loadHISU(h, i, s, u, stor, 8);
		return new Duration(stor, 8);
	}

	/**
	 * Subtract an exact duration from this, note the exact/vague boundary is at 400years,
	 * (when the two coincide) so 1y1d - 2d will *fail*.  The two aren't really expected
	 * to interop, but this gives the ability to say "3 days before 1000 years from now" etc
	 * @pure
	 */
	public sub(d: DurationExact): Duration;
	/**
	 * Subtract a duration from this
	 * @pure
	 */
	public sub(d: Duration): Duration;
	public sub(du: ADurationCore): Duration {
		let [ymf, dh, misu] = this._ymf_dh_misu();
		//Diverge: Duration vs Duration Exact
		if (du instanceof Duration) {
			const [oymf, odh, omisu] = du._ymf_dh_misu();
			ymf -= oymf;
			dh -= odh;
			misu -= omisu;
		} else {
			// @ts-expect-error: du is ADurationCore, as we are, and we can see protected properties @@bug (ts2446)
			const [odh, omisu] = du._dh_misu();
			dh -= odh;
			misu -= omisu;
		}
		if (misu < 0) {
			misu += usPerHour;
			dh -= 1;
		}
		if (dh < 0) {
			dh += hPerCD;
			ymf -= mfPerYear * 400;
		}
		if (ymf < 0) return zeroV;

		const mf = ymf % mfPerYear;
		const y = (ymf - mf) / mfPerYear;
		const d = (dh / hPerDay) | 0;
		const h = dh % hPerDay;
		const u = misu % usPerSec;
		misu = (misu / usPerSec) | 0;
		const s = misu % 60;
		misu = (misu / 60) | 0;
		const i = misu % 60;

		const stor = new Uint8Array(Duration.storageBytes);
		Duration._loadYMfD(y, mf, d, stor);
		ADurationCore._loadHISU(h, i, s, u, stor, 8);
		return new Duration(stor, 8);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Duration';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Duration(${this.toString()})`;
	}

	//Store y-d, range checks must have been done before
	private static _loadYMfD(
		y: number,
		mf: number,
		d: number,
		storage: Uint8Array
	) {
		storage[0] = y >> 16;
		storage[1] = y >> 8;
		storage[2] = y;
		storage[3] = mf >> 8;
		storage[4] = mf;
		storage[5] = d >> 16;
		storage[6] = d >> 8;
		storage[7] = d;
	}

	/**
	 * Create a duration from parts, y/m/d/h/i/s can be floating point.
	 * m/d/h/i/s/us can exceed their maximum (the values will roll up)
	 * All values are optional, but if specified must be >=0
	 *
	 * If days are large (more than 146097, the number in 400 years), then
	 * they are instead added as 400 year sets.
	 *
	 * The maximum number of years+months is 367475y7m.
	 *
	 * Because of day-rollup, you can trigger a `years+months should be 4409707, got $value`
	 * error without providing any years/months
	 * @param parts
	 * @returns
	 */
	public static new(parts: IDurationParts): Duration {
		let m = 0;
		if (parts.y) {
			if (parts.y < 0) throw new NegativeError('years', parts.y);
			if (parts.y > maxYears) throw new AtMostError('years', parts.y, maxYears);
			m = parts.y * mPerYear;
		}
		if (parts.m) {
			if (parts.m < 0) throw new NegativeError('months', parts.m);
			m += parts.m;
		}
		let us = ADurationCore._convertHISUPartsToUs(parts);
		let d = 0;
		if (parts.d) {
			if (parts.d < 0) throw new NegativeError('days', parts.d);
			//Catch any fractional days and move them to micros
			d = parts.d;
			const dRem = d % 1;
			if (dRem != 0) {
				us += Math.round(dRem * usPerDay);
				d -= dRem;
			}
			//if (parts.d % 1 !== 0) throw new TypeError(`days must whole: ${d}`);
			d = parts.d;
		}
		//If more than a day in micros, move to days
		if (us >= usPerDay) {
			d += Math.floor(us / usPerDay);
			us %= usPerDay;
		}
		//Catch excess days and add them to years
		if (d > daysPerCD) {
			const cd = (d / daysPerCD) | 0;
			d %= daysPerCD;
			m += cd * 400 * mPerYear;
		}

		//Calculate years+monthFracs
		const y = (m / mPerYear) | 0;
		const mf = Math.round((m % mPerYear) * monthFrac);
		//Slightly incorrect error, but how better to phrase?
		if (m > maxYM)
			throw new AtMostError(
				'years+months+days',
				`${y}y${m % mPerYear}m${d}d`,
				maxYears + 'y'
			);

		//Calculate seconds+micros
		const u = us % usPerSec;
		const s = (us / usPerSec) % 60 | 0;
		//Calculate hours+minutes
		const h = (us / usPerHour) | 0;
		const i = ((us / usPerMin) | 0) % 60;

		const stor = new Uint8Array(Duration.storageBytes);
		Duration._loadYMfD(y, mf, d, stor);
		ADurationCore._loadHISU(h, i, s, u, stor, 8);
		const ret = new Duration(stor, 8);
		//Note you can build invariants (that exceed max) by doing y:maxYears-1,d>366 or y:maxYears-2, d>731 etc
		// but we can't reconcile that with vague durations (short of preventing any years>maxYears-400, or
		// making an assumption about how many days are in a year) - we'll just have to document the constraint
		if (m == maxYM && (d > 0 || us > 0))
			throw new AtMostError('duration', ret, maxV);
		return ret;
	}

	//public static fromDurationExact(de:DurationExact,y?:number,m?:number):Duration{}

	public static parse(input: WindowStr): Duration {
		const reset = input.getReset();
		let y = 0,
			m = 0;
		// quelle stupid for blanket complaints like this, especially ending in return
		// eslint-disable-next-line no-constant-condition
		while (true) {
			const delimY = input.indexOfAny(['y', 'Y']);
			if (delimY > 0) {
				y = Float.parseDec(input.substring(0, delimY));
				if (Number.isNaN(y)) break;
				input.shrink(delimY + 1);
			}
			const delimM = input.indexOfAny(['m', 'M']);
			if (delimM > 0) {
				m = Float.parseDec(input.substring(0, delimM));
				if (Number.isNaN(m)) break;
				input.shrink(delimM + 1);
			}
			try {
				//This may throw, but we want the ymdhis error message (hence catch/break)
				const exactParts = ADurationCore._parseDHIS(input);
				return Duration.new({ y, m, ...exactParts });
			} catch (e: unknown) {
				break;
			}
		}
		reset();
		throw new ContentError('Expecting ymdhis components', 'duration', input);
	}

	/**
	 * Deserialize next 88 bits into Duration. It's recommended you call
	 * {@link validate} after if you don't trust the source.
	 * Throws if:
	 * - There's not 88 bits remaining in $source.buffer
	 * @param source Source to read bits from
	 * @returns
	 */
	public static deserialize(source: BitReader): Duration {
		const stor = new Uint8Array(Duration.storageBytes);
		const ym = source.readNumber(32);
		const y = (ym / mfPerYear) | 0;
		const mf = ym % mfPerYear;
		const d = source.readNumber(daySerBitsDv);
		Duration._loadYMfD(y, mf, d, stor);
		ADurationCore._deserHISU(source, stor, 8);
		return new Duration(stor, 8);
	}
}
const zeroV = Duration.new({});
const maxV = Duration.new({ y: maxYears });
