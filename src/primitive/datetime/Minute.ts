/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { Sexagesimal } from '../number/Sexagesimal.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Minute';
const minPerHour = 60;
const secPerMin = 60;
const secPerHour = secPerMin * minPerHour;
const msPerMin = secPerMin * 1000;
const msPerHour = msPerMin * minPerHour;
const usPerMin = secPerMin * 1000000;
const usPerHour = usPerMin * minPerHour;

export class Minute extends Sexagesimal {
	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/** Return a copy of this value (using provided storage/different memory) */
	public clone(storage?: Uint8Array): Minute {
		const stor = self.setupStor(storage);
		stor[0] = this._v[0];
		return new Minute(stor);
	}

	/**
	 * Create from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Minute {
		const stor = self.setupStor(storage);
		stor[0] = date.getMinutes();
		return new Minute(stor);
	}

	/**
	 * Create from a js Date object in UTC
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): Minute {
		const stor = self.setupStor(storage);
		stor[0] = date.getUTCMinutes();
		return new Minute(stor);
	}

	/** Create from seconds since UNIX epoch */
	public static fromUnixTime(source: number, storage?: Uint8Array): Minute {
		const stor = self.setupStor(storage);
		stor[0] = (source % secPerHour) / secPerMin;
		return new Minute(stor);
	}

	/** Create from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(source: number, storage?: Uint8Array): Minute {
		const stor = self.setupStor(storage);
		stor[0] = (source % msPerHour) / msPerMin;
		return new Minute(stor);
	}

	/** Create from microseconds since UNIX epoch */
	public static fromUnixTimeUs(source: number, storage?: Uint8Array): Minute {
		const stor = self.setupStor(storage);
		stor[0] = (source % usPerHour) / usPerMin;
		return new Minute(stor);
	}

	/** Create this minute (local) */
	public static now(storage?: Uint8Array): Minute {
		return self.fromDate(new Date(), storage);
	}

	/** Create this minute (UTC) */
	public static nowUtc(storage?: Uint8Array): Minute {
		const n = new Date();
		//This is hacky - Date keeps UTC internally, but interprets value into local on output
		//(getters) ie. getFulLYear/getMonth/getDate are in local.
		//SO! If we add getTimezoneOffset (which is minutes) to the current time, we get the "UTC" time.
		const nUtc = new Date(n.valueOf() + n.getTimezoneOffset() * 60 * 1000);
		return self.fromDate(nUtc, storage);
	}

	/** Create a new Minute, range 0-59 */
	public static new(v: number, storage?: Uint8Array): Minute {
		safe.int.inRangeInc(v, 0, 59);
		const stor = self.setupStor(storage);
		stor[0] = v;
		return new Minute(stor);
	}

	protected static doParse(
		str: string,
		strict: boolean,
		storage?: Uint8Array
	): Minute {
		if (str.toLowerCase() === 'now') return self.now(storage);
		return super.doParse(str, strict, storage) as Minute;
	}

	/**
	 * Deserialize next 6 bits into a Minute
	 * Throws if:
	 * - There's not 6 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): Minute {
		const stor = self.setupStor(storage);
		stor[0] = source.readNumber(this.serialBits);
		return new Minute(stor);
	}
}
const self = Minute;
