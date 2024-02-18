/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { Hour } from './Hour.js';
import { Minute } from './Minute.js';
import { Second } from './Second.js';
import { Millisecond } from './Millisecond.js';
import { UtcOrNot } from './UtcOrNot.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'TimeOnlyMs';

/**
 * Time of day in millisecond resolution (h:m:s.uuuuuu)
 * Range 0:0:0.000 - 23:59:59.999 (no leap second support)
 */
export class TimeOnlyMs implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 6; //1+ 1+ 1+ 2+ 1
	/**Number of bits required to serialize this data */
	static readonly serialBits = 28; //5+ 6+ 6+ 10+ 1

	private constructor(
		/** Hours (0-23) */
		readonly hour: Hour,
		/** Minutes (0-59) */
		readonly minute: Minute,
		/** Seconds (0-59) */
		readonly second: Second,
		/** Milliseconds (0-999) */
		readonly millisecond: Millisecond,
		/** In UTC or not */
		readonly isUtc: UtcOrNot
	) {}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted time: hh:mm:ss.mmm(z) (all zero padded)
	 */
	public toString(): string {
		return (
			this.hour.toIsoString() +
			':' +
			this.minute.toPadString() +
			':' +
			this.second.toPadString() +
			'.' +
			this.millisecond.toPadString() +
			this.isUtc.toIsoString()
		);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted time: hh:mm:ss.mmm(z) (all zero padded)
	 */
	toJSON(): string {
		//JSON is supposed to be human readable, but it's often used as a data-transport between machines only.
		// Using a number (like valueOf), or encoded serialized bytes, would decrease the JSON
		// size but is no longer *human readable*.  This mistake is made in some libraries
		// serializing date and time in unix-time
		return this.toString();
	}

	//toDate makes little sense (would have to provide y/m/d)
	//toUnixTime likewise makes little sense (would always be 1970-01-01) so instead: toSeconds,
	// as in seconds since midnight
	//toUnixTimeMs likewise -> toMilliseconds (ms since midnight)

	/** Time as seconds (since midnight) value can be floating point (ms component)*/
	toSeconds(): number {
		return this.toMilliseconds() / 1000;
	}

	/** Time as milliseconds (since midnight)*/
	toMilliseconds(): number {
		const msPerSec = 1000;
		const msPerMin = 60 * msPerSec;
		const msPerHour = 60 * msPerMin;

		return (
			this.hour.valueOf() * msPerHour +
			this.minute.valueOf() * msPerMin +
			this.second.valueOf() * msPerSec +
			this.millisecond.valueOf()
		);
	}

	/**
	 * Numeric time, base 10 shifted: 000000000 - 235959999
	 * NOTE there are gaps in valid values 240000000, 236000000, etc
	 * But you can do <, >, = comparisons
	 * NOTE: Utc indicator is not included in this value
	 */
	public valueOf(): number {
		return (
			this.hour.valueOf() * 10000000 +
			this.minute.valueOf() * 100000 +
			this.second.valueOf() * 1000 +
			this.millisecond.valueOf()
		);
	}

	/** Serialize into target  - 28 bits*/
	public serialize(target: BitWriter): void {
		this.hour.serialize(target);
		this.minute.serialize(target);
		this.second.serialize(target);
		this.millisecond.serialize(target);
		this.isUtc.serialize(target);
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
	public validate(): TimeOnlyMs {
		this.hour.validate();
		this.minute.validate();
		this.second.validate();
		this.millisecond.validate();
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
		if (!storage) return new Uint8Array(this.storageBytes);
		safe.len.atLeast('storage', storage, this.storageBytes);
		return storage;
	}

	/**
	 * Create a new time
	 * @param hour 0-23
	 * @param minute 0-59
	 * @param second 0-59
	 * @param millisecond 0-999
	 */
	public static new(
		hour: number,
		minute: number,
		second: number,
		millisecond: number,
		isUtc: boolean,
		storage?: Uint8Array
	): TimeOnlyMs {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const h = Hour.new(hour, storage);
		const m = Minute.new(minute, stor.subarray(1, 2));
		const s = Second.new(second, stor.subarray(2, 3));
		const ms = Millisecond.new(millisecond, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(5));
		return new TimeOnlyMs(h, m, s, ms, utc);
	}

	/**
	 * Create a time from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(
		date: Date,
		isUtc = false,
		storage?: Uint8Array
	): TimeOnlyMs {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		//NOTE: We could see if date.getTimezoneOffset() is zero and auto detect isUtc
		// but we want the dev to be explicit that this is a UTC number when it is
		// and not just conveniently running in the UTC timezone
		const h = Hour.fromDate(date, stor);
		const m = Minute.fromDate(date, stor.subarray(1, 2));
		const s = Second.fromDate(date, stor.subarray(2, 3));
		const ms = Millisecond.fromDate(date, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(5));
		return new TimeOnlyMs(h, m, s, ms, utc);
	}

	/**
	 * Create a time from a js Date object in UTC
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): TimeOnlyMs {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const h = Hour.fromDateUtc(date, stor);
		const m = Minute.fromDateUtc(date, stor.subarray(1, 2));
		const s = Second.fromDateUtc(date, stor.subarray(2, 3));
		const ms = Millisecond.fromDateUtc(date, stor.subarray(3));
		const utc = UtcOrNot.new(true, stor.subarray(5));
		return new TimeOnlyMs(h, m, s, ms, utc);
	}

	/**
	 * Create a time from float seconds since UNIX epoch aka unix time
	 *
	 * @param source Unix time at second accuracy, may include floating point (for higher resolution)
	 * @param [isUtc=true] Unix time is always UTC, however you may wish to override this marker
	 * if you've adjusted for local
	 */
	public static fromUnixTime(
		source: number,
		isUtc = true,
		storage?: Uint8Array
	): TimeOnlyMs {
		const stor = self.setupStor(storage);
		const h = Hour.fromUnixTime(source, stor);
		const m = Minute.fromUnixTime(source, stor.subarray(1, 2));
		const s = Second.fromUnixTime(source, stor.subarray(2, 3));
		const ms = Millisecond.fromUnixTime(source, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(5));
		return new TimeOnlyMs(h, m, s, ms, utc);
	}

	/**
	 * Create a time from float milliseconds since UNIX epoch aka unix time
	 *
	 * @param source Unix time at millisecond accuracy, may include floating point (for higher resolution)
	 * @param [isUtc=true] Unix time is always UTC, however you may wish to override this marker
	 * if you've adjusted for local
	 */
	public static fromUnixTimeMs(
		source: number,
		isUtc = true,
		storage?: Uint8Array
	): TimeOnlyMs {
		const stor = self.setupStor(storage);
		const h = Hour.fromUnixTimeMs(source, stor);
		const m = Minute.fromUnixTimeMs(source, stor.subarray(1, 2));
		const s = Second.fromUnixTimeMs(source, stor.subarray(2, 3));
		const ms = Millisecond.fromUnixTimeMs(source, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(5));
		return new TimeOnlyMs(h, m, s, ms, utc);
	}

	/** Create time from this point in (local) time */
	public static now(storage?: Uint8Array): TimeOnlyMs {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const utcNow = performance.timeOrigin + performance.now();
		//Calculate the offset to get it in local time
		const utcDt = new Date(utcNow);
		const offset = utcDt.getTimezoneOffset() * 60 * 1000;
		return self.fromUnixTimeMs(utcNow - offset, false, storage);
	}

	/** Create time from this point in UTC time */
	public static nowUtc(storage?: Uint8Array): TimeOnlyMs {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const now = performance.timeOrigin + performance.now();
		return self.fromUnixTimeMs(now, true, storage);
	}

	/**
	 * Deserialize next 28 bits into time
	 * Throws if:
	 * - There's not 28 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(
		source: BitReader,
		storage?: Uint8Array
	): TimeOnlyMs {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const h = Hour.deserialize(source, stor);
		const m = Minute.deserialize(source, stor.subarray(1, 2));
		const s = Second.deserialize(source, stor.subarray(2, 3));
		const ms = Millisecond.deserialize(source, stor.subarray(3));
		const utc = UtcOrNot.deserialize(source, stor.subarray(5));
		return new TimeOnlyMs(h, m, s, ms, utc);
	}
}
const self = TimeOnlyMs;
