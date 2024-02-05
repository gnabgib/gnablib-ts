/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
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
		readonly year: Year,
		/** Months (1-12) */
		readonly month: Month,
		/** Days (1-31) */
		readonly day: Day
	) {}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date: yyyy-mm-dd (zero padded year/month/day)
	 */
	public toString(): string {
		return (
			this.year.toIsoString() +
			'-' +
			this.month.toIsoString() +
			'-' +
			this.day.toIsoString()
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
			this.year.valueOf(),
			/*fucks sake JS*/ this.month.valueOf() - 1,
			this.day.valueOf()
		);
	}

	/** Days since the Unix epoch (1970-01-01) */
	toUnixDays(): number {
		let yv = this.year.valueOf();
		let mv = this.month.valueOf();
		const dv = this.day.valueOf();
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
		return (
			this.year.valueOf() * 10000 +
			this.month.valueOf() * 100 +
			this.day.valueOf()
		);
	}

	/** Serialize into target  - 24 bits*/
	public serialize(target: BitWriter): void {
		this.year.serialize(target);
		this.month.serialize(target);
		this.day.serialize(target);
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
		this.month.validate();
		this.day.validate();
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
		const daysPer4y = 1460;//no leap day
		const daysPer100y = 36524;//with leap days
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
