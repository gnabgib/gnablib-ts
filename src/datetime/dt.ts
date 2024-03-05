/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { somewhatSafe as safe } from '../safe/index.js';
import { BitReader } from '../primitive/BitReader.js';
import { BitWriter } from '../primitive/BitWriter.js';
import { WindowStr } from '../primitive/WindowStr.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../primitive/interfaces/ISerializer.js';
import { parseDec } from '../primitive/number/Int.js';
import { Duration, DurationExact } from './Duration.js';
import { AtMostError } from '../error/AtMostError.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

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

const yearSerBits = 15; //2^15 = 32767
const monthSerBits = 4; //2^4 = 16
const daySerBits = 5; //2^5 = 32
const hourSerBits = 5; //2^5 = 32
const minSerBits = 6; //2^6 = 64
const secSerBits = 6; //2^6 = 64
const milliSerBits = 10; //2^10 = 1024
const microSerBits = 20; //2^20 = 1048576

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

//There's definitely some entangled intent here, but we get to reuse code at the
// component/rollup(date|time)/double rollup (datetime) by sharing a core
class Core {
	protected constructor(
		protected readonly _stor: Uint8Array,
		protected readonly _pos: number
	) {}

	protected _year(p: number): number {
		return ((this._stor[p] << 8) | this._stor[p + 1]) - 10000;
	}
	protected _month(p: number): number {
		return this._stor[p] + 1;
	}
	protected _day(p: number): number {
		return this._stor[p] + 1;
	}
	protected _hour(p: number): number {
		return this._stor[p];
	}
	protected _minute(p: number): number {
		return this._stor[p];
	}
	protected _second(p: number): number {
		return this._stor[p];
	}
	protected _milli(p: number): number {
		return (this._stor[p] << 8) | this._stor[p + 1];
	}
	protected _micro(p: number): number {
		return (this._stor[p] << 16) | (this._stor[p + 1] << 8) | this._stor[p + 2];
	}

	protected _year_iso(p: number): string {
		let v = ((this._stor[p] << 8) | this._stor[p + 1]) - 10000;
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
		const s = (this._stor[p] + 1).toString();
		return ('00' + s).substring(s.length);
	}
	protected _day_iso(p: number): string {
		const s = (this._stor[p] + 1).toString();
		return ('00' + s).substring(s.length);
	}
	protected _date_iso(p: number, sep: string): string {
		let ret = this._year_iso(p) + sep;
		p += yearBytes;
		ret += this._month_iso(p) + sep;
		return ret + this._day_iso(p + monthBytes);
	}
	protected _hour_iso(p: number): string {
		const s = this._stor[p].toString();
		return ('00' + s).substring(s.length);
	}
	protected _minute_iso(p: number): string {
		const s = this._stor[p].toString();
		return ('00' + s).substring(s.length);
	}
	protected _second_iso(p: number): string {
		const s = this._stor[p].toString();
		return ('00' + s).substring(s.length);
	}
	protected _milli_iso(p: number): string {
		const v = (this._stor[p] << 8) | this._stor[p + 1];
		const s = v.toString();
		return ('000' + s).substring(s.length);
	}
	protected _micro_iso(p: number): string {
		const v =
			(this._stor[p] << 16) | (this._stor[p + 1] << 8) | this._stor[p + 2];
		const s = v.toString();
		return ('000000' + s).substring(s.length);
	}
	protected _time_iso(p: number, sep: boolean): string {
		let sep1 = '',
			sep2 = '';
		if (sep) {
			sep1 = ':';
			sep2 = '.';
		}
		let ret = this._hour_iso(p) + sep1;
		p += hourBytes;
		ret += this._minute_iso(p) + sep1;
		p += minBytes;
		ret += this._second_iso(p) + sep2;
		return ret + this._micro_iso(p + secBytes);
	}

	protected _date_ser(to: BitWriter, p: number): void {
		to.writeNumber((this._stor[p++] << 8) | this._stor[p++], yearSerBits);
		to.writeNumber(this._stor[p++], monthSerBits);
		to.writeNumber(this._stor[p], daySerBits);
	}
	protected _timeMs_ser(to: BitWriter, p: number): void {
		to.writeNumber(this._stor[p++], hourSerBits);
		to.writeNumber(this._stor[p++], minSerBits);
		to.writeNumber(this._stor[p++], secSerBits);
		to.writeNumber((this._stor[p++] << 8) | this._stor[p], milliSerBits);
	}
	protected _time_ser(to: BitWriter, p: number): void {
		to.writeNumber(this._stor[p++], hourSerBits);
		to.writeNumber(this._stor[p++], minSerBits);
		to.writeNumber(this._stor[p++], secSerBits);
		to.writeNumber(
			(this._stor[p++] << 16) | (this._stor[p++] << 8) | this._stor[p],
			microSerBits
		);
	}

	protected _date_valid(p: number): void {
		//no validate needed for year (can't exceed with ser)
		//no need for negative check (all uint)
		p += yearBytes;
		const m = this._month(p);
		safe.int.lte('month', m, 12);
		safe.int.lte(
			'day',
			this._day(p + monthBytes),
			Month.lastDay(m, this._year(p))
		);
	}
	protected _time_valid(p: number): void {
		safe.int.lte('hour', this._hour(p), 23);
		p += hourBytes;
		safe.int.lte('minute', this._minute(p), 59);
		p += minBytes;
		safe.int.lte('second', this._second(p), 59);
		p += secBytes;
		safe.int.lte('microsecond', this._micro(p), 999999);
	}

	/** Days since the Unix epoch (1970-01-01) */
	protected toUnixDays(p: number): number {
		let yv = this._year(p);
		p += yearBytes;
		let mv = this._month(p);
		const dv = this._day(p + monthBytes);
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
		let ret = this._hour(p) * usPerHour;
		p += hourBytes;
		ret += this._minute(p) * usPerMin;
		p += minBytes;
		ret += this._second(p) * usPerSec;
		return ret + this._micro(p + secBytes);
	}

	protected static writeYear(to: Uint8Array, p: number, v: number): void {
		v += 10000;
		to[p] = v >> 8;
		to[p + 1] = v;
	}
	protected static writeDate(
		to: Uint8Array,
		p: number,
		y: number,
		m: number,
		d: number
	): void {
		Core.writeYear(to, p, y);
		p += yearBytes;
		/*writeMonth*/ to[p++] = m - 1;
		/*writeDay*/ to[p] = d - 1;
	}
	protected static writeMilli(to: Uint8Array, p: number, v: number): void {
		to[p] = v >> 8;
		to[p + 1] = v;
	}
	protected static writeMicro(to: Uint8Array, p: number, v: number): void {
		to[p] = v >> 16;
		to[p + 1] = v >> 8;
		to[p + 2] = v;
	}
	protected static writeTime(
		to: Uint8Array,
		pos: number,
		h: number,
		i: number,
		s: number,
		u: number
	): void {
		/*writeHour*/ to[pos++] = h;
		/*writeMinute*/ to[pos++] = i;
		/*writeSecond*/ to[pos++] = s;
		Core.writeMicro(to, pos, u);
	}

	protected static writeYFromDt(to: Uint8Array, p: number, dt: Date): void {
		const v = dt.getFullYear() + 10000; //Convert to holocene
		to[p] = v >> 8;
		to[p + 1] = v;
	}
	protected static writeMoFromDt(to: Uint8Array, p: number, dt: Date): void {
		to[p] = dt.getMonth(); //We store months 0 based too (but we don't trouble the dev with that detail)
	}
	protected static writeDFromDt(to: Uint8Array, p: number, dt: Date): void {
		to[p] = dt.getDate() - 1; //We store 0 based
	}
	protected static writeDtFromDt(to: Uint8Array, p: number, dt: Date): void {
		Core.writeYFromDt(to, p, dt);
		p += yearBytes;
		Core.writeMoFromDt(to, p, dt);
		Core.writeDFromDt(to, p + monthBytes, dt);
	}
	protected static writeMsFromDt(to: Uint8Array, p: number, dt: Date): void {
		const v = dt.getMilliseconds();
		to[p] = v >> 8;
		to[p + 1] = v;
	}
	protected static writeUsFromDt(to: Uint8Array, p: number, dt: Date): void {
		const v = dt.getMilliseconds() * 1000;
		to[p] = v >> 16;
		to[p + 1] = v >> 8;
		to[p + 2] = v;
	}

	protected static vetDate(y: number, m: number, d: number): void {
		/*vetYear*/ safe.int.inRangeInc('year', y, minIsoYear, maxIsoYear);
		/*vetMonth*/ safe.int.inRangeInc('month', m, 1, 12);
		/*vetDay*/ safe.int.inRangeInc('day', d, 1, Month.lastDay(m, y));
	}
	protected static vetTime(h: number, i: number, s: number, u: number): void {
		/*vetHour*/ safe.int.inRangeInc('hour', h, 0, 23);
		/*vetMinute*/ safe.int.inRangeInc('minute', i, 0, 59);
		/*vetSecond*/ safe.int.inRangeInc('second', s, 0, 59);
		/*vetMicro*/ safe.int.inRangeInc('microsecond', u, 0, 999999);
	}

	protected static timeMsFromUnixMs(
		to: Uint8Array,
		p: number,
		ms: number
	): void {
		to[p] = (ms % msPerDay) / msPerHour;
		p += hourBytes;
		to[p] = (ms % msPerHour) / msPerMin;
		p += minBytes;
		to[p] = (ms % msPerMin) / msPerSec;
		Core.writeMilli(to, p + secBytes, ms % msPerSec);
	}
	protected static timeFromUnixUs(to: Uint8Array, p: number, us: number): void {
		/*hFromUnixUs*/ to[p++] = (us % usPerDay) / usPerHour;
		/*miFromUnixUs*/ to[p++] = (us % usPerHour) / usPerMin;
		/*sFromUnixUs*/ to[p++] = (us % usPerMin) / usPerSec;
		Core.writeMicro(to, p, us % usPerSec);
	}

	protected static parseYear(
		to: Uint8Array,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//Optional leading +-, one or more digits, optional trailing space, nothing else
		const r = input.match(/^([+-])?(\d+)$/);
		if (r !== null) {
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
			if (!isNaN(intVal)) {
				if (sign) {
					input.shrink(1);
					if (sign === '-') intVal = 0 - intVal;
				}
				if (intVal >= minIsoYear && intVal <= maxIsoYear) {
					input.shrink(digits.length);
					Core.writeYear(to, p, intVal);
					return;
				}
			}
		}
		reset();
		return new ContentError('expecting signed integer-string', 'year', input);
	}
	protected static parseMonth(
		to: Uint8Array,
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
		if (r !== null) {
			const [, mon, int] = r;
			if (mon != undefined) {
				//Try and parse using Date and local settings (16th makes unambiguous day)
				const unixMs = Date.parse(mon + ' 16, 2000');
				if (!Number.isNaN(unixMs)) {
					input.shrink(mon.length);
					/*writeMonth*/ to[p] = new Date(unixMs).getMonth();
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
					/*writeMonth*/ to[p] = intVal - 1;
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
		to: Uint8Array,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r !== null) {
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
				/*writeDay*/ to[p] = intVal - 1;
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
		to: Uint8Array,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		let e = Core.parseYear(to, p, input.left(input.length - 4), strict, reset);
		if (e) return e;
		/*_year*/ const y = ((to[p++] << 8) | to[p++]) - 10000;
		input.shrink(input.length - 4);

		e = Core.parseMonth(to, p, input.left(2), strict, reset);
		if (e) return e;
		/*_month*/ const m = to[p++] + 1;
		input.shrink(2);

		e = Core.parseDay(to, p, input, strict, reset);
		if (e) return e;
		/*_day*/ const d = to[p] + 1;

		//Check for day invariance
		const dim = Month.lastDay(m, y);
		if (d > dim) return new AtMostError('day', d, dim);

		input.shrink(input.length);
		return;
	}
	protected static parseDate(
		to: Uint8Array,
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
			e = Core.parseYear(to, p, input.left(delim1).trimEnd(), strict, reset);
			if (e) return e;
			input.shrink(delim1 + 1);
			/*_year*/ const y = ((to[p++] << 8) | to[p++]) - 10000;

			e = Core.parseMonth(to, p, input.left(delim2).trim(), strict, reset);
			if (e) return e;
			input.shrink(delim2 + 1);
			/*_month*/ const m = to[p++] + 1;

			e = Core.parseDay(to, p, input.trim(), strict, reset);
			if (e) return e;
			/*_day*/ const d = to[p] + 1;

			//Check for day invariance
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
		to: Uint8Array,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r !== null) {
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
				/*writeHour*/ to[p] = intVal;
				return;
			}
		}
		reset();
		return new ContentError('expecting unsigned integer-string', 'hour', input);
	}
	protected static parseMinute(
		to: Uint8Array,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r !== null) {
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
				/*writeMinute*/ to[p] = intVal;
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
		to: Uint8Array,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r !== null) {
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
				/*writeSecond*/ to[p] = intVal;
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
		to: Uint8Array,
		p: number,
		input: WindowStr,
		strict: boolean,
		left: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r !== null) {
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
				Core.writeMilli(to, p, intVal);
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
		to: Uint8Array,
		p: number,
		input: WindowStr,
		strict: boolean,
		left: boolean,
		reset: () => void
	): Error | undefined {
		//One more more digits, optional trailing whitespace only
		const r = input.match(/^(\d+)$/);
		if (r !== null) {
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
				Core.writeMicro(to, p, intVal);
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
		to: Uint8Array,
		p: number,
		input: WindowStr,
		strict: boolean,
		reset: () => void
	): Error | undefined {
		let e = Core.parseHour(to, p, input.left(2), strict, reset);
		if (e) return e;
		p += hourBytes;
		input.shrink(2);

		e = Core.parseMinute(to, p, input.left(2), strict, reset);
		if (e) return e;
		p += minBytes;
		input.shrink(2);

		e = Core.parseSecond(to, p, input.left(2), strict, reset);
		if (e) return e;
		p += secBytes;
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
		to: Uint8Array,
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
			e = Core.parseHour(to, p, input.left(delim1).trim(), strict, reset);
			if (e) return e;
			p += hourBytes;
			input.shrink(delim1 + 1);

			e = Core.parseMinute(to, p, input.left(delim2).trim(), strict, reset);
			if (e) return e;
			p += minBytes;
			input.shrink(delim2 + 1);

			e = Core.parseSecond(to, p, input.left(delim3).trim(), strict, reset);
			if (e) return e;
			p += secBytes;
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
	protected static deserYear(to: Uint8Array, p: number, src: BitReader): void {
		//This is a raw-write (writeYear does a value-transform)
		const v = src.readNumber(yearSerBits);
		to[p] = v >> 8;
		to[p + 1] = v;
	}
	protected static deserDate(to: Uint8Array, p: number, src: BitReader): void {
		Core.deserYear(to, p, src);
		p += yearBytes;
		/*deserMonth*/ to[p++] = src.readNumber(monthSerBits);
		/*deserDay*/ to[p] = src.readNumber(daySerBits);
	}
	protected static deserTime(to: Uint8Array, p: number, src: BitReader): void {
		/*deserHour*/ to[p++] = src.readNumber(hourSerBits);
		/*deserMin*/ to[p++] = src.readNumber(minSerBits);
		/*deserSec*/ to[p++] = src.readNumber(secSerBits);
		/*deserMicro*/ Core.writeMicro(to, p, src.readNumber(microSerBits));
	}

	protected static dateFromValue(to: Uint8Array, p: number, v: number): void {
		const d = v % 100;
		v = (v - d) / 100;
		const m = v % 100;
		v = (v - m) / 100;
		Core.vetDate(v, m, d);
		Core.writeDate(to, p, v, m, d);
	}
	protected static timeFromValue(to: Uint8Array, p: number, v: number): void {
		const u = v % 1000000;
		v = (v - u) / 1000000;
		const s = v % 100;
		v = (v - s) / 100;
		const i = v % 100;
		v = (v - i) / 100;
		Core.vetTime(v, i, s, u);
		Core.writeTime(to, p, v, i, s, u);
	}

	protected static dateFromUnixDays(
		to: Uint8Array,
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
		Core.writeDate(to, p, y, m, d);
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
		return (
			((this._stor[this._pos] << 8) | this._stor[this._pos + 1]) -
			10000
		).toString();
	}

	/** Year ISO8601, zero padded if >-1000,<1000, includes sign if >4 digits */
	public toIsoString(): string {
		return this._year_iso(this._pos);
	}

	/** Year in ISO8601 as an integer (0=1BC, -10000=10001BC, 2024=2024AD) */
	toJSON(): number {
		return ((this._stor[this._pos] << 8) | this._stor[this._pos + 1]) - 10000;
	}

	/** Year in ISO8601 as an integer (0=1BC, -10000=10001BC, 2024=2024AD) */
	public valueOf(): number {
		return ((this._stor[this._pos] << 8) | this._stor[this._pos + 1]) - 10000;
	}

	/** Serialize into target  - 15 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(
			(this._stor[this._pos] << 8) | this._stor[this._pos + 1],
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
		return `Year(${this.toString()})`;
	}

	/** Create a new year in ISO601 format, range -10000 - +22767 */
	public static new(v: number): Year {
		const stor = new Uint8Array(yearBytes);
		/*vetYear*/ safe.int.inRangeInc('year', v, minIsoYear, maxIsoYear);
		Core.writeYear(stor, 0, v);
		return new Year(stor, 0);
	}

	/**
	 * Create a new year in Gregorian format, range 10001BC - 22676AD
	 * @param year 1-22676 if AD, 1-10001 if BC (no zero year)
	 * @param ad True=Anno Domini(AD)/Common Era(CE), False=Before Chris(BC)/Before common era (BCE)
	 */
	public static newGregorian(year: number, ad = true): Year {
		const stor = new Uint8Array(yearBytes);
		if (ad) {
			safe.int.inRangeInc('year', year, 1, maxIsoYear);
			Core.writeYear(stor, 0, year);
		} else {
			safe.int.inRangeInc('-year', year, 1, 10001);
			Core.writeYear(stor, 0, 1 - year);
		}
		return new Year(stor, 0);
	}

	/** Create a new year in Holocene format, range 0 - 32767*/
	public static newHolocene(year: number): Year {
		safe.int.inRangeInc('year', year, 0, maxHeYear);
		const stor = new Uint8Array(yearBytes);
		Core.writeYear(stor, 0, year - 10000);
		return new Year(stor, 0);
	}

	/**
	 * Create a year from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Year {
		const stor = new Uint8Array(yearBytes);
		Core.writeYFromDt(stor, 0, dt);
		return new Year(stor, 0);
	}

	/**
	 * Create a year from a js Date object in UTC
	 * @param date Value used as source
	 */
	public static fromDateUtc(dt: Date): Year {
		const stor = new Uint8Array(yearBytes);
		const v = dt.getUTCFullYear() + 10000; //Convert to holocene
		stor[0] = v >> 8;
		stor[1] = v;
		return new Year(stor, 0);
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
		const stor = new Uint8Array(yearBytes);
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			Core.writeYFromDt(stor, 0, new Date());
		} else {
			const e = Core.parseYear(stor, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Year(stor, 0);
	}

	/** Create this year (local) */
	public static now(): Year {
		const now = new Date();
		const stor = new Uint8Array(yearBytes);
		Core.writeYFromDt(stor, 0, now);
		return new Year(stor, 0);
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
	 * @param storage Storage location, if undefined will be built
	 * @returns
	 */
	public static deserialize(src: BitReader): Year {
		const stor = new Uint8Array(yearBytes);
		Core.deserYear(stor, 0, src);
		return new Year(stor, 0);
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
		return (this._stor[this._pos] + 1).toString();
	}

	/** Month ISO8601, zero padded (01-12) */
	public toIsoString(): string {
		return this._month_iso(this._pos);
	}

	/** Month ISO8601 as an integer (1=January, 12=December) */
	toJSON(): number {
		return this._stor[this._pos] + 1;
	}

	/** Month ISO8601 as an integer (1=January, 12=December) */
	public valueOf(): number {
		return this._stor[this._pos] + 1;
	}

	/** Serialize into target  - 4 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this._stor[this._pos], monthSerBits);
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
		safe.int.lte('month', this._month(this._pos), 12);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Month';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Month(${this.toString()})`;
	}

	/** Create a new month of the year, range 1-12 */
	public static new(v: number): Month {
		/*vetMonth*/ safe.int.inRangeInc('month', v, 1, 12);
		return new Month(/*writeMonth*/ Uint8Array.of(v - 1), 0);
	}

	/**
	 * Create a month from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Month {
		const stor = new Uint8Array(monthBytes);
		Core.writeMoFromDt(stor, 0, dt);
		return new Month(stor, 0);
	}

	/**
	 * Create a month from a js Date object in UTC
	 * @param dt Value used as source
	 */
	public static fromDateUtc(dt: Date): Month {
		const stor = new Uint8Array(monthBytes);
		stor[0] = dt.getUTCMonth(); //We store months 0 based too (but we don't trouble the dev with that detail)
		return new Month(stor, 0);
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
		const stor = new Uint8Array(monthBytes);
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			Core.writeMoFromDt(stor, 0, new Date());
		} else {
			const e = Core.parseMonth(stor, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Month(stor, 0);
	}

	/** Create this year (local) */
	public static now(): Month {
		const now = new Date();
		const stor = new Uint8Array(monthBytes);
		Core.writeMoFromDt(stor, 0, now);
		return new Month(stor, 0);
	}

	/**
	 * Deserialize next 4 bits into month of year
	 * Throws if:
	 * - There's not 4 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param src Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(src: BitReader): Month {
		return new Month(
			Uint8Array.of(/*deserMonth*/ src.readNumber(monthSerBits)),
			0
		);
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
		const leap = y === undefined ? false : Year.isLeap(y);
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
		return (this._stor[this._pos] + 1).toString();
	}

	/** Day ISO8601, zero padded (01-31) */
	public toIsoString(): string {
		return this._day_iso(this._pos);
	}

	/** Day of the month ISO8601 as a number (1-31) */
	toJSON(): number {
		return this._stor[this._pos] + 1;
	}

	/** Day of the month ISO8601 as a number (1-31) */
	public valueOf(): number {
		return this._stor[this._pos] + 1;
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this._stor[this._pos], daySerBits);
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
		safe.int.lte('day', this._day(this._pos), 31);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'DayOfMonth';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `DayOfMonth(${this.toString()})`;
	}

	/** Create a new day of the month, range 1-31 */
	public static new(v: number): Day {
		/*vetDay*/ safe.int.inRangeInc('day', v, 1, 31);
		return new Day(/*writeDay*/ Uint8Array.of(v - 1), 0);
	}

	/**
	 * Create a day from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Day {
		const stor = new Uint8Array(dayBytes);
		Core.writeDFromDt(stor, 0, dt);
		return new Day(stor, 0);
	}

	/**
	 * Create a day from a js Date object in UTC
	 * @param dt Value used as source
	 */
	public static fromDateUtc(dt: Date): Day {
		const stor = new Uint8Array(dayBytes);
		stor[0] = dt.getUTCDate() - 1; //We store 0 based
		return new Day(stor, 0);
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
		const stor = new Uint8Array(dayBytes);
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			Core.writeDFromDt(stor, 0, new Date());
		} else {
			const e = Core.parseDay(stor, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Day(stor, 0);
	}

	/** Create this day of the month (local) */
	public static now(): Day {
		const now = new Date();
		const stor = new Uint8Array(dayBytes);
		Core.writeDFromDt(stor, 0, now);
		return new Day(stor, 0);
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
		return new Day(Uint8Array.of(/*deserDay*/ src.readNumber(daySerBits)), 0);
	}
}
const minD = Day.new(1);
const maxD = Day.new(31);

export class DateOnly extends Core implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = dateBytes; //4
	/**Number of bits required to serialize this data */
	static readonly serialBits = yearSerBits + monthSerBits + daySerBits; //24

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
		return this._year(this._pos);
	}
	/** Months (1-12) */
	get month(): number {
		return this._month(this._pos + yearBytes);
	}
	/** Days (1-31) */
	get day(): number {
		return this._day(this._pos + yearBytes + monthBytes);
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
		return new Date(
			this._year(this._pos),
			/*fucks sake JS*/ this._month(this._pos + yearBytes) - 1,
			this._day(this._pos + yearBytes + monthBytes)
		);
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
		const y = this._year(this._pos) * 10000;
		return y < 0
			? y -
					this._month(this._pos + yearBytes) * 100 -
					this._day(this._pos + yearBytes + monthBytes)
			: y +
					this._month(this._pos + yearBytes) * 100 +
					this._day(this._pos + yearBytes + monthBytes);
	}

	/** Serialize into target  - 24 bits*/
	public serialize(target: BitWriter): void {
		this._date_ser(target, this._pos);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return yearSerBits + monthSerBits + daySerBits;
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
		return `DateOnly(${this.toString()})`;
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
		const stor = new Uint8Array(dateBytes);
		Core.dateFromUnixDays(stor, 0, super.toUnixDays(this._pos) + (days | 0));
		return new DateOnly(stor, 0);
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
	 * @param y Integer, if float will be truncated
	 * @param m
	 * @param d
	 *
	 * @pure
	 */
	public add(y: number, m = 0): DateOnly {
		let monthAdd = 0;
		//By collecting and distributing we normalize high m or m/y sign mismatch
		// (eg +1-4 == +8)
		if (y) monthAdd += (y | 0) * 12;
		if (m) monthAdd += m | 0;
		const yearAdd = (monthAdd / 12) | 0;
		monthAdd %= 12;

		const yv = this._year(this._pos) + yearAdd;
		const mv = this._month(this._pos + yearBytes) + monthAdd;
		const dv = Math.min(
			this._day(this._pos + yearBytes + monthBytes),
			Month.lastDay(mv, yv)
		);
		const stor = new Uint8Array(dateBytes);
		Core.writeDate(stor, 0, yv, mv, dv);
		return new DateOnly(stor, 0);
	}

	/**
	 * Create a new ISO8601 date
	 * @param y range -10000 - +22767
	 * @param m range 1 - 12
	 * @param d range 1 - 31
	 */
	public static new(y: number, m: number, d: number): DateOnly {
		const stor = new Uint8Array(dateBytes);
		Core.vetDate(y, m, d);
		Core.writeDate(stor, 0, y, m, d);
		return new DateOnly(stor, 0);
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
	 * @param storage
	 * @returns
	 */
	public static fromValue(v: number): DateOnly {
		const stor = new Uint8Array(dateBytes);
		Core.dateFromValue(stor, 0, v);
		return new DateOnly(stor, 0);
	}

	public static fromUnixDays(source: number): DateOnly {
		const stor = new Uint8Array(dateBytes);
		Core.dateFromUnixDays(stor, 0, source);
		return new DateOnly(stor, 0);
	}

	/**
	 * Create a date from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date): DateOnly {
		const dms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		const stor = new Uint8Array(dateBytes);
		Core.dateFromUnixDays(stor, 0, dms / msPerDay);
		return new DateOnly(stor, 0);
	}

	/**
	 * Create a date from a js Date object in UTC
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date): DateOnly {
		const stor = new Uint8Array(dateBytes);
		Core.dateFromUnixDays(stor, 0, date.valueOf() / msPerDay);
		return new DateOnly(stor, 0);
	}

	/**
	 * Create a date from float seconds since UNIX epoch aka unix time
	 * *NOTE*: Unix time is always in UTC, depending on your timezone this may differ from local
	 * */
	public static fromUnixTime(source: number): DateOnly {
		const stor = new Uint8Array(dateBytes);
		Core.dateFromUnixDays(stor, 0, source / sPerDay);
		return new DateOnly(stor, 0);
	}

	/**
	 * Create a date from float milliseconds since UNIX epoch aka unix time
	 * *NOTE*: Unix time is always in UTC, depending on your timezone this may differ from local
	 */
	public static fromUnixTimeMs(source: number): DateOnly {
		const stor = new Uint8Array(dateBytes);
		Core.dateFromUnixDays(stor, 0, source / msPerDay);
		return new DateOnly(stor, 0);
	}

	/**
	 * Parse a string into a date, accepts:
	 * 'now', a 3 part date separated by '-' characters
	 * @param input
	 * @param storage
	 */
	public static parse(input: WindowStr, strict = false): DateOnly {
		const stor = new Uint8Array(dateBytes);
		const reset = input.getReset();
		input.trim();

		//If content starts with "now" and optionally followed by whitespace - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			Core.writeDtFromDt(stor, 0, new Date());
		} else {
			const e = Core.parseDate(stor, 0, input, strict, reset);
			if (e) throw e;
		}
		return new DateOnly(stor, 0);
	}

	/** Create this date (local) */
	public static now(): DateOnly {
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const n = new Date();
		const dms = n.valueOf() - n.getTimezoneOffset() * msPerMin;
		const stor = new Uint8Array(dateBytes);
		Core.dateFromUnixDays(stor, 0, dms / msPerDay);
		return new DateOnly(stor, 0);
	}

	/** Create this date (UTC) */
	public static nowUtc(): DateOnly {
		//Note we depend on JS Date here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		const n = new Date();
		const stor = new Uint8Array(dateBytes);
		Core.dateFromUnixDays(stor, 0, n.valueOf() / msPerDay);
		return new DateOnly(stor, 0);
	}

	public static deserialize(source: BitReader): DateOnly {
		const stor = new Uint8Array(dateBytes);
		Core.deserDate(stor, 0, source);
		return new DateOnly(stor, 0);
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
		return this._stor[this._pos].toString();
	}

	/** Hour, zero padded (01-23) */
	public toIsoString(): string {
		return this._hour_iso(this._pos);
	}

	/** Hour as a number (0-23) */
	toJSON(): number {
		return this._stor[this._pos];
	}

	/** Hour as a number (0-23) */
	public valueOf(): number {
		return this._stor[this._pos];
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this._stor[this._pos], hourSerBits);
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
		safe.int.lte('hour', this._hour(this._pos), 23);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'HourOfDay';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `HourOfDay(${this.toString()})`;
	}

	/** Create a new hour, range 0-23 */
	public static new(v: number): Hour {
		/*vetHour*/ safe.int.inRangeInc('hour', v, 0, 23);
		return new Hour(/*writeHour*/ Uint8Array.of(v), 0);
	}

	/**
	 * Create from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Hour {
		const stor = new Uint8Array(hourBytes);
		/* writeHFromDt*/ stor[0] = dt.getHours();
		return new Hour(stor, 0);
	}

	/**
	 * Create from a js Date object in UTC
	 * @param dt Value used as source
	 */
	public static fromDateUtc(dt: Date): Hour {
		return new Hour(Uint8Array.of(dt.getUTCHours()), 0);
	}

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(source: number): Hour {
		const stor = new Uint8Array(hourBytes);
		stor[0] = (source % sPerDay) / sPerHour;
		return new Hour(stor, 0);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(source: number): Hour {
		const stor = new Uint8Array(hourBytes);
		stor[0] = (source % msPerDay) / msPerHour;
		return new Hour(stor, 0);
	}

	/** Create from microseconds since UNIX epoch */
	public static fromUnixTimeUs(source: number): Hour {
		const stor = new Uint8Array(hourBytes);
		stor[0] = (source % usPerDay) / usPerHour;
		return new Hour(stor, 0);
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
		const stor = new Uint8Array(hourBytes);
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			/* writeHFromDt*/ stor[0] = new Date().getHours();
		} else {
			const e = Core.parseHour(stor, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Hour(stor, 0);
	}

	/** Create this hour (local) */
	public static now(): Hour {
		const now = new Date();
		const stor = new Uint8Array(hourBytes);
		/* writeHFromDt*/ stor[0] = now.getHours();
		return new Hour(stor, 0);
	}

	/** Create this hour (UTC) */
	public static nowUtc(): Hour {
		return new Hour(Uint8Array.of(new Date().getUTCHours()), 0);
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
		return new Hour(
			Uint8Array.of(/*deserHour*/ src.readNumber(hourSerBits)),
			0
		);
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
		return this._stor[this._pos].toString();
	}
	/** Minute, Zero padded (00-59) */
	public toIsoString(): string {
		return this._minute_iso(this._pos);
	}

	/** Minute as an integer (0-59) */
	toJSON(): number {
		return this._stor[this._pos];
	}

	/** Minute as an integer (0-59) */
	public valueOf(): number {
		return this._stor[this._pos];
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this._stor[this._pos], minSerBits);
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
		safe.int.lte('minute', this._minute(this._pos), 59);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Minute';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Minute(${this.toString()})`;
	}

	/** Create a new minute, range 0-59 */
	public static new(v: number): Minute {
		/*vetMinute*/ safe.int.inRangeInc('minute', v, 0, 59);
		return new Minute(/*writeMinute*/ Uint8Array.of(v), 0);
	}

	/**
	 * Create from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Minute {
		const stor = new Uint8Array(minBytes);
		/*writeMiFromDt*/ stor[0] = dt.getMinutes();
		return new Minute(stor, 0);
	}

	/**
	 * Create from a js Date object in UTC
	 * @param dt Value used as source
	 */
	public static fromDateUtc(dt: Date): Minute {
		return new Minute(Uint8Array.of(dt.getUTCMinutes()), 0);
	}

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(src: number): Minute {
		const stor = new Uint8Array(minBytes);
		/*writeMinute*/ stor[0] = (src % sPerHour) / 60;
		return new Minute(stor, 0);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(src: number): Minute {
		const stor = new Uint8Array(minBytes);
		/*writeMinute*/ stor[0] = (src % msPerHour) / msPerMin;
		return new Minute(stor, 0);
	}

	/** Create from microseconds since UNIX epoch */
	public static fromUnixTimeUs(src: number): Minute {
		const stor = new Uint8Array(minBytes);
		/*writeMinute*/ stor[0] = (src % usPerHour) / usPerMin;
		return new Minute(stor, 0);
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
		const stor = new Uint8Array(minBytes);
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			/*writeMiFromDt*/ stor[0] = new Date().getMinutes();
		} else {
			const e = Core.parseMinute(stor, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Minute(stor, 0);
	}

	/** Create this minute (local) */
	public static now(): Minute {
		const now = new Date();
		const stor = new Uint8Array(minBytes);
		/*writeMiFromDt*/ stor[0] = now.getMinutes();
		return new Minute(stor, 0);
	}

	/** Create this minute (UTC) */
	public static nowUtc(): Minute {
		return new Minute(Uint8Array.of(new Date().getUTCMinutes()), 0);
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
		return new Minute(
			Uint8Array.of(/*deserMin*/ src.readNumber(minSerBits)),
			0
		);
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
		return this._stor[this._pos].toString();
	}
	/** Second, Zero padded (00-59) */
	public toIsoString(): string {
		return this._second_iso(this._pos);
	}

	/** As an integer (0-59) */
	toJSON(): number {
		return this._stor[this._pos];
	}

	/** As an integer (0-59) */
	public valueOf(): number {
		return this._stor[this._pos];
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this._stor[this._pos], secSerBits);
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
		safe.int.lte('second', this._second(this._pos), 59);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Second';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Second(${this.toString()})`;
	}

	/** Create a new second, range 0-59 */
	public static new(v: number): Second {
		/*vetSecond*/ safe.int.inRangeInc('second', v, 0, 59);
		return new Second(/*writeSecond*/ Uint8Array.of(v), 0);
	}

	/**
	 * Create from a js Date object
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Second {
		const stor = new Uint8Array(minBytes);
		/*writeSFromDt*/ stor[0] = dt.getSeconds();
		return new Second(stor, 0);
	}

	//fromDateUtc makes no sense

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(src: number): Second {
		const stor = new Uint8Array(minBytes);
		/*writeSecond*/ stor[0] = src % 60;
		return new Second(stor, 0);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(src: number): Second {
		const stor = new Uint8Array(minBytes);
		/*writeSecond*/ stor[0] = (src % msPerMin) / msPerSec;
		return new Second(stor, 0);
	}

	/** Create from microseconds since UNIX epoch */
	public static fromUnixTimeUs(src: number): Second {
		const stor = new Uint8Array(minBytes);
		/*writeSecond*/ stor[0] = (src % usPerMin) / usPerSec;
		return new Second(stor, 0);
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
		const stor = new Uint8Array(minBytes);
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			const utcNow = performance.timeOrigin + performance.now();
			//No need for offset since there's no TZ off by seconds (yet?)
			/*writeSecond*/ stor[0] = (utcNow / msPerSec) % 60;
		} else {
			const e = Core.parseSecond(stor, 0, input, strict, reset);
			if (e) throw e;
		}
		return new Second(stor, 0);
	}

	/** Current second */
	public static now(): Second {
		const stor = new Uint8Array(minBytes);
		/*writeSFromDt*/ stor[0] = new Date().getSeconds();
		return new Second(stor, 0);
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
		return new Second(
			Uint8Array.of(/*deserSec*/ src.readNumber(secSerBits)),
			0
		);
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
		return (this._stor[this._pos] << 8) | this._stor[this._pos + 1];
	}

	/** Millisecond, not zero padded (0-999) */
	public toString(): string {
		return this.valueOf().toString();
	}

	/** Millisecond, zero padded (000-999)*/
	public toIsoString(): string {
		return this._milli_iso(this._pos);
	}

	/** Value as an integer (0-999) */
	toJSON(): number {
		return (this._stor[this._pos] << 8) | this._stor[this._pos + 1];
	}

	/** Serialize into target  - 10 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(
			(this._stor[this._pos] << 8) | this._stor[this._pos + 1],
			milliSerBits
		);
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
		safe.int.lte('millisecond', this._milli(this._pos), 999);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Millisecond';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Millisecond(${this.toString()})`;
	}

	/** Create a new Millisecond, range 0-999 */
	public static new(v: number): Millisecond {
		const stor = new Uint8Array(milliBytes);
		/*vetMilli*/ safe.int.inRangeInc('millisecond', v, 0, 999);
		Core.writeMilli(stor, 0, v);
		return new Millisecond(stor, 0);
	}

	/**
	 * Create a millisecond from a js Date object
	 *
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Millisecond {
		const stor = new Uint8Array(milliBytes);
		Core.writeMsFromDt(stor, 0, dt);
		return new Millisecond(stor, 0);
	}

	//no sense: fromDateUtc

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(s: number): Millisecond {
		const stor = new Uint8Array(milliBytes);
		Core.writeMilli(stor, 0, (s * msPerSec) % msPerSec);
		return new Millisecond(stor, 0);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(ms: number): Millisecond {
		const stor = new Uint8Array(milliBytes);
		Core.writeMilli(stor, 0, ms % msPerSec);
		return new Millisecond(stor, 0);
	}

	/** Create from millisecond since UNIX epoch */
	public static fromUnixTimeUs(us: number): Millisecond {
		const stor = new Uint8Array(milliBytes);
		Core.writeMilli(stor, 0, (us / 1000) % msPerSec);
		return new Millisecond(stor, 0);
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
		const stor = new Uint8Array(milliBytes);
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			const utcNow = performance.timeOrigin + performance.now();
			//No need for offset since there's no TZ off by milliseconds
			Core.writeMilli(stor, 0, utcNow % msPerSec);
		} else {
			const e = Core.parseMilli(stor, 0, input, strict, left, reset);
			if (e) throw e;
		}
		return new Millisecond(stor, 0);
	}

	/** Create this millisecond */
	public static now(): Millisecond {
		const now = performance.timeOrigin + performance.now();
		const stor = new Uint8Array(milliBytes);
		Core.writeMilli(stor, 0, now % msPerSec);
		return new Millisecond(stor, 0);
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
		const stor = new Uint8Array(milliBytes);
		/*deserMilli*/ Core.writeMilli(stor, 0, src.readNumber(milliSerBits));
		return new Millisecond(stor, 0);
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
		return (
			(this._stor[this._pos] << 16) |
			(this._stor[this._pos + 1] << 8) |
			this._stor[this._pos + 2]
		);
	}

	/** Microsecond, not zero padded (0-999999) */
	public toString(): string {
		return this.valueOf().toString();
	}

	/** Microsecond, zero padded (000000-999999)*/
	public toIsoString(): string {
		return this._micro_iso(this._pos);
	}

	/** Value as an integer (0-999999) */
	toJSON(): number {
		return (
			(this._stor[this._pos] << 16) |
			(this._stor[this._pos + 1] << 8) |
			this._stor[this._pos + 2]
		);
	}

	/** Serialize into target  - 20 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(
			(this._stor[this._pos] << 16) |
				(this._stor[this._pos + 1] << 8) |
				this._stor[this._pos + 2],
			microSerBits
		);
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
		safe.int.lte('microsecond', this._micro(this._pos), 999999);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'Microsecond';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `Microsecond(${this.toString()})`;
	}

	/** Create a new Microsecond, range 0-999999 */
	public static new(v: number): Microsecond {
		const stor = new Uint8Array(microBytes);
		/*vetMicro*/ safe.int.inRangeInc('microsecond', v, 0, 999999);
		Core.writeMicro(stor, 0, v);
		return new Microsecond(stor, 0);
	}

	/**
	 * Create a microsecond from a js Date object
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 *
	 * @param dt Value used as source
	 */
	public static fromDate(dt: Date): Microsecond {
		const stor = new Uint8Array(microBytes);
		Core.writeUsFromDt(stor, 0, dt);
		return new Microsecond(stor, 0);
	}

	//no sense: fromDateUtc

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(s: number): Microsecond {
		const stor = new Uint8Array(microBytes);
		Core.writeMicro(stor, 0, (s * usPerSec) % usPerSec);
		return new Microsecond(stor, 0);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(ms: number): Microsecond {
		const stor = new Uint8Array(microBytes);
		Core.writeMicro(stor, 0, (ms % msPerSec) * 1000);
		return new Microsecond(stor, 0);
	}

	/** Create from microseconds since UNIX epoch */
	public static fromUnixTimeUs(us: number): Microsecond {
		const stor = new Uint8Array(microBytes);
		Core.writeMicro(stor, 0, us % usPerSec);
		return new Microsecond(stor, 0);
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
		const stor = new Uint8Array(microBytes);
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			const utcNow = performance.timeOrigin + performance.now();
			//No need for offset since there's no TZ off by microseconds
			Core.writeMicro(stor, 0, utcNow % usPerSec);
		} else {
			const e = Core.parseMicro(stor, 0, input, strict, left, reset);
			if (e) throw e;
		}
		return new Microsecond(stor, 0);
	}

	/** Create this microsecond */
	public static now(): Microsecond {
		const now = performance.timeOrigin + performance.now();
		const stor = new Uint8Array(microBytes);
		Core.writeMicro(stor, 0, (now * 1000) % usPerSec);
		return new Microsecond(stor, 0);
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
		const stor = new Uint8Array(microBytes);
		/*deserMicro*/ Core.writeMicro(stor, 0, src.readNumber(microSerBits));
		return new Microsecond(stor, 0);
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
	static readonly serialBits =
		hourSerBits + minSerBits + secSerBits + microSerBits; //37

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
		return this._hour(this._pos);
	}
	/** Minutes (0-59) */
	get minute(): number {
		return this._minute(this._pos + hourBytes);
	}
	/** Seconds (0-59) */
	get second(): number {
		return this._second(this._pos + hourBytes + minBytes);
	}
	/** Microseconds (0-999999) */
	get microsecond(): number {
		return this._micro(this._pos + hourBytes + minBytes + secBytes);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted time: hh:mm:ss.mmmmmm(z) (all zero padded)
	 * @param [sep=true] Include separators (default) or not
	 */
	public toString(sep = true): string {
		return this._time_iso(this._pos, sep);
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
		return this._time_iso(this._pos, true);
	}

	/** Microseconds (since midnight) */
	toMicroseconds(): number {
		return this.timeToUs(this._pos);
	}

	/** Milliseconds (since midnight) value can be floating point (us component)*/
	toMilliseconds(): number {
		return this.timeToUs(this._pos) / 1000;
	}

	/** Seconds (since midnight) value can be floating point (us component)*/
	toSeconds(): number {
		return this.timeToUs(this._pos) / usPerSec;
	}

	/**
	 * Numeric time, base 10 shifted: 000000000000 - 235959999999
	 * 2^38 so safe in JS as a number
	 * NOTE there are gaps in valid values 240000000000, 236000000000, etc
	 * But you can do <, >, = comparisons
	 */
	public valueOf(): number {
		let pos = this._pos;
		let ret = this._hour(pos) * 10000000000;
		pos += hourBytes;
		ret += this._minute(pos) * 100000000;
		pos += minBytes;
		ret += this._second(pos) * 1000000;
		return ret + this._micro(pos + secBytes);
	}

	/** Serialize into target  - 38 bits*/
	public serialize(target: BitWriter): void {
		this._time_ser(target, this._pos);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return hourSerBits + minSerBits + secSerBits + microSerBits;
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
		return `TimeOnly(${this.toString()})`;
	}

	/**
	 * Create a new time
	 * @param h Hours 0-23
	 * @param i Minutes 0-59
	 * @param s Seconds 0-59
	 * @param u Microseconds 0-999999
	 */
	public static new(h: number, i: number, s: number, u: number): TimeOnly {
		const stor = new Uint8Array(timeBytes);
		Core.vetTime(h, i, s, u);
		Core.writeTime(stor, 0, h, i, s, u);
		return new TimeOnly(stor, 0);
	}

	/**
	 * Convert from base 10 shifted value {@link valueOf} into new TimeOnly
	 * @param v
	 * @returns
	 */
	public static fromValue(v: number): TimeOnly {
		const stor = new Uint8Array(timeBytes);
		Core.timeFromValue(stor, 0, v);
		return new TimeOnly(stor, 0);
	}

	/**
	 * Create a time from microseconds since Unix epoch
	 *
	 * @param source Number of microseconds since midnight (if floating point it'll be truncated)
	 */
	public static fromUnixTimeUs(source: number): TimeOnly {
		const stor = new Uint8Array(timeBytes);
		Core.timeFromUnixUs(stor, 0, source);
		return new TimeOnly(stor, 0);
	}

	/**
	 * Create a time from float milliseconds since UNIX epoch aka unix time
	 *
	 * @param source Unix time at millisecond accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTimeMs(source: number): TimeOnly {
		const stor = new Uint8Array(timeBytes);
		Core.timeFromUnixUs(stor, 0, source * 1000);
		return new TimeOnly(stor, 0);
	}

	/**
	 * Create a time from float seconds since UNIX epoch aka unix time
	 *
	 * @param source Unix time at second accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTime(source: number): TimeOnly {
		const stor = new Uint8Array(timeBytes);
		Core.timeFromUnixUs(stor, 0, source * 1000000);
		return new TimeOnly(stor, 0);
	}

	/**
	 * Create a time from a js Date object
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs}/{@link fromUnixTimeUs} with a high resolution (floating point) source
	 * @param date Value used as source
	 */
	public static fromDate(date: Date): TimeOnly {
		const dms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		const stor = new Uint8Array(timeBytes);
		Core.timeFromUnixUs(stor, 0, dms * 1000);
		return new TimeOnly(stor, 0);
	}

	/**
	 * Parse a string into a date, accepts:
	 * 'now', a 3 part time separated by ':' characters with fractional seconds
	 * @param input
	 * @param storage
	 */
	public static parse(input: WindowStr, strict = false): TimeOnly {
		const stor = new Uint8Array(timeBytes);
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			const utcNow = performance.timeOrigin + performance.now();
			const utcDt = new Date(utcNow);
			const offset = utcDt.getTimezoneOffset() * 60000;
			Core.timeFromUnixUs(stor, 0, (utcNow - offset) * 1000);
		} else {
			const e = Core.parseTime(stor, 0, input, strict, reset);
			if (e) throw e;
		}
		return new TimeOnly(stor, 0);
	}

	/** Create time from this point in (local) time */
	public static now(): TimeOnly {
		const utcNow = performance.timeOrigin + performance.now();
		//Calculate the offset to get it in local time
		const utcDt = new Date(utcNow);
		const offset = utcDt.getTimezoneOffset() * 60000;
		const stor = new Uint8Array(timeBytes);
		Core.timeFromUnixUs(stor, 0, (utcNow - offset) * 1000);
		return new TimeOnly(stor, 0);
	}

	/**
	 * Deserialize next 38 bits into time
	 * Throws if:
	 * - There's not 38 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 */
	public static deserialize(source: BitReader): TimeOnly {
		//Keep the memory contiguous
		const stor = new Uint8Array(timeBytes);
		Core.deserTime(stor, 0, source);
		return new TimeOnly(stor, 0);
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
		return this._hour(this._pos);
	}
	/** Minutes (0-59) */
	get minute(): number {
		return this._minute(this._pos + hourBytes);
	}
	/** Seconds (0-59) */
	get second(): number {
		return this._second(this._pos + hourBytes + minBytes);
	}
	/** Milliseconds (0-999) */
	get millisecond(): number {
		return this._milli(this._pos + hourBytes + minBytes + secBytes);
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
		let p = this._pos;
		let ret = this._hour_iso(p) + sep1;
		p += hourBytes;
		ret += this._minute_iso(p) + sep1;
		p += minBytes;
		ret += this._second_iso(p) + sep2;
		return ret + this._milli_iso(p + secBytes);
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
		let p = this._pos;
		let ret = this._hour(p) * usPerHour;
		p += hourBytes;
		ret += this._minute(p) * usPerMin;
		p += minBytes;
		ret += this._second(p) * usPerSec;
		return ret + this._milli(p + secBytes) * 1000;
	}

	/** Milliseconds (since midnight) value can be floating point (us component)*/
	toMilliseconds(): number {
		let p = this._pos;
		let ret = this._hour(p) * msPerHour;
		p += hourBytes;
		ret += this._minute(p) * msPerMin;
		p += minBytes;
		ret += this._second(p) * msPerSec;
		return ret + this._milli(p + secBytes);
	}

	/** Seconds (since midnight) value can be floating point (us component)*/
	toSeconds(): number {
		return this.toMilliseconds() / 1000;
	}

	/**
	 * Numeric time, base 10 shifted: 000000000 - 235959999
	 * NOTE there are gaps in valid values 240000000, 236000000, etc
	 * But you can do <, >, = comparisons
	 */
	public valueOf(): number {
		let pos = this._pos;
		let ret = this._hour(pos) * 10000000;
		pos += hourBytes;
		ret += this._minute(pos) * 100000;
		pos += minBytes;
		ret += this._second(pos) * 1000;
		return ret + this._milli(pos + secBytes);
	}

	/** Serialize into target  - 28 bits*/
	public serialize(target: BitWriter): void {
		this._timeMs_ser(target, this._pos);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return hourSerBits + minSerBits + secSerBits + milliSerBits;
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): TimeOnlyMs {
		let p = this._pos;
		safe.int.lte('hour', this._hour(p), 23);
		p += hourBytes;
		safe.int.lte('minute', this._minute(p), 59);
		p += minBytes;
		safe.int.lte('second', this._second(p), 59);
		p += secBytes;
		safe.int.lte('millisecond', this._milli(p), 999);
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
		/*vetHour*/ safe.int.inRangeInc('hour', h, 0, 23);
		/*vetMinute*/ safe.int.inRangeInc('minute', i, 0, 59);
		/*vetSecond*/ safe.int.inRangeInc('second', s, 0, 59);
		/*vetMilli*/ safe.int.inRangeInc('millisecond', ms, 0, 999);
		const stor = new Uint8Array(timeMsBytes);
		let pos = 0;
		stor[pos++] = h;
		/*writeMinute*/ stor[pos++] = i;
		/*writeSecond*/ stor[pos++] = s;
		Core.writeMilli(stor, pos, ms);
		return new TimeOnlyMs(stor, 0);
	}

	/**
	 * Convert from base 10 shifted value {@link valueOf} into new TimeOnlyMs
	 * @param v
	 * @returns
	 */
	public static fromValue(v: number): TimeOnlyMs {
		const stor = new Uint8Array(timeMsBytes);
		const ms = v % 1000;
		v = (v - ms) / 1000;
		const s = v % 100;
		v = (v - s) / 100;
		const i = v % 100;
		v = (v - i) / 100;
		/*vetHour*/ safe.int.inRangeInc('hour', v, 0, 23);
		/*vetMinute*/ safe.int.inRangeInc('minute', i, 0, 59);
		/*vetSecond*/ safe.int.inRangeInc('second', s, 0, 59);
		/*vetMilli*/ safe.int.inRangeInc('millisecond', ms, 0, 999);

		let pos = 0;
		stor[pos++] = v;
		/*writeMinute*/ stor[pos++] = i;
		/*writeSecond*/ stor[pos++] = s;
		Core.writeMilli(stor, pos, ms);
		return new TimeOnlyMs(stor, 0);
	}

	/**
	 * Create a time from microseconds since Unix epoch
	 *
	 * @param us Number of microseconds since midnight (if floating point it'll be truncated)
	 */
	public static fromUnixTimeUs(us: number): TimeOnlyMs {
		const stor = new Uint8Array(timeMsBytes);
		Core.timeMsFromUnixMs(stor, 0, us / 1000);
		return new TimeOnlyMs(stor, 0);
	}

	/**
	 * Create a time from float milliseconds since UNIX epoch aka unix time
	 *
	 * @param ms Unix time at millisecond accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTimeMs(ms: number): TimeOnlyMs {
		const stor = new Uint8Array(timeMsBytes);
		Core.timeMsFromUnixMs(stor, 0, ms);
		return new TimeOnlyMs(stor, 0);
	}

	/**
	 * Create a time from float seconds since UNIX epoch aka unix time
	 *
	 * @param s Unix time at second accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTime(s: number): TimeOnlyMs {
		const stor = new Uint8Array(timeMsBytes);
		Core.timeMsFromUnixMs(stor, 0, s * msPerSec);
		return new TimeOnlyMs(stor, 0);
	}

	/**
	 * Create a time from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date): TimeOnlyMs {
		const dms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		const stor = new Uint8Array(timeMsBytes);
		Core.timeMsFromUnixMs(stor, 0, dms);
		return new TimeOnlyMs(stor, 0);
	}

	/**
	 * Parse a string into a date, accepts:
	 * 'now', a 3 part time separated by ':' characters with fractional seconds
	 * @param input
	 * @param storage
	 */
	public static parse(input: WindowStr, strict = false): TimeOnlyMs {
		const stor = new Uint8Array(timeMsBytes);
		const reset = input.getReset();
		let p = 0;
		input.trim();

		//If content starts with "now" and optionally followed by whitespace - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			return TimeOnlyMs.now();
		}

		let e: Error | undefined = undefined;

		//If it's 9 digits assume it's an un-delimited time
		if (input.test(/^\d{9}$/)) {
			e = Core.parseHour(stor, p, input.left(2), strict, reset);
			if (e) throw e;
			p += hourBytes;
			input.shrink(2);

			e = Core.parseMinute(stor, p, input.left(2), strict, reset);
			if (e) throw e;
			p += minBytes;
			input.shrink(2);

			e = Core.parseSecond(stor, p, input.left(2), strict, reset);
			if (e) throw e;
			p += secBytes;
			input.shrink(2);

			e = Core.parseMilli(stor, p, input, strict, false, reset);
			//This can't generate an error because it already has to be 3 digits (because of test
			// above) and it can be any 3 digit value (0-999)
			//if (e) throw e;

			input.shrink(input.length);
			return new TimeOnlyMs(stor, 0);
		}

		const delim1 = input.indexOf(':');
		let delim2 = input.indexOf(':', delim1 + 1);
		const delim3 = input.indexOf('.', delim2 + 1) - delim2 - 1;
		delim2 = delim2 - delim1 - 1;
		if (delim1 > 0 && delim2 > 0 && delim3 > 0) {
			e = Core.parseHour(stor, p, input.left(delim1), strict, reset);
			if (e) throw e;
			p += hourBytes;
			input.shrink(delim1 + 1);

			e = Core.parseMinute(stor, p, input.left(delim2).trim(), strict, reset);
			if (e) throw e;
			p += minBytes;
			input.shrink(delim2 + 1);

			e = Core.parseSecond(stor, p, input.left(delim3).trim(), strict, reset);
			if (e) throw e;
			p += secBytes;
			input.shrink(delim3 + 1);

			e = Core.parseMilli(stor, p, input.trim(), strict, true, reset);
			if (e) throw e;

			input.shrink(input.length);
			return new TimeOnlyMs(stor, 0);
		}
		throw new ContentError(
			`Expecting hh:mm:ss.###, or hhmmss###`,
			'time',
			input
		);
	}

	/** Create time from this point in (local) time */
	public static now(): TimeOnlyMs {
		const utcNow = performance.timeOrigin + performance.now();
		//Calculate the offset to get it in local time
		const utcDt = new Date(utcNow);
		const offset = utcDt.getTimezoneOffset() * 60000;
		const stor = new Uint8Array(timeMsBytes);
		Core.timeMsFromUnixMs(stor, 0, utcNow - offset);
		return new TimeOnlyMs(stor, 0);
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
		const stor = new Uint8Array(timeMsBytes);
		/*deserHour*/ stor[0] = src.readNumber(hourSerBits);
		/*deserMin*/ stor[1] = src.readNumber(minSerBits);
		/*deserSec*/ stor[2] = src.readNumber(secSerBits);
		/*deserMilli*/ Core.writeMilli(stor, 3, src.readNumber(milliSerBits));
		return new TimeOnlyMs(stor, 0);
	}
}
const minTMs = TimeOnlyMs.new(0, 0, 0, 0);
const maxTMs = TimeOnlyMs.new(23, 59, 59, 999);

class DateTimeShared extends Core {
	/**Number of bytes required to store this data */
	static readonly storageBytes = dateBytes + timeBytes; //10
	/**Number of bits required to serialize this data */
	static readonly serialBits =
		yearSerBits +
		monthSerBits +
		daySerBits +
		hourSerBits +
		minSerBits +
		secSerBits +
		microSerBits; //61

	/** Years (-10000 - +22767) ISO8601 */
	get year(): number {
		return this._year(this._pos);
	}
	/** Months (1-12) */
	get month(): number {
		return this._month(this._pos + yearBytes);
	}
	/** Days (1-31) */
	get day(): number {
		return this._day(this._pos + yearBytes + monthBytes);
	}
	/** Hours (0-23) */
	get hour(): number {
		return this._hour(this._pos + dateBytes);
	}
	/** Minutes (0-59) */
	get minute(): number {
		return this._minute(this._pos + dateBytes + hourBytes);
	}
	/** Seconds (0-59) */
	get second(): number {
		return this._second(this._pos + dateBytes + hourBytes + minBytes);
	}
	/** Microseconds (0-999999) */
	get microsecond(): number {
		return this._micro(this._pos + dateBytes + hourBytes + minBytes + secBytes);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date-time: yyyy-mm-ddThh:mm:ss.mmmmmm
	 */
	public toString(dateTimeSep = 'T'): string {
		return (
			this._date_iso(this._pos, '-') +
			dateTimeSep +
			this._time_iso(this._pos + dateBytes, true)
		);
	}

	/**
	 * [ISO8601](https://en.wikipedia.org/wiki/ISO_8601)/[RFC3339](https://www.rfc-editor.org/rfc/rfc3339)
	 * formatted date-time: yyyy-mm-ddThh:mm:ss.mmmmmm(z)
	 */
	toJSON(): string {
		return (
			this._date_iso(this._pos, '-') +
			'T' +
			this._time_iso(this._pos + dateBytes, true)
		);
	}

	/** Seconds since the Unix epoch aka unix time */
	toUnixTime(): number {
		return (
			super.toUnixDays(this._pos) * sPerDay +
			this.timeToUs(this._pos + dateBytes) / usPerSec
		);
	}

	/** Milliseconds since the Unix epoch aka unix time (compatible with `Date` constructor) */
	toUnixTimeMs(): number {
		return (
			super.toUnixDays(this._pos) * msPerDay +
			this.timeToUs(this._pos + dateBytes) / 1000
		);
	}

	/** Serialize into target*/
	public serialize(target: BitWriter): void {
		this._date_ser(target, this._pos);
		this._time_ser(target, this._pos + dateBytes);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return (
			yearSerBits +
			monthSerBits +
			daySerBits +
			hourSerBits +
			minSerBits +
			secSerBits +
			microSerBits
		);
	}

	protected _addDe(de: DurationExact, stor: Uint8Array): void {
		let miso = this.timeToUs(this._pos + dateBytes) % usPerHour;
		let dh = this.toUnixDays(this._pos) * 24 + this.hour;
		const [, ddh, dmiso] = de.toYmDhMiso();
		dh += ddh;
		miso += dmiso;

		if (miso >= usPerHour) {
			dh += 1;
			miso -= usPerHour;
		}

		Core.dateFromUnixDays(stor, 0, (dh / 24) | 0);
		const us = miso + (dh % 24) * usPerHour;
		Core.timeFromUnixUs(stor, 0 + dateBytes, us);
	}
	protected _addDv(du: Duration, stor: Uint8Array): void {
		let miso = this.timeToUs(this._pos + dateBytes) % usPerHour;
		let y = this._year(this._pos);
		let m = this._month(this._pos + yearBytes);
		let d = this._day(this._pos + yearBytes + monthBytes);

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
		let dh = d * 24 + this._hour(this._pos + dateBytes);
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
		Core.writeDate(stor, 0, y, m, (dh / 24) | 0);
		const us = miso + (dh % 24) * usPerHour;
		Core.timeFromUnixUs(stor, 0 + dateBytes, us);
	}
	protected _subDe(du: DurationExact, stor: Uint8Array): void {
		const hmiso = this.timeToUs(this._pos + dateBytes);
		let miso = hmiso % usPerHour;
		let dh = (hmiso / usPerHour) | 0;
		dh += this.toUnixDays(this._pos) * 24;
		const [, ddh, dmiso] = du.toYmDhMiso();
		dh -= ddh;
		miso -= dmiso;

		if (miso < 0) {
			dh -= 1;
			miso += usPerHour;
		}

		Core.dateFromUnixDays(stor, 0, (dh / 24) | 0);
		const us = miso + (dh % 24) * usPerHour;
		Core.timeFromUnixUs(stor, 0 + dateBytes, us);
	}
	protected _subDv(du: Duration, stor: Uint8Array): void {
		const hmiso = this.timeToUs(this._pos + dateBytes);
		let miso = hmiso % usPerHour;
		let dh = (hmiso / usPerHour) | 0;

		let y = this._year(this._pos);
		let m = this._month(this._pos + yearBytes);
		let d = this._day(this._pos + yearBytes + monthBytes);

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
		Core.writeDate(stor, 0, y, m, (1 + dh / 24) | 0);
		const us = miso + (dh % 24) * usPerHour;
		Core.timeFromUnixUs(stor, 0 + dateBytes, us);
	}

	protected gt(dt: DateTimeShared, eq = false): boolean {
		for (let i = 0; i < dateBytes + timeBytes; i++) {
			const t = this._stor[this._pos + i];
			const o = dt._stor[dt._pos + i];
			if (t > o) return true;
			if (t < o) return false;
		}
		//Equal!
		return eq;
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
		return new Date(
			this.year,
			/*fucks sake JS*/ this.month - 1,
			this.day,
			this.hour,
			this.minute,
			this.second,
			this.microsecond / 1000
		);
	}

	/**
	 * String datetime, without separators
	 * NOTE there are gaps in valid values, but you can do < > = comparisons
	 */
	public valueOf(): string {
		return (
			this._date_iso(this._pos, '') +
			this._time_iso(this._pos + dateBytes, false)
		);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): DateTimeLocal {
		this._date_valid(this._pos);
		this._time_valid(this._pos + dateBytes);
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
		const stor = new Uint8Array(dateBytes + timeBytes);
		if (du instanceof DurationExact) {
			this._addDe(du, stor);
		} else {
			this._addDv(du, stor);
		}
		return new DateTimeLocal(stor, 0);
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
		const stor = new Uint8Array(dateBytes + timeBytes);
		if (du instanceof DurationExact) {
			this._subDe(du, stor);
		} else {
			this._subDv(du, stor);
		}
		return new DateTimeLocal(stor, 0);
	}

	// public diff(dt:DateTimeLocal):Duration {
	// 	if (dt.gt(this)) return dt.diff(this);
	// 	//dt is *not* larger (might be equal)
	// }

	/**
	 * Whether this is greater than `other`
	 * @param other
	 * @returns True - this is greater, false-this is less or equal
	 * @pure
	 */
	public gt(other: DateTimeLocal): boolean {
		return super.gt(other);
	}

	/**
	 * Whether this is greater than or equal `other`
	 * @param other
	 * @pure
	 */
	public gte(other: DateTimeLocal): boolean {
		return super.gt(other, true);
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
	 * @param storage
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
		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.writeDate(stor, 0, y, m, d);
		Core.writeTime(stor, dateBytes, h, i, s, u);
		return new DateTimeLocal(stor, 0);
	}

	public static fromValue(v: string): DateTimeLocal {
		const stor = new Uint8Array(dateBytes + timeBytes);
		const dt = parseDec(v.substring(0, v.length - 12));
		const tm = parseDec(v.substring(v.length - 12));
		Core.dateFromValue(stor, 0, dt);
		Core.timeFromValue(stor, dateBytes, tm);
		return new DateTimeLocal(stor, 0);
	}

	/**
	 * Create a time from a js Date object
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 * @param date Value used as source
	 */
	public static fromDate(date: Date): DateTimeLocal {
		const dms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		return DateTimeLocal.fromUnixTimeMs(dms);
	}

	/**
	 * Create a date-time from float milliseconds since UNIX epoch aka unix time
	 *
	 * @param src Unix time at millisecond accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTimeMs(src: number): DateTimeLocal {
		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.dateFromUnixDays(stor, 0, src / msPerDay);
		Core.timeFromUnixUs(stor, dateBytes, src * 1000);
		return new DateTimeLocal(stor, 0);
	}

	/**
	 * Create a date-time from float seconds since UNIX epoch aka unix time
	 *
	 * @param src Unix time at second accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTime(src: number): DateTimeLocal {
		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.dateFromUnixDays(stor, 0, src / sPerDay);
		Core.timeFromUnixUs(stor, dateBytes, src * 1000000);
		return new DateTimeLocal(stor, 0);
	}

	/** Create this date-time */
	public static now(): DateTimeLocal {
		//Note we depend on JS performance here to catch a point in time
		//(rather than relying on each component's now() method which could cause inconsistency)
		let now = performance.timeOrigin + performance.now();
		//Calculate the offset to get it in local time
		const utcDt = new Date(now);
		const offset = utcDt.getTimezoneOffset() * msPerMin;
		now -= offset;

		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.dateFromUnixDays(stor, 0, now / msPerDay);
		Core.timeFromUnixUs(stor, dateBytes, now * 1000);
		return new DateTimeLocal(stor, 0);
	}

	public static parse(input: WindowStr, strict = false): DateTimeLocal {
		const reset = input.getReset();
		input.trim();

		//If content starts with "now" and optionally followed by whitespace - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			return DateTimeLocal.now();
		}

		const stor = new Uint8Array(dateBytes + timeBytes);
		let e: Error | undefined = undefined;

		//If it's 20-21 digits, with optional leading sign, tailing z assume it's an un-delimited dateTime
		if (input.test(/^[-+]?\d{20,21}$/)) {
			e = Core.parseDateUndelim(
				stor,
				0,
				input.left(input.length - 12),
				strict,
				reset
			);
			if (e) throw e;
			input.shrink(input.length - 12);

			e = Core.parseTimeUndelim(stor, dateBytes, input, strict, reset);
			if (e) throw e;

			input.shrink(input.length);
			return new DateTimeLocal(stor, 0);
		}

		const tPos = input.indexOfAny(['t', 'T']);
		if (tPos > 0) {
			e = Core.parseDate(stor, 0, input.left(tPos), strict, reset);
			if (e) throw e;
			input.shrink(tPos + 1);

			e = Core.parseTime(stor, dateBytes, input, strict, reset);
			if (e) throw e;

			input.shrink(input.length);
			return new DateTimeLocal(stor, 0);
		}

		throw new ContentError(
			`Expecting yyyy-mm-ddThh:mm:ss.uuuuuuZ or a 20-21 digit date with optional sign/trailing z`,
			'datetime',
			input
		);
	}

	public static deserialize(source: BitReader): DateTimeLocal {
		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.deserDate(stor, 0, source);
		Core.deserTime(stor, dateBytes, source);
		return new DateTimeLocal(stor, 0);
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
			this._date_iso(this._pos, '-') +
			dateTimeSep +
			this._time_iso(this._pos + dateBytes, true) +
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
			super.toUnixDays(this._pos) * msPerDay +
				this.timeToUs(this._pos + dateBytes) / 1000
		);
	}

	/**
	 * String datetime, without separators
	 * NOTE there are gaps in valid values, but you can do < > = comparisons
	 * NOTE UTC indicator is not included in this value
	 */
	public valueOf(): string {
		return (
			this._date_iso(this._pos, '') +
			this._time_iso(this._pos + dateBytes, false)
		);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): DateTimeUtc {
		this._date_valid(this._pos);
		this._time_valid(this._pos + dateBytes);
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
		const stor = new Uint8Array(dateBytes + timeBytes);
		if (du instanceof DurationExact) {
			this._addDe(du, stor);
		} else {
			this._addDv(du, stor);
		}
		return new DateTimeUtc(stor, 0);
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
		const stor = new Uint8Array(dateBytes + timeBytes);
		if (du instanceof DurationExact) {
			this._subDe(du, stor);
		} else {
			this._subDv(du, stor);
		}
		return new DateTimeUtc(stor, 0);
	}
	//asUtc|asLocal tbd

	/**
	 * Whether this is greater than `other`
	 * @param other
	 * @returns True - this is greater, false-this is less or equal
	 * @pure
	 */
	public gt(other: DateTimeUtc): boolean {
		return super.gt(other);
	}

	/**
	 * Whether this is greater than or equal `other`
	 * @param other
	 * @pure
	 */
	public gte(other: DateTimeUtc): boolean {
		return super.gt(other, true);
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
	 * @param storage
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
		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.vetDate(y, m, d);
		Core.vetTime(h, i, s, u);
		Core.writeDate(stor, 0, y, m, d);
		Core.writeTime(stor, dateBytes, h, i, s, u);
		return new DateTimeUtc(stor, 0);
	}

	public static fromValue(v: string): DateTimeUtc {
		const stor = new Uint8Array(dateBytes + timeBytes);
		const dt = parseDec(v.substring(0, v.length - 12));
		const tm = parseDec(v.substring(v.length - 12));
		Core.dateFromValue(stor, 0, dt);
		Core.timeFromValue(stor, dateBytes, tm);
		return new DateTimeUtc(stor, 0);
	}

	/**
	 * Create a time from a js Date object
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 * @param date Value used as source
	 */
	public static fromDate(date: Date): DateTimeUtc {
		const dms = date.valueOf() - date.getTimezoneOffset() * msPerMin;
		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.dateFromUnixDays(stor, 0, dms / msPerDay);
		Core.timeFromUnixUs(stor, dateBytes, dms * 1000);
		return new DateTimeUtc(stor, 0);
	}

	/**
	 * Create a date-time from float milliseconds since UNIX epoch aka unix time
	 *
	 * @param src Unix time at millisecond accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTimeMs(src: number): DateTimeUtc {
		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.dateFromUnixDays(stor, 0, src / msPerDay);
		Core.timeFromUnixUs(stor, dateBytes, src * 1000);
		return new DateTimeUtc(stor, 0);
	}

	/**
	 * Create a date-time from float seconds since UNIX epoch aka unix time
	 *
	 * @param src Unix time at second accuracy, may include floating point (for higher resolution)
	 */
	public static fromUnixTime(src: number): DateTimeUtc {
		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.dateFromUnixDays(stor, 0, src / sPerDay);
		Core.timeFromUnixUs(stor, dateBytes, src * 1000000);
		return new DateTimeUtc(stor, 0);
	}

	/** Create this date-time (UTC) */
	public static now(): DateTimeUtc {
		const utcNow = performance.timeOrigin + performance.now();
		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.dateFromUnixDays(stor, 0, utcNow / msPerDay);
		Core.timeFromUnixUs(stor, dateBytes, utcNow * 1000);
		return new DateTimeUtc(stor, 0);
	}

	public static parse(input: WindowStr, strict = false): DateTimeUtc {
		const reset = input.getReset();
		input.trim();

		//If content is "now" - run now macro
		if (input.toString().toLowerCase() == 'now') {
			input.shrink(3);
			return DateTimeUtc.now();
		}

		const stor = new Uint8Array(dateBytes + timeBytes);
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
				stor,
				0,
				input.left(input.length - 12),
				strict,
				reset
			);
			if (e) throw e;
			input.shrink(input.length - 12);

			e = Core.parseTimeUndelim(stor, dateBytes, input, strict, reset);
			if (e) throw e;

			input.shrink(input.length);
			return new DateTimeUtc(stor, 0);
		}

		const tPos = input.indexOfAny(['t', 'T']);
		//z is required if strict
		if (tPos > 0 && (hasZ || !strict)) {
			e = Core.parseDate(stor, 0, input.left(tPos), strict, reset);
			if (e) throw e;
			input.shrink(tPos + 1);

			e = Core.parseTime(stor, dateBytes, input, strict, reset);
			if (e) throw e;

			input.shrink(input.length);
			return new DateTimeUtc(stor, 0);
		}

		reset();
		throw new ContentError(
			`Expecting yyyy-mm-ddThh:mm:ss.uuuuuuZ or a 20-21 digit date with optional sign/trailing z`,
			'datetime',
			input
		);
	}

	public static deserialize(source: BitReader): DateTimeUtc {
		const stor = new Uint8Array(dateBytes + timeBytes);
		Core.deserDate(stor, 0, source);
		Core.deserTime(stor, dateBytes, source);
		return new DateTimeUtc(stor, 0);
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
