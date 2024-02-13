/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { WindowStr } from '../WindowStr.js';
import { ContentError } from '../../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';
import { Day } from './Day.js';
import { Month } from './Month.js';
import { Year } from './Year.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'DateOnly';
//Days in month, note it's offset for
const DIM = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const daysPerCD = 146097;
//Amount of days to shift a CD segment to make the epoch 0
const epochShift = 719468;
const msPerMin = 60 * 1000;

/**
 * Date down to day resolution (no time component)
 *
 * Range: -10000-01-01 - +22767-12-31
 */
export class DateOnly implements ISerializer {
	static readonly sPerDay = 86400;
	static readonly msPerDay = 86400000;
	static readonly usPerDay = 86400000000;
	/**Number of bytes required to store this data */
	static readonly storageBytes =
		Year.storageBytes + Month.storageBytes + Day.storageBytes; //4
	/**Number of bits required to serialize this data */
	static readonly serialBits =
		Year.serialBits + Month.serialBits + Day.serialBits; //24

	private constructor(
		/** Years (-10000 - +22767) ISO8601 */
		private readonly _year: Year,
		/** Months (1-12) */
		private readonly _month: Month,
		/** Days (1-31) */
		private readonly _day: Day
	) {}

	/** Minimum date = -10000-01-01 */
	static get min(): DateOnly {
		return min;
	}
	/** Maximum date =  +22767-12-31 */
	static get max(): DateOnly {
		return max;
	}

	/** Years (-10000 - +22767) ISO8601 */
	get year(): number {
		return this._year.valueOf();
	}
	/** Months (1-12) */
	get month(): number {
		return this._month.valueOf();
	}
	/** Days (1-31) */
	get day(): number {
		return this._day.valueOf();
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date: yyyy-mm-dd (zero padded year/month/day)
	 *
	 * @param [sep='-'] Character to separate components (default -)
	 */
	public toString(sep = '-'): string {
		return (
			this._year.toIsoString() +
			sep +
			this._month.toIsoString() +
			sep +
			this._day.toIsoString()
		);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date-time: yyyy-mm-ddThh:mm:ss.mmmmmm(z)
	 */
	toJSON(): string {
		//JSON is supposed to be human readable, but it's often used as a data-transport between machines only.
		// Using a number (like valueOf), or encoded serialized bytes, would decrease the JSON
		// size but is no longer *human readable*.  This mistake is made in some libraries
		// serializing date and time in unix-time
		return this.toString();
	}

	/**
	 * Output as a JS `Date` object (in local, hour and smaller units zeroed)
	 *
	 * If you don't want it in local time, build a new date from {@link toUnixTimeMs}
	 *
	 * Because JS Date includes a time element, there can be some unexpected side effects with
	 * date-math. (eg when crossing daylight savings time boundaries).
	 */
	toDate(): Date {
		return new Date(
			this._year.valueOf(),
			/*fucks sake JS*/ this._month.valueOf() - 1,
			this._day.valueOf()
		);
	}

	/** Days since the Unix epoch (1970-01-01) */
	toUnixDays(): number {
		let yv = this._year.valueOf();
		let mv = this._month.valueOf();
		const dv = this._day.valueOf();
		//Move so 1-March first day of year (28/29-Feb last)
		if (mv > 2) {
			mv -= 3;
		} else {
			mv += 9;
			yv -= 1;
		}
		//The calendar repeats itself ever 400 years (see: leap year rules) so we can break
		// things down into 400 year segments (CD - 400 in roman numerals)
		const CD = ((yv >= 0 ? yv : yv - 399) / 400) | 0;
		const yearOfCD = yv - CD * 400; //[0 - 399]
		const dayOfYear = ((153 * mv + 2) / 5 + dv - 1) | 0; // [0 - 365]
		const dayOfCD =
			yearOfCD * 365 +
			((yearOfCD / 4) | 0) -
			((yearOfCD / 100) | 0) +
			dayOfYear; // [0 - 146096]
		const ret = CD * daysPerCD + dayOfCD - epochShift;
		return ret;
	}

	/** Seconds since the Unix epoch aka unix time (hour and smaller units zeroed) */
	toUnixTime(): number {
		return this.toUnixDays() * self.sPerDay;
	}

	/** Milliseconds since the Unix epoch aka unix time (hour and smaller units zeroed, compatible with `Date` constructor) */
	toUnixTimeMs(): number {
		return this.toUnixDays() * self.msPerDay;
	}

	/**
	 * Numeric date base 10 shifted -100000101 - +227671231
	 * So today (2024-01-15) would be: 20240115
	 * Note there are gaps in valid values: 20241301, 20240132, 20240230 aren't valid, but
	 * you can do <, >, = comparisons
	 */
	public valueOf(): number {
		const y = this._year.valueOf() * 10000;
		return y < 0
			? y - this._month.valueOf() * 100 - this._day.valueOf()
			: y + this._month.valueOf() * 100 + this._day.valueOf();
	}

	/** Serialize into target  - 24 bits*/
	public serialize(target: BitWriter): void {
		this._year.serialize(target);
		this._month.serialize(target);
		this._day.serialize(target);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return self.serialBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): DateOnly {
		//no validate for year
		this._month.validate();
		this._day.validate();
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

	/**
	 * Add a number of days to this date, returns a new object (pure)
	 *
	 * @param days Integer number of days, can be negative, if floating it will be truncated
	 * @returns New date
	 *
	 * @pure
	 */
	public addSafe(days: number, storage?: Uint8Array): DateOnly {
		return DateOnly.fromUnixDays(this.toUnixDays() + (days | 0), storage);
	}

	/**
	 * Add a number of years/months to this date, returns a new object (pure)
	 *
	 * Adding years is mostly safe, unless it's currently February 29th, in which case the `day`
	 * *may* become 28th if the new year isn't leap.  Might be easiest to consider `y=12*m` (although
	 * the magnitude of `m` is not limited to 12.. you can add `14m`, or - bizarrely - `1y14m` (26m) if you want)
	 *
	 * Adding months is safe when the day is <=28.  Could be safe with higher values. When
	 * the destination month has a lower count of days the `day` will be clamped.  The results
	 * may also be unexpected if you consider the current value to be relative to the end of a month
	 * and expect the new value to be likewise the same distance
	 *
	 * If you want to add days before/after call {@link addSafe} in sequence
	 *
	 * @example
	 * Sep 30 + 1m1d = Oct 31 //Sep30->Oct30->Oct31
	 * @example
	 * Oct 31 + 1m1d = Dec 1  //Oct31->Nov30->Dec01
	 * @example
	 * Feb 29 + 1y1m = Mar 29 //Feb29->Mar29. If there was 2 stage validation Feb29->Feb28->Mar28
	 *
	 * @param y Integer, if float will be truncated
	 * @param m
	 * @param d
	 *
	 * @pure
	 */
	public add(y: number, m = 0, storage?: Uint8Array): DateOnly {
		let monthAdd = 0;
		//By collecting and distributing we normalize high m or m/y sign mismatch
		// (eg +1-4 == +8)
		if (y) monthAdd += (y | 0) * 12;
		if (m) monthAdd += m | 0;
		const yearAdd = (monthAdd / 12) | 0;
		monthAdd %= 12;

		const yv = this._year.valueOf() + yearAdd;
		const mv = this._month.valueOf() + monthAdd;
		const dv = Math.min(this._day.valueOf(), DateOnly.daysInMonth(yv, mv));
		return DateOnly.new(yv, mv, dv, storage);
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (storage === undefined) return new Uint8Array(self.storageBytes);
		safe.lengthAtLeast('storage', storage, self.storageBytes);
		return storage;
	}

	/**
	 * Create a new ISO8601 date
	 * @param year range -10000 - +22767
	 * @param month range 1 - 12
	 * @param day range 1 - 31
	 */
	public static new(
		year: number,
		month: number,
		day: number,
		storage?: Uint8Array
	): DateOnly {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const y = Year.new(year, stor);
		const m = Month.new(month, stor.subarray(2, 3));
		const d = Day.new(day, stor.subarray(3, 4));
		return new DateOnly(y, m, d);
	}

	/**
	 * Convert from base 10 shifted value {@link valueOf} into new DateOnly
	 *
	 * @example
	 * ```js
	 * const dto=DateOnly.fromValue(20240115);
	 * dto.toValue();//20240115
	 * dto.year.toValue();//2024
	 * dto.month.toValue();//1
	 * dto.day.toValue();//15
	 * ```
	 *
	 * @param v
	 * @param storage
	 * @returns
	 */
	public static fromValue(v: number, storage?: Uint8Array): DateOnly {
		const d = v % 100;
		v = (v - d) / 100;
		const m = v % 100;
		v = (v - m) / 100;
		return DateOnly.new(v, m, d, storage).validate();
	}

	/**
	 * Create a date from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): DateOnly {
		const dms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		return self.fromUnixDays(dms / self.msPerDay, storage);
	}

	/**
	 * Create a date from a js Date object in UTC
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): DateOnly {
		return self.fromUnixDays(date.valueOf() / self.msPerDay, storage);
	}

	public static fromUnixDays(source: number, storage?: Uint8Array): DateOnly {
		const daysPer4y = 1460; //no leap day
		const daysPer100y = 36524; //with leap days
		//Move to 0000-3-1 based days
		source = (source + epochShift) | 0;
		const CD =
			((source >= 0 ? source : source - daysPerCD + 1) / daysPerCD) | 0;
		const dayOfCD = source - CD * daysPerCD; //[0 - 146096]
		const yearOfCD =
			((dayOfCD -
				((dayOfCD / daysPer4y) | 0) +
				((dayOfCD / daysPer100y) | 0) -
				((dayOfCD / (daysPerCD - 1)) | 0)) /
				365) |
			0; // [0 - 399]
		let y = yearOfCD + CD * 400;
		const dayOfYear =
			dayOfCD - 365 * yearOfCD - ((yearOfCD / 4) | 0) + ((yearOfCD / 100) | 0); // [0 - 365]
		const mp = ((5 * dayOfYear + 2) / 153) | 0; // [0 - 11]
		const d = dayOfYear + 1 - (((153 * mp + 2) / 5) | 0); // [1 - 31]
		const m = mp < 10 ? mp + 3 : mp - 9; // [1 - 12]
		if (m <= 2) y += 1;
		return self.new(y, m, d, storage);
	}

	/**
	 * Create a date from float seconds since UNIX epoch aka unix time
	 * *NOTE*: Unix time is always in UTC, depending on your timezone this may differ from local
	 * */
	public static fromUnixTime(source: number, storage?: Uint8Array): DateOnly {
		return self.fromUnixDays(source / self.sPerDay, storage);
	}

	/**
	 * Create a date from float milliseconds since UNIX epoch aka unix time
	 * *NOTE*: Unix time is always in UTC, depending on your timezone this may differ from local
	 */
	public static fromUnixTimeMs(source: number, storage?: Uint8Array): DateOnly {
		return self.fromUnixDays(source / self.msPerDay, storage);
	}

	/**
	 * Parse a string into a date, accepts:
	 * 'now', a 3 part date separated by '-' characters
	 * @param input
	 * @param storage
	 */
	public static parse(
		input: WindowStr,
		strict = false,
		storage?: Uint8Array
	): DateOnly {
		const stor = self.setupStor(storage);
		input.trimStart();

		//If content starts with "now" and optionally followed by whitespace - run now macro
		if (input.test(/^now\s*$/i)) {
			input.shrink(3);
			return self.now(stor);
		}

		//If it's an optional sign followed by 8-9 digits assume it's an undelimitered date
		if (input.test(/^[-+]?\d{8,9}\s*$/)) {
			input.trimEnd();
			const ret = new DateOnly(
				Year.parse(input.left(input.length - 4), strict, stor),
				Month.parse(input.span(input.length - 4, 2), strict, stor.subarray(2)),
				Day.parse(input.right(2), strict, stor.subarray(3))
			);
			input.shrink(input.length);
			return ret;
		}

		//Dash, slash, dot (germany?) separated allowed
		let delim1: number;
		if (!strict) {
			delim1 = input.indexOfAny(['-', '/', '.'], 1);
		} else {
			delim1 = input.indexOf('-', 1);
		}
		let delim = '';
		if (delim1 > 0) {
			delim = input.charAt(delim1);
		}
		//Make sure second delim matches first, and there is one
		const delim2 = input.indexOf(delim, delim1 + 1);
		if (delim2 > 0) {
			//Prevent partial parsing (that throws) from consuming the input
			const ret = new DateOnly(
				Year.parse(input.left(delim1), strict, stor),
				Month.parse(
					input.span(delim1 + 1, delim2 - delim1 - 1),
					strict,
					stor.subarray(2)
				),
				Day.parse(input.span(delim2 + 1), strict, stor.subarray(3))
			);
			input.shrink(input.length);
			return ret;
		}

		throw new ContentError(
			`Expecting 8-9 digit ymd (with optional sign), or ${delim} delimited date`,
			'date',
			input
		);
	}

	//public static parse(str: string, storage?: Uint8Array): DateOnly {}

	/** Create this date (local) */
	public static now(storage?: Uint8Array): DateOnly {
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const n = new Date();
		const dms = n.valueOf() - n.getTimezoneOffset() * msPerMin;
		return self.fromUnixDays(dms / self.msPerDay, storage);
	}

	/** Create this date (UTC) */
	public static nowUtc(storage?: Uint8Array): DateOnly {
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const n = new Date();
		return self.fromUnixDays(n.valueOf() / self.msPerDay, storage);
	}

	public static deserialize(source: BitReader, storage?: Uint8Array): DateOnly {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const y = Year.deserialize(source, stor);
		const m = Month.deserialize(source, stor.subarray(2, 3));
		const d = Day.deserialize(source, stor.subarray(3, 4));
		return new DateOnly(y, m, d);
	}

	/* * Number of days in the given month */
	/**
	 * Number of days in the given month
	 * @param y Year integer, can exceed Year range, but cannot exceed Int32 (-2147483648  - 2147483647)
	 * @param m Month integer, not validated (1-12)
	 * @returns One of: 28,29,30,31
	 */
	public static daysInMonth(y: number, m: number): number {
		return m != 2 || !Year.isLeap(y) ? DIM[m] : 29;
	}

	/**
	 * Day of the week (where 0=Sunday, 1=Monday.. 6=Saturday)
	 * @param unixDays Count of days from epoch (can be negative)
	 * @returns Day (0 - 6)
	 */
	public static dayOfWeek(unixDays: number): number {
		return unixDays >= -4 ? (unixDays + 4) % 7 : ((unixDays + 5) % 7) + 6;
	}
}
const self = DateOnly;
const min = DateOnly.new(-10000, 1, 1);
const max = DateOnly.new(22767, 12, 31);
