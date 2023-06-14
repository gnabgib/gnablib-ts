/*! Copyright 2023 gnabgib MPL-2.0 */

/* ISO8601 duration:
    - Marked by starting P
    - P[n]Y[n]M[n]DT[n]H[n]M[n]S (P[n]W not supported.. just use P[n*7]D)
    - The last N may be a decimal (can support >second, but can also support 1.5months)
    - No [n] can be negative (the whole duration maybe a measurement into the past)
    - There is no concept of normalization
        - Y can fold into M (*12)
        - H(*60) -> M(*60) -> S can fold
        - D can mostly fold into hour (*24) HOWEVER on DST dates it /cannot/
        - Because the smallest element can include a decimal aspect PT1.5H == PT90M
        - Should the entered amount be maintained, or should it auto fold? eg P90M -> PT1H30M? PT300S ->PT5M

        //Approx hours for years/months/days 
        // -Years can safely deconstruct into months (except for historical calendar changes)
        // -Months cannot deconstruct into days because of varying lengths (use avg 30.5days/mo which is NEVER the right amount, but.. averages out)
        // -Days cannot deconstruct into hours because of daylight savings (23 & 25 hour days)

 */

import { EnforceTypeError } from './ErrorExt.js';
import { safety } from './Safety.js';
import { stringExt } from './StringExt.js';

const microPerSec = 1000000;
const secPerMin = 60;
const microPerMin = secPerMin * microPerSec;
const minPerHour = 60;
// const hourPerDay = 24;
const monPerYear = 12;
// const approxDayPerMon = 30.5; //30.42, 30.5 leap

export interface DurationComponents {
	year: number; //float
	month: number; //float
	day: number; //float
	hour: number; //int
	minute: number; //int
	second: number; //int
	micro: number; //int
}

export class Duration {
	private readonly ym: number;
	private readonly d: number;
	private readonly hmsu: number;

	constructor(
		year: number,
		month = 0,
		day = 0,
		hour = 0,
		minute = 0,
		second = 0,
		micro = 0
	) {
		safety.numGte(year,0,'year');
		safety.numGte(month,0,'month');
		safety.numGte(day,0,'day');
		safety.numGte(hour,0,'hour');
		safety.numGte(minute,0,'minute');
		safety.numGte(second,0,'second');
		safety.numGte(micro,0,'micro');

		if (!Number.isInteger(micro))
			throw new EnforceTypeError('Integer micro', micro);
		if (!Number.isInteger(second) && micro > 0)
			throw new EnforceTypeError('Integer second with us defined', second);
		if (!Number.isInteger(minute) && micro + second > 0)
			throw new EnforceTypeError('Integer minute with s/us defined', minute);
		if (!Number.isInteger(hour) && micro + second + minute > 0)
			throw new EnforceTypeError('Integer hour with m/s/us defined', hour);
		if (!Number.isInteger(day) && micro + second + minute + hour > 0)
			throw new EnforceTypeError('Integer day with h/m/s/us defined', day);
		if (!Number.isInteger(month) && micro + second + minute + hour + day > 0)
			throw new EnforceTypeError(
				'Integer month with d/h/m/s/us defined',
				month
			);
		if (
			!Number.isInteger(year) &&
			micro + second + minute + hour + day + month > 0
		)
			throw new EnforceTypeError(
				'Integer year with m/d/h/m/s/us defined',
				year
			);

		this.ym = year * monPerYear + month;
		this.d = day;
		this.hmsu =
			hour * minPerHour * secPerMin * microPerSec +
			minute * secPerMin * microPerSec +
			second * microPerSec +
			micro;
	}

	get year(): number {
		return Math.floor(this.ym / monPerYear);
	}
	get month(): number {
		return this.ym % monPerYear;
	}
	get day(): number {
		return this.d;
	}
	get hour(): number {
		return Math.floor(this.hmsu / (minPerHour * secPerMin * microPerSec));
	}
	get minute(): number {
		return Math.floor(this.hmsu / microPerMin) % minPerHour;
	}
	get second(): number {
		return Math.floor(this.hmsu / microPerSec) % secPerMin;
	}
	get micro(): number {
		return this.hmsu % microPerSec;
	}
	/**
	 * Seconds with microseconds (floating point up to 6dp)
	 */
	get secondMicro(): number {
		return (this.hmsu % microPerMin) / microPerSec;
	}

	toIso8601(): string {
		let retLeft = '';
		if (this.ym > 0) {
			const m = this.month;
			const y = Math.floor((this.ym - m) / monPerYear);
			if (y > 0) retLeft += y + 'Y';
			if (m > 0) retLeft += m + 'M';
		}
		if (this.d > 0) {
			retLeft += this.d + 'D';
		}
		//retLeft+='T';
		let retRight = '';
		if (this.hmsu > 0) {
			const h = this.hour;
			const m = this.minute;
			const s = (this.hmsu % microPerMin) / microPerSec; //includes us

			if (h > 0) retRight += h + 'H';
			if (m > 0) retRight += m + 'M';
			if (s > 0) retRight += s + 'S';
		}
		if (retRight.length === 0) {
			if (retLeft.length === 0) retLeft = '0D';
		} else {
			retRight = 'T' + retRight;
		}
		return 'P' + retLeft + retRight;
	}

	/**
	 * n | n:nn | n:nn:nn | (n\y)(n\m)(n\d)n:nn:nn
	 * @see toIso8601 may be preferable
	 * @returns
	 */
	toString(): string {
		let ret = '';

		//YMD
		const moInt = this.ym % monPerYear;
		const yInt = (this.ym - moInt) / monPerYear;
		const mo = moInt > 0 ? moInt.toString() + 'm' : '';
		const y = yInt > 0 ? yInt.toString() + 'y' : '';
		const d = this.d > 0 ? this.d.toString() + 'd' : '';
		const ymd = y + mo + d;

		//HMS
		const sInt = this.secondMicro;
		let s = sInt.toString();
		const mInt = this.minute;
		let m = mInt > 0 ? mInt.toString() : '';
		const hInt = this.hour;
		const h = hInt > 0 || ymd.length > 0 ? hInt.toString() : '';

		//Figure out padding (pad if higher order exist)
		const padMin = h.length > 0 || ymd.length > 0;
		const padSec = padMin || m.length > 0;

		if (padMin) m = ':' + stringExt.padStart(m, 2, '0'); // stringExt.padStart(m,2,'0');
		if (padSec) s = ':' + stringExt.padStart(s, 2, '0');
		let hms = h + m + s;

		//Don't show null time if we
		if (hms === '0' && ymd.length > 0) hms = '';

		ret += ymd + hms;
		return ret.length > 0 ? ret : '0';
	}

	toMSString(): string {
		if (this.ym + this.d > 0)
			throw new RangeError(
				'Cannot convert years/months/days into minutes & seconds'
			);
		let hmsu = this.hmsu;
		const u = hmsu % microPerSec;
		hmsu = (hmsu - u) / microPerSec; //In s
		const s = hmsu % secPerMin;
		hmsu = (hmsu - s) / secPerMin; //In m
		const m = hmsu; //Hours stay in minute form
		let su = (s + u / 1000000).toString();
		//SU will always be at least 1 char, add a leading zero when s=0-9
		if (s < 10) su = '0' + su;

		return stringExt.padStart(m.toString(), 2, '0') + ':' + su;
	}

	toMSShiftNumber(): number {
		if (this.ym + this.d > 0)
			throw new RangeError(
				'Cannot convert years/months/days into minutes & seconds'
			);
		const m = Math.floor(this.hmsu / microPerMin); //Includes hours
		return m * 100 + this.secondMicro;
	}

	toDto(): DurationComponents {
		const mo = this.month;
		const y = (this.ym - mo) / monPerYear;
		//Bring hmsu locally and shift it's scale as we harvest values
		let hmsu = this.hmsu; //In u
		const u = hmsu % microPerSec;
		hmsu = (hmsu - u) / microPerSec; //In s
		const s = hmsu % secPerMin;
		hmsu = (hmsu - s) / secPerMin; //In m
		const mi = hmsu % minPerHour;
		const h = (hmsu - mi) / minPerHour;
		return {
			year: y,
			month: mo,
			day: this.d,
			hour: h, //int
			minute: mi, //int
			second: s, //int
			micro: u, //int
		};
	}

	/**
	 * Shift Number: Minutes and seconds written without the colon (m*ss), human readable, gaps.  Minutes
	 * can exceed 99.. 10001 is 100minutes 1 second (1h 40m 1s)
	 */
	static fromMSShiftNumber(n: number): Duration {
		const s = n % 100;
		n = (n - s) / 100;
		const m = n;
		return new Duration(0, 0, 0, 0, m, s);
	}

	/**
	 * Effectively a clone op, but can also use DurationComponents object (DTO interface @see toDto)
	 * @param d
	 * @returns
	 */
	static fromDurationComponents(d: DurationComponents | Duration): Duration {
		if (d instanceof Duration) d = d.toDto();
		return new Duration(
			d.year,
			d.month,
			d.day,
			d.hour,
			d.minute,
			d.second,
			d.micro
		);
	}
}
