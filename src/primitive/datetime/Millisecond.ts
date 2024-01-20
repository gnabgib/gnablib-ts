/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { Milli } from '../number/Milli.js';

export class Millisecond extends Milli {
	/**
	 * Create a millisecond from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Millisecond {
		const stor = this.setupStor(storage);
		this.writeValue(stor, date.getMilliseconds());
		return new Millisecond(stor);
	}

	/** Create a millisecond from float seconds since UNIX epoch */
	public static fromSecondsSinceEpoch(
		source: number,
		storage?: Uint8Array
	): Millisecond {
		const stor = this.setupStor(storage);
		this.writeValue(stor, (source * 1000) % 1000);
		return new Millisecond(stor);
	}

	/** Create a millisecond from milliseconds since UNIX epoch */
	public static fromMillisecondsSinceEpoch(
		source: number,
		storage?: Uint8Array
	): Millisecond {
		const stor = this.setupStor(storage);
		this.writeValue(stor, source % 1000);
		return new Millisecond(stor);
	}

	/** Create this millisecond (local) */
	public static now(storage?: Uint8Array): Millisecond {
		const now = performance.timeOrigin + performance.now();
		return this.fromMillisecondsSinceEpoch(now, storage);
	}

	//nowUtc makes no sense: there's no TZ that's off by milliseconds

	protected static doParse(
		str: string,
		strict: boolean,
		storage?: Uint8Array
	): Millisecond {
		if (str.toLowerCase() === 'now') return this.now(storage);
		return super.doParse(str, strict, storage);
	}
}
