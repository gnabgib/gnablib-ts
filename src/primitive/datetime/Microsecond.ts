/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { Micro } from '../number/Micro.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Microsecond';

export class Microsecond extends Micro {
	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/** Microsecond as a floating point millisecond */
	public toMillisecond(): number {
		return this.valueOf() / 1000;
	}

	/**
	 * Create a microsecond from a js Date object
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 *
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Microsecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, date.getMilliseconds() * 1000);
		return new Microsecond(stor);
	}

	/**
	 * Create a microsecond from a js Date object in UTC
	 * **WARN**: Date only has millisecond accuracy, use {@link now}, or
	 * {@link fromUnixTime}/{@link fromUnixTimeMs} with a high resolution (floating point) source
	 *
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): Microsecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, date.getUTCMilliseconds() * 1000);
		return new Microsecond(stor);
	}

	/**
	 * Create from seconds since Unix epoch
	 * *NOTE*: `$source` can be floating point (ie higher resolution than seconds)
	 * */
	public static fromUnixTime(
		source: number,
		storage?: Uint8Array
	): Microsecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, (source * 1000000) % 1000000);
		return new Microsecond(stor);
	}

	/**
	 * Create from milliseconds since Unix epoch
	 * *NOTE*: `$source` can be floating point (ie higher resolution than milliseconds)
	 * */
	public static fromUnixTimeMs(
		source: number,
		storage?: Uint8Array
	): Microsecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, (source * 1000) % 1000000);
		return new Microsecond(stor);
	}

	/**
	 * Create from microseconds since Unix epoch.  Largely the same as new() but `$source`
	 * is `mod 1000000` allowing wrap around (rather than enforcing range constraints)
	 * *NOTE*: if `$source` is floating point it will be truncated
	 * @param source
	 * @param storage
	 * @returns
	 */
	public static fromUnixTimeUs(
		source: number,
		storage?: Uint8Array
	): Microsecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, source % 1000000);
		return new Microsecond(stor);
	}

	/** Create this microsecond (local) */
	public static now(storage?: Uint8Array): Microsecond {
		const now = performance.timeOrigin + performance.now();
		return self.fromUnixTimeMs(now, storage);
	}

	//nowUtc makes no sense: there's no TZ that's off by microseconds

	/** Create a new Microsecond, range 0-59 */
	public static new(v: number, storage?: Uint8Array): Microsecond {
		safe.int.inRangeInc(v, 0, 999999);
		const stor = self.setupStor(storage);
		self.writeValue(stor, v);
		return new Microsecond(stor);
	}

	protected static doParse(
		str: string,
		strict: boolean,
		storage?: Uint8Array
	): Microsecond {
		const stor = self.setupStor(storage);
		if (str.toLowerCase() === 'now') return self.now(stor);
		const m=super.doParse(str, strict, stor);
		return new Microsecond(stor);
	}

	/**
	 * Deserialize next bits into a Microsecond
	 * Throws if:
	 * - There's not 6 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(
		source: BitReader,
		storage?: Uint8Array
	): Microsecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, source.readNumber(self.serialBits));
		return new Microsecond(stor);
	}
}
const self = Microsecond;
