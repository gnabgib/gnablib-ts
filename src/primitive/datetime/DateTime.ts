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
import { DateOnly } from './DateOnly.js';
import { TimeOnly } from './TimeOnly.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'DateTime';
const msPerMin = 60 * 1000;

let min: DateTime;
let max: DateTime;

/**
 * Date and time down to microsecond resolution
 * Range: -10000-01-01 00:00:00.000000 - +22767-12-31 23:59:59.999999 (no leap second support)
 *
 * *Note*: This is higher resolution than [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 */
export class DateTime implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = DateOnly.storageBytes + TimeOnly.storageBytes; //11
	/**Number of bits required to serialize this data */
	static readonly serialBits = DateOnly.serialBits + TimeOnly.serialBits; //62

	private constructor(
		/** Date [-10000-01-01 - +22767-12-31] */
		readonly date: DateOnly,
		/** Time [00:00:00.000000 - 23:59:59.999999] */
		readonly time: TimeOnly
	) {}

	/** Minimum dateTime = -10000-01-01 00:00:00.000000 */
	static get min(): DateTime {
		return min;
	}
	/** Maximum date =  +22767-12-31 23:59:59.999999 */
	static get max(): DateTime {
		return max;
	}

	/** Years (-10000 - +22767) ISO8601 */
	get year(): Year {
		return this.date.year;
	}
	/** Months (1-12) */
	get month(): Month {
		return this.date.month;
	}
	/** Days (1-31) */
	get day(): Day {
		return this.date.day;
	}
	/** Hours (0-23) */
	get hour(): Hour {
		return this.time.hour;
	}
	/** Minutes (0-59) */
	get minute(): Minute {
		return this.time.minute;
	}
	/** Seconds (0-59) */
	get second(): Second {
		return this.time.second;
	}
	/** Microseconds (0-999999) */
	get microsecond(): Microsecond {
		return this.time.microsecond;
	}
	/** In UTC or not */
	get isUtc(): UtcOrNot {
		return this.time.isUtc;
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date-time: yyyy-mm-ddThh:mm:ss.mmmmmm(z)
	 */
	public toString(dateTimeSep = 'T'): string {
		return this.date.toString() + dateTimeSep + this.time.toString();
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
	 * Output as a JS `Date` object (in UTC)
	 *
	 * *Note*: `Date` only supports millisecond resolution so accuracy will be lost
	 */
	toDate(): Date {
		return new Date(
			this.date.year.valueOf(),
			/*fucks sake JS*/ this.date.month.valueOf() - 1,
			this.date.day.valueOf(),
			this.time.hour.valueOf(),
			this.time.minute.valueOf(),
			this.time.second.valueOf(),
			this.time.microsecond.toMillisecond()
		);
	}

	/** Seconds since the Unix epoch aka unix time */
	toUnixTime(): number {
		return this.date.toUnixTime() + this.time.toSeconds();
	}

	/** Milliseconds since the Unix epoch aka unix time (compatible with `Date` constructor) */
	toUnixTimeMs(): number {
		return this.date.toUnixTimeMs() + this.time.toMilliseconds();
	}

	/**
	 * String datetime, without separators
	 * NOTE there are gaps in valid values, but you can do < > = comparisons
	 * NOTE Utc indicator is not included in this value
	 */
	public valueOf(): string {
		return (
			this.date.year.toIsoString() +
			this.date.month.toIsoString() +
			this.date.day.toIsoString() +
			this.time.hour.toIsoString() +
			this.time.minute.toPadString() +
			this.time.second.toPadString() +
			this.time.microsecond.toPadString()
		);
	}

	/** Serialize into target*/
	public serialize(target: BitWriter): void {
		this.date.serialize(target);
		this.time.serialize(target);
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
	public validate(): DateTime {
		this.date.validate();
		this.time.validate();
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

	public addSafe(
		v: { d?: number; h?: number; m?: number; s?: number; us?: number },
		storage?: Uint8Array
	): DateTime {
		let us = this.date.toUnixTimeMs() * 1000 + this.time.toMicroseconds();
		if (v.d) us += v.d * DateOnly.usPerDay;
		if (v.h) us += v.h * TimeOnly.usPerHour;
		if (v.m) us += v.m * TimeOnly.usPerMin;
		if (v.s) us += v.s * TimeOnly.usPerSec;
		if (v.us) us += v.us;
		return DateTime.fromUnixTimeMs(us / 1000, this.isUtc.valueBool(), storage);
	}

	/**
	 * Convert into UTC.  Assumes the difference between local and UTC is the same as
	 * **this machine**.  If current value is UTC then a clone is returned with the same value.
	 * @param storage
	 * @pure
	 */
	public asUtc(storage?: Uint8Array): DateTime {
		let unixMs = this.toUnixTimeMs();
		if (!this.time.isUtc.valueBool()) {
			const dt = new Date(unixMs);
			unixMs += dt.getTimezoneOffset() * msPerMin;
		}
		return DateTime.fromUnixTimeMs(unixMs, true, storage);
	}

	/**
	 * Convert into local.  Assumes the difference between local and UTC is hte same as
	 * **this machine**.  If current value isn't UTC, it's assumed correct and a clone is returned.
	 * @param storage
	 * @pure
	 */
	public asLocal(storage?: Uint8Array): DateTime {
		let unixMs = this.toUnixTimeMs();
		if (this.time.isUtc.valueBool()) {
			const dt = new Date(unixMs);
			unixMs -= dt.getTimezoneOffset() * msPerMin;
		}
		return DateTime.fromUnixTimeMs(unixMs, false, storage);
	}

	/** {@inheritdoc primitive.datetime.DateOnly.add} */
	public add(y: number, m = 0, storage?: Uint8Array): DateTime {
		const stor = self.setupStor(storage);
		const d = this.date.add(y, m, stor);
		const t = this.time.clone(stor.subarray(4));
		return new DateTime(d, t);
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
		const d = DateOnly.new(year, month, day, stor);
		const t = TimeOnly.new(
			hour,
			minute,
			second,
			microsecond,
			isUtc,
			stor.subarray(4)
		);
		return new DateTime(d, t);
	}

	public static fromValue(v: string, storage?: Uint8Array): DateTime {
		//last 12 are time
		const dPart = v.substring(0, v.length - 12);
		const tPart = v.substring(v.length - 12);
		const d = DateOnly.fromValue(+dPart);
		const t = TimeOnly.fromValue(+tPart);
		return new DateTime(d, t);
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
		const dms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		return self.fromUnixTimeMs(dms, isUtc, storage);
	}

	/**
	 * Create a time from a js Date object in UTC
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): DateTime {
		return self.fromUnixTimeMs(date.valueOf(), true, storage);
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
		const d = DateOnly.fromUnixTime(source, stor);
		const t = TimeOnly.fromUnixTime(source, isUtc, stor.subarray(4));
		return new DateTime(d, t);
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
		const d = DateOnly.fromUnixTimeMs(source, stor);
		const t = TimeOnly.fromUnixTimeMs(source, isUtc, stor.subarray(4));
		return new DateTime(d, t);
	}

	/** Create this date-time (local) */
	public static now(storage?: Uint8Array): DateTime {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const utcNow = performance.timeOrigin + performance.now();
		//Calculate the offset to get it in local time
		const utcDt = new Date(utcNow);
		const offset = utcDt.getTimezoneOffset() * msPerMin;
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
		const d = DateOnly.deserialize(source, stor);
		const t = TimeOnly.deserialize(source, stor.subarray(4));
		return new DateTime(d, t);
	}
}
const self = DateTime;
min = DateTime.new(-10000, 1, 1, 0, 0, 0, 0);
max = DateTime.new(22767, 12, 31, 23, 59, 59, 999999);
