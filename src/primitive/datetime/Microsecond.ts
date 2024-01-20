/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { Micro } from '../number/Micro.js';

export class Microsecond extends Micro {
	/**
	 * Create a microsecond from a js Date object
	 * WARNING: Date only has millisecond accuracy, use .now() instead
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Microsecond {
		const stor = this.setupStor(storage);
		this.writeValue(stor, date.getMilliseconds() * 1000);
		return new Microsecond(stor);
	}

	/** Create a microsecond from float seconds since UNIX epoch */
	public static fromSecondsSinceEpoch(
		source: number,
		storage?: Uint8Array
	): Microsecond {
		const stor = this.setupStor(storage);
		this.writeValue(stor, (source * 1000000) % 1000000);
		return new Microsecond(stor);
	}

	/** Create a microsecond from milliseconds since UNIX epoch */
	public static fromMillisecondsSinceEpoch(
		source: number,
		storage?: Uint8Array
	): Microsecond {
		const stor = this.setupStor(storage);
		//this.writeValue(stor, (source % 1000) * 1000);
		this.writeValue(stor, (source * 1000) % 1000000);
		return new Microsecond(stor);
	}

	/** Create this microsecond (local) */
	public static now(storage?: Uint8Array): Microsecond {
		const now = performance.timeOrigin + performance.now();
		return this.fromMillisecondsSinceEpoch(now, storage);
	}

	//nowUtc makes no sense: there's no TZ that's off by microseconds

	protected static doParse(
		str: string,
		strict: boolean,
		storage?: Uint8Array
	): Microsecond {
		if (str.toLowerCase() === 'now') return this.now(storage);
		return super.doParse(str, strict, storage);
	}
}
