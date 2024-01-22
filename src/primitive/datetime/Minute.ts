/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { Sexagesimal } from '../number/Sexagesimal.js';

const secsPerMin = 60;
const secsPerHour = secsPerMin * 60;
const msPerMin = secsPerMin * 1000;
const msPerHour = secsPerHour * 1000;

export class Minute extends Sexagesimal {
	/**
	 * Create a minute from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Minute {
		const stor = self.setupStor(storage);
		stor[0] = date.getMinutes();
		return new Minute(stor);
	}

	/** Create a minute from seconds since UNIX epoch */
	public static fromSecondsSinceEpoch(
		source: number,
		storage?: Uint8Array
	): Minute {
		const stor = self.setupStor(storage);
		stor[0] = (source % secsPerHour) / secsPerMin;
		return new Minute(stor);
	}

	/** Create a minute from milliseconds since UNIX epoch */
	public static fromMillisecondsSinceEpoch(
		source: number,
		storage?: Uint8Array
	): Minute {
		const stor = self.setupStor(storage);
		stor[0] = (source % msPerHour) / msPerMin;
		return new Minute(stor);
	}

	/** Create this minute (local) */
	public static now(storage?: Uint8Array): Minute {
		return self.fromDate(new Date(), storage);
	}

	/** Create this minute (UTC) */
	public static nowUtc(storage?: Uint8Array): Minute {
		const n = new Date();
		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/valueOf
		//This is hackey - Date keeps UTC internally, but interprets value into local on output
		//(getters) ie. getFulLYear/getMonth/getDate are in local.
		//SO! If we add getTimezoneOffset (which is minutes) to the current time, we get the "UTC"
		// time.  Or UTC + timezone offset internally.. it's turtles all the way down
		// minutes * secPerMin * msPerSec (valueOf is in ms)
		const nUtc = new Date(n.valueOf() + n.getTimezoneOffset() * 60 * 1000);
		return self.fromDate(nUtc, storage);
	}

	protected static doParse(
		str: string,
		strict: boolean,
		storage?: Uint8Array
	): Minute {
		if (str.toLowerCase() === 'now') return self.now(storage);
		return super.doParse(str, strict, storage);
	}
}
const self = Minute;
