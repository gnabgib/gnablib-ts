/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { Hour } from './Hour.js';
import { Minute } from './Minute.js';
import { Second } from './Second.js';
import { Microsecond } from './Microsecond.js';
import { UtcOrNot } from './UtcOrNot.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'TimeOnly';

/**
 * Time of day in microsecond resolution (hh:mm:ss.uuuuuu)
 * Range 00:00:00.000000 - 23:59:59.999999 (no leap second support)
 *
 * *Note*: This is higher resolution than [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 */
export class TimeOnly implements ISerializer {
	static readonly usPerSec = 1000000;
	static readonly usPerMin = 60000000;
	static readonly usPerHour = 3600000000;

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
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted time: hh:mm:ss.mmmmmm(z) (all zero padded)
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

	/** Seconds (since midnight) value can be floating point (us component)*/
	toSeconds(): number {
		return this.toMicroseconds() / 1000000;
	}

	/** Milliseconds (since midnight) value can be floating point (us component)*/
	toMilliseconds(): number {
		return this.toMicroseconds() / 1000;
	}

	/** Microseconds (since midnight) */
	toMicroseconds(): number {
		return (
			this.hour.valueOf() * self.usPerHour +
			this.minute.valueOf() * self.usPerMin +
			this.second.valueOf() * self.usPerSec +
			this.microsecond.valueOf()
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

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return self.serialBits;
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

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/**
	 * Return a copy of this time
	 * @param storage Optional memory to store the data (will be created if not provided)
	 * @pure
	 */
	public clone(storage?:Uint8Array):TimeOnly {
		const stor = self.setupStor(storage);
		const h=this.hour.clone(stor);
		const m=this.minute.clone(stor.subarray(1,2));
		const s=this.second.clone(stor.subarray(2,3));
		const us=this.microsecond.clone(stor.subarray(3));
		const utc=this.isUtc.clone(stor.subarray(6));
		return new TimeOnly(h,m,s,us,utc);
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
	 * Convert from base 10 shifted value {@link valueOf} into new TimeOnly
	 * @param v 
	 * @param [isUtc=false] By default value will be considered local, unless this is set to true
	 * @param storage 
	 * @returns 
	 */
	public static fromValue(v:number,isUtc=false,storage?:Uint8Array) :TimeOnly {
		const us=v%1000000;
		v=(v-us)/1000000;
		const s=v%100;
		v=(v-s)/100;
		const m=v%100;
		v=(v-m)/100;
		return TimeOnly.new(v,m,s,us,isUtc,storage);
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
	): TimeOnly {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		//NOTE: We could see if date.getTimezoneOffset() is zero and auto detect isUtc
		// but we want the dev to be explicit that this is a UTC number when it is
		// and not just conveniently running in the UTC timezone (or use fromUtcDate)
		const h = Hour.fromDate(date, stor);
		const m = Minute.fromDate(date, stor.subarray(1, 2));
		const s = Second.fromDate(date, stor.subarray(2, 3));
		const us = Microsecond.fromDate(date, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
	}

	/**
	 * Create a time from a js Date object in UTC
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): TimeOnly {
		//Keep the memory contiguous
		const stor = self.setupStor(storage);

		const h = Hour.fromDateUtc(date, stor);
		const m = Minute.fromDateUtc(date, stor.subarray(1, 2));
		const s = Second.fromDateUtc(date, stor.subarray(2, 3));
		const us = Microsecond.fromDateUtc(date, stor.subarray(3));
		const utc = UtcOrNot.new(true, stor.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
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
	): TimeOnly {
		const stor = self.setupStor(storage);
		const h = Hour.fromUnixTime(source, stor);
		const m = Minute.fromUnixTime(source, stor.subarray(1, 2));
		const s = Second.fromUnixTime(source, stor.subarray(2, 3));
		const us = Microsecond.fromUnixTime(source, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
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
	): TimeOnly {
		const stor = self.setupStor(storage);
		const h = Hour.fromUnixTimeMs(source, stor);
		const m = Minute.fromUnixTimeMs(source, stor.subarray(1, 2));
		const s = Second.fromUnixTimeMs(source, stor.subarray(2, 3));
		const us = Microsecond.fromUnixTimeMs(source, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
	}

	/**
	 * Create a time from microseconds since Unix epoch
	 *
	 * @param source Number of microseconds since midnight (if floating point it'll be truncated)
	 * @param [isUtc=true] Unix time is always UTC, however you may wish to override this marker
	 * if you've adjusted for local
	 */
	public static fromUnixTimeUs(
		source: number,
		isUtc = true,
		storage?: Uint8Array
	): TimeOnly {
		const stor = self.setupStor(storage);
		const h = Hour.fromUnixTimeUs(source, stor);
		const m = Minute.fromUnixTimeUs(source, stor.subarray(1, 2));
		const s = Second.fromUnixTimeUs(source, stor.subarray(2, 3));
		const us = Microsecond.fromUnixTimeUs(source, stor.subarray(3));
		const utc = UtcOrNot.new(isUtc, stor.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
	}

	/** Create time from this point in (local) time */
	public static now(storage?: Uint8Array): TimeOnly {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const utcNow = performance.timeOrigin + performance.now();
		//Calculate the offset to get it in local time
		const utcDt = new Date(utcNow);
		const offset = utcDt.getTimezoneOffset() * 60 * 1000;
		return self.fromUnixTimeMs(utcNow - offset, false, storage);
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
