/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { AtMostError } from '../../error/AtMostError.js';
import { BitWriter } from '../BitWriter.js';
import { BitReader } from '../BitReader.js';
import { ISerializer } from '../interfaces/ISerializer.js';
import { NegativeError } from '../../error/NegativeError.js';
import { Hour } from './Hour.js';
import { Minute } from './Minute.js';
import { Second } from './Second.js';
import { Microsecond } from './Microsecond.js';
import { ContentError } from '../../error/ContentError.js';
import { LTError } from '../../error/LTError.js';
import { Float, Int } from '../number/index.js';
import { WindowStr } from '../WindowStr.js';
import { IDurationExactParts, IDurationParts } from '../interfaces/IDurationParts.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT_E = 'DurationExact';
const DBG_RPT_V = 'Duration'; //aka DurationVague
const hPerD = 24;
const mPerY = 12;
const usPerS = 1000000; //        1000000
const usPerM = usPerS * 60; //   60000000
const usPerH = usPerM * 60; // 3600000000
const usPerD = usPerH * hPerD; //86400000000 //more than 2^32
const daysPerCD = 146097;
const maxDays = 134117046; //Number of days in 918CD*400 = 367200y
const maxDH = maxDays * hPerD;
//We chose 500 here because that's less than a month of time, but large enough
// for most plausible use-cases for representing time in this format
const maxTimeLikeHours = 500;
const daySerialBitsDe = 27; //2^27 = 134,217,728 (~367438y)
const dayStorageBytesDe = 4;
const daySerialBitsDv = 18 + 1; //2^18 = 262,144, just need 146097 the extra bit (waste) is align end hex of DE/D
const dayStorageBytesDv = 3;
const monthFrac = 720;
const mfPerYear = monthFrac * mPerY;
const maxYears = 367200;
const maxYM = maxYears * mPerY; //4406400
//Note Duration.maxYears == DurationExact.maxDays but when Duration years are less than max years (eg maxYears-1)
// you can provide dhis components that'll EXCEED maxYears (but we cannot tell without having to guess at a y/m<->d conversion)
//It is expected you're EITHER using Duration with days, or with years+months at very large values (allows .gt to work)
const ymSerialBits = 32; //2^32 = 4,294,967,296, we only need 3,172,608,000
const yearStorageBytes = 3;
const monthStorageBytes = 2;

//By using a shared _DurationCore, DurationExact and Duration can share features and code
const hisuSerialBits =
	Hour.serialBits +
	Minute.serialBits +
	Second.serialBits +
	Microsecond.serialBits; //37
const hisuStorageBytes =
	Hour.storageBytes +
	Minute.storageBytes +
	Second.storageBytes +
	Microsecond.storageBytes; //6

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
		target.writeNumber(this._storage[this._hPos], Hour.serialBits);
		target.writeNumber(this._storage[this._hPos + 1], Minute.serialBits);
		target.writeNumber(this._storage[this._hPos + 2], Second.serialBits);
		target.writeNumber(this.microsecond, Microsecond.serialBits);
	}

	protected _validate(): void {
		safe.int.lt('hour', this._storage[this._hPos], 24);
		safe.int.lt('minute', this._storage[this._hPos + 1], 60);
		safe.int.lt('second', this._storage[this._hPos + 2], 60);
		safe.int.lt('second', this.microsecond, usPerS);
	}

	//Extract the current value into two integers, both u32
	protected _dh_misu(): [number, number] {
		return [
			this.day * hPerD + this._storage[this._hPos],
			this._storage[this._hPos + 1] * usPerM +
				this._storage[this._hPos + 2] * usPerS +
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
			us += parts.h * usPerH;
		}
		if (parts.i) {
			if (parts.i < 0) throw new NegativeError('minutes', parts.i);
			us += parts.i * usPerM;
		}
		if (parts.s) {
			if (parts.s < 0) throw new NegativeError('seconds', parts.s);
			us += parts.s * usPerS;
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
		const h = source.readNumber(Hour.serialBits);
		const i = source.readNumber(Minute.serialBits);
		const s = source.readNumber(Second.serialBits);
		const u = source.readNumber(Microsecond.serialBits);
		ADurationCore._loadHISU(h, i, s, u, storage, hPos);
	}
}

export class DurationExact extends ADurationCore implements ISerializer {
	static readonly serialBits = daySerialBitsDe + hisuSerialBits; //64
	static readonly storageBytes =
		dayStorageBytesDe + //day
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
		return this.day * hPerD;
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

	/** Serialize into target  - 38 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.day, daySerialBitsDe);
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
		let [dh, misu] = this._dh_misu();
		const [odh, omisu] = de._dh_misu();
		dh += odh;
		misu += omisu;

		if (misu >= usPerH) {
			misu -= usPerH;
			dh += 1;
		}
		//If we exceed max - return max
		if (dh > maxDH) return maxE;
		//Max has a day component only, no hisu allowed
		if (dh == maxDH && misu > 0) return maxE;

		const d = (dh / hPerD) | 0;
		const h = dh % hPerD;
		const u = misu % usPerS;
		misu = (misu / usPerS) | 0;
		const s = misu % 60;
		misu = (misu / 60) | 0;
		const i = misu % 60;

		const stor = new Uint8Array(DurationExact.storageBytes);
		DurationExact._loadDHISU(d, h, i, s, u, stor);
		return new DurationExact(stor, dayStorageBytesDe);
	}

	/**
	 * Subtract duration from this
	 * @param de Duration to subtract
	 * @returns A new duration
	 * @pure
	 */
	public sub(de: DurationExact): DurationExact {
		let [dh, misu] = this._dh_misu();
		const [odh, omisu] = de._dh_misu();
		dh -= odh;
		misu -= omisu;
		if (misu < 0) {
			misu += usPerH;
			dh -= 1;
		}
		if (dh < 0) {
			//Clamp at zero
			return zeroE;
		}

		const d = (dh / hPerD) | 0;
		const h = dh % hPerD;
		const u = misu % usPerS;
		misu = (misu / usPerS) | 0;
		const s = misu % 60;
		misu = (misu / 60) | 0;
		const i = misu % 60;

		const stor = new Uint8Array(DurationExact.storageBytes);
		DurationExact._loadDHISU(d, h, i, s, u, stor);
		return new DurationExact(stor, dayStorageBytesDe);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT_E;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT_E}(${this.toString()})`;
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
		ADurationCore._loadHISU(h, i, s, u, storage, dayStorageBytesDe);
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
			us += Math.round(dRem * usPerD);
			d -= dRem;
		}
		//If more than a day in micros, move to days
		if (us >= usPerD) {
			d += Math.floor(us / usPerD);
			us %= usPerD;
		}
		//Calculate seconds+micros
		const u = us % usPerS;
		const s = (us / usPerS) % 60 | 0;
		//Calculate hours+minutes
		const h = (us / usPerH) | 0;
		const i = ((us / usPerM) | 0) % 60;

		const stor = new Uint8Array(DurationExact.storageBytes);
		DurationExact._loadDHISU(d, h, i, s, u, stor);
		const ret = new DurationExact(stor, dayStorageBytesDe);
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
		u = us % usPerS;
		us = Math.floor(us / usPerS);
		s = us % 60;
		us = Math.floor(us / 60);
		i = us % 60;
		us = Math.floor(us / 60);
		h = us % hPerD;
		us = Math.floor(us / 24);
		d = us;

		//Days can only exceed max if us was floating point.. which it could have been
		// so make sure we catch that.
		if (d > maxDays) throw new AtMostError('days', d, maxDays);
		const stor = new Uint8Array(DurationExact.storageBytes);
		DurationExact._loadDHISU(d, h, i, s, u, stor);
		return new DurationExact(stor, dayStorageBytesDe);
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
		const d = (h / hPerD) | 0;
		h = h % hPerD;
		const u = ((s % 1) * usPerS) | 0;
		s = s | 0;
		const stor = new Uint8Array(DurationExact.storageBytes);
		DurationExact._loadDHISU(d, h, i, s, u, stor);
		return new DurationExact(stor, dayStorageBytesDe);
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
		const d = source.readNumber(daySerialBitsDe);
		stor[0] = d >> 24;
		stor[1] = d >> 16;
		stor[2] = d >> 8;
		stor[3] = d;
		ADurationCore._deserHISU(source, stor, dayStorageBytesDe);
		return new DurationExact(stor, dayStorageBytesDe);
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
		daySerialBitsDv + //32+19 = 51
		hisuSerialBits; //32+19+37 = 88
	static readonly storageBytes =
		yearStorageBytes + monthStorageBytes + dayStorageBytesDv + hisuStorageBytes; //14

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
		const ym = this.year * mPerY + this.month;
		//Shortest month = 28d = 672h so 75% of a month is at least 500h
		if (ym >= 0.75) return 501;
		//However we both can't combine y-months and days (how long is a month etc)

		//We can't accurately measure a day's length (could be 23-25 hours) so we
		// use the same 24 as DurationExact and expect the caller to only be using this
		// with low day counts (probably without year/months too).  Which is
		// somewhat enforced by not implementing fromTimeLike on this type
		return this.day * hPerD;
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
		target.writeNumber(this.day, daySerialBitsDv);
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
		safe.float.lt('month', this.month, mPerY);
		safe.int.lt('day', this.day, daysPerCD);
		this._validate();
		return this;
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
	//todo: add, sub

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT_V;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT_V}(${this.toString()})`;
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
			m = parts.y * mPerY;
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
				us += Math.round(dRem * usPerD);
				d -= dRem;
			}
			//if (parts.d % 1 !== 0) throw new TypeError(`days must whole: ${d}`);
			d = parts.d;
		}
		//If more than a day in micros, move to days
		if (us >= usPerD) {
			d += Math.floor(us / usPerD);
			us %= usPerD;
		}
		//Catch excess days and add them to years
		if (d > daysPerCD) {
			const cd = (d / daysPerCD) | 0;
			d %= daysPerCD;
			m += cd * 400 * mPerY;
		}

		//Calculate years+monthFracs
		const y = (m / mPerY) | 0;
		const mf = Math.round((m % mPerY) * monthFrac);
		//Slightly incorrect error, but how better to phrase?
		if (m > maxYM)
			throw new AtMostError(
				'years+months+days',
				`${y}y${m % mPerY}m${d}d`,
				maxYears + 'y'
			);

		//Calculate seconds+micros
		const u = us % usPerS;
		const s = (us / usPerS) % 60 | 0;
		//Calculate hours+minutes
		const h = (us / usPerH) | 0;
		const i = ((us / usPerM) | 0) % 60;

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
		const d = source.readNumber(daySerialBitsDv);
		Duration._loadYMfD(y, mf, d, stor);
		ADurationCore._deserHISU(source, stor, 8);
		return new Duration(stor, 8);
	}
}
const zeroV = Duration.new({});
const maxV = Duration.new({ y: maxYears });
