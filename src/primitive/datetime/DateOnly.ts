/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { stringExt } from '../StringExt.js';
import { Day } from './Day.js';
import { Month } from './Month.js';
import { Year } from './Year.js';

const u8MemSize = 4;

/** A year-month-day, in the range -10000-01-01 - +22767-12-31 */
export class DateOnly {
	static readonly serialBits = 24;
	readonly year: Year;
	readonly month: Month;
	readonly day: Day;

	private constructor(y: Year, m: Month, d: Day) {
		this.year = y;
		this.month = m;
		this.day = d;
	}

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

	public validate(): DateOnly {
		//no validate for year
		this.month.validate();
		this.day.validate();
		return this;
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
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		const u16 = new Uint16Array(storage.buffer);
		const y = Year.new(year, u16);
		const m = Month.new(month, storage.subarray(2, 3));
		const d = Day.new(day, storage.subarray(3, 4));
		return new DateOnly(y, m, d);
	}

	/**
	 * Create a date from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): DateOnly {
		//Keep the memory contiguous
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		const u16 = new Uint16Array(storage.buffer);
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const y = Year.new(date.getFullYear(), u16);
		const m = Month.new(date.getMonth() + 1, storage.subarray(2, 3));
		const d = Day.new(date.getDate(), storage.subarray(3, 4));
		return new DateOnly(y, m, d);
	}

	//
	//public static parse(str: string, storage?: Uint8Array): DateOnly {}

	/** Create this date (local) */
	public static now(storage?: Uint8Array): DateOnly {
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const n = new Date();
		return this.fromDate(n, storage);
	}

	/** Create this date (UTC) */
	public static nowUtc(storage?: Uint8Array): DateOnly {
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const n = new Date();
		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/valueOf
		//This is hackey - Date keeps UTC internally, but interprets value into local on output
		//(getters) ie. getFulLYear/getMonth/getDate are in local.
		//SO! If we add getTimezoneOffset (which is minutes) to the current time, we get the "UTC"
		// time.  Or UTC + timezone offset internally.. it's turtles all the way down
		// minutes * secPerMin * msPerSec (valueOf is in ms)
		const nUtc = new Date(n.valueOf() + n.getTimezoneOffset() * 60 * 1000);
		return this.fromDate(nUtc, storage);
		// //The alternative would be not to reuse this.fromDate:
		// const u16 = new Uint16Array(2);
		// const u8 = new Uint8Array(u16.buffer);
		// const y = Year.new(n.getUTCFullYear(), u16);
		// const m = Month.new(n.getUTCMonth() + 1, u8.subarray(2, 3));
		// const d = Day.new(n.getUTCDate(), u8.subarray(3, 4));
		// return new DateOnly(y, m, d);
	}

	public static deserialize(source: BitReader, storage?: Uint8Array): DateOnly {
		//Keep the memory contiguous
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		const u16 = new Uint16Array(storage.buffer);
		const y = Year.deserialize(source, u16);
		const m = Month.deserialize(source, storage.subarray(2, 3));
		const d = Day.deserialize(source, storage.subarray(3, 4));
		return new DateOnly(y, m, d);
	}
}
