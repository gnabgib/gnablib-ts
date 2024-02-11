/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ISerializer } from '../interfaces/ISerializer.js';
import { DateOnly } from './DateOnly.js';
import { TimeOnly } from './TimeOnly.js';
import { WindowStr } from '../WindowStr.js';
import { ContentError } from '../error/ContentError.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'DateTime';
const msPerMin = 60 * 1000;

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
	get year(): number {
		return this.date.year;
	}
	/** Months (1-12) */
	get month(): number {
		return this.date.month;
	}
	/** Days (1-31) */
	get day(): number {
		return this.date.day;
	}
	/** Hours (0-23) */
	get hour(): number {
		return this.time.hour;
	}
	/** Minutes (0-59) */
	get minute(): number {
		return this.time.minute;
	}
	/** Seconds (0-59) */
	get second(): number {
		return this.time.second;
	}
	/** Microseconds (0-999999) */
	get microsecond(): number {
		return this.time.microsecond;
	}
	/** In UTC or not */
	get isUtc(): boolean {
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
			this.date.year,
			/*fucks sake JS*/ this.date.month - 1,
			this.date.day,
			this.time.hour,
			this.time.minute,
			this.time.second,
			this.time.microsecond / 1000
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
		return this.date.toString('') + this.time.toString(false);
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
		return DateTime.fromUnixTimeMs(us / 1000, this.time.isUtc, storage);
	}

	/**
	 * Convert into UTC.  Assumes the difference between local and UTC is the same as
	 * **this machine**.  If current value is UTC then a clone is returned with the same value.
	 * @param storage
	 * @pure
	 */
	public asUtc(storage?: Uint8Array): DateTime {
		let unixMs = this.toUnixTimeMs();
		if (!this.time.isUtc) {
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
		if (this.time.isUtc) {
			const dt = new Date(unixMs);
			unixMs -= dt.getTimezoneOffset() * msPerMin;
		}
		return DateTime.fromUnixTimeMs(unixMs, false, storage);
	}

	/** {@inheritdoc primitive.datetime.DateOnly.add} */
	public add(y: number, m = 0, storage?: Uint8Array): DateTime {
		const stor = self.setupStor(storage);
		const d = this.date.add(y, m, stor);
		const t = this.time.cloneTo(stor.subarray(4));
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
		const stor = self.setupStor(storage);
		//last 12 are time
		const dPart = v.substring(0, v.length - 12);
		const tPart = v.substring(v.length - 12);
		const d = DateOnly.fromValue(+dPart, stor);
		const t = TimeOnly.fromValue(+tPart, false, stor.subarray(4));
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

	public static parse(
		input: WindowStr,
		strict = false,
		storage?: Uint8Array
	): DateTime {
		const stor = self.setupStor(storage);
		input.trimStart();

		//If content starts with "now" and optionally followed by whitespace - run now macro
		if (input.test(/^now\s*$/i)) {
			input.shrink(3);
			return self.now(stor);
		}

		//If it's 20-21 digits, with optional leading sign, tailing z assume it's an undelimitered dateTime
		const r = input.match(/^([-+]?\d{8,9})\d{12}[Zz]?\s*$/);
		if (r !== null) {
			const [, dt] = r;
			//console.log(dt);
			const ret = new DateTime(
				DateOnly.parse(input.span(0, dt.length), strict, stor),
				TimeOnly.parse(input.span(dt.length), strict, stor.subarray(4))
			);
			input.shrink(input.length);
			return ret;
		}

		const tPos = input.indexOfAny(['t', 'T']);
		if (tPos > 0) {
			//console.log(`t=${input.span(tPos+1)}`);
			const ret = new DateTime(
				DateOnly.parse(input.span(0, tPos), strict, stor),
				TimeOnly.parse(input.span(tPos + 1), strict, stor.subarray(4))
			);
			input.shrink(input.length);
			return ret;
		}

		throw new ContentError(
			`Expecting yyyy-mm-ddThh:mm:ss.uuuuuuZ or a 20-21 digit date with optional sign/trailing z`,
			'datetime',
			input
		);
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
const min = DateTime.new(-10000, 1, 1, 0, 0, 0, 0);
const max = DateTime.new(22767, 12, 31, 23, 59, 59, 999999);
