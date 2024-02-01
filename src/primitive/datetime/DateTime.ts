/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ISerializer } from '../interfaces/ISerializer.js';
import { Year } from './Year.js';
import { Month } from './Month.js';
import { Day } from './Day.js';
import { Hour } from './Hour.js';
import { Minute } from './Minute.js';
import { Second } from './Second.js';
import { Microsecond } from './Microsecond.js';
import { UtcOrNot } from './UtcOrNot.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'DateTime';

/**
 * Date and time down to microsecond resolution
 * Range: -10000-01-01 00:00:00.000000 - +22767-12-31 23:59:59.999999 (no leap second support)
 *
 * *Note*: This is higher resolution than [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 */
export class DateTime implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes =
		Year.storageBytes +
		Month.storageBytes +
		Day.storageBytes +
		Hour.storageBytes +
		Minute.storageBytes +
		Second.storageBytes +
		Microsecond.storageBytes +
		UtcOrNot.storageBytes; //11
	/**Number of bits required to serialize this data */
	static readonly serialBits =
		Year.serialBits +
		Month.serialBits +
		Day.serialBits +
		Hour.serialBits +
		Minute.serialBits +
		Second.serialBits +
		Microsecond.serialBits +
		UtcOrNot.serialBits; // 62

	private constructor(
		/** Years (-10000 - +22767) ISO8601 */
		readonly year: Year,
		/** Months (1-12) */
		readonly month: Month,
		/** Days (1-31) */
		readonly day: Day,
		/** Hours (0-23) */
		readonly hour: Hour,
		/** Minutes (0-59) */
		readonly minute: Minute,
		/** Seconds (0-59) */
		readonly second: Second,
		/** Microseconds (0-999999) */
		readonly microsecond: Microsecond,
		/** In UTC or not */
		readonly isUtc: UtcOrNot
	) {}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date-time: yyyy-mm-ddThh:mm:ss.mmmmmm(z)
	 */
	public toString(dateTimeSep = 'T'): string {
		return (
			this.year.toIsoString() +
			'-' +
			this.month.toIsoString() +
			'-' +
			this.day.toIsoString() +
			dateTimeSep +
			this.hour.toIsoString() +
			':' +
			this.minute.toPadString() +
			':' +
			this.second.toPadString() +
			'.' +
			this.microsecond.toPadString() +
			this.isUtc.toIsoString()
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
	 * String datetime, without separators
	 * NOTE there are gaps in valid values, but you can do < > = comparisons
	 * NOTE Utc indicator is not included in this value
	 */
	public valueOf(): string {
		return (
			this.year.toIsoString() +
			this.month.toIsoString() +
			this.day.toIsoString() +
			this.hour.toIsoString() +
			this.minute.toPadString() +
			this.second.toPadString() +
			this.microsecond.toPadString()
		);
	}

	/** Serialize into target*/
	public serialize(target: BitWriter): void {
		this.year.serialize(target);
		this.month.serialize(target);
		this.day.serialize(target);
		this.hour.serialize(target);
		this.minute.serialize(target);
		this.second.serialize(target);
		this.microsecond.serialize(target);
		this.isUtc.serialize(target);
	}

	/** Number of bits required to serialize */
	get serialSizeBits():number {
		return self.serialBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): DateTime {
		//no validate for year
		this.month.validate();
		this.day.validate();
		this.hour.validate();
		this.minute.validate();
		this.second.validate();
		this.microsecond.validate();
		//no validate for isUtc
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
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.lengthAtLeast('storage', storage, self.storageBytes);
		return storage;
	}

	/**
	 * Create a new DateTime
	 * @param year range -10000 - +22767
	 * @param month range 1 - 12
	 * @param day range 1 - 31
	 * @param hour 0-23
	 * @param minute 0-59
	 * @param second 0-59
	 * @param microsecond 0-999999
	 * @param isUtc
	 * @param storage
	 */
	public static new(
		year: number,
		month: number,
		day: number,
		hour: number,
		minute: number,
		second: number,
		microsecond: number,
		isUtc = false,
		storage?: Uint8Array
	): DateTime {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const y = Year.new(year, stor);
		const m = Month.new(month, stor.subarray(2, 3));
		const d = Day.new(day, stor.subarray(3, 4));

		const h = Hour.new(hour, stor.subarray(4, 5));
		const i = Minute.new(minute, stor.subarray(5, 6));
		const s = Second.new(second, stor.subarray(6, 7));
		const us = Microsecond.new(microsecond, stor.subarray(7));
		const utc = UtcOrNot.new(isUtc, stor.subarray(10));
		return new DateTime(y, m, d, h, i, s, us, utc);
	}

	/**
	 * Create a time from a js Date object
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 * @param date Value used as source
	 */
	public static fromDate(
		date: Date,
		isUtc = false,
		storage?: Uint8Array
	): DateTime {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const y = Year.fromDate(date, stor);
		const m = Month.fromDate(date, stor.subarray(2, 3));
		const d = Day.fromDate(date, stor.subarray(3, 4));
		//NOTE: We could see if date.getTimezoneOffset() is zero and auto detect isUtc
		// but we want the dev to be explicit that this is a UTC number when it is
		// and not just conveniently running in the UTC timezone
		const h = Hour.fromDate(date, stor.subarray(4, 5));
		const i = Minute.fromDate(date, stor.subarray(5, 6));
		const s = Second.fromDate(date, stor.subarray(6, 7));
		const us = Microsecond.fromDate(date, stor.subarray(7));
		const utc = UtcOrNot.new(isUtc, stor.subarray(10));
		return new DateTime(y, m, d, h, i, s, us, utc);
	}

	/**
	 * Create a time from a js Date object in UTC
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): DateTime {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const y = Year.fromDateUtc(date, stor);
		const m = Month.fromDateUtc(date, stor.subarray(2, 3));
		const d = Day.fromDateUtc(date, stor.subarray(3, 4));
		//NOTE: We could see if date.getTimezoneOffset() is zero and auto detect isUtc
		// but we want the dev to be explicit that this is a UTC number when it is
		// and not just conveniently running in the UTC timezone
		const h = Hour.fromDateUtc(date, stor.subarray(4, 5));
		const i = Minute.fromDateUtc(date, stor.subarray(5, 6));
		const s = Second.fromDateUtc(date, stor.subarray(6, 7));
		const us = Microsecond.fromDateUtc(date, stor.subarray(7));
		const utc = UtcOrNot.new(true, stor.subarray(10));
		return new DateTime(y, m, d, h, i, s, us, utc);
	}

	/**
	 * Create a date-time from float seconds since UNIX epoch aka unix time
	 *
	 * @param source Unix time at second accuracy, may include floating point (for higher resolution)
	 * @param [isUtc=true] Unix time is always UTC, however you may wish to override this marker
	 * if you've adjusted for local
	 */
	public static fromUnixTime(
		source: number,
		isUtc = true,
		storage?: Uint8Array
	): DateTime {
		const stor = self.setupStor(storage);

		//Use Date's builtin to convert ymd part
		const date = new Date(source * 1000);
		const y = Year.fromDateUtc(date, stor);
		const m = Month.fromDateUtc(date, stor.subarray(2, 3));
		const d = Day.fromDateUtc(date, stor.subarray(3, 4));

		//The rest can come from fromUnixTime
		const h = Hour.fromUnixTime(source, stor.subarray(4, 5));
		const i = Minute.fromUnixTime(source, stor.subarray(5, 6));
		const s = Second.fromUnixTime(source, stor.subarray(6, 7));
		const us = Microsecond.fromUnixTime(source, stor.subarray(7));
		const utc = UtcOrNot.new(isUtc, stor.subarray(10));
		return new DateTime(y, m, d, h, i, s, us, utc);
	}

	/**
	 * Create a date-time from float milliseconds since UNIX epoch aka unix time
	 *
	 * @param source Unix time at millisecond accuracy, may include floating point (for higher resolution)
	 * @param [isUtc=true] Unix time is always UTC, however you may wish to override this marker
	 * if you've adjusted for local
	 */
	public static fromUnixTimeMs(
		source: number,
		isUtc = true,
		storage?: Uint8Array
	): DateTime {
		const stor = self.setupStor(storage);

		//Use Date's builtin to convert ymd part, note we generate from source so
		// the timezone offset *at that point in time* is used (if we construct without params we'll
		// get today's date which may have a different offset due to DST/rule changes etc)
		const date = new Date(source);
		const y = Year.fromDateUtc(date, stor);
		const m = Month.fromDateUtc(date, stor.subarray(2, 3));
		const d = Day.fromDateUtc(date, stor.subarray(3, 4));

		//The rest can come from fromUnixTime
		const h = Hour.fromUnixTimeMs(source, stor.subarray(4, 5));
		const i = Minute.fromUnixTimeMs(source, stor.subarray(5, 6));
		const s = Second.fromUnixTimeMs(source, stor.subarray(6, 7));
		const us = Microsecond.fromUnixTimeMs(source, stor.subarray(7));
		const utc = UtcOrNot.new(isUtc, stor.subarray(10));
		return new DateTime(y, m, d, h, i, s, us, utc);
	}

	/** Create this date-time (local) */
	public static now(storage?: Uint8Array): DateTime {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const utcNow = performance.timeOrigin + performance.now();
		//Calculate the offset to get it in local time
		const utcDt = new Date(utcNow);
		const offset = utcDt.getTimezoneOffset() * 60 * 1000;
		//We've double-created date objects (once for utcDate and again in fromUnixTimeMs), but
		// we need that safety for using .now at the end of the year in a timezone that isn't UTC
		return self.fromUnixTimeMs(utcNow - offset, false, storage);
	}

	/** Create this date-time (UTC) */
	public static nowUtc(storage?: Uint8Array): DateTime {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const utcNow = performance.timeOrigin + performance.now();
		return self.fromUnixTimeMs(utcNow, true, storage);
	}

	public static deserialize(source: BitReader, storage?: Uint8Array): DateTime {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const y = Year.deserialize(source, stor);
		const m = Month.deserialize(source, stor.subarray(2, 3));
		const d = Day.deserialize(source, stor.subarray(3, 4));

		const h = Hour.deserialize(source, stor.subarray(4, 5));
		const i = Minute.deserialize(source, stor.subarray(5, 6));
		const s = Second.deserialize(source, stor.subarray(6, 7));
		const us = Microsecond.deserialize(source, stor.subarray(7));
		const utc = UtcOrNot.deserialize(source, stor.subarray(10));
		return new DateTime(y, m, d, h, i, s, us, utc);
	}
}
const self = DateTime;
