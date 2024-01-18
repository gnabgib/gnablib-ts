/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { Hour } from './Hour.js';
import { Minute } from './Minute.js';
import { Second } from './Second.js';
import { Microsecond } from './Microsecond.js';
import { UtcOrNot } from './UtcOrNot.js';

//We don't export this, because we don't want external parties providing storage, it's for internal
// use only :D
const u8MemSize = 7;

/**
 * Time of day in microsecond resolution (h:m:s.uuuuuu)
 * Range 0:0:0.000000 - 23:59:59.999999 (no leap second support)
 */
export class TimeOnly {
	static readonly serialBits = 38;

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
        readonly isUtc:UtcOrNot
	) {}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted time: hh:mm:ss.mmmmmm(z) (all zero padded)
	 */
	public toString(): string {
		return (
			this.hour.toIsoString() +
			':' +
			this.minute.toIsoString() +
			':' +
			this.second.toIsoString() +
			'.' +
			this.microsecond.toIsoString() +
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
		return this;
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
        isUtc:boolean,
		storage?: Uint8Array
	): TimeOnly {
		//Keep the memory contiguous
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		const h = Hour.new(hour, storage);
		const m = Minute.new(minute, storage.subarray(1, 2));
		const s = Second.new(second, storage.subarray(2, 3));
		const us = Microsecond.new(microsecond, storage.subarray(3));
        const utc=UtcOrNot.new(isUtc,storage.subarray(6));
		return new TimeOnly(h, m, s, us,utc);
	}

	/**
	 * Create a time from a js Date object, will be missing microseconds (date only supports milliseconds)
	 * Only use this if you /have/ to
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, isUtc=false, storage?: Uint8Array): TimeOnly {
		//Keep the memory contiguous
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		const h = Hour.new(date.getHours(), storage);
		const m = Minute.new(date.getMinutes(), storage.subarray(1, 2));
		const s = Second.new(date.getSeconds(), storage.subarray(2, 3));
		const us = Microsecond.new(
			date.getMilliseconds() * 1000,
			storage.subarray(3)
		);
        const utc=UtcOrNot.new(isUtc,storage.subarray(6));
		return new TimeOnly(h, m, s, us,utc);
	}

	/**
	 * Create a time from a number representing microseconds since unix-epoch
	 * (Date uses this internally, as does performance)
	 * @param ms Value used as source
	 */
	public static fromMicrosecondsFloat(
		ms: number,
        isUtc=false,
		storage?: Uint8Array
	): TimeOnly {
		//Keep the memory contiguous
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		const date = new Date(ms);
		const h = Hour.new(date.getHours(), storage);
		const m = Minute.new(date.getMinutes(), storage.subarray(1, 2));
		const s = Second.new(date.getSeconds(), storage.subarray(2, 3));
		const us = Microsecond.new(((ms % 1000) * 1000) | 0, storage.subarray(3));
        const utc=UtcOrNot.new(isUtc,storage.subarray(6));
		return new TimeOnly(h, m, s, us,utc);
	}

	/** Create time from this point in (local) time */
	public static now(storage?: Uint8Array): TimeOnly {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const now = performance.timeOrigin + performance.now();
		return this.fromMicrosecondsFloat(now, false, storage);
	}

	/** Create time from this point in UTC time */
	public static nowUtc(storage?: Uint8Array): TimeOnly {
		let now = performance.timeOrigin + performance.now();
		let dt = new Date(now);
		now += dt.getTimezoneOffset() * 60 * 1000;
		return this.fromMicrosecondsFloat(now, true, storage);
	}

	public static deserialize(source: BitReader, storage?: Uint8Array): TimeOnly {
		//Keep the memory contiguous
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		const h = Hour.deserialize(source, storage);
		const m = Minute.deserialize(source, storage.subarray(1, 2));
		const s = Second.deserialize(source, storage.subarray(2, 3));
		const us = Microsecond.deserialize(source, storage.subarray(3));
        const utc=UtcOrNot.deserialize(source,storage.subarray(6));
		return new TimeOnly(h, m, s, us, utc);
	}
}
