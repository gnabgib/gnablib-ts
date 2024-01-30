/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { Hour } from './Hour.js';
import { Minute } from './Minute.js';
import { Second } from './Second.js';
import { Microsecond } from './Microsecond.js';
import { UtcOrNot } from './UtcOrNot.js';

/**
 * Time of day in microsecond resolution (hh:mm:ss.uuuuuu)
 * Range 00:00:00.000000 - 23:59:59.999999 (no leap second support)
 */
export class TimeOnly {
	/**Number of bytes required to store this data */
	static readonly storageBytes =
		Hour.storageBytes +
		Minute.storageBytes +
		Second.storageBytes +
		Microsecond.storageBytes +
		UtcOrNot.storageBytes; //7
	/**Number of bits required to serialize this data */
	static readonly serialBits =
		Hour.serialBits +
		Minute.serialBits +
		Second.serialBits +
		Microsecond.serialBits +
		UtcOrNot.serialBits; // 38

	private constructor(
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
	 * formatted time: hh:mm:ss.mmmmmm(z) (all zero padded)
	 */
	public toString(): string {
		return (
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
	 * Numeric time, base 10 shifted: 000000000000 - 235959999999
	 * 2^38 so safe in JS as a number
	 * NOTE there are gaps in valid values 240000000000, 236000000000, etc
	 * But you can do <, >, = comparisons
	 * NOTE: Utc indicator is not included in this value
	 */
	public valueOf(): number {
		return (
			this.hour.valueOf() * 10000000000 +
			this.minute.valueOf() * 100000000 +
			this.second.valueOf() * 1000000 +
			this.microsecond.valueOf()
		);
	}

	/** Serialize into target  - 38 bits*/
	public serialize(target: BitWriter): void {
		this.hour.serialize(target);
		this.minute.serialize(target);
		this.second.serialize(target);
		this.microsecond.serialize(target);
		this.isUtc.serialize(target);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): TimeOnly {
		this.hour.validate();
		this.minute.validate();
		this.second.validate();
		this.microsecond.validate();
		//no validate for isUtc
		return this;
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.lengthAtLeast('storage', storage, self.storageBytes);
		return storage;
	}

	/**
	 * Create a new time
	 * @param hour 0-23
	 * @param minute 0-59
	 * @param second 0-59
	 * @param microsecond 0-999999
	 */
	public static new(
		hour: number,
		minute: number,
		second: number,
		microsecond: number,
		isUtc = false,
		storage?: Uint8Array
	): TimeOnly {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const h = Hour.new(hour, stor);
		const m = Minute.new(minute, stor.subarray(1, 2));
		const s = Second.new(second, stor.subarray(2, 3));
		const us = Microsecond.new(microsecond, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
	}

	/**
	 * Create a time from a js Date object
	 * WARNING: Date only has millisecond accuracy, use .now() instead
	 * @param date Value used as source
	 */
	public static fromDate(
		date: Date,
		isUtc = false,
		storage?: Uint8Array
	): TimeOnly {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		//NOTE: We could see if date.getTimezoneOffset() is zero and auto detect isUtc
		// but we want the dev to be explicit that this is a UTC number when it is
		// and not just conveniently running in the UTC timezone
		const h = Hour.fromDate(date, stor);
		const m = Minute.fromDate(date, stor.subarray(1, 2));
		const s = Second.fromDate(date, stor.subarray(2, 3));
		const us = Microsecond.fromDate(date, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
	}

	/** Create a time from float seconds since UNIX epoch aka unix time */
	public static fromUnixTime(
		source: number,
		isUtc = false,
		storage?: Uint8Array
	): TimeOnly {
		const stor = self.setupStor(storage);
		//Correct into local time if !isUtc
		if (!isUtc) {
			const n=new Date();
			source -= n.getTimezoneOffset()*60;
		}
		const h = Hour.fromUnixTime(source, stor);
		const m = Minute.fromUnixTime(source, stor.subarray(1, 2));
		const s = Second.fromUnixTime(source, stor.subarray(2, 3));
		const us = Microsecond.fromUnixTime(source, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
	}

	/** Create a time from float milliseconds since UNIX epoch aka unixtime
	 * 
	 * **Note** also the numeric content of the js `Date` object
	 */
	public static fromUnixTimeMs(
		source: number,
		isUtc = false,
		storage?: Uint8Array
	): TimeOnly {
		const stor = self.setupStor(storage);
		//Correct into local time if !isUtc
		if (!isUtc) {
			const n=new Date();
			source -= n.getTimezoneOffset()*60*1000;
		}
		const h = Hour.fromUnixTimeMs(source, stor);
		const m = Minute.fromUnixTimeMs(source, stor.subarray(1, 2));
		const s = Second.fromUnixTimeMs(source, stor.subarray(2, 3));
		const us = Microsecond.fromUnixTimeMs(source, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
	}

	/** Create time from this point in (local) time */
	public static now(storage?: Uint8Array): TimeOnly {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const now = performance.timeOrigin + performance.now();
		return self.fromUnixTimeMs(now, false, storage);
	}

	/** Create time from this point in UTC time */
	public static nowUtc(storage?: Uint8Array): TimeOnly {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const now = performance.timeOrigin + performance.now();
		return self.fromUnixTimeMs(now, true, storage);
	}

	/**
	 * Deserialize next 38 bits into time
	 * Throws if:
	 * - There's not 38 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): TimeOnly {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const h = Hour.deserialize(source, stor);
		const m = Minute.deserialize(source, stor.subarray(1, 2));
		const s = Second.deserialize(source, stor.subarray(2, 3));
		const us = Microsecond.deserialize(source, stor.subarray(3));
		const utc = UtcOrNot.deserialize(source, stor.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
	}
}
const self = TimeOnly;
