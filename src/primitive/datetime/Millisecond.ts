/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { BitReader } from '../BitReader.js';
import { Milli } from '../number/Milli.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Millisecond';

export class Millisecond extends Milli {
	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/**
	 * Create a millisecond from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Millisecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, date.getMilliseconds());
		return new Millisecond(stor);
	}

	/**
	 * Create a millisecond from a js Date object in UTC
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): Millisecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, date.getUTCMilliseconds());
		return new Millisecond(stor);
	}

	/** Create a millisecond from float seconds since UNIX epoch */
	public static fromUnixTime(
		source: number,
		storage?: Uint8Array
	): Millisecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, (source * 1000) % 1000);
		return new Millisecond(stor);
	}

	/** Create a millisecond from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(
		source: number,
		storage?: Uint8Array
	): Millisecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, source % 1000);
		return new Millisecond(stor);
	}

	/** Create this millisecond (local) */
	public static now(storage?: Uint8Array): Millisecond {
		const now = performance.timeOrigin + performance.now();
		return self.fromUnixTimeMs(now, storage);
	}

	//nowUtc makes no sense: there's no TZ that's off by milliseconds

	/** Create a new Millisecond, range 0-59 */
	public static new(v: number, storage?: Uint8Array): Millisecond {
		return Milli.new(v, storage) as Millisecond;
	}

	protected static doParse(
		str: string,
		strict: boolean,
		storage?: Uint8Array
	): Millisecond {
		if (str.toLowerCase() === 'now') return self.now(storage);
		return super.doParse(str, strict, storage) as Millisecond;
	}

	/**
	 * Deserialize next bits into a Millisecond
	 * Throws if:
	 * - There's not 10 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(
		source: BitReader,
		storage?: Uint8Array
	): Millisecond {
		const stor = self.setupStor(storage);
		self.writeValue(stor, source.readNumber(self.serialBits));
		return new Millisecond(stor);
	}
}
const self = Millisecond;
