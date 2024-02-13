/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { WindowStr } from '../WindowStr.js';
import { AtMostError } from '../../error/AtMostError.js';
import { ContentError } from '../../error/ContentError.js';
import { LessThanError } from '../../error/LessThanError.js';
import { NegativeError } from '../../error/NegativeError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'DurationVague';
const maxMos = 699050;
const maxDays = 512;

export interface IDurationVagueParts {
	y?: number;
	m?: number;
	d?: number;
}

/**
 * A duration of years, months, and days that vary based on context.
 *
 * Years can be 365-366 days (ie leap years), in one (known) historical case
 * ([1752 in US](https://www.timeanddate.com/calendar/julian-gregorian-switch.html)) the year was 356 days
 *
 * Months can be 28,30 or 31 days long (variance of months), and of course 29 days for February on leap years. Note
 * September 1752 was only 19 days long.
 *
 * Days can be 23-25 hours long (due to daylight savings/summer and winter times).
 * [BDST](https://www.timeanddate.com/time/zone/uk/london?year=1947) was two sequential shifts so still only resulted
 * in 23/25 hour days.  Note a few rare savings timezones are only a 30 minute shift.
 */
export class DurationVague implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 4;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 32;
	readonly #m12: number;

	protected constructor(
		m12: number,
		/** Days (0 - 512) */
		public readonly days: number
	) {
		this.#m12 = m12;
	}

	/** Zero duration */
	public static get zero(): DurationVague {
		return zero;
	}
	public static get max(): DurationVague {
		return max;
	}

	/** Years (0 - 25k) */
	public get year(): number {
		return (this.#m12 / 144) | 0;
	}

	/** Months (0 - 12) */
	public get month(): number {
		return ((this.#m12 / 12)%12) | 0;
	}

	public toString(): string {
		let ret = '';
		let v = this.#m12 / 12;

		const m = v % 12;
		v = (v / 12) | 0;

		if (v > 0) ret += v + 'y';
		if (m > 0) ret += m + 'm';
		if (this.days > 0) ret += this.days + 'd';
		return ret;
	}
	//toIso8601

	/** Serialize into target */
	public serialize(target: BitWriter): void {
		target.writeNumber(this.#m12, 23);
		target.writeNumber(this.days, 9);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return DurationVague.serialBits;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	public static fromMonthsDays(m: number, d: number): DurationVague {
		safe.int.inRangeInc('months', m, 0, maxMos);
		safe.int.inRangeInc('days', d, 0, maxDays);
		m = (m * 12) | 0;
		return new DurationVague(m, d);
	}

	public static new(parts: IDurationVagueParts): DurationVague {
		let m = 0;
		let d = 0;
		if (parts.y) {
			if (parts.y < 0) throw new NegativeError('years', parts.y);
			m = parts.y * 144;
		}
		if (parts.m) {
			if (parts.m < 0) throw new NegativeError('months', parts.m);
			m += parts.m * 12;
		}
		if (parts.d) {
			if (parts.d < 0) throw new NegativeError('days', parts.d);
			d += parts.d;
		}
		return new DurationVague(m | 0, d);
	}

	/**
	 * Deserialize next 32 bits into duration
f	 * Throws if:
	 * - There's not enough bits remaining in $source.buffer
	 * @param source Source to read bits from
	 * @returns
	 */
	public static deserialize(source: BitReader): DurationVague {
		const m = source.readNumber(23);
		const d = source.readNumber(9);
		return new DurationVague(m, d);
	}
}
const zero = DurationVague.fromMonthsDays(0, 0);
const max = DurationVague.fromMonthsDays(maxMos, maxDays);
//const zero=DurationVague
//2^16 months = 5461yr
//~46k years (same as Duration) ~= 551202mos (2^20 = 1048576 = 87,381y)
//~46k years = 33072130 60ths of months (2^21)
//2^11=2048
//2^23 = 8388608 / 144 = 58254 years of months 12ths, fits 6,614,426 12ths of months
// - supports a good range and fractional months (1/2 1/3 1/4 1/6 1/12)
//2^9=512 days (no factions) both fit in 2^32
// There are exactly 146097 days in 400years, duration covers 114 of these
// 146097 can be stored in 2^18 (262144), which gives us 6 bits back from Duration storage 2^6=64 64CD=25600
//400y in month-12ths = 57600 (2^16=65536)
