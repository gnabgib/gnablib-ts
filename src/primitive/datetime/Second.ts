/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { Sexagesimal } from '../number/Sexagesimal.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Second';
const secsPerMin = 60;
const msPerSec = 1000;
const msPerMin = secsPerMin * msPerSec;
const usPerSec = 1000000;
const usPerMin = usPerSec * secsPerMin;

export class Second extends Sexagesimal {
	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/** Return a copy of this value (using provided storage/different memory) */
	public clone(storage?: Uint8Array): Second {
		const stor = self.setupStor(storage);
		stor[0] = this._v[0];
		return new Second(stor);
	}

	/**
	 * Create a second from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Second {
		const stor = self.setupStor(storage);
		stor[0] = date.getSeconds();
		return new Second(stor);
	}

	/**
	 * Create a second from a js Date object in UTC
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): Second {
		const stor = self.setupStor(storage);
		stor[0] = date.getUTCSeconds();
		return new Second(stor);
	}

	/** Create a second from seconds since Unix epoch */
	public static fromUnixTime(source: number, storage?: Uint8Array): Second {
		const stor = self.setupStor(storage);
		stor[0] = source % secsPerMin;
		return new Second(stor);
	}

	/** Create a second from milliseconds since Unix epoch */
	public static fromUnixTimeMs(source: number, storage?: Uint8Array): Second {
		const stor = self.setupStor(storage);
		stor[0] = (source % msPerMin) / msPerSec;
		return new Second(stor);
	}

	/** Create from microseconds since Unix epoch */
	public static fromUnixTimeUs(source: number, storage?: Uint8Array): Second {
		const stor = self.setupStor(storage);
		stor[0] = (source % usPerMin) / usPerSec;
		return new Second(stor);
	}

	/** Create this second (local) */
	public static now(storage?: Uint8Array): Second {
		return self.fromDate(new Date(), storage);
	}

	//nowUtc makes no sense: there's no TZ that's off by seconds

	/** Create a new Second, range 0-59 */
	public static new(v: number, storage?: Uint8Array): Second {
		safe.int.inRangeInc('value', v, 0, 59);
		const stor = self.setupStor(storage);
		stor[0] = v;
		return new Second(stor);
	}

	protected static doParse(
		str: string,
		strict: boolean,
		storage?: Uint8Array
	): Second {
		if (str.toLowerCase() === 'now') return self.now(storage);
		return super.doParse(str, strict, storage) as Second;
	}

	/**
	 * Deserialize next 6 bits into a Second
	 * Throws if:
	 * - There's not 6 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): Second {
		const stor = self.setupStor(storage);
		stor[0] = source.readNumber(this.serialBits);
		return new Second(stor);
	}
}
const self = Second;
