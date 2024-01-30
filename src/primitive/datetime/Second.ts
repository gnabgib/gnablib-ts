/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { Sexagesimal } from '../number/Sexagesimal.js';

const secsPerMin = 60;
const milliPerSec = 1000;
const milliPerMin = secsPerMin * milliPerSec;

export class Second extends Sexagesimal {
	/**
	 * Create a second from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Second {
		const stor = self.setupStor(storage);
		stor[0] = date.getSeconds();
		return new Second(stor);
	}

	/** Create a second from seconds since UNIX epoch */
	public static fromUnixTime(
		source: number,
		storage?: Uint8Array
	): Second {
		const stor = self.setupStor(storage);
		stor[0] = source % secsPerMin;
		return new Second(stor);
	}

	/** Create a second from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(
		source: number,
		storage?: Uint8Array
	): Second {
		const stor = self.setupStor(storage);
		stor[0] = (source % milliPerMin) / milliPerSec;
		return new Second(stor);
	}

	/** Create this second (local) */
	public static now(storage?: Uint8Array): Second {
		return self.fromDate(new Date(), storage);
	}

	//nowUtc makes no sense: there's no TZ that's off by seconds

	protected static doParse(
		str: string,
		strict: boolean,
		storage?: Uint8Array
	): Second {
		if (str.toLowerCase() === 'now') return self.now(storage);
		return super.doParse(str, strict, storage);
	}
}
const self = Second;
