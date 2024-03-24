/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { safe as safe } from '../safe/safe.js';
import { BitReader } from '../primitive/BitReader.js';
import { BitWriter } from '../primitive/BitWriter.js';
import { WindowStr } from '../primitive/WindowStr.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../primitive/interfaces/ISerializer.js';
import { parseDec } from '../primitive/number/Int.js';
import { Duration, DurationExact } from './Duration.js';
import { AtMostError } from '../error/AtMostError.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

// date: [d][m][y][Y]
// time: [u][u][U][s][i][h]
const yearBytes = 2;
const monthBytes = 1;
const dayBytes = 1;
const dateBytes = 4; //yearBytes + monthBytes + dayBytes;
const hourBytes = 1;
const minBytes = 1;
const secBytes = 1;
const milliBytes = 2;
const microBytes = 3;
const timeMsBytes = 5; //hourBytes + minBytes + secBytes + milliBytes;
const timeBytes = 6; //hourBytes + minBytes + secBytes + microBytes;
const dtBytes = 10; //dateBytes + timeBytes
const dt_to_pos = 0;
const dt_do_pos = timeBytes;

const yearSerBits = 15; //2^15 = 32767
const monthSerBits = 4; //2^4 = 16
const daySerBits = 5; //2^5 = 32
const dateSerBits = 24; //yearSerBits + monthSerBits + daySerBits
const hourSerBits = 5; //2^5 = 32
const minSerBits = 6; //2^6 = 64
const secSerBits = 6; //2^6 = 64
const milliSerBits = 10; //2^10 = 1024
const microSerBits = 20; //2^20 = 1048576
const timeSerBits = 37; //hourSerBits + minSerBits + secSerBits + microSerBits 5+6+6+20

const minIsoYear = -10000;
const maxHeYear = 32767; //0x7fff
const maxIsoYear = 22767; // 32767 - 10000

const sPerDay = 86400; //24*60*60
const sPerHour = 3600; //60*60
const msPerDay = 86400000; //24*60*60*1000
const msPerHour = 3600000; //60*60*1000
const msPerMin = 60000; //60*1000
const msPerSec = 1000;
const usPerDay = 86400000000; ////24*60*60*1000000
const usPerHour = 3600000000; //60*60*1000000
const usPerMin = 60000000; //60*1000000
const usPerSec = 1000000;

const DIM = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; //Days in month, note it's offset for 1 idx
const daysPerCD = 146097; //CD=400y (400 is CD in roman numerals)
const epochShift = 719468; //Amount of days to shift a CD segment to make the epoch 0
const LE = true; //littleEndian (in DataView, which most platforms are, so beneficial)

function rYear(d: DataView, p: number): number {
	return d.getUint16(p, LE) - 10000;
}
function wYear(d: DataView, p: number, v: number): void {
	d.setUint16(p, v + 10000, LE);
}
function rMonth(d: DataView, p: number): number {
	return d.getUint8(p) + 1;
}
function wMonth(d: DataView, p: number, v: number): void {
	d.setUint8(p, v - 1);
}
function rDay(d: DataView, p: number): number {
	return d.getUint8(p) + 1;
}
function wDay(d: DataView, p: number, v: number): void {
	d.setUint8(p, v - 1);
}
function wDate(v: DataView, p: number, y: number, m: number, d: number): void {
	wDay(v, p, d);
	wMonth(v, p + 1, m);
	wYear(v, p + 2, y);
}
function rDate(v: DataView, p: number): [number, number, number] {
	return [rYear(v, p + 2), rMonth(v, p + 1), rDay(v, p)];
}
function serDate(d: DataView, p: number, to: BitWriter): void {
	to.writeNumber(/*rawDay*/ d.getUint8(p), daySerBits);
	to.writeNumber(/*rawMonth*/ d.getUint8(p + 1), monthSerBits);
	to.writeNumber(/*rawYear*/ d.getUint16(p + 2, LE), yearSerBits);
}
function deserDate(to: DataView, p: number, src: BitReader): void {
	/*deserDay*/ to.setUint8(p, src.readNumber(daySerBits));
	/*deserMonth*/ to.setUint8(p + 1, src.readNumber(monthSerBits));
	/*deserYear*/ to.setUint16(p + 2, src.readNumber(yearSerBits), LE);
}

function rHour(d: DataView, p: number): number {
	return d.getUint8(p);
}
function wHour(d: DataView, p: number, v: number): void {
	d.setUint8(p, v);
}
function rMin(d: DataView, p: number): number {
	return d.getUint8(p);
}
function wMin(d: DataView, p: number, v: number): void {
	d.setUint8(p, v);
}
function rSec(d: DataView, p: number): number {
	return d.getUint8(p);
}
function wSec(d: DataView, p: number, v: number): void {
	d.setUint8(p, v);
}
function rMilli(d: DataView, p: number): number {
	return d.getUint16(p, LE);
}
function wMilli(d: DataView, p: number, v: number): void {
	d.setUint16(p, v, LE);
}
function rMicro(d: DataView, p: number): number {
	return d.getUint16(p, LE) | (d.getUint8(p + 2) << 16);
}
function wMicro(d: DataView, p: number, v: number): void {
	d.setUint16(p, v, LE);
	d.setUint8(p + 2, v >> 16);
}

function rTimeMs(v: DataView, p: number): [number, number, number, number] {
	return [rHour(v, p + 4), rMin(v, p + 3), rSec(v, p + 2), rMilli(v, p)];
}
function wTimeMs(
	v: DataView,
	p: number,
	h: number,
	i: number,
	s: number,
	ms: number
): void {
	wMilli(v, p, ms);
	wSec(v, p + 2, s);
	wMin(v, p + 3, i);
	wHour(v, p + 4, h);
}
function rTime(v: DataView, p: number): [number, number, number, number] {
	return [rHour(v, p + 5), rMin(v, p + 4), rSec(v, p + 3), rMicro(v, p)];
}
function wTime(
	v: DataView,
	p: number,
	h: number,
	i: number,
	s: number,
	us: number
): void {
	wMicro(v, p, us);
	wSec(v, p + 3, s);
	wMin(v, p + 4, i);
	wHour(v, p + 5, h);
}
function serTime(d: DataView, p: number, to: BitWriter): void {
	to.writeNumber(
		/*rawUs*/ d.getUint16(p, LE) | (d.getUint8(p + 2) << 16),
		microSerBits
	);
	to.writeNumber(/*rawSec*/ d.getUint8(p + 3), secSerBits);
	to.writeNumber(/*rawMin*/ d.getUint8(p + 4), minSerBits);
	to.writeNumber(/*rawHour*/ d.getUint8(p + 5), hourSerBits);
}
function deserTime(to: DataView, p: number, src: BitReader): void {
	/*deserMicro*/ wMicro(to, p, src.readNumber(microSerBits));
	/*deserSec*/ to.setUint8(p + 3, src.readNumber(secSerBits));
	/*deserMin*/ to.setUint8(p + 4, src.readNumber(minSerBits));
	/*deserHour*/ to.setUint8(p + 5, src.readNumber(hourSerBits));
}

//There's definitely some entangled intent here, but we get to reuse code at the
// component/rollup(date|time)/double rollup (datetime) by sharing a core
class Core {
	protected constructor(
		protected readonly _d: DataView,
		protected readonly _pos = 0
	) {}

	protected _year_iso(p: number): string {
		let v = rYear(this._d, p);
		let sign = '';
		if (v > 9999) {
			sign = '+';
		} else if (v < 0) {
			sign = '-';
			v = -v;
		}
		let r = v.toString();
		if (r.length < 4) r = ('0000' + r).substring(r.length);
		return sign + r;
	}
	protected _month_iso(p: number): string {
		const s = rMonth(this._d, p).toString();
		return ('00' + s).substring(s.length);
	}
	protected _day_iso(p: number): string {
		const s = rDay(this._d, p).toString();
		return ('00' + s).substring(s.length);
	}
	protected _date_iso(p: number, sep: string): string {
		return (
			this._year_iso(p + 2) +
			sep +
			this._month_iso(p + 1) +
			sep +
			this._day_iso(p)
		);
	}
	protected _hour_iso(p: number): string {
		const s = rHour(this._d, p).toString();
		return ('00' + s).substring(s.length);
	}
	protected _minute_iso(p: number): string {
		const s = rMin(this._d, p).toString();
		return ('00' + s).substring(s.length);
	}
	protected _second_iso(p: number): string {
		const s = rSec(this._d, p).toString();
		return ('00' + s).substring(s.length);
	}
	protected _milli_iso(p: number): string {
		const s = rMilli(this._d, p).toString();
		return ('000' + s).substring(s.length);
	}
	protected _micro_iso(p: number): string {
		const s = rMicro(this._d, p).toString();
		return ('000000' + s).substring(s.length);
	}
	protected _time_iso(p: number, sep: boolean): string {
		let sep1 = '',
			sep2 = '';
		if (sep) {
			sep1 = ':';
			sep2 = '.';
		}
		return (
			this._hour_iso(p + 5) +
			sep1 +
			this._minute_iso(p + 4) +
			sep1 +
			this._second_iso(p + 3) +
			sep2 +
			this._micro_iso(p)
		);
	}

	protected _date_valid(p: number): void {
		//no validate needed for year (can't exceed with ser)
		const [y, m, d] = rDate(this._d, p);
		//no need for negative check (all uint)
		safe.int.lte('month', m, 12);
		safe.int.lte('day', d, Month.lastDay(m, y));
	}

	protected _time_valid(p: number): void {
		const [h, i, s, u] = rTime(this._d, p);
		safe.int.lte('hour', h, 23);
		safe.int.lte('minute', i, 59);
		safe.int.lte('second', s, 59);
		safe.int.lte('microsecond', u, 999999);
	}

	/** Days since the Unix epoch (1970-01-01) */
	protected toUnixDays(p: number): number {
		// eslint-disable-next-line prefer-const
		let [yv, mv, dv] = rDate(this._d, p);
		//Move so 1-March first day of year (28/29-Feb last)
		if (mv > 2) {
			mv -= 3;
		} else {
			mv += 9;
			yv -= 1;
		}
		//The calendar repeats itself ever 400 years (see: leap year rules) so we can break
		// things down into 400 year segments (CD - 400 in roman numerals)
		const CD = ((yv >= 0 ? yv : yv - 399) / 400) | 0;
		const yearOfCD = yv - CD * 400; //[0 - 399]
		const dayOfYear = ((153 * mv + 2) / 5 + dv - 1) | 0; // [0 - 365]
		const dayOfCD =
			yearOfCD * 365 +
			((yearOfCD / 4) | 0) -
			((yearOfCD / 100) | 0) +
			dayOfYear; // [0 - 146096]
		const ret = CD * daysPerCD + dayOfCD - epochShift;
		return ret;
	}

	protected timeToUs(p: number): number {
		const [h, i, s, u] = rTime(this._d, p);
		return h * usPerHour + i * usPerMin + s * usPerSec + u;
	}

	protected static vetDate(y: number, m: number, d: number): void {
		/*vetYear*/ safe.int.inRangeInc('year', y, minIsoYear, maxIsoYear);
		/*vetMonth*/ safe.int.inRangeInc('month', m, 1, 12);
		/*vetDay*/ safe.int.inRangeInc('day', d, 1, Month.lastDay(m, y));
	}
	protected static vetTime(h: number, i: number, s: number, u: number): void {
		/*vetHour*/ safe.uint.atMost('hour', h, 23);
		/*vetMinute*/ safe.uint.atMost('minute', i, 59);
		/*vetSecond*/ safe.uint.atMost('second', s, 59);
		/*vetMicro*/ safe.uint.atMost('microsecond', u, 999999);
	}

	protected static parseYear(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//Optional leading +-, one or more digits, optional trailing space, nothing else
		const r = input.match(/^([+-])?(\d+)$/);
		if (r != null) {
			const [, sign, digits] = r;
			if (strict) {
				if (
					digits.length > 5 ||
					(digits.length == 5 && sign == undefined) ||
					digits.length < 4
				) {
					reset();
					return new ContentError(
						'expecting 4 digits zero padded or 5 digits with mandatory sign',
						'input',
						input
					);
				}
			}
			let intVal = parseDec(digits);
			if (!Number.isNaN(intVal)) {
				if (sign) {
					input.shrink(1);
					if (sign === '-') intVal = 0 - intVal;
				}
				if (intVal >= minIsoYear && intVal <= maxIsoYear) {
					input.shrink(digits.length);
					wYear(to, p, intVal);
					return;
				}
			}
		}
		reset();
		return new ContentError('expecting signed integer-string', 'year', input);
	}
	protected static parseMonth(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//Three or more letters (including accented letters), or one or more digits.
		//Either with optional trailing whitespace
		const r = input.match(
			/^(?:([\p{Alphabetic}\p{Mark}\p{Join_Control}]{3,})|(\d+))$/u
		);
		if (r != null) {
			const [, mon, int] = r;
			if (mon != undefined) {
				//Try and parse using Date and local settings (16th makes unambiguous day)
				const unixMs = Date.parse(mon + ' 16, 2000');
				if (!Number.isNaN(unixMs)) {
					input.shrink(mon.length);
					wMonth(to, p, new Date(unixMs).getMonth() + 1);
					return;
				}
			} else {
				if (strict) {
					if (int.length != 2) {
						reset();
						return new ContentError(
							'expecting 2 digit unsigned integer-string',
							'month',
							input
						);
					}
				}
				const intVal = parseDec(int);
				if (intVal >= 1 && intVal <= 12) {
					wMonth(to, p, intVal);
					input.shrink(int.length);
					return;
				}
			}
		}
		reset();
		return new ContentError(
			'expecting unsigned integer-string, or short-form month',
			'month',
			input
		);
	}
	protected static parseDay(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r != null) {
			const [, digits] = r;
			if (strict) {
				if (digits.length != 2) {
					reset();
					return new ContentError(
						'expecting 2 digit unsigned integer-string',
						'day',
						input
					);
				}
			}
			const intVal = parseDec(digits);
			if (intVal >= 1 && intVal <= 31) {
				input.shrink(digits.length);
				/*writeDay*/ to.setUint8(p, intVal - 1);
				return;
			}
		}
		reset();
		return new ContentError(
			'expecting 1-2 digit unsigned integer-string',
			'day',
			input
		);
	}
	/** input.test(/^[-+]?\d{8,9}$/) */
	protected static parseDateUndelim(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		let e = Core.parseYear(
			to,
			p + 2,
			input.left(input.length - 4),
			strict,
			reset
		);
		if (e) return e;
		input.shrink(input.length - 4);

		e = Core.parseMonth(to, p + 1, input.left(2), strict, reset);
		if (e) return e;
		input.shrink(2);

		e = Core.parseDay(to, p, input, strict, reset);
		if (e) return e;

		//Check for day invariance
		const [y, m, d] = rDate(to, p);
		const dim = Month.lastDay(m, y);
		if (d > dim) return new AtMostError('day', d, dim);

		input.shrink(input.length);
		return;
	}
	protected static parseDate(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//If it's an optional sign followed by 8-9 digits assume it's an un-delimited date
		if (input.test(/^[-+]?\d{8,9}$/)) {
			return Core.parseDateUndelim(to, p, input, strict, reset);
		}

		//Otherwise assumed delimited date
		let e: Error | undefined = undefined;
		let delim1: number;
		//Dash, slash, dot (germany?) separated allowed
		if (!strict) {
			delim1 = input.indexOfAny(['-', '/', '.'], 1);
		} else {
			delim1 = input.indexOf('-', 1);
		}
		let delim = '';
		if (delim1 > 0) {
			delim = input.charAt(delim1);
		}
		//Make sure second delim matches first, and there is one
		const delim2 = input.indexOf(delim, delim1 + 1) - delim1 - 1;
		if (delim2 > 0) {
			e = Core.parseYear(
				to,
				p + 2,
				input.left(delim1).trimEnd(),
				strict,
				reset
			);
			if (e) return e;
			input.shrink(delim1 + 1);

			e = Core.parseMonth(to, p + 1, input.left(delim2).trim(), strict, reset);
			if (e) return e;
			input.shrink(delim2 + 1);

			e = Core.parseDay(to, p, input.trim(), strict, reset);
			if (e) return e;

			//Check for day invariance
			const [y, m, d] = rDate(to, p);
			const dim = Month.lastDay(m, y);
			if (d > dim) return new AtMostError('day', d, dim);

			input.shrink(input.length);
			return;
		}

		reset();
		return new ContentError(
			`Expecting 8-9 digit ymd (with optional sign), or ${delim} delimited date`,
			'date',
			input
		);
	}
	protected static parseHour(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r != null) {
			const [, digits] = r;
			if (strict) {
				if (digits.length != 2) {
					reset();
					return new ContentError(
						'expecting 2 digit unsigned integer-string',
						'hour',
						input
					);
				}
			}
			const intVal = parseDec(digits);
			if (intVal >= 0 && intVal <= 23) {
				input.shrink(digits.length);
				/*writeHour*/ to.setUint8(p, intVal);
				return;
			}
		}
		reset();
		return new ContentError('expecting unsigned integer-string', 'hour', input);
	}
	protected static parseMinute(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r != null) {
			const [, digits] = r;
			if (strict) {
				if (digits.length != 2) {
					reset();
					return new ContentError(
						'expecting 2 digit unsigned integer-string',
						'minute',
						input
					);
				}
			}
			const intVal = parseDec(digits);
			if (intVal >= 0 && intVal <= 59) {
				input.shrink(digits.length);
				/*writeMinute*/ to.setUint8(p, intVal);
				return;
			}
		}
		reset();
		return new ContentError(
			'expecting unsigned integer-string',
			'minute',
			input
		);
	}
	protected static parseSecond(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r != null) {
			const [, digits] = r;
			if (strict) {
				if (digits.length != 2) {
					reset();
					return new ContentError(
						'expecting 2 digit unsigned integer-string',
						'second',
						input
					);
				}
			}
			const intVal = parseDec(digits);
			if (intVal >= 0 && intVal <= 59) {
				input.shrink(digits.length);
				/*writeSecond*/ to.setUint8(p, intVal);
				return;
			}
		}
		reset();
		return new ContentError(
			'expecting unsigned integer-string',
			'second',
			input
		);
	}
	protected static parseMilli(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		left: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r != null) {
			const [, digits] = r;
			let effDigits = digits;
			if (strict && digits.length != 3) {
				reset();
				return new ContentError(
					'expecting 3 digit unsigned integer-string',
					'millisecond',
					input
				);
			} else if (digits.length < 3 && left) {
				//If we're short digits, implied zeros at the end, but only if "left mode"
				effDigits = (digits + '000').substring(0, 3);
			}

			const intVal = parseDec(effDigits);
			if (intVal >= 0 && intVal <= 999) {
				input.shrink(digits.length);
				wMilli(to, p, intVal);
				return;
			}
		}
		reset();
		return new ContentError(
			'expecting unsigned integer-string',
			'millisecond',
			input
		);
	}
	protected static parseMicro(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		left: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r != null) {
			const [, digits] = r;
			let effDigits = digits;
			if (strict && digits.length != 6) {
				reset();
				return new ContentError(
					'expecting 6 digit unsigned integer-string',
					'microsecond',
					input
				);
			} else if (digits.length < 6 && left) {
				//If we're short digits, implied zeros at the end, but only if "left mode"
				effDigits = (digits + '000000').substring(0, 6);
			}

			const intVal = parseDec(effDigits);
			if (intVal >= 0 && intVal <= 999999) {
				input.shrink(digits.length);
				wMicro(to, p, intVal);
				return;
			}
		}
		reset();
		return new ContentError(
			'expecting unsigned integer-string',
			'microsecond',
			input
		);
	}
	protected static parseTimeUndelim(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		let e = Core.parseHour(to, p + 5, input.left(2), strict, reset);
		if (e) return e;
		input.shrink(2);

		e = Core.parseMinute(to, p + 4, input.left(2), strict, reset);
		if (e) return e;
		input.shrink(2);

		e = Core.parseSecond(to, p + 3, input.left(2), strict, reset);
		if (e) return e;
		input.shrink(2);

		e = Core.parseMicro(to, p, input, strict, false, reset);
		//because parseTime and DateTime*.parse will only call this with
		// exactly 12 digits, it's impossible to get an invalid micro (they
		// must be 6 digits, and all values are welcome).  But! We'll leave
		// this check here incase the interface changes in the future
		if (e) return e;

		input.shrink(input.length);
		return;
	}
	protected static parseTime(
		to: DataView,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		let e: Error | undefined = undefined;

		//If it's 12 digits assume it's an un-delimited time
		if (input.test(/^\d{12}$/)) {
			return Core.parseTimeUndelim(to, p, input, strict, reset);
		}

		const delim1 = input.indexOf(':');
		let delim2 = input.indexOf(':', delim1 + 1);
		let delim3 = input.indexOf('.', delim2 + 1);
		delim3 -= delim2 + 1;
		delim2 -= delim1 + 1;
		if (delim1 > 0 && delim2 > 0 && delim3 > 0) {
			e = Core.parseHour(to, p + 5, input.left(delim1).trim(), strict, reset);
			if (e) return e;
			input.shrink(delim1 + 1);

			e = Core.parseMinute(to, p + 4, input.left(delim2).trim(), strict, reset);
			if (e) return e;
			input.shrink(delim2 + 1);

			e = Core.parseSecond(to, p + 3, input.left(delim3).trim(), strict, reset);
			if (e) return e;
			input.shrink(delim3 + 1);

			e = Core.parseMicro(to, p, input.trim(), strict, true, reset);
			if (e) return e;

			input.shrink(input.length);
			return;
		}
		reset();
		return new ContentError(
			`Expecting hh:mm:ss.uuuuuu, or hhmmssuuuuuu`,
			'time',
			input
		);
	}

	protected static dateFromValue(to: DataView, p: number, v: number): void {
		const d = v % 100;
		v = (v - d) / 100;
		const m = v % 100;
		v = (v - m) / 100;
		Core.vetDate(v, m, d);
		wDate(to, p, v, m, d);
	}
	protected static timeFromValue(to: DataView, p: number, v: number): void {
		const u = v % 1000000;
		v = (v - u) / 1000000;
		const s = v % 100;
		v = (v - s) / 100;
		const i = v % 100;
		v = (v - i) / 100;
		Core.vetTime(v, i, s, u);
		wTime(to, p, v, i, s, u);
	}

	protected static dateFromUnixDays(
		to: DataView,
		p: number,
		source: number
	): void {
		const daysPer4y = 1460; //no leap day
		const daysPer100y = 36524; //with leap days
		//Move to 0000-3-1 based days
		source = (source + epochShift) | 0;
		const CD =
			((source >= 0 ? source : source - daysPerCD + 1) / daysPerCD) | 0;
		const dayOfCD = source - CD * daysPerCD; //[0 - 146096]
		const yearOfCD =
			((dayOfCD -
				((dayOfCD / daysPer4y) | 0) +
				((dayOfCD / daysPer100y) | 0) -
				((dayOfCD / (daysPerCD - 1)) | 0)) /
				365) |
			0; // [0 - 399]
		let y = yearOfCD + CD * 400;
		const dayOfYear =
			dayOfCD - 365 * yearOfCD - ((yearOfCD / 4) | 0) + ((yearOfCD / 100) | 0); // [0 - 365]
		const mp = ((5 * dayOfYear + 2) / 153) | 0; // [0 - 11]
		const d = dayOfYear + 1 - (((153 * mp + 2) / 5) | 0); // [1 - 31]
		const m = mp < 10 ? mp + 3 : mp - 9; // [1 - 12]
		if (m <= 2) y += 1;
		wDate(to, p, y, m, d);
	}
}

/**
 * A year in the range -10000 - +22767 (ISO), 10001BC - 22767AD (Gregorian), or 0-32767 (Holocene)
 *
 * [Holocene calendar](https://en.wikipedia.org/wiki/Holocene_calendar#Conversion)
 * HE    = ISO8601 Gregory
 * 0     =  -10000 10001BC MIN
 * 10000 =       0     1BC
 * 10001 =       1     1AD
 * 12024 =    2024  2024AD CUR
 * 32767 =   22767 22767AD MAX
 * NOTE: Gregorian calendar has no 0 year, ISO8601 maps 0 to 1BC
 */
export class Year extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = yearBytes; //2
	/**Number of bits required to serialize this data */
	static readonly serialBits = yearSerBits; //15

	/** Minimum year = -10000 */
	static get min(): Year {
		return minY;
	}
	/** Maximum year = +22767 */
	static get max(): Year {
		return maxY;
	}

	/** Year, not zero padded, sign only on negative */
	public toString(): string {
		return rYear(this._d, this._pos).toString();
	}

	/** Year ISO8601, zero padded if >-1000,<1000, includes sign if >4 digits */
	public toIsoString(): string {
		return this._year_iso(this._pos);
	}

	/** Year in ISO8601 as an integer (0=1BC, -10000=10001BC, 2024=2024AD) */
	toJSON(): number {
		return rYear(this._d, this._pos);
	}

	/** Year in ISO8601 as an integer (0=1BC, -10000=10001BC, 2024=2024AD) */
	public valueOf(): number {
		return rYear(this._d, this._pos);
	}

	/** Serialize into target  - 15 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(
			/*rawYear*/ this._d.getUint16(this._pos, LE),
			yearSerBits
		);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return yearSerBits;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Year';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Year(${rYear(this._d, this._pos)})`;
	}

	/** Create a new year in ISO601 format, range -10000 - +22767 */
	public static new(v: number): Year {
		/*vetYear*/ safe.int.inRangeInc('year', v, minIsoYear, maxIsoYear);
		const dv = new DataView(new ArrayBuffer(yearBytes));
		wYear(dv, 0, v);
		return new Year(dv);
	}

	/**
	 * Create a new year in Gregorian format, range 10001BC - 22676AD
	 * @param year 1-22676 if AD, 1-10001 if BC (no zero year)
	 * @param ad True=Anno Domini(AD)/Common Era(CE), False=Before Chris(BC)/Before common era (BCE)
	 */
	public static newGregorian(year: number, ad = true): Year {
		const dv = new DataView(new ArrayBuffer(yearBytes));
		if (ad) {
			safe.int.inRangeInc('year', year, 1, maxIsoYear);
			wYear(dv, 0, year);
		} else {
			safe.int.inRangeInc('-year', year, 1, 10001);
			wYear(dv, 0, 1 - year);
		}
		return new Year(dv);
	}

	/** Create a new year in Holocene format, range 0 - 32767*/
	public static newHolocene(year: number): Year {
		safe.uint.atMost('year', year, maxHeYear);
		const dv = new DataView(new ArrayBuffer(yearBytes));
		wYear(dv, 0, year - 10000);
		return new Year(dv);
	}

	/**
	 * Create a year from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Year {
		const dv = new DataView(new ArrayBuffer(yearBytes));
		wYear(dv, 0, dt.getFullYear());
		return new Year(dv);
	}

	/**
	 * Create a year from a js Date object in UTC
	 * @param dt Value used as source
	 */
	public static fromDateUtc(dt: Date): Year {
		const dv = new DataView(new ArrayBuffer(yearBytes));
		wYear(dv, 0, dt.getUTCFullYear());
		return new Year(dv);
	}

	/**
	 * Create a year from a string, accepts:
	 * 'now', an integer with sign, if strict: integer must be 4 digits, when >4 digits must have sign (even +)
	 *
	 * Throws if:
	 * - Not a string, or $input is empty
	 * - There's no available $storage
	 * - The integer value of $input is out of range
	 * - The content of $input isn't valid
	 */
	public static parse(input: WindowStr, strict = false): Year {
		const dv = new DataView(new ArrayBuffer(yearBytes));
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			wYear(dv, 0, new Date().getFullYear());
		} else {
			const e = Core.parseYear(dv, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Year(dv);
	}

	/** Create this year (local) */
	public static now(): Year {
		const dv = new DataView(new ArrayBuffer(yearBytes));
		wYear(dv, 0, new Date().getFullYear());
		return new Year(dv);
	}

	/**
	 * Whether the ISO year `y` is a leap year, or not.
	 *
	 * @param y Year integer, can exceed Year range, but cannot exceed Int32 (-2147483648  - 2147483647) because of big logic, floats will be truncated
	 */
	public static isLeap(y: number): boolean {
		y = y | 0;
		//In a 400 year period, there are:
		//   100-4+1 = 97 leap years
		//   400-97  =303 regular old years

		//3 & 15 mask can be done straight off the lower byte
		//Not a multiple of 4 - no leap (300 values | 300)
		if ((y & 3) !== 0) return false;

		//Is a multiple of 16 - leap (25 values | 325)
		//0,16,32,48,64,80,96,112,128,144,160,176,192,208,224,240,256,272,288,304,320,336,352,368,384
		if ((y & 15) === 0) return true;

		//Isn't a multiple of 25 - leap
		//There are only 3 numbers that are multiples of 25 now:
		//(0) (25) (50) (75) 100 (125) (150) (175) 200 (225) (250) (275) 300 (325) (350) (375)
		// .. 100, 200, 300 (the others have already returned being not multiples of 4 or multiples of 16)
		//This could also be %100
		return y % 25 !== 0;
	}

	/**
	 * Deserialize next 15 bits into year.
	 * Throws if:
	 * - There's not 15 bits remaining in $source.buffer
	 * - There's no available $storage
	 * @param src Source to read bits from
	 * @returns
	 */
	public static deserialize(src: BitReader): Year {
		const dv = new DataView(new ArrayBuffer(yearBytes));
		/*deserYear*/ dv.setUint16(0, src.readNumber(yearSerBits), LE);
		return new Year(dv);
	}
}
const minY = Year.newHolocene(0);
const maxY = Year.newHolocene(maxHeYear);

/** Month of year (gregorian, julian) in the range 1 - 12 */
export class Month extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = monthBytes;
	/**Number of bits required to serialize this data */
	static readonly serialBits = monthSerBits;

	/** Minimum month */
	static get min(): Month {
		return minMo;
	}
	/** Maximum month */
	static get max(): Month {
		return maxMo;
	}

	/** Month, not zero padded (1 - 12)*/
	public toString(): string {
		return rMonth(this._d, this._pos).toString();
	}

	/** Month ISO8601, zero padded (01-12) */
	public toIsoString(): string {
		return this._month_iso(this._pos);
	}

	/** Month ISO8601 as an integer (1=January, 12=December) */
	toJSON(): number {
		return rMonth(this._d, this._pos);
	}

	/** Month ISO8601 as an integer (1=January, 12=December) */
	public valueOf(): number {
		return rMonth(this._d, this._pos);
	}

	/** Serialize into target  - 4 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this._d.getUint8(this._pos), monthSerBits);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return monthSerBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 * @returns
	 */
	public validate(): Month {
		safe.int.lte('month', rMonth(this._d, this._pos), 12);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Month';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Month(${rMonth(this._d, this._pos)})`;
	}

	/** Create a new month of the year, range 1-12 */
	public static new(v: number): Month {
		/*vetMonth*/ safe.int.inRangeInc('month', v, 1, 12);
		const dv = new DataView(new ArrayBuffer(monthBytes));
		wMonth(dv, 0, v);
		return new Month(dv);
	}

	/**
	 * Create a month from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Month {
		const dv = new DataView(new ArrayBuffer(monthBytes));
		wMonth(dv, 0, dt.getMonth() + 1);
		return new Month(dv);
	}

	/**
	 * Create a month from a js Date object in UTC
	 * @param dt Value used as source
	 */
	public static fromDateUtc(dt: Date): Month {
		const dv = new DataView(new ArrayBuffer(monthBytes));
		wMonth(dv, 0, dt.getUTCMonth() + 1);
		return new Month(dv);
	}

	/**
	 * Create a month from a string, accepts:
	 * 'now', a 1-2 digit unsigned integer, short or long form month (based on local localization)
	 *
	 * Throws if:
	 * - Not a string, or $input is empty
	 * - There's no available $storage
	 * - The integer value of $input is out of range
	 * - The content of $input isn't valid
	 */
	public static parse(input: WindowStr, strict = false): Month {
		const dv = new DataView(new ArrayBuffer(monthBytes));
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			wMonth(dv, 0, new Date().getMonth() + 1);
		} else {
			const e = Core.parseMonth(dv, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Month(dv);
	}

	/** Create this year (local) */
	public static now(): Month {
		const dv = new DataView(new ArrayBuffer(monthBytes));
		wMonth(dv, 0, new Date().getMonth() + 1);
		return new Month(dv);
	}

	/**
	 * Deserialize next 4 bits into month of year
	 * Throws if:
	 * - There's not 4 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param src Source to read bits from
	 */
	public static deserialize(src: BitReader): Month {
		const dv = new DataView(new ArrayBuffer(monthBytes));
		/*deserMonth*/ dv.setUint8(0, src.readNumber(monthSerBits));
		return new Month(dv);
	}

	/**
	 * Number of days in the given month, assumed to be a non-leap year
	 * @param month Month integer, not validated (1 - 12)
	 * @returns One of: 28,30,31
	 */
	public static lastDay(month: number): number;
	/**
	 * Number of days in the given month, in the given year
	 * @param month Month integer, not validated (1 - 12)
	 * @param year Year integer, can exceed Year range, but cannot exceed Int32 (-2147483648  - 2147483647)
	 * @returns One of: 28,29,30,31
	 */
	public static lastDay(month: number, year: number): number;
	public static lastDay(m: number, y?: number): number {
		const leap = y == undefined ? false : Year.isLeap(y);
		return m != 2 || !leap ? DIM[m] : 29;
	}
}
const minMo = Month.new(1);
const maxMo = Month.new(12);

export class Day extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = dayBytes;
	/**Number of bits required to serialize this data */
	static readonly serialBits = daySerBits;

	/** Minimum month 1 */
	static get min(): Day {
		return minD;
	}
	/** Maximum day 31 (note with context this might be inaccurate) */
	static get max(): Day {
		return maxD;
	}

	/** Day, not zero padded (1 - 31) */
	public toString(): string {
		return rDay(this._d, this._pos).toString();
	}

	/** Day ISO8601, zero padded (01-31) */
	public toIsoString(): string {
		return this._day_iso(this._pos);
	}

	/** Day of the month ISO8601 as a number (1-31) */
	toJSON(): number {
		return rDay(this._d, this._pos);
	}

	/** Day of the month ISO8601 as a number (1-31) */
	public valueOf(): number {
		return rDay(this._d, this._pos);
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this._d.getUint8(this._pos), daySerBits);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return daySerBits;
	}

	/**
	 * Test internal state is valid (<=31), throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Day {
		safe.int.lte('day', rDay(this._d, this._pos), 31);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'DayOfMonth';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `DayOfMonth(${rDay(this._d, this._pos)})`;
	}

	/** Create a new day of the month, range 1-31 */
	public static new(v: number): Day {
		/*vetDay*/ safe.int.inRangeInc('day', v, 1, 31);
		const dv = new DataView(new ArrayBuffer(dayBytes));
		wDay(dv, 0, v);
		return new Day(dv);
	}

	/**
	 * Create a day from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Day {
		const dv = new DataView(new ArrayBuffer(dayBytes));
		wDay(dv, 0, dt.getDate());
		return new Day(dv);
	}

	/**
	 * Create a day from a js Date object in UTC
	 * @param dt Value used as source
	 */
	public static fromDateUtc(dt: Date): Day {
		const dv = new DataView(new ArrayBuffer(dayBytes));
		wDay(dv, 0, dt.getUTCDate());
		return new Day(dv);
	}

	/**
	 * Create a day from a string, accepts:
	 * 'now', a 1-2 digit unsigned integer
	 *
	 * Throws if:
	 * - Not a string, or $input is empty
	 * - There's no available $storage
	 * - The integer value of $input is out of range
	 * - The content of $input isn't valid
	 */
	public static parse(input: WindowStr, strict = false): Day {
		const dv = new DataView(new ArrayBuffer(dayBytes));
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			wDay(dv, 0, new Date().getDate());
		} else {
			const e = Core.parseDay(dv, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Day(dv);
	}

	/** Create this day of the month (local) */
	public static now(): Day {
		const dv = new DataView(new ArrayBuffer(dayBytes));
		wDay(dv, 0, new Date().getDate());
		return new Day(dv);
	}

	/**
	 * Deserialize next 5 bits into day of month.
	 * Throws if:
	 * - There's not 5 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param src Source to read bits from
	 * @returns
	 */
	public static deserialize(src: BitReader): Day {
		const dv = new DataView(new ArrayBuffer(dayBytes));
		/*deserDay*/ dv.setUint8(0, src.readNumber(daySerBits));
		return new Day(dv);
	}
}
const minD = Day.new(1);
const maxD = Day.new(31);

export class DateOnly extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = dateBytes; //4
	/**Number of bits required to serialize this data */
	static readonly serialBits = dateSerBits; //24

	/** Minimum date = -10000-01-01 */
	static get min(): DateOnly {
		return minDate;
	}
	/** Maximum date =  +22767-12-31 */
	static get max(): DateOnly {
		return maxDate;
	}

	/** Years (-10000 - +22767) ISO8601 */
	get year(): number {
		return rYear(this._d, this._pos + 2);
	}
	/** Months (1-12) */
	get month(): number {
		return rMonth(this._d, this._pos + 1);
	}
	/** Days (1-31) */
	get day(): number {
		return rDay(this._d, this._pos);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date: yyyy-mm-dd (zero padded year/month/day)
	 *
	 * @param [sep='-'] Character to separate components (default -)
	 */
	public toString(sep = '-'): string {
		return this._date_iso(this._pos, sep);
	}

	/**
	 * Numeric date base 10 shifted -100000101 - +227671231
	 * So today (2024-01-15) would be: 20240115
	 * Note there are gaps in valid values: 20230229, 20241301, 20240132, 20240230 aren't valid, but
	 * you can do <, >, = comparisons
	 */
	public toJSON(): number {
		return this.valueOf();
	}

	/**
	 * Output as a JS `Date` object (in local, hour and smaller units zeroed)
	 *
	 * If you don't want it in local time, build a new date from {@link toUnixTimeMs}
	 *
	 * Because JS Date includes a time element, there can be some unexpected side effects with
	 * date-math. (eg when crossing daylight savings time boundaries).
	 */
	toDate(): Date {
		const [y, m, d] = rDate(this._d, this._pos);
		return new Date(y, /*fucks sake JS*/ m - 1, d);
	}

	/** Days since the Unix epoch (1970-01-01) */
	toUnixDays(): number {
		return super.toUnixDays(this._pos);
	}

	/** Seconds since the Unix epoch aka unix time (hour and smaller units zeroed) */
	toUnixTime(): number {
		return super.toUnixDays(this._pos) * sPerDay;
	}

	/** Milliseconds since the Unix epoch aka unix time (hour and smaller units zeroed, compatible with `Date` constructor) */
	toUnixTimeMs(): number {
		return super.toUnixDays(this._pos) * msPerDay;
	}

	/**
	 * Numeric date base 10 shifted -100000101 - +227671231
	 * So today (2024-01-15) would be: 20240115
	 * Note there are gaps in valid values: 20241301, 20240132, 20240230 aren't valid, but
	 * you can do <, >, = comparisons
	 */
	public valueOf(): number {
		const [y, m, d] = rDate(this._d, this._pos);
		return y < 0 ? y * 10000 - m * 100 - d : y * 10000 + m * 100 + d;
	}

	/** Serialize into target  - 24 bits*/
	public serialize(to: BitWriter): void {
		serDate(this._d, this._pos, to);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return dateSerBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): DateOnly {
		this._date_valid(this._pos);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'DateOnly';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `DateOnly(${this._date_iso(this._pos, '-')})`;
	}

	/**
	 * Add a number of days to this date, returns a new object (pure)
	 *
	 * @param days Integer number of days, can be negative, if floating it will be truncated
	 * @returns New date
	 *
	 * @pure
	 */
	public addSafe(days: number): DateOnly {
		const dv = new DataView(new ArrayBuffer(dateBytes));
		Core.dateFromUnixDays(dv, 0, super.toUnixDays(this._pos) + (days | 0));
		return new DateOnly(dv);
	}

	/**
	 * Add a number of years/months to this date, returns a new object (pure)
	 *
	 * Adding years is mostly safe, unless it's currently February 29th, in which case the `day`
	 * *may* become 28th if the new year isn't leap.  Might be easiest to consider `y=12*m` (although
	 * the magnitude of `m` is not limited to 12.. you can add `14m`, or - bizarrely - `1y14m` (26m) if you want)
	 *
	 * Adding months is safe when the day is <=28.  Could be safe with higher values. When
	 * the destination month has a lower count of days the `day` will be clamped.  The results
	 * may also be unexpected if you consider the current value to be relative to the end of a month
	 * and expect the new value to be likewise the same distance
	 *
	 * If you want to add days before/after call {@link addSafe} in sequence
	 *
	 * @example
	 * Sep 30 + 1m1d = Oct 31 //Sep30->Oct30->Oct31
	 * @example
	 * Oct 31 + 1m1d = Dec 1  //Oct31->Nov30->Dec01
	 * @example
	 * Feb 29 + 1y1m = Mar 29 //Feb29->Mar29. If there was 2 stage validation Feb29->Feb28->Mar28
	 *
	 * @param ys Integer, if float will be truncated
	 * @param ms
	 *
	 * @pure
	 */
	public add(ys: number, ms = 0): DateOnly {
		let monthAdd = 0;
		//By collecting and distributing we normalize high m or m/y sign mismatch
		// (eg +1-4 == +8)
		if (ys) monthAdd += (ys | 0) * 12;
		if (ms) monthAdd += ms | 0;
		const yearAdd = (monthAdd / 12) | 0;
		monthAdd %= 12;

		let [y, m, d] = rDate(this._d, this._pos);
		y += yearAdd;
		m += monthAdd;
		const dim = Month.lastDay(m, y);
		if (d > dim) d = dim;
		const dv = new DataView(new ArrayBuffer(dateBytes));
		wDate(dv, 0, y, m, d);
		return new DateOnly(dv);
	}

	/**
	 * Create a new ISO8601 date
	 * @param y range -10000 - +22767
	 * @param m range 1 - 12
	 * @param d range 1 - 31
	 */
	public static new(y: number, m: number, d: number): DateOnly {
		const dv = new DataView(new ArrayBuffer(dateBytes));
		Core.vetDate(y, m, d);
		wDate(dv, 0, y, m, d);
		return new DateOnly(dv);
	}

	/**
	 * Convert from base 10 shifted value {@link valueOf} into new DateOnly
	 *
	 * @example
	 * ```js
	 * const dto=DateOnly.fromValue(20240115);
	 * dto.toValue();//20240115
	 * dto.year.toValue();//2024
	 * dto.month.toValue();//1
	 * dto.day.toValue();//15
	 * ```
	 *
	 * @param v
	 * @returns
	 */
	public static fromValue(v: number): DateOnly {
		const dv = new DataView(new ArrayBuffer(dateBytes));
		Core.dateFromValue(dv, 0, v);
		return new DateOnly(dv);
	}

	public static fromUnixDays(d: number): DateOnly {
		const dv = new DataView(new ArrayBuffer(dateBytes));
		Core.dateFromUnixDays(dv, 0, d);
		return new DateOnly(dv);
	}

	/**
	 * Create a date from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): DateOnly {
		const ms = dt.valueOf() - dt.getTimezoneOffset() * msPerMin;
		const dv = new DataView(new ArrayBuffer(dateBytes));
		Core.dateFromUnixDays(dv, 0, ms / msPerDay);
		return new DateOnly(dv);
	}

	/**
	 * Create a date from a js Date object in UTC
	 * @param dt Value used as source
	 */
	public static fromDateUtc(dt: Date): DateOnly {
		const dv = new DataView(new ArrayBuffer(dateBytes));
		Core.dateFromUnixDays(dv, 0, dt.valueOf() / msPerDay);
		return new DateOnly(dv);
	}

	/**
	 * Create a date from float seconds since UNIX epoch aka unix time
	 * *NOTE*: Unix time is always in UTC, depending on your timezone this may differ from local
	 */
	public static fromUnixTime(s: number): DateOnly {
		const dv = new DataView(new ArrayBuffer(dateBytes));
		Core.dateFromUnixDays(dv, 0, s / sPerDay);
		return new DateOnly(dv);
	}

	/**
	 * Create a date from float milliseconds since UNIX epoch aka unix time
	 * *NOTE*: Unix time is always in UTC, depending on your timezone this may differ from local
	 */
	public static fromUnixTimeMs(ms: number): DateOnly {
		const dv = new DataView(new ArrayBuffer(dateBytes));
		Core.dateFromUnixDays(dv, 0, ms / msPerDay);
		return new DateOnly(dv);
	}

	/**
	 * Parse a string into a date, accepts:
	 * 'now', a 3 part date separated by '-' characters
	 * @param input
	 * @param [strict=false] Whether {@link Year.parse} {@link Month.parse} and {@link Day.parse} are strict
	 */
	public static parse(input: WindowStr, strict = false): DateOnly {
		const dv = new DataView(new ArrayBuffer(dateBytes));
		const reset = input.getReset();
		input.trim();

		//If content starts with "now" and optionally followed by whitespace - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			const dt = new Date();
			wDate(dv, 0, dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
		} else {
			const e = Core.parseDate(dv, 0, input, strict, reset);
			if (e) throw e;
		}
		return new DateOnly(dv);
	}

	/** Create this date (local) */
	public static now(): DateOnly {
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const n = new Date();
		const ms = n.valueOf() - n.getTimezoneOffset() * msPerMin;
		const dv = new DataView(new ArrayBuffer(dateBytes));
		Core.dateFromUnixDays(dv, 0, ms / msPerDay);
		return new DateOnly(dv);
	}

	/** Create this date (UTC) */
	public static nowUtc(): DateOnly {
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const ms = new Date().valueOf();
		const dv = new DataView(new ArrayBuffer(dateBytes));
		Core.dateFromUnixDays(dv, 0, ms / msPerDay);
		return new DateOnly(dv);
	}

	public static deserialize(src: BitReader): DateOnly {
		const dv = new DataView(new ArrayBuffer(dateBytes));
		deserDate(dv, 0, src);
		return new DateOnly(dv);
	}

	/**
	 * Day of the week (where 0=Sunday, 1=Monday.. 6=Saturday)
	 * @param unixDays Count of days from epoch (can be negative)
	 * @returns Day (0 - 6)
	 */
	public static dayOfWeek(unixDays: number): number {
		return unixDays >= -4 ? (unixDays + 4) % 7 : ((unixDays + 5) % 7) + 6;
	}
}
const minDate = DateOnly.new(minIsoYear, 1, 1);
const maxDate = DateOnly.new(maxIsoYear, 12, 31);

export class Hour extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = hourBytes;
	/**Number of bits required to serialize this data */
	static readonly serialBits = hourSerBits;

	/** Minimum hour (0) */
	static get min(): Hour {
		return minH;
	}
	/** Maximum hour (23) */
	static get max(): Hour {
		return maxH;
	}

	/** Hour, not zero padded (0-23) */
	public toString(): string {
		return rHour(this._d, this._pos).toString();
	}

	/** Hour, zero padded (01-23) */
	public toIsoString(): string {
		return this._hour_iso(this._pos);
	}

	/** Hour as a number (0-23) */
	toJSON(): number {
		return rHour(this._d, this._pos);
	}

	/** Hour as a number (0-23) */
	public valueOf(): number {
		return rHour(this._d, this._pos);
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this._d.getUint8(this._pos), hourSerBits);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return hourSerBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Hour {
		safe.int.lte('hour', rHour(this._d, this._pos), 23);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'HourOfDay';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `HourOfDay(${rHour(this._d, this._pos)})`;
	}

	/** Create a new hour, range 0-23 */
	public static new(v: number): Hour {
		/*vetHour*/ safe.uint.atMost('hour', v, 23);
		const dv = new DataView(new ArrayBuffer(hourBytes));
		wHour(dv, 0, v);
		return new Hour(dv);
	}

	/**
	 * Create from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Hour {
		const dv = new DataView(new ArrayBuffer(hourBytes));
		wHour(dv, 0, dt.getHours());
		return new Hour(dv);
	}

	/**
	 * Create from a js Date object in UTC
	 * @param dt Value used as source
	 */
	public static fromDateUtc(dt: Date): Hour {
		const dv = new DataView(new ArrayBuffer(hourBytes));
		wHour(dv, 0, dt.getUTCHours());
		return new Hour(dv);
	}

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(s: number): Hour {
		const dv = new DataView(new ArrayBuffer(hourBytes));
		wHour(dv, 0, (s % sPerDay) / sPerHour);
		return new Hour(dv);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(ms: number): Hour {
		const dv = new DataView(new ArrayBuffer(hourBytes));
		wHour(dv, 0, (ms % msPerDay) / msPerHour);
		return new Hour(dv);
	}

	/** Create from microseconds since UNIX epoch */
	public static fromUnixTimeUs(us: number): Hour {
		const dv = new DataView(new ArrayBuffer(hourBytes));
		wHour(dv, 0, (us % usPerDay) / usPerHour);
		return new Hour(dv);
	}

	/**
	 * Create from a string accepts:
	 * 'now', a 1-2 digit unsigned integer
	 *
	 * Throws if:
	 * - Not a string, or $input is empty
	 * - The integer value of $input is out of range
	 * - The content of $input isn't valid
	 */
	public static parse(input: WindowStr, strict = false): Hour {
		const dv = new DataView(new ArrayBuffer(hourBytes));
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			wHour(dv, 0, new Date().getHours());
		} else {
			const e = Core.parseHour(dv, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Hour(dv);
	}

	/** Create this hour (local) */
	public static now(): Hour {
		const dv = new DataView(new ArrayBuffer(hourBytes));
		wHour(dv, 0, new Date().getHours());
		return new Hour(dv);
	}

	/** Create this hour (UTC) */
	public static nowUtc(): Hour {
		const dv = new DataView(new ArrayBuffer(hourBytes));
		wHour(dv, 0, new Date().getUTCHours());
		return new Hour(dv);
	}

	/**
	 * Deserialize next 4 bits into month of year
	 * Throws if:
	 * - There's not 4 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param src Source to read bits from
	 */
	public static deserialize(src: BitReader): Hour {
		const dv = new DataView(new ArrayBuffer(hourBytes));
		wHour(dv, 0, src.readNumber(hourSerBits));
		return new Hour(dv);
	}
}
const minH = Hour.new(0);
const maxH = Hour.new(23);

export class Minute extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = minBytes;
	/**Number of bits required to serialize this data */
	static readonly serialBits = minSerBits;

	/** Minimum minute (0) */
	static get min(): Minute {
		return minMi;
	}
	/** Maximum minute (59) */
	static get max(): Minute {
		return maxMi;
	}

	/** Minute, not zero padded (0-59) */
	public toString(): string {
		return rMin(this._d, this._pos).toString();
	}
	/** Minute, Zero padded (00-59) */
	public toIsoString(): string {
		return this._minute_iso(this._pos);
	}

	/** Minute as an integer (0-59) */
	toJSON(): number {
		return rMin(this._d, this._pos);
	}

	/** Minute as an integer (0-59) */
	public valueOf(): number {
		return rMin(this._d, this._pos);
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(rMin(this._d, this._pos), minSerBits);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return minSerBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Minute {
		safe.int.lte('minute', rMin(this._d, this._pos), 59);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Minute';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Minute(${rMin(this._d, this._pos)})`;
	}

	/** Create a new minute, range 0-59 */
	public static new(v: number): Minute {
		/*vetMinute*/ safe.uint.atMost('minute', v, 59);
		const dv = new DataView(new ArrayBuffer(minBytes));
		wMin(dv, 0, v);
		return new Minute(dv);
	}

	/**
	 * Create from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Minute {
		const dv = new DataView(new ArrayBuffer(minBytes));
		wMin(dv, 0, dt.getMinutes());
		return new Minute(dv);
	}

	/**
	 * Create from a js Date object in UTC
	 * @param dt Value used as source
	 */
	public static fromDateUtc(dt: Date): Minute {
		const dv = new DataView(new ArrayBuffer(minBytes));
		wMin(dv, 0, dt.getUTCMinutes());
		return new Minute(dv);
	}

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(src: number): Minute {
		const dv = new DataView(new ArrayBuffer(minBytes));
		wMin(dv, 0, (src % sPerHour) / 60);
		return new Minute(dv);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(src: number): Minute {
		const dv = new DataView(new ArrayBuffer(minBytes));
		wMin(dv, 0, (src % msPerHour) / msPerMin);
		return new Minute(dv);
	}

	/** Create from microseconds since UNIX epoch */
	public static fromUnixTimeUs(src: number): Minute {
		const dv = new DataView(new ArrayBuffer(minBytes));
		wMin(dv, 0, (src % usPerHour) / usPerMin);
		return new Minute(dv);
	}

	/**
	 * Create from a string accepts:
	 * 'now', a 1-2 digit unsigned integer
	 *
	 * Throws if:
	 * - Not a string, or $input is empty
	 * - The integer value of $input is out of range
	 * - The content of $input isn't valid
	 */
	public static parse(input: WindowStr, strict = false): Minute {
		const dv = new DataView(new ArrayBuffer(minBytes));
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			wMin(dv, 0, new Date().getMinutes());
		} else {
			const e = Core.parseMinute(dv, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Minute(dv);
	}

	/** Create this minute (local) */
	public static now(): Minute {
		const dv = new DataView(new ArrayBuffer(minBytes));
		wMin(dv, 0, new Date().getMinutes());
		return new Minute(dv);
	}

	/** Create this minute (UTC) */
	public static nowUtc(): Minute {
		const dv = new DataView(new ArrayBuffer(minBytes));
		wMin(dv, 0, new Date().getUTCMinutes());
		return new Minute(dv);
	}

	/**
	 * Deserialize next 6 bits into minutes
	 * Throws if:
	 * - There's not 6 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param src Source to read bits from
	 */
	public static deserialize(src: BitReader): Minute {
		const dv = new DataView(new ArrayBuffer(minBytes));
		wMin(dv, 0, src.readNumber(minSerBits));
		return new Minute(dv);
	}
}
const minMi = Minute.new(0);
const maxMi = Minute.new(59);

export class Second extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = secBytes;
	/**Number of bits required to serialize this data */
	static readonly serialBits = secSerBits;

	/** Minimum (0) */
	static get min(): Second {
		return minS;
	}
	/** Maximum (59) */
	static get max(): Second {
		return maxS;
	}

	/** Second, not zero padded (0-59) */
	public toString(): string {
		return rSec(this._d, this._pos).toString();
	}
	/** Second, Zero padded (00-59) */
	public toIsoString(): string {
		return this._second_iso(this._pos);
	}

	/** As an integer (0-59) */
	toJSON(): number {
		return rSec(this._d, this._pos);
	}

	/** As an integer (0-59) */
	public valueOf(): number {
		return rSec(this._d, this._pos);
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(rSec(this._d, this._pos), secSerBits);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return secSerBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Second {
		safe.int.lte('second', rSec(this._d, this._pos), 59);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Second';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Second(${rSec(this._d, this._pos)})`;
	}

	/** Create a new second, range 0-59 */
	public static new(v: number): Second {
		/*vetSecond*/ safe.uint.atMost('second', v, 59);
		const dv = new DataView(new ArrayBuffer(secBytes));
		wSec(dv, 0, v);
		return new Second(dv);
	}

	/**
	 * Create from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Second {
		const dv = new DataView(new ArrayBuffer(secBytes));
		wSec(dv, 0, dt.getSeconds());
		return new Second(dv);
	}

	//fromDateUtc makes no sense

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(s: number): Second {
		const dv = new DataView(new ArrayBuffer(secBytes));
		wSec(dv, 0, s % 60);
		return new Second(dv);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(src: number): Second {
		const dv = new DataView(new ArrayBuffer(secBytes));
		wSec(dv, 0, (src % msPerMin) / msPerSec);
		return new Second(dv);
	}

	/** Create from microseconds since UNIX epoch */
	public static fromUnixTimeUs(src: number): Second {
		const dv = new DataView(new ArrayBuffer(secBytes));
		wSec(dv, 0, (src % usPerMin) / usPerSec);
		return new Second(dv);
	}

	/**
	 * Create from a string accepts:
	 * 'now', a 1-2 digit unsigned integer
	 *
	 * Throws if:
	 * - Not a string, or $input is empty
	 * - The integer value of $input is out of range
	 * - The content of $input isn't valid
	 */
	public static parse(input: WindowStr, strict = false): Second {
		const dv = new DataView(new ArrayBuffer(secBytes));
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			const ms = performance.timeOrigin + performance.now();
			//No need for offset since there's no TZ off by seconds (yet?)
			wSec(dv, 0, (ms / msPerSec) % 60);
		} else {
			const e = Core.parseSecond(dv, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Second(dv);
	}

	/** Current second */
	public static now(): Second {
		const dv = new DataView(new ArrayBuffer(secBytes));
		wSec(dv, 0, new Date().getSeconds());
		return new Second(dv);
	}

	//nowUtc makes no sense: there's no TZ that's off by seconds

	/**
	 * Deserialize next 6 bits into minutes
	 * Throws if:
	 * - There's not 6 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param src Source to read bits from
	 */
	public static deserialize(src: BitReader): Second {
		const dv = new DataView(new ArrayBuffer(secBytes));
		wSec(dv, 0, src.readNumber(secSerBits));
		return new Second(dv);
	}
}
const minS = Second.new(0);
const maxS = Second.new(59);

export class Millisecond extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = milliBytes;
	/**Number of bits required to serialize this data */
	static readonly serialBits = milliSerBits;

	/** Minimum (0) */
	static get min(): Millisecond {
		return minMs;
	}
	/** Maximum (999) */
	static get max(): Millisecond {
		return maxMs;
	}

	/** Value as an integer (0-999999) */
	public valueOf(): number {
		return rMilli(this._d, this._pos);
	}

	/** Millisecond, not zero padded (0-999) */
	public toString(): string {
		return rMilli(this._d, this._pos).toString();
	}

	/** Millisecond, zero padded (000-999)*/
	public toIsoString(): string {
		return this._milli_iso(this._pos);
	}

	/** Value as an integer (0-999) */
	toJSON(): number {
		return rMilli(this._d, this._pos);
	}

	/** Serialize into target  - 10 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(rMilli(this._d, this._pos), milliSerBits);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return milliSerBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Millisecond {
		safe.int.lte('millisecond', rMilli(this._d, this._pos), 999);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Millisecond';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Millisecond(${rMilli(this._d, this._pos)})`;
	}

	/** Create a new Millisecond, range 0-999 */
	public static new(v: number): Millisecond {
		/*vetMilli*/ safe.uint.atMost('millisecond', v, 999);
		const dv = new DataView(new ArrayBuffer(milliBytes));
		wMilli(dv, 0, v);
		return new Millisecond(dv);
	}

	/**
	 * Create a millisecond from a js Date object
	 *
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Millisecond {
		const dv = new DataView(new ArrayBuffer(milliBytes));
		wMilli(dv, 0, dt.getMilliseconds());
		return new Millisecond(dv);
	}

	//no sense: fromDateUtc

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(s: number): Millisecond {
		const dv = new DataView(new ArrayBuffer(milliBytes));
		wMilli(dv, 0, (s * msPerSec) % msPerSec);
		return new Millisecond(dv);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(ms: number): Millisecond {
		const dv = new DataView(new ArrayBuffer(milliBytes));
		wMilli(dv, 0, ms % msPerSec);
		return new Millisecond(dv);
	}

	/** Create from millisecond since UNIX epoch */
	public static fromUnixTimeUs(us: number): Millisecond {
		const dv = new DataView(new ArrayBuffer(milliBytes));
		wMilli(dv, 0, (us / 1000) % msPerSec);
		return new Millisecond(dv);
	}

	/**
	 * Parse from a string, accepts:
	 * 1-3 digit unsigned integer, must be 3 digits if strict.
	 *
	 * Leading whitespace will be removed, trailing whitespace will be ignored (but not removed from window)
	 *
	 * Throws if:
	 * - Not a string, or $str is empty
	 * - There's no available $storage
	 * - The integer value of $str is out of range
	 * - The content of $str isn't valid
	 */
	public static parse(
		input: WindowStr,
		strict = false,
		left = false
	): Millisecond {
		const dv = new DataView(new ArrayBuffer(milliBytes));
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			const ms = performance.timeOrigin + performance.now();
			//No need for offset since there's no TZ off by milliseconds
			wMilli(dv, 0, ms % msPerSec);
		} else {
			const e = Core.parseMilli(dv, 0, input, strict, left, reset);
			if (e) throw e;
		}
		return new Millisecond(dv);
	}

	/** Create this millisecond */
	public static now(): Millisecond {
		const ms = performance.timeOrigin + performance.now();
		const dv = new DataView(new ArrayBuffer(milliBytes));
		wMilli(dv, 0, ms % msPerSec);
		return new Millisecond(dv);
	}

	//nowUtc makes no sense: there's no TZ that's off by milliseconds

	/**
	 * Deserialize next bits into a millisecond
	 * Throws if:
	 * - There's not 20 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param src Source to read bits from
	 */
	public static deserialize(src: BitReader): Millisecond {
		const dv = new DataView(new ArrayBuffer(milliBytes));
		wMilli(dv, 0, src.readNumber(milliSerBits));
		return new Millisecond(dv);
	}
}
const minMs = Millisecond.new(0);
const maxMs = Millisecond.new(999);

export class Microsecond extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = microBytes;
	/**Number of bits required to serialize this data */
	static readonly serialBits = microSerBits;

	/** Minimum (0) */
	static get min(): Microsecond {
		return minUs;
	}
	/** Maximum (999999) */
	static get max(): Microsecond {
		return maxUs;
	}

	/** Value as an integer (0-999999) */
	public valueOf(): number {
		return rMicro(this._d, this._pos);
	}

	/** Microsecond, not zero padded (0-999999) */
	public toString(): string {
		return rMicro(this._d, this._pos).toString();
	}

	/** Microsecond, zero padded (000000-999999)*/
	public toIsoString(): string {
		return this._micro_iso(this._pos);
	}

	/** Value as an integer (0-999999) */
	toJSON(): number {
		return rMicro(this._d, this._pos);
	}

	/** Serialize into target  - 20 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(rMicro(this._d, this._pos), microSerBits);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return microSerBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Microsecond {
		safe.int.lte('microsecond', rMicro(this._d, this._pos), 999999);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Microsecond';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Microsecond(${rMicro(this._d, this._pos)})`;
	}

	/** Create a new Microsecond, range 0-999999 */
	public static new(v: number): Microsecond {
		/*vetMicro*/ safe.uint.atMost('microsecond', v, 999999);
		const dv = new DataView(new ArrayBuffer(microBytes));
		wMicro(dv, 0, v);
		return new Microsecond(dv);
	}

	/**
	 * Create a microsecond from a js Date object
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 *
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Microsecond {
		const dv = new DataView(new ArrayBuffer(microBytes));
		wMicro(dv, 0, dt.getMilliseconds() * 1000);
		return new Microsecond(dv);
	}

	//no sense: fromDateUtc

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(s: number): Microsecond {
		const dv = new DataView(new ArrayBuffer(microBytes));
		wMicro(dv, 0, (s * usPerSec) % usPerSec);
		return new Microsecond(dv);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(ms: number): Microsecond {
		const dv = new DataView(new ArrayBuffer(microBytes));
		wMicro(dv, 0, (ms % msPerSec) * 1000);
		return new Microsecond(dv);
	}

	/** Create from microseconds since UNIX epoch */
	public static fromUnixTimeUs(us: number): Microsecond {
		const dv = new DataView(new ArrayBuffer(microBytes));
		wMicro(dv, 0, us % usPerSec);
		return new Microsecond(dv);
	}

	/**
	 * Parse from a string, accepts:
	 * 1-6 digit unsigned integer, must be 6 digits if strict.
	 *
	 * Leading whitespace will be removed, trailing whitespace will be ignored (but not removed from window)
	 *
	 * Throws if:
	 * - Not a string, or $str is empty
	 * - There's no available $storage
	 * - The integer value of $str is out of range
	 * - The content of $str isn't valid
	 */
	public static parse(
		input: WindowStr,
		strict = false,
		left = false
	): Microsecond {
		const dv = new DataView(new ArrayBuffer(microBytes));
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			const utcNow = performance.timeOrigin + performance.now();
			//No need for offset since there's no TZ off by microseconds
			wMicro(dv, 0, utcNow % usPerSec);
		} else {
			const e = Core.parseMicro(dv, 0, input, strict, left, reset);
			if (e) throw e;
		}
		return new Microsecond(dv);
	}

	/** Create this microsecond */
	public static now(): Microsecond {
		const ms = performance.timeOrigin + performance.now();
		const dv = new DataView(new ArrayBuffer(microBytes));
		wMicro(dv, 0, (ms * 1000) % usPerSec);
		return new Microsecond(dv);
	}

	//nowUtc makes no sense: there's no TZ that's off by microseconds

	/**
	 * Deserialize next bits into a Microsecond
	 * Throws if:
	 * - There's not 20 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param src Source to read bits from
	 */
	public static deserialize(src: BitReader): Microsecond {
		const dv = new DataView(new ArrayBuffer(microBytes));
		wMicro(dv, 0, src.readNumber(microSerBits));
		return new Microsecond(dv);
	}
}
const minUs = Microsecond.new(0);
const maxUs = Microsecond.new(999999);

/**
 * Time of day in microsecond resolution (hh:mm:ss.uuuuuu)
 * Range 00:00:00.000000 - 23:59:59.999999 (no leap second support)
 *
 * *Note*: This is higher resolution than [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 */
export class TimeOnly extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = timeBytes; //6
	/**Number of bits required to serialize this data */
	static readonly serialBits = timeSerBits; //37

	/** Minimum time = 00:00:00.000000 */
	static get min(): TimeOnly {
		return minT;
	}
	/** Maximum time = 23:59:59.999999 */
	static get max(): TimeOnly {
		return maxT;
	}

	/** Hours (0-23) */
	get hour(): number {
		return rHour(this._d, this._pos + 5);
	}
	/** Minutes (0-59) */
	get minute(): number {
		return rMin(this._d, this._pos + 4);
	}
	/** Seconds (0-59) */
	get second(): number {
		return rSec(this._d, this._pos + 3);
	}
	/** Microseconds (0-999999) */
	get microsecond(): number {
		return rMicro(this._d, this._pos);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted time: hh:mm:ss.mmmmmm(z) (all zero padded)
	 * @param [sep=true] Include separators (default) or not
	 */
	public toString(sep = true): string {
		return super._time_iso(this._pos, sep);
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
		return super._time_iso(this._pos, true);
	}

	/** Microseconds (since midnight) */
	toMicroseconds(): number {
		return super.timeToUs(this._pos);
	}

	/** Milliseconds (since midnight) value can be floating point (us component)*/
	toMilliseconds(): number {
		return super.timeToUs(this._pos) / 1000;
	}

	/** Seconds (since midnight) value can be floating point (us component)*/
	toSeconds(): number {
		return super.timeToUs(this._pos) / usPerSec;
	}

	/**
	 * Numeric time, base 10 shifted: 000000000000 - 235959999999
	 * 2^38 so safe in JS as a number
	 * NOTE there are gaps in valid values 240000000000, 236000000000, etc
	 * But you can do <, >, = comparisons
	 */
	public valueOf(): number {
		const [h, i, s, u] = rTime(this._d, this._pos);
		return h * 10000000000 + i * 100000000 + s * 1000000 + u;
	}

	/** Serialize into target  - 38 bits*/
	public serialize(to: BitWriter): void {
		serTime(this._d, this._pos, to);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return timeSerBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): TimeOnly {
		this._time_valid(this._pos);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'TimeOnly';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `TimeOnly(${this._time_iso(this._pos, true)})`;
	}

	/**
	 * Create a new time
	 * @param h Hours 0-23
	 * @param i Minutes 0-59
	 * @param s Seconds 0-59
	 * @param u Microseconds 0-999999
	 */
	public static new(h: number, i: number, s: number, u: number): TimeOnly {
		Core.vetTime(h, i, s, u);
		const dv = new DataView(new ArrayBuffer(timeBytes));
		wTime(dv, 0, h, i, s, u);
		return new TimeOnly(dv);
	}

	/**
	 * Convert from base 10 shifted value {@link valueOf} into new TimeOnly
	 * @param v
	 * @returns
	 */
	public static fromValue(v: number): TimeOnly {
		const dv = new DataView(new ArrayBuffer(timeBytes));
		Core.timeFromValue(dv, 0, v);
		return new TimeOnly(dv);
	}

	/**
	 * Create a time from microseconds since Unix epoch
	 *
	 * @param us Number of microseconds since midnight (if floating point it'll be truncated)
	 */
	public static fromUnixTimeUs(us: number): TimeOnly {
		const dv = new DataView(new ArrayBuffer(timeBytes));
		wTime(
			dv,
			0,
			(us % usPerDay) / usPerHour,
			(us % usPerHour) / usPerMin,
			(us % usPerMin) / usPerSec,
			us % usPerSec
		);
		return new TimeOnly(dv);
	}

	/**
	 * Create a time from float milliseconds since UNIX epoch aka unix time
	 *
	 * @param ms Unix time at millisecond accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTimeMs(ms: number): TimeOnly {
		const dv = new DataView(new ArrayBuffer(timeBytes));
		wTime(
			dv,
			0,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			(ms * 1000) % usPerSec
		);
		return new TimeOnly(dv);
	}

	/**
	 * Create a time from float seconds since UNIX epoch aka unix time
	 *
	 * @param s Unix time at second accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTime(s: number): TimeOnly {
		const dv = new DataView(new ArrayBuffer(timeBytes));
		wTime(
			dv,
			0,
			(s % sPerDay) / sPerHour,
			(s % sPerHour) / 60,
			s % 60,
			(s * usPerSec) % usPerSec
		);
		return new TimeOnly(dv);
	}

	/**
	 * Create a time from a js Date object
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs}/{@link fromUnixTimeUs} with a high resolution (floating point) source
	 * @param date Value used as source
	 */
	public static fromDate(date: Date): TimeOnly {
		const ms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		const dv = new DataView(new ArrayBuffer(timeBytes));
		wTime(
			dv,
			0,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			(ms * 1000) % usPerSec
		);
		return new TimeOnly(dv);
	}

	/**
	 * Parse a string into a date, accepts:
	 * 'now', a 3 part time separated by ':' characters with fractional seconds
	 * @param input
	 */
	public static parse(input: WindowStr, strict = false): TimeOnly {
		const dv = new DataView(new ArrayBuffer(timeBytes));
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			let ms = performance.timeOrigin + performance.now();
			const utcDt = new Date(ms);
			ms -= utcDt.getTimezoneOffset() * msPerMin;
			wTime(
				dv,
				0,
				(ms % msPerDay) / msPerHour,
				(ms % msPerHour) / msPerMin,
				(ms % msPerMin) / msPerSec,
				(ms * 1000) % usPerSec
			);
		} else {
			const e = Core.parseTime(dv, 0, input, strict, reset);
			if (e) throw e;
		}
		return new TimeOnly(dv);
	}

	/** Create time from this point in (local) time */
	public static now(): TimeOnly {
		let ms = performance.timeOrigin + performance.now();
		//Calculate the offset to get it in local time
		const utcDt = new Date(ms);
		ms -= utcDt.getTimezoneOffset() * msPerMin;
		const dv = new DataView(new ArrayBuffer(timeBytes));
		wTime(
			dv,
			0,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			(ms * 1000) % usPerSec
		);
		return new TimeOnly(dv);
	}

	/**
	 * Deserialize next 38 bits into time
	 * Throws if:
	 * - There's not 38 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param src Source to read bits from
	 */
	public static deserialize(src: BitReader): TimeOnly {
		//Keep the memory contiguous
		const dv = new DataView(new ArrayBuffer(timeBytes));
		deserTime(dv, 0, src);
		return new TimeOnly(dv);
	}
}
const minT = TimeOnly.new(0, 0, 0, 0);
const maxT = TimeOnly.new(23, 59, 59, 999999);

/**
 * Time of day in millisecond resolution (h:m:s.mmm)
 * Range 0:0:0.000 - 23:59:59.999 (no leap second support)
 */
export class TimeOnlyMs extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = timeMsBytes; //5

	/**Number of bits required to serialize this data */
	static readonly serialBits =
		hourSerBits + minSerBits + secSerBits + milliSerBits; //27

	/** Minimum time = 00:00:00.000000 */
	static get min(): TimeOnlyMs {
		return minTMs;
	}
	/** Maximum time = 23:59:59.999999 */
	static get max(): TimeOnlyMs {
		return maxTMs;
	}

	/** Hours (0-23) */
	get hour(): number {
		return rHour(this._d, this._pos + 4);
	}
	/** Minutes (0-59) */
	get minute(): number {
		return rMin(this._d, this._pos + 3);
	}
	/** Seconds (0-59) */
	get second(): number {
		return rSec(this._d, this._pos + 2);
	}
	/** Milliseconds (0-999) */
	get millisecond(): number {
		return rMilli(this._d, this._pos);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted time: hh:mm:ss.mmm (all zero padded)
	 */
	public toString(sep = true): string {
		let sep1 = '',
			sep2 = '';
		if (sep) {
			sep1 = ':';
			sep2 = '.';
		}
		return (
			this._hour_iso(this._pos + 4) +
			sep1 +
			this._minute_iso(this._pos + 3) +
			sep1 +
			this._second_iso(this._pos + 2) +
			sep2 +
			this._milli_iso(this._pos)
		);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted time: hh:mm:ss.mmm (all zero padded)
	 */
	toJSON(): string {
		return this.toString(true);
	}

	/** Microseconds (since midnight) */
	toMicroseconds(): number {
		const [h, i, s, ms] = rTimeMs(this._d, this._pos);
		return h * usPerHour + i * usPerMin + s * usPerSec + ms * 1000;
	}

	/** Milliseconds (since midnight) value can be floating point (us component)*/
	toMilliseconds(): number {
		const [h, i, s, ms] = rTimeMs(this._d, this._pos);
		return h * msPerHour + i * msPerMin + s * msPerSec + ms;
	}

	/** Seconds (since midnight) value can be floating point (us component)*/
	toSeconds(): number {
		const [h, i, s, ms] = rTimeMs(this._d, this._pos);
		return h * sPerHour + i * 60 + s + ms / 1000;
	}

	/**
	 * Numeric time, base 10 shifted: 000000000 - 235959999
	 * NOTE there are gaps in valid values 240000000, 236000000, etc
	 * But you can do <, >, = comparisons
	 */
	public valueOf(): number {
		const [h, i, s, ms] = rTimeMs(this._d, this._pos);
		return h * 10000000 + i * 100000 + s * 1000 + ms;
	}

	/** Serialize into target  - 28 bits*/
	public serialize(to: BitWriter): void {
		to.writeNumber(rMilli(this._d, this._pos), milliSerBits);
		to.writeNumber(rSec(this._d, this._pos + 2), secSerBits);
		to.writeNumber(rMin(this._d, this._pos + 3), minSerBits);
		to.writeNumber(rHour(this._d, this._pos + 4), hourSerBits);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return timeSerBits - 10;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): TimeOnlyMs {
		const [h, i, s, ms] = rTimeMs(this._d, this._pos);
		safe.int.lte('hour', h, 23);
		safe.int.lte('minute', i, 59);
		safe.int.lte('second', s, 59);
		safe.int.lte('millisecond', ms, 999);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'TimeOnlyMs';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `TimeOnlyMs(${this.toString()})`;
	}

	/**
	 * Create a new time
	 * @param h Hours 0-23
	 * @param i Minutes 0-59
	 * @param s Seconds 0-59
	 * @param ms Milliseconds 0-999
	 */
	public static new(h: number, i: number, s: number, ms: number): TimeOnlyMs {
		/*vetHour*/ safe.uint.atMost('hour', h, 23);
		/*vetMinute*/ safe.uint.atMost('minute', i, 59);
		/*vetSecond*/ safe.uint.atMost('second', s, 59);
		/*vetMilli*/ safe.uint.atMost('millisecond', ms, 999);

		const dv = new DataView(new ArrayBuffer(timeMsBytes));
		wTimeMs(dv, 0, h, i, s, ms);
		return new TimeOnlyMs(dv);
	}

	/**
	 * Convert from base 10 shifted value {@link valueOf} into new TimeOnlyMs
	 * @param v
	 * @returns
	 */
	public static fromValue(v: number): TimeOnlyMs {
		const ms = v % 1000;
		v = (v - ms) / 1000;
		const s = v % 100;
		v = (v - s) / 100;
		const i = v % 100;
		v = (v - i) / 100;
		/*vetHour*/ safe.uint.atMost('hour', v, 23);
		/*vetMinute*/ safe.uint.atMost('minute', i, 59);
		/*vetSecond*/ safe.uint.atMost('second', s, 59);
		/*vetMilli*/ safe.uint.atMost('millisecond', ms, 999);

		const dv = new DataView(new ArrayBuffer(timeMsBytes));
		wTimeMs(dv, 0, v, i, s, ms);
		return new TimeOnlyMs(dv);
	}

	/**
	 * Create a time from microseconds since Unix epoch
	 *
	 * @param us Number of microseconds since midnight (if floating point it'll be truncated)
	 */
	public static fromUnixTimeUs(us: number): TimeOnlyMs {
		const dv = new DataView(new ArrayBuffer(timeMsBytes));
		wTimeMs(
			dv,
			0,
			(us % usPerDay) / usPerHour,
			(us % usPerHour) / usPerMin,
			(us % usPerMin) / usPerSec,
			(us / 1000) % 1000
		);
		return new TimeOnlyMs(dv);
	}

	/**
	 * Create a time from float milliseconds since UNIX epoch aka unix time
	 *
	 * @param ms Unix time at millisecond accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTimeMs(ms: number): TimeOnlyMs {
		const dv = new DataView(new ArrayBuffer(timeMsBytes));
		wTimeMs(
			dv,
			0,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			ms % msPerSec
		);
		return new TimeOnlyMs(dv);
	}

	/**
	 * Create a time from float seconds since UNIX epoch aka unix time
	 *
	 * @param s Unix time at second accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTime(s: number): TimeOnlyMs {
		const dv = new DataView(new ArrayBuffer(timeMsBytes));
		wTimeMs(
			dv,
			0,
			(s % sPerDay) / sPerHour,
			(s % sPerHour) / 60,
			s % 60,
			(s * 1000) % 1000
		);
		return new TimeOnlyMs(dv);
	}

	/**
	 * Create a time from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date): TimeOnlyMs {
		const ms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		const dv = new DataView(new ArrayBuffer(timeMsBytes));
		wTimeMs(
			dv,
			0,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			ms % msPerSec
		);
		return new TimeOnlyMs(dv);
	}

	/**
	 * Parse a string into a date, accepts:
	 * 'now', a 3 part time separated by ':' characters with fractional seconds
	 * @param input
	 */
	public static parse(input: WindowStr, strict = false): TimeOnlyMs {
		const dv = new DataView(new ArrayBuffer(timeMsBytes));
		const reset = input.getReset();
		input.trim();

		//If content starts with "now" and optionally followed by whitespace - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			return TimeOnlyMs.now();
		}

		let e: Error | undefined = undefined;

		//If it's 9 digits assume it's an un-delimited time
		if (input.test(/^\d{9}$/)) {
			e = Core.parseHour(dv, 4, input.left(2), strict, reset);
			if (e) throw e;
			input.shrink(2);

			e = Core.parseMinute(dv, 3, input.left(2), strict, reset);
			if (e) throw e;
			input.shrink(2);

			e = Core.parseSecond(dv, 2, input.left(2), strict, reset);
			if (e) throw e;
			input.shrink(2);

			e = Core.parseMilli(dv, 0, input, strict, false, reset);
			//This can't generate an error because it already has to be 3 digits (because of test
			// above) and it can be any 3 digit value (0-999)
			//if (e) throw e;

			input.shrink(input.length);
			return new TimeOnlyMs(dv);
		}

		const delim1 = input.indexOf(':');
		let delim2 = input.indexOf(':', delim1 + 1);
		const delim3 = input.indexOf('.', delim2 + 1) - delim2 - 1;
		delim2 = delim2 - delim1 - 1;
		if (delim1 > 0 && delim2 > 0 && delim3 > 0) {
			e = Core.parseHour(dv, 4, input.left(delim1), strict, reset);
			if (e) throw e;
			input.shrink(delim1 + 1);

			e = Core.parseMinute(dv, 3, input.left(delim2).trim(), strict, reset);
			if (e) throw e;
			input.shrink(delim2 + 1);

			e = Core.parseSecond(dv, 2, input.left(delim3).trim(), strict, reset);
			if (e) throw e;
			input.shrink(delim3 + 1);

			e = Core.parseMilli(dv, 0, input.trim(), strict, true, reset);
			if (e) throw e;

			input.shrink(input.length);
			return new TimeOnlyMs(dv);
		}
		throw new ContentError(
			`Expecting hh:mm:ss.###, or hhmmss###`,
			'time',
			input
		);
	}

	/** Create time from this point in (local) time */
	public static now(): TimeOnlyMs {
		let ms = performance.timeOrigin + performance.now();
		//Calculate the offset to get it in local time
		const utcDt = new Date(ms);
		const dv = new DataView(new ArrayBuffer(timeMsBytes));
		ms -= utcDt.getTimezoneOffset() * msPerMin;
		wTimeMs(
			dv,
			0,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			ms % msPerSec
		);
		return new TimeOnlyMs(dv);
	}

	/**
	 * Deserialize next 38 bits into time
	 * Throws if:
	 * - There's not 38 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param src Source to read bits from
	 */
	public static deserialize(src: BitReader): TimeOnlyMs {
		//Keep the memory contiguous
		const dv = new DataView(new ArrayBuffer(timeMsBytes));
		wMilli(dv, 0, src.readNumber(milliSerBits));
		/*deserSec*/ dv.setUint8(2, src.readNumber(secSerBits));
		/*deserMin*/ dv.setUint8(3, src.readNumber(minSerBits));
		/*deserHour*/ dv.setUint8(4, src.readNumber(hourSerBits));
		return new TimeOnlyMs(dv);
	}
}
const minTMs = TimeOnlyMs.new(0, 0, 0, 0);
const maxTMs = TimeOnlyMs.new(23, 59, 59, 999);

class DateTimeShared extends Core {
	/**Number of bytes required to store this data */
	static readonly storageBytes = dtBytes; //10
	/**Number of bits required to serialize this data */
	static readonly serialBits = dateSerBits + timeSerBits; //61

	/** Years (-10000 - +22767) ISO8601 */
	get year(): number {
		return rYear(this._d, this._pos + dt_do_pos + 2);
	}
	/** Months (1-12) */
	get month(): number {
		return rMonth(this._d, this._pos + dt_do_pos + 1);
	}
	/** Days (1-31) */
	get day(): number {
		return rDay(this._d, this._pos + dt_do_pos);
	}
	/** Hours (0-23) */
	get hour(): number {
		return rHour(this._d, this._pos + dt_to_pos + 5);
	}
	/** Minutes (0-59) */
	get minute(): number {
		return rMin(this._d, this._pos + dt_to_pos + 4);
	}
	/** Seconds (0-59) */
	get second(): number {
		return rSec(this._d, this._pos + dt_to_pos + 3);
	}
	/** Microseconds (0-999999) */
	get microsecond(): number {
		return rMicro(this._d, this._pos + dt_to_pos);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date-time: yyyy-mm-ddThh:mm:ss.mmmmmm
	 */
	public toString(dateTimeSep = 'T'): string {
		return (
			this._date_iso(this._pos + dt_do_pos, '-') +
			dateTimeSep +
			this._time_iso(this._pos + dt_to_pos, true)
		);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date-time: yyyy-mm-ddThh:mm:ss.mmmmmm(z)
	 */
	toJSON(): string {
		return (
			this._date_iso(this._pos + dt_do_pos, '-') +
			'T' +
			this._time_iso(this._pos + dt_to_pos, true)
		);
	}

	/** Seconds since the Unix epoch aka unix time */
	toUnixTime(): number {
		return (
			super.toUnixDays(this._pos + dt_do_pos) * sPerDay +
			super.timeToUs(this._pos + dt_to_pos) / usPerSec
		);
	}

	/** Milliseconds since the Unix epoch aka unix time (compatible with `Date` constructor) */
	toUnixTimeMs(): number {
		return (
			super.toUnixDays(this._pos + dt_do_pos) * msPerDay +
			super.timeToUs(this._pos + dt_to_pos) / 1000
		);
	}

	/** Serialize into target*/
	public serialize(to: BitWriter): void {
		serDate(this._d, this._pos + dt_do_pos, to);
		serTime(this._d, this._pos + dt_to_pos, to);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return dateSerBits + timeSerBits;
	}

	protected _addDe(de: DurationExact, dv: DataView): void {
		let miso = super.timeToUs(this._pos + dt_to_pos) % usPerHour;
		let dh = super.toUnixDays(this._pos + dt_do_pos) * 24 + this.hour;
		const [ddh, dmiso] = de.toDhMiso();
		dh += ddh;
		miso += dmiso;

		if (miso >= usPerHour) {
			dh += 1;
			miso -= usPerHour;
		}

		const us = miso + (dh % 24) * usPerHour;
		wTime(
			dv,
			dt_to_pos,
			(us % usPerDay) / usPerHour,
			(us % usPerHour) / usPerMin,
			(us % usPerMin) / usPerSec,
			us % usPerSec
		);
		Core.dateFromUnixDays(dv, dt_do_pos, (dh / 24) | 0);
	}
	protected _addDv(du: Duration, dv: DataView): void {
		let miso = super.timeToUs(this._pos + dt_to_pos) % usPerHour;
		let [y, m, d] = rDate(this._d, this._pos + dt_do_pos);

		const [dy, dm, ddh, dmiso] = du.toYMDhMiso();
		y += dy;
		m += dm;
		if (m > 12) {
			y += 1;
			m -= 12;
		}

		let dim = Month.lastDay(m | 0, y);
		//Correct to the last day for the target month
		if (d > dim) d = dim;

		//Add fraction months, to the nearest day
		d += (dim * (m % 1)) | 0;
		m |= 0;
		//Convert to dh
		let dh = d * 24 + rHour(this._d, this._pos + dt_to_pos + 5);
		dh += ddh;
		miso += dmiso;
		if (miso >= usPerHour) {
			dh += 1;
			miso -= usPerHour;
		}
		//dh can be vastly bigger than a month so we have to while this
		while (dh >= dim * 24 + 23) {
			m += 1;
			if (m > 12) {
				y += 1;
				m = 1;
			}
			dh -= dim * 24;
			dim = Month.lastDay(m, y);
		}
		const us = miso + (dh % 24) * usPerHour;
		wTime(
			dv,
			dt_to_pos,
			(us % usPerDay) / usPerHour,
			(us % usPerHour) / usPerMin,
			(us % usPerMin) / usPerSec,
			us % usPerSec
		);
		wDate(dv, dt_do_pos, y, m, (dh / 24) | 0);
	}
	protected _subDe(du: DurationExact, dv: DataView): void {
		const hmiso = super.timeToUs(this._pos + dt_to_pos);
		let miso = hmiso % usPerHour;
		let dh = (hmiso / usPerHour) | 0;
		dh += super.toUnixDays(this._pos + dt_do_pos) * 24;
		const [ddh, dmiso] = du.toDhMiso();
		dh -= ddh;
		miso -= dmiso;

		if (miso < 0) {
			dh -= 1;
			miso += usPerHour;
		}

		const us = miso + (dh % 24) * usPerHour;
		wTime(
			dv,
			dt_to_pos,
			(us % usPerDay) / usPerHour,
			(us % usPerHour) / usPerMin,
			(us % usPerMin) / usPerSec,
			us % usPerSec
		);
		Core.dateFromUnixDays(dv, dt_do_pos, (dh / 24) | 0);
	}
	protected _subDv(du: Duration, dv: DataView): void {
		const hmiso = super.timeToUs(this._pos + dt_to_pos);
		let miso = hmiso % usPerHour;
		let dh = (hmiso / usPerHour) | 0;

		let [y, m, d] = rDate(this._d, this._pos + dt_do_pos);

		const [dy, dm, ddh, dmiso] = du.toYMDhMiso();

		y -= dy;
		m -= dm;
		let mFrac = m % 1;
		m = Math.ceil(m);
		if (m < 1) {
			y -= 1;
			m += 12;
			//The fraction will also be negative, correct that
			mFrac = 0 - mFrac;
		}

		let dim = Month.lastDay(m, y);
		//Correct to the last day for the target month
		if (d > dim) d = dim;

		//Sub fraction months, to the nearest day - we need to
		// invert the fraction since this is counting back from the end
		if (mFrac > 0) d -= (dim * (1 - mFrac)) | 0;
		//Convert to dh
		dh += (d - 1) * 24;
		dh -= ddh;
		miso -= dmiso;
		if (miso < 0) {
			dh -= 1;
			miso += usPerHour;
		}
		//dh can be vastly bigger than a month so we have to while this
		while (dh < 0) {
			m -= 1;
			if (m < 1) {
				y -= 1;
				m = 12;
			}
			dim = Month.lastDay(m, y);
			dh += dim * 24;
		}
		const us = miso + (dh % 24) * usPerHour;
		wTime(
			dv,
			dt_to_pos,
			(us % usPerDay) / usPerHour,
			(us % usPerHour) / usPerMin,
			(us % usPerMin) / usPerSec,
			us % usPerSec
		);
		wDate(dv, dt_do_pos, y, m, (1 + dh / 24) | 0);
	}

	/**
	 * !danger Because this treats all `dt` the same, careful with confusing types in public implementations
	 * !danger You can call this with wicked invariants.  There are only 6 valid entries:
	 * ```
	 * >  true,false,false
	 * >= true,false,true
	 * <  false,true,false //Can also be achieved with !>=
	 * <= false,true,true //Can also be achieved with !>
	 * == false,false,true
	 * != true,true,false //Can also be achieved with !==, but this fast-exits
	 * ```
	 * @param other
	 * @param gt
	 * @param lt
	 * @param eq
	 * @returns
	 */
	protected cmp<T>(other: DateTimeShared, gt: T, lt: T, eq: T): T {
		// time: [u][u][U][s][i][h]
		// date: [d][m][y][Y]
		// Because this is full LE, we need to check the last pair first (u16)
		// followed by the two u32. 6 comparisons vs 20 is worth it

		//Last pair (yY)
		const t16 = this._d.getUint16(this._pos + 8, LE);
		const o16 = other._d.getUint16(other._pos + 8, LE);
		if (t16 > o16) return gt;
		if (t16 < o16) return lt;

		//Last quad (ihdm)
		let t32 = this._d.getUint32(this._pos + 4, LE);
		let o32 = other._d.getUint32(other._pos + 4, LE);
		if (t32 > o32) return gt;
		if (t32 < o32) return lt;

		//First quad (uuUs)
		t32 = this._d.getUint32(this._pos, LE);
		o32 = other._d.getUint32(other._pos, LE);
		if (t32 > o32) return gt;
		if (t32 < o32) return lt;

		return eq;
	}

	private static _diff(lt: DateTimeShared, erl: DateTimeShared): Duration {
		let [y, m, d] = rDate(lt._d, lt._pos + dt_do_pos);
		const [ey, em, ed] = rDate(erl._d, erl._pos + dt_do_pos);
		y -= ey;
		m -= em;
		d -= ed;

		let [h, i, s, us] = rTime(lt._d, lt._pos + dt_to_pos);
		const [eh, ei, es, eus] = rTime(erl._d, erl._pos + dt_to_pos);
		h -= eh;
		i -= ei;
		s -= es;
		us -= eus;

		if (us < 0) {
			us += usPerSec;
			s -= 1;
		}
		if (s < 0) {
			s += 60;
			i -= 1;
		}
		if (i < 0) {
			i += 60;
			h -= 1;
		}
		if (h < 0) {
			h += 24;
			d -= 1;
		}
		if (d < 0) {
			d += Month.lastDay(em, ey);
			m -= 1;
		}
		if (m < 0) {
			m += 12;
			y -= 1;
		}
		//y can't be <0 (starting gt)
		return Duration.new({ y, m, d, h, i, s, us });
	}
	private static _diffExact(
		lt: DateTimeShared,
		erl: DateTimeShared
	): DurationExact {
		let d =
			lt.toUnixDays(lt._pos + dt_do_pos) - erl.toUnixDays(erl._pos + dt_do_pos);

		let [h, i, s, us] = rTime(lt._d, lt._pos + dt_to_pos);
		const [eh, ei, es, eus] = rTime(erl._d, erl._pos + dt_to_pos);
		h -= eh;
		i -= ei;
		s -= es;
		us -= eus;

		if (us < 0) {
			us += usPerSec;
			s -= 1;
		}
		if (s < 0) {
			s += 60;
			i -= 1;
		}
		if (i < 0) {
			i += 60;
			h -= 1;
		}
		if (h < 0) {
			h += 24;
			d -= 1;
		}
		//d can't be <0 (starting gt)
		return DurationExact.new({ d, h, i, s, us });
	}
	/** Because this treats all `erl` the same, careful with confusing types in public implementations */
	protected diff(erl: DateTimeShared): Duration {
		if (erl.cmp(this, true, false, false))
			return DateTimeShared._diff(erl, this);
		return DateTimeShared._diff(this, erl);
	}

	/** Because this treats all `erl` the same, careful with confusing types in public implementations */
	protected diffExact(erl: DateTimeShared): DurationExact {
		if (erl.cmp(this, true, false, false))
			return DateTimeShared._diffExact(erl, this);
		return DateTimeShared._diffExact(this, erl);
	}
}

/**
 * Date and time down to microsecond resolution, in "local"  Local is *not* UTC (well it might be but
 * since the objects are different it's not)
 * Range: -10000-01-01 00:00:00.000000 - +22767-12-31 23:59:59.999999 (no leap second support)
 *
 * *Note*: This is higher resolution than [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 *
 * *Note*: Without transition data, `DurationExact.Days` and `Duration.Days` will behave the same (no concept of a 23 or 25 hour day)
 *
 * *Note*: Since "local" is vague, daylight/summer/winter time changes are not coded, and so this
 * can represent times that might not exist eg `2024-03-10 02:05` in North America doesn't, but it
 * does in UK, while `2024-03-31 01:05` doesn't exist in the UK
 */
export class DateTimeLocal extends DateTimeShared implements ISerializer {
	/** Minimum dateTime = -10000-01-01 00:00:00.000000 */
	static get min(): DateTimeLocal {
		return minDTL;
	}
	/** Maximum date =  +22767-12-31 23:59:59.999999 */
	static get max(): DateTimeLocal {
		return maxDTL;
	}

	/**
	 * Output as a JS `Date` object (in local)
	 *
	 * *Note*: `Date` only supports millisecond resolution so accuracy will be lost
	 */
	toDate(): Date {
		const [y, m, d] = rDate(this._d, this._pos + dt_do_pos);
		const [h, i, s, us] = rTime(this._d, this._pos + dt_to_pos);
		return new Date(y, /*fucks sake JS*/ m - 1, d, h, i, s, us / 1000);
	}

	/**
	 * String datetime, without separators
	 * NOTE there are gaps in valid values, but you can do < > = comparisons
	 */
	public valueOf(): string {
		return (
			this._date_iso(this._pos + dt_do_pos, '') +
			this._time_iso(this._pos + dt_to_pos, false)
		);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): DateTimeLocal {
		this._time_valid(this._pos + dt_to_pos);
		this._date_valid(this._pos + dt_do_pos);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'DateTimeLocal';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `DateTimeLocal(${this.toString()})`;
	}

	/**
	 * Add an exact duration to this date, returns a new object.  Days
	 * are *always* 24 hours (ie no concept of daylight/summer/winter time)
	 * if you're looking for such consideration add `Duration` instead
	 *
	 * @param du Days/Hours/Minutes/Seconds/Microseconds to add
	 * @returns New DateTime (local)
	 * @pure
	 */
	public add(du: DurationExact): DateTimeLocal;
	/**
	 * Add a duration to this date, elements are added in order:
	 * Years, months, days, hours, minutes, seconds, microseconds.
	 *
	 * After years+months are added, the day may be corrected down
	 * (due to months having different lengths).
	 *
	 * After years+whole months are added, the fraction is truncated to
	 * days (only) based on the resulting month's length.  ie. It's assumed 1/2
	 * a month from January 1st (31d) is January 16th, not January 16th at midday.
	 * This might be most unexpected at when the fraction is in February since half
	 * is only 14 days, while all other months are 15 (because the fraction is truncated).
	 * If you'd rather month-fractions are standardized, move the fraction to days
	 * based on a standard like eg 1m=30d
	 *
	 * Note:
	 * 12*30d months = 360d
	 * 12*31d months = 372d
	 *
	 * Examples:
	 * 2024-02-29 +1y = 2024-02-28 (note the day correction)
	 * 2024-02-29 +4y = 2028-02-29
	 * 2024-02-29 +1m = 2024-03-29
	 * 2024-01-31 +1m = 2024-02-29
	 * 2023-01-31 +1m1d = 2024-03-01
	 * 2024-01-31 +1m1d = 2024-03-01
	 * 2024-05-01 +1.5m = 2024-06-16 (50% of June's 30d = 15d)
	 * 2024-01-01 +1.5m = 2024-02-15
	 * 2024-01-31 +1.5m = 2024-03-14 (+1m=feb, 50%*29d = 14d,)
	 * @returns New DateTime (local)
	 * @pure
	 */
	public add(du: Duration): DateTimeLocal;
	public add(du: DurationExact | Duration): DateTimeLocal {
		const dv = new DataView(new ArrayBuffer(dtBytes));
		if (du instanceof DurationExact) {
			this._addDe(du, dv);
		} else {
			this._addDv(du, dv);
		}
		return new DateTimeLocal(dv);
	}

	/**
	 * Subtract an exact duration from this date, returns a new object.  Days
	 * are *always* 24 hours (ie no)
	 * @returns New DateTime (local)
	 * @pure
	 */
	public sub(du: DurationExact): DateTimeLocal;
	/**
	 * Subtract a duration from this date.  Elements are subtracted in order:
	 * Years, months, days, hours, minutes ,seconds, microseconds.
	 *
	 * After years+months, the day may be corrected down
	 * (due to months having different lengths)
	 *
	 * Once whole months are subtracted, any fraction is converted to days (only),
	 * based on the months length of the date at that point.  It is assumed 1/2
	 * a month back from January 31st (31d) is January 16th, not January 15th at
	 * midday.  This might be most unexpected when the fraction is in February since
	 * half is only 14 days, while all others are 15. If you'd rather month-fractions
	 * are standardized, move the fraction to days based on a standard like 1m=30d
	 * @returns New DateTime (local)
	 * @pure
	 */
	public sub(du: Duration): DateTimeLocal;
	public sub(du: DurationExact | Duration): DateTimeLocal {
		const dv = new DataView(new ArrayBuffer(dtBytes));
		if (du instanceof DurationExact) {
			this._subDe(du, dv);
		} else {
			this._subDv(du, dv);
		}
		return new DateTimeLocal(dv);
	}

	/**
	 * Get the duration between this date-time and `earlier`, duration will contain years
	 * and months when durations are that large.
	 *
	 * **Note**: If `earlier>this` arguments will be inverted (Durations can only be positive)
	 * @pure
	 */
	public diff(earlier: DateTimeLocal): Duration {
		return super.diff(earlier);
	}

	/**
	 * Get the exact duration between this date-time and `earlier`, duration will be composed
	 * of days and smaller units only.
	 *
	 * **Note**: If `earlier>this` arguments will be inverted (Durations can only be positive)
	 * @pure
	 */
	public diffExact(earlier: DateTimeLocal): DurationExact {
		return super.diffExact(earlier);
	}

	/**
	 * Whether this is greater than `other`
	 * @pure
	 */
	public gt(other: DateTimeLocal): boolean {
		return super.cmp(other, true, false, false);
	}

	/**
	 * Whether this is greater than or equal `other`
	 * @pure
	 */
	public gte(other: DateTimeLocal): boolean {
		return super.cmp(other, true, false, true);
	}

	/**
	 * Whether this is less than `other`
	 * @pure
	 */
	public lt(other: DateTimeLocal): boolean {
		return super.cmp(other, false, true, false);
	}

	/**
	 * Whether this is less than or equal `other`
	 * @pure
	 */
	public lte(other: DateTimeLocal): boolean {
		return super.cmp(other, false, true, true);
	}

	/**
	 * Whether this is equal to `other`
	 * @pure
	 */
	public eq(other: DateTimeLocal): boolean {
		return super.cmp(other, false, false, true);
	}

	/**
	 * Whether this is not equal to `other`
	 * @pure
	 */
	public neq(other: DateTimeLocal): boolean {
		return super.cmp(other, true, true, false);
	}

	// /**
	//  * Convert this into UTC time, using *current* (server) running information
	//  * on how far away UTC is.  If "local" was created on another machine, which might
	//  * have had different rules, this is useless
	//  */
	// public asUtc():DateTimeUtc {}

	/**
	 * Create a new DateTime
	 * @param y range -10000 - +22767
	 * @param m range 1 - 12
	 * @param d range 1 - 31
	 * @param h 0-23
	 * @param i 0-59
	 * @param s 0-59
	 * @param u 0-999999
	 */
	public static new(
		y: number,
		m: number,
		d: number,
		h: number,
		i: number,
		s: number,
		u: number
	): DateTimeLocal {
		Core.vetDate(y, m, d);
		Core.vetTime(h, i, s, u);
		const dv = new DataView(new ArrayBuffer(dtBytes));
		wTime(dv, dt_to_pos, h, i, s, u);
		wDate(dv, dt_do_pos, y, m, d);
		return new DateTimeLocal(dv);
	}

	public static fromValue(v: string): DateTimeLocal {
		const dt = parseDec(v.substring(0, v.length - 12));
		const tm = parseDec(v.substring(v.length - 12));
		const dv = new DataView(new ArrayBuffer(dtBytes));
		Core.timeFromValue(dv, dt_to_pos, tm);
		Core.dateFromValue(dv, dt_do_pos, dt);
		return new DateTimeLocal(dv);
	}

	/**
	 * Create a time from a js Date object
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 * @param date Value used as source
	 */
	public static fromDate(date: Date): DateTimeLocal {
		const ms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		return DateTimeLocal.fromUnixTimeMs(ms);
	}

	/**
	 * Create a date-time from float milliseconds since UNIX epoch aka unix time
	 *
	 * @param ms Unix time at millisecond accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTimeMs(ms: number): DateTimeLocal {
		const dv = new DataView(new ArrayBuffer(dtBytes));
		wTime(
			dv,
			dt_to_pos,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			(ms * 1000) % usPerSec
		);
		Core.dateFromUnixDays(dv, dt_do_pos, ms / msPerDay);
		return new DateTimeLocal(dv);
	}

	/**
	 * Create a date-time from float seconds since UNIX epoch aka unix time
	 *
	 * @param s Unix time at second accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTime(s: number): DateTimeLocal {
		const dv = new DataView(new ArrayBuffer(dtBytes));
		wTime(
			dv,
			dt_to_pos,
			(s % sPerDay) / sPerHour,
			(s % sPerHour) / 60,
			s % 60,
			(s * usPerSec) % usPerSec
		);
		Core.dateFromUnixDays(dv, dt_do_pos, s / sPerDay);
		return new DateTimeLocal(dv);
	}

	/** Create this date-time */
	public static now(): DateTimeLocal {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		let ms = performance.timeOrigin + performance.now();
		//Calculate the offset to get it in local time
		const utcDt = new Date(ms);
		ms -= utcDt.getTimezoneOffset() * msPerMin;

		const dv = new DataView(new ArrayBuffer(dtBytes));
		wTime(
			dv,
			dt_to_pos,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			(ms * 1000) % usPerSec
		);
		Core.dateFromUnixDays(dv, dt_do_pos, ms / msPerDay);
		return new DateTimeLocal(dv);
	}

	public static parse(input: WindowStr, strict = false): DateTimeLocal {
		const reset = input.getReset();
		input.trim();

		//If content starts with "now" and optionally followed by whitespace - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			return DateTimeLocal.now();
		}

		const dv = new DataView(new ArrayBuffer(dtBytes));
		let e: Error | undefined = undefined;

		//If it's 20-21 digits, with optional leading sign, tailing z assume it's an un-delimited dateTime
		if (input.test(/^[-+]?\d{20,21}$/)) {
			e = Core.parseDateUndelim(
				dv,
				dt_do_pos,
				input.left(input.length - 12),
				strict,
				reset
			);
			if (e) throw e;
			input.shrink(input.length - 12);

			e = Core.parseTimeUndelim(dv, dt_to_pos, input, strict, reset);
			if (e) throw e;

			input.shrink(input.length);
			return new DateTimeLocal(dv);
		}

		const tPos = input.indexOfAny(['t', 'T']);
		if (tPos > 0) {
			e = Core.parseDate(dv, dt_do_pos, input.left(tPos), strict, reset);
			if (e) throw e;
			input.shrink(tPos + 1);

			e = Core.parseTime(dv, dt_to_pos, input, strict, reset);
			if (e) throw e;

			input.shrink(input.length);
			return new DateTimeLocal(dv);
		}

		throw new ContentError(
			`Expecting yyyy-mm-ddThh:mm:ss.uuuuuuZ or a 20-21 digit date with optional sign/trailing z`,
			'datetime',
			input
		);
	}

	public static deserialize(src: BitReader): DateTimeLocal {
		const dv = new DataView(new ArrayBuffer(dtBytes));
		deserDate(dv, dt_do_pos, src);
		deserTime(dv, dt_to_pos, src);
		return new DateTimeLocal(dv);
	}
}
const minDTL = DateTimeLocal.new(minIsoYear, 1, 1, 0, 0, 0, 0);
const maxDTL = DateTimeLocal.new(maxIsoYear, 12, 31, 23, 59, 59, 999999);

/**
 * Date and time down to microsecond resolution, in UTC
 * Range: -10000-01-01 00:00:00.000000z - +22767-12-31 23:59:59.999999z (no leap second support)
 *
 * *Note*: This is higher resolution than [Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
 *
 * *Note*: Because UTC doesn't shift, `DurationExact.Days` and `Duration.Days` will behave the same
 */
export class DateTimeUtc extends DateTimeShared implements ISerializer {
	/** Minimum dateTime = -10000-01-01 00:00:00.000000 */
	static get min(): DateTimeShared {
		return minDTU;
	}
	/** Maximum date =  +22767-12-31 23:59:59.999999 */
	static get max(): DateTimeShared {
		return maxDTU;
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date-time: yyyy-mm-ddThh:mm:ss.mmmmmmZ
	 */
	public toString(dateTimeSep = 'T'): string {
		return (
			this._date_iso(this._pos + dt_do_pos, '-') +
			dateTimeSep +
			this._time_iso(this._pos + dt_to_pos, true) +
			'Z'
		);
	}

	/**
	 * Output as a JS `Date` object (in UTC)
	 *
	 * *Note*: `Date` only supports millisecond resolution so accuracy will be lost
	 */
	toDate(): Date {
		return new Date(
			super.toUnixDays(this._pos + dt_do_pos) * msPerDay +
				this.timeToUs(this._pos + dt_to_pos) / 1000
		);
	}

	/**
	 * String datetime, without separators
	 * NOTE there are gaps in valid values, but you can do < > = comparisons
	 * NOTE UTC indicator is not included in this value
	 */
	public valueOf(): string {
		return (
			this._date_iso(this._pos + dt_do_pos, '') +
			this._time_iso(this._pos + dt_to_pos, false)
		);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): DateTimeUtc {
		this._time_valid(this._pos + dt_to_pos);
		this._date_valid(this._pos + dt_do_pos);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'DateTimeUtc';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `DateTimeUtc(${this.toString()})`;
	}

	/**
	 * Add an exact duration to this date, returns a new object.
	 *
	 * @param du Days/Hours/Minutes/Seconds/Microseconds to add
	 * @returns New DateTime (UTC)
	 * @pure
	 */
	public add(du: DurationExact): DateTimeUtc;
	/**
	 * Add a duration to this date, elements are added in order:
	 * Years, months, days, hours, minutes, seconds, microseconds.
	 *
	 * After years+months are added, the day may be corrected down
	 * (due to months having different lengths).
	 *
	 * After years+whole months are added, the fraction is truncated to
	 * days (only) based on the resulting month's length.  ie. It's assumed 1/2
	 * a month from January 1st (31d) is January 16th, not January 16th at midday.
	 * This might be most unexpected at when the fraction is in February since half
	 * is only 14 days, while all other months are 15 (because the fraction is truncated).
	 * If you'd rather month-fractions are standardized, move the fraction to days
	 * based on a standard like eg 1m=30d
	 *
	 * Note:
	 * 12*30d months = 360d
	 * 12*31d months = 372d
	 *
	 * Examples:
	 * 2024-02-29 +1y = 2024-02-28 (note the day correction)
	 * 2024-02-29 +4y = 2028-02-29
	 * 2024-02-29 +1m = 2024-03-29
	 * 2024-01-31 +1m = 2024-02-29
	 * 2023-01-31 +1m1d = 2024-03-01
	 * 2024-01-31 +1m1d = 2024-03-01
	 * 2024-05-01 +1.5m = 2024-06-16 (50% of June's 30d = 15d)
	 * 2024-01-01 +1.5m = 2024-02-15
	 * 2024-01-31 +1.5m = 2024-03-14 (+1m=feb, 50%*29d = 14d,)
	 * @param du
	 * @pure
	 */
	public add(du: Duration): DateTimeUtc;
	public add(du: DurationExact | Duration): DateTimeUtc {
		const dv = new DataView(new ArrayBuffer(dtBytes));
		if (du instanceof DurationExact) {
			this._addDe(du, dv);
		} else {
			this._addDv(du, dv);
		}
		return new DateTimeUtc(dv);
	}
	/**
	 * Subtract an exact duration from this date, returns a new object.  Days
	 * are *always* 24 hours (ie no)
	 * @returns New DateTime (UTC)
	 * @pure
	 */
	public sub(du: DurationExact): DateTimeUtc;
	/**
	 * Subtract a duration from this date.  Elements are subtracted in order:
	 * Years, months, days, hours, minutes ,seconds, microseconds.
	 *
	 * After years+months, the day may be corrected down
	 * (due to months having different lengths)
	 *
	 * Once whole months are subtracted, any fraction is converted to days (only),
	 * based on the months length of the date at that point.  It is assumed 1/2
	 * a month back from January 31st (31d) is January 16th, not January 15th at
	 * midday.  This might be most unexpected when the fraction is in February since
	 * half is only 14 days, while all others are 15. If you'd rather month-fractions
	 * are standardized, move the fraction to days based on a standard like 1m=30d
	 * @returns New DateTime (UTC)
	 * @pure
	 */
	public sub(du: Duration): DateTimeUtc;
	public sub(du: DurationExact | Duration): DateTimeUtc {
		const dv = new DataView(new ArrayBuffer(dtBytes));
		if (du instanceof DurationExact) {
			this._subDe(du, dv);
		} else {
			this._subDv(du, dv);
		}
		return new DateTimeUtc(dv);
	}
	//asUtc|asLocal tbd

	/**
	 * Whether this is greater than `other`
	 * @param other
	 * @returns True - this is greater, false-this is less or equal
	 * @pure
	 */
	public gt(other: DateTimeUtc): boolean {
		return super.cmp(other, true, false, false);
	}

	/**
	 * Whether this is greater than or equal `other`
	 * @param other
	 * @pure
	 */
	public gte(other: DateTimeUtc): boolean {
		return super.cmp(other, true, false, true);
	}

	/**
	 * Whether this is less than `other`
	 * @pure
	 */
	public lt(other: DateTimeUtc): boolean {
		return super.cmp(other, false, true, false);
	}

	/**
	 * Whether this is less than or equal `other`
	 * @pure
	 */
	public lte(other: DateTimeUtc): boolean {
		return super.cmp(other, false, true, true);
	}

	/**
	 * Whether this is equal to `other`
	 * @pure
	 */
	public eq(other: DateTimeUtc): boolean {
		return super.cmp(other, false, false, true);
	}

	/**
	 * Whether this is not equal to `other`
	 * @pure
	 */
	public neq(other: DateTimeUtc): boolean {
		return super.cmp(other, true, true, false);
	}

	/**
	 * Get the duration between this date-time and `earlier`, duration will contain years
	 * and months when durations are that large.
	 *
	 * **Note**: If `earlier>this` arguments will be inverted (Durations can only be positive)
	 * @pure
	 */
	public diff(earlier: DateTimeUtc): Duration {
		return super.diff(earlier);
	}

	/**
	 * Get the exact duration between this date-time and `earlier`, duration will be composed
	 * of days and smaller units only.
	 *
	 * **Note**: If `earlier>this` arguments will be inverted (Durations can only be positive)
	 * @pure
	 */

	public diffExact(earlier: DateTimeUtc): DurationExact {
		return super.diffExact(earlier);
	}

	/**
	 * Create a new DateTime
	 * @param y range -10000 - +22767
	 * @param m range 1 - 12
	 * @param d range 1 - 31
	 * @param h 0-23
	 * @param i 0-59
	 * @param s 0-59
	 * @param u 0-999999
	 */
	public static new(
		y: number,
		m: number,
		d: number,
		h: number,
		i: number,
		s: number,
		u: number
	): DateTimeUtc {
		Core.vetDate(y, m, d);
		Core.vetTime(h, i, s, u);
		const dv = new DataView(new ArrayBuffer(dtBytes));
		wTime(dv, dt_to_pos, h, i, s, u);
		wDate(dv, dt_do_pos, y, m, d);
		return new DateTimeUtc(dv);
	}

	public static fromValue(v: string): DateTimeUtc {
		const dt = parseDec(v.substring(0, v.length - 12));
		const tm = parseDec(v.substring(v.length - 12));
		const dv = new DataView(new ArrayBuffer(dtBytes));
		Core.timeFromValue(dv, dt_to_pos, tm);
		Core.dateFromValue(dv, dt_do_pos, dt);
		return new DateTimeUtc(dv);
	}

	/**
	 * Create a time from a js Date object
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 * @param date Value used as source
	 */
	public static fromDate(date: Date): DateTimeUtc {
		const ms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		const dv = new DataView(new ArrayBuffer(dtBytes));
		wTime(
			dv,
			dt_to_pos,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			(ms * 1000) % usPerSec
		);
		Core.dateFromUnixDays(dv, dt_do_pos, ms / msPerDay);
		return new DateTimeUtc(dv);
	}

	/**
	 * Create a date-time from float milliseconds since UNIX epoch aka unix time
	 *
	 * @param ms Unix time at millisecond accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTimeMs(ms: number): DateTimeUtc {
		const dv = new DataView(new ArrayBuffer(dtBytes));
		wTime(
			dv,
			dt_to_pos,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			(ms * 1000) % usPerSec
		);
		Core.dateFromUnixDays(dv, dt_do_pos, ms / msPerDay);
		return new DateTimeUtc(dv);
	}

	/**
	 * Create a date-time from float seconds since UNIX epoch aka unix time
	 *
	 * @param s Unix time at second accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTime(s: number): DateTimeUtc {
		const dv = new DataView(new ArrayBuffer(dtBytes));
		wTime(
			dv,
			dt_to_pos,
			(s % sPerDay) / sPerHour,
			(s % sPerHour) / 60,
			s % 60,
			(s * usPerSec) % usPerSec
		);
		Core.dateFromUnixDays(dv, dt_do_pos, s / sPerDay);
		return new DateTimeUtc(dv);
	}

	/** Create this date-time (UTC) */
	public static now(): DateTimeUtc {
		const ms = performance.timeOrigin + performance.now();
		const dv = new DataView(new ArrayBuffer(dtBytes));
		wTime(
			dv,
			dt_to_pos,
			(ms % msPerDay) / msPerHour,
			(ms % msPerHour) / msPerMin,
			(ms % msPerMin) / msPerSec,
			(ms * 1000) % usPerSec
		);
		Core.dateFromUnixDays(dv, dt_do_pos, ms / msPerDay);
		return new DateTimeUtc(dv);
	}

	public static parse(input: WindowStr, strict = false): DateTimeUtc {
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			return DateTimeUtc.now();
		}

		const dv = new DataView(new ArrayBuffer(dtBytes));
		let e: Error | undefined = undefined;

		const zPos = input.lastIndexOfAny(['z', 'Z']);
		let hasZ = false;
		if (zPos == input.length - 1) {
			input.shrink(0, 1);
			hasZ = true;
		}

		//If it's 20-21 digits, with optional leading sign, tailing z assume it's an un-delimited dateTime
		if (input.test(/^[-+]?\d{20,21}$/)) {
			e = Core.parseDateUndelim(
				dv,
				dt_do_pos,
				input.left(input.length - 12),
				strict,
				reset
			);
			if (e) throw e;
			input.shrink(input.length - 12);

			e = Core.parseTimeUndelim(dv, dt_to_pos, input, strict, reset);
			if (e) throw e;

			input.shrink(input.length);
			return new DateTimeUtc(dv);
		}

		const tPos = input.indexOfAny(['t', 'T']);
		//z is required if strict
		if (tPos > 0 && (hasZ || !strict)) {
			e = Core.parseDate(dv, dt_do_pos, input.left(tPos), strict, reset);
			if (e) throw e;
			input.shrink(tPos + 1);

			e = Core.parseTime(dv, dt_to_pos, input, strict, reset);
			if (e) throw e;

			input.shrink(input.length);
			return new DateTimeUtc(dv);
		}

		reset();
		throw new ContentError(
			`Expecting yyyy-mm-ddThh:mm:ss.uuuuuuZ or a 20-21 digit date with optional sign/trailing z`,
			'datetime',
			input
		);
	}

	public static deserialize(src: BitReader): DateTimeUtc {
		const dv = new DataView(new ArrayBuffer(dtBytes));
		deserDate(dv, dt_do_pos, src);
		deserTime(dv, dt_to_pos, src);
		return new DateTimeUtc(dv);
	}
}
const minDTU = DateTimeUtc.new(minIsoYear, 1, 1, 0, 0, 0, 0);
const maxDTU = DateTimeUtc.new(maxIsoYear, 12, 31, 23, 59, 59, 999999);

/*
* *Note*: Subject to the daylight/summer/winter time rules (when the change 
    happens, what the change is) for example 2024-03-10 02:05 doesn't exist 
    in North America (02->03 for daylight savings) but it does in Europe, 
    and 2024-03-31 01:05 doesn't exist in UK (01->02 for daylight savings),
    2024-03-31 02:05 doesn't exist in France (02->03 for daylight savings).. 
    all of the EU moves at the same time (UTC)
*/
//class DateTimeTz{}
