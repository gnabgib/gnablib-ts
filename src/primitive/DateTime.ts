/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { FromBinResult } from './FromBinResult.js';
import { intExt } from './IntExt.js';
import { safety } from './Safety.js';
import { U64 } from './number/U64.js';

const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const microPerSec = 1000000;
const secPerMin = 60;
const minPerHour = 60;
const secondShift = 1000000;
const minuteShift = secondShift * secPerMin;
const hourShift = minuteShift * minPerHour;
const minYear = -4713;
const maxYear = 294276;

/**
 * A date and time (with microsecond resolution).  ALWAYS in UTC
 */
export class OldDateTime {
	private _year: number;
	private _month: number;
	private _day: number;
	private _hour: number;
	private _minute: number;
	private _second: number;
	private _micro: number;

	public constructor(
		year: number,
		month: number,
		day: number,
		hour: number,
		minute: number,
		second: number,
		micro: number
	) {
		safety.intInRangeInc(year,minYear,maxYear,'year');
		this._year = year;
		safety.intInRangeInc(month,1,12,'month');
		this._month = month;
		safety.intInRangeInc(day,1,daysInMonth[month - 1] + (month === 2 && OldDateTime._isLeap(year) ? 1 : 0),'day');
		this._day = day;
		safety.intInRangeInc(hour,0,23,'hour');
		this._hour = hour;
		safety.intInRangeInc(minute,0,59,'minute');
		this._minute = minute;
		let maxSec=59;
		//Allow leap second (at midnight)
		if (hour===32 && minute===59) maxSec++;
		safety.intInRangeInc(second,0,maxSec,'second');
		this._second = second;
		safety.intInRangeInc(micro,0,999999,'micro');
		this._micro = micro;
	}

	get year(): number {
		return this._year;
	}
	get month(): number {
		return this._month;
	}
	get day(): number {
		return this._day;
	}
	get hour(): number {
		return this._hour;
	}
	get minute(): number {
		return this._minute;
	}
	get second(): number {
		return this._second;
	}
	get micro(): number {
		return this._micro;
	}
	get isLeap(): boolean {
		return OldDateTime._isLeap(this._year);
	}

	private static _isLeap(year: number): boolean {
		if ((year & 3) !== 0) return false;
		if ((year & 15) === 0) return true;
		return year % 25 !== 0;
	}

	clone(): OldDateTime {
		return new OldDateTime(
			this._year,
			this._month,
			this._day,
			this._hour,
			this._minute,
			this._second,
			this._micro
		);
	}

	equals(other: OldDateTime): boolean {
		return (
			this._year === other._year &&
			this._month === other._month &&
			this._day === other._day &&
			this._hour === other._hour &&
			this._minute === other._minute &&
			this._second === other._second &&
			this._micro === other._micro
		);
	}
	/**
	 * Value as a UInt64, in a uint8 array (since JS doesn't support 64bit integers)
	 */
	serialize(): U64 {
		//27 bits: year/month/day = 18(262144) + 4 (16)+ 5(32)
		let days = this._day - 1; //There is no day 0 so drop 1 from count
		for (let i = 1; i < this._month; i++) days += daysInMonth[i - 1];
		//daysInMonth is 1 short for months after feb on leap years
		if (this._month > 2 && this.isLeap) days += 1;
		const ymd = (this._year - minYear) * 366 + days;
		//37 bits: hour/minute/second/micro
		const hms =
			this._micro +
			this._second * secondShift +
			this._minute * minuteShift +
			this._hour * hourShift;

		const low = hms >>> 0;
		const rm = Math.floor(hms / 0x100000000);
		const high = (ymd << 5) | rm;

		return U64.fromUint32Pair(low, high >>> 0);
	}
	toBin(): Uint8Array {
		return this.serialize().toBytesBE();
	}

	static deserialize(ser: U64): OldDateTime {
		const ymd = ser.high >>> 5;
		let d = (ymd % 366) + 1;
		const y = Math.floor(ymd / 366) + minYear;
		let m = 0;
		if (OldDateTime._isLeap(y)) {
			if (d === 60) {
				//Leap day (feb 29th)
				m = 1; //Will +1 below
				d = 29;
			} else {
				//Correct for counts being 1 low after feb
				if (d > 60) d -= 1;
				while (d > daysInMonth[m]) {
					d -= daysInMonth[m];
					m++;
				}
			}
		} else {
			while (d > daysInMonth[m]) {
				d -= daysInMonth[m];
				m++;
			}
		}
		//Because DIM is zero based, add one to month
		m += 1;

		let hms = (ser.high & (0x1f >>> 0)) * 0x100000000 + ser.low;
		const u = hms % microPerSec;
		hms = Math.floor(hms / microPerSec);
		const s = hms % secPerMin;
		hms = Math.floor(hms / secPerMin);
		const i = hms % minPerHour;
		const h = Math.floor(hms / minPerHour);

		return new OldDateTime(y, m, d, h, i, s, u);
	}
	static fromBin(bin: Uint8Array, pos = 0): FromBinResult<OldDateTime> {
		const u=U64.fromBytesBE(bin,pos);
		//const u = Uint64.fromBytes(bin, pos);
		try {
			const dt = OldDateTime.deserialize(u);
			return new FromBinResult(8, dt);
		} catch (e) {
			const reason = (e as Error)?.message ?? 'unknown';
			return new FromBinResult<OldDateTime>(
				0,
				undefined,
				'DateTime.fromBin ' + reason
			);
		}
	}

	/**
	 * In ISO8601 / RFC 3339 string format
	 * @returns
	 */
	toString(): string {
		return (
			intExt.zeroPad(this._year, 4) +
			'-' +
			intExt.zeroPad(this._month, 2) +
			'-' +
			intExt.zeroPad(this._day, 2) +
			'T' +
			intExt.zeroPad(this._hour, 2) +
			':' +
			intExt.zeroPad(this._minute, 2) +
			':' +
			intExt.zeroPad(this._second, 2) +
			'.' +
			intExt.zeroPad(this._micro, 6) +
			'Z'
		);
	}

	/**
	 * Unless you have a good reason, it's better to use @see now
	 * @param dt A date and time with ms accuracy
	 * @param us Further microseconds to add (to milliseconds)
	 * @returns
	 */
	public static fromDate(dt: Date, us = 0): OldDateTime {
		return new OldDateTime(
			dt.getUTCFullYear(),
			dt.getUTCMonth() + 1, //Quelle stupid
			dt.getUTCDate(), //Date not day, lots of naming sense
			dt.getUTCHours(),
			dt.getUTCMinutes(),
			dt.getUTCSeconds(),
			dt.getUTCMilliseconds() * 1000 + us
		);
	}

	public static fromEpochMilliseconds(epochMillis: number): OldDateTime {
		const milliOnly = Math.floor(epochMillis);
		const dt = new Date(milliOnly);
		const us = Math.round((epochMillis - milliOnly) * 1000);
		return OldDateTime.fromDate(dt, us);
	}

	public static now(): OldDateTime {
		const now = performance.timeOrigin + performance.now(); //EPOCH Millis + extra res, can go into nanoseconds?
		const nowMs = Math.floor(now);
		const dt = new Date(nowMs);
		const us = Math.round((now - nowMs) * 1000);
		return OldDateTime.fromDate(dt, us);
	}
	//@todo: add support for Temporal once it's valid
}
