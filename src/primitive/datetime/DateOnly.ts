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

/**
 * Date down to day resolution (no time component)
 *
 * Range: -10000-01-01 - +22767-12-31
 */
export class DateOnly implements ISerializer {
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
	 * Output as a JS `Date` object (in UTC, hour and smaller units zeroed)
	 * 
	 * Because JS Date includes a time element, there can be some unexpected side effects with
	 * date-math. (eg when crossing daylight savings time boundaries). 
	 */
	toDate():Date {
		return new Date(Date.UTC(this.year.valueOf(),this.month.valueOf()-1,this.day.valueOf()));
	}

	/** Seconds since the Unix epoch aka unix time (hour and smaller units zeroed) */
	toUnixTime():number {
		return Date.UTC(this.year.valueOf(),this.month.valueOf()-1,this.day.valueOf())/1000;
	}

	/** Milliseconds since the Unix epoch aka unix time (hour and smaller units zeroed, compatible with `Date` constructor) */
	toUnixTimeMs():number {
		return Date.UTC(this.year.valueOf(),this.month.valueOf()-1,this.day.valueOf());
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
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const y = Year.fromDate(date, stor);
		const m = Month.fromDate(date, stor.subarray(2, 3));
		const d = Day.fromDate(date, stor.subarray(3, 4));
		return new DateOnly(y, m, d);
	}

	/**
	 * Create a date from a js Date object in UTC
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): DateOnly {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const y = Year.fromDateUtc(date, stor);
		const m = Month.fromDateUtc(date, stor.subarray(2, 3));
		const d = Day.fromDateUtc(date, stor.subarray(3, 4));
		return new DateOnly(y, m, d);
	}

	/**
	 * Create a date from float seconds since UNIX epoch aka unix time
	 * *NOTE*: Unix time is always in UTC, depending on your timezone this may differ from local
	 * */
	public static fromUnixTime(source: number, storage?: Uint8Array): DateOnly {
		//No need to reinvent the wheel, use Date's built in converter
		const date = new Date(source * 1000);
		return self.fromDateUtc(date, storage);
	}

	/**
	 * Create a date from float milliseconds since UNIX epoch aka unix time
	 * *NOTE*: Unix time is always in UTC, depending on your timezone this may differ from local
	 */
	public static fromUnixTimeMs(source: number, storage?: Uint8Array): DateOnly {
		//No need to reinvent the wheel, use Date's built in converter
		const date = new Date(source);
		return self.fromDateUtc(date, storage);
	}

	//public static parse(str: string, storage?: Uint8Array): DateOnly {}

	/** Create this date (local) */
	public static now(storage?: Uint8Array): DateOnly {
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const n = new Date();
		return self.fromDate(n, storage);
	}

	/** Create this date (UTC) */
	public static nowUtc(storage?: Uint8Array): DateOnly {
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const n = new Date();
		return self.fromDateUtc(n, storage);
	}

	public static deserialize(source: BitReader, storage?: Uint8Array): DateOnly {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const y = Year.deserialize(source, stor);
		const m = Month.deserialize(source, stor.subarray(2, 3));
		const d = Day.deserialize(source, stor.subarray(3, 4));
		return new DateOnly(y, m, d);
	}
}
const self = DateOnly;
