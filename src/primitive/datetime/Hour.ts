/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const secsPerHour = 60 * 60;
const msPerHour = secsPerHour * 1000;
const secsPerDay = secsPerHour * 24;
const msPerDay = secsPerDay * 1000;

export class Hour implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 1;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 5; //2^5=32
	readonly #v: Uint8Array;

	private constructor(storage: Uint8Array) {
		this.#v = storage;
	}

	/** Hour, not zero padded (0-23) */
	public toString(): string {
		return this.#v[0].toString();
	}

	/** Hour, zero padded (01-23) */
	public toIsoString(): string {
		const s = this.#v[0].toString();
		return ('00' + s).substring(s.length);
	}

	/** Hour as a number (0-23) */
	public valueOf(): number {
		return this.#v[0];
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.#v[0], self.serialBits);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Hour {
		safe.int.inRangeInc(this.#v[0], 0, 23);
		return this;
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.lengthAtLeast('storage', storage, self.storageBytes);
		return storage;
	}

	/** Create a new hour, range 0-23 */
	public static new(hour: number, storage?: Uint8Array): Hour {
		safe.int.inRangeInc(hour, 0, 23);
		const stor = self.setupStor(storage);
		stor[0] = hour;
		return new Hour(stor);
	}

	/**
	 * Create an hour from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Hour {
		const stor = self.setupStor(storage);
		stor[0] = date.getHours();
		return new Hour(stor);
	}

	/** Create an hour from seconds since UNIX epoch */
	public static fromUnixTime(
		source: number,
		storage?: Uint8Array
	): Hour {
		const stor = self.setupStor(storage);
		stor[0] = (source % secsPerDay) / secsPerHour;
		return new Hour(stor);
	}

	/** Create an hour from milliseconds since UNIX epoch */
	public static fromUnixTimeMs(
		source: number,
		storage?: Uint8Array
	): Hour {
		const stor = self.setupStor(storage);
		stor[0] = (source % msPerDay) / msPerHour;
		return new Hour(stor);
	}

	/**
	 * Create an hour from a string accepts:
	 * 'now', a 1-2 digit unsigned integer
	 *
	 * Throws if:
	 * - Not a string, or $input is empty
	 * - There's no available $storage
	 * - The integer value of $input is out of range
	 * - The content of $input isn't valid
	 */
	public static parse(
		input: string,
		storage?: Uint8Array,
		strict = false
	): Hour {
		const strVal = safe.string.nullEmpty(input);
		if (strVal === undefined)
			throw new ContentError('require string content', 'input', input);
		if (strVal.toLowerCase() === 'now') return self.now(storage);

		//Only parse integers (no floating point/scientific notation)
		const r = strVal.match(/^\s*(\d+)\s*$/);
		if (r !== null) {
			if (strict) {
				if (r[1].length != 2)
					throw new ContentError(
						'expecting 2 digit unsigned integer-string',
						'input',
						strVal
					);
			} else {
				if (r[1].length > 2)
					throw new ContentError(
						'expecting 1-2 digit unsigned integer-string',
						'input',
						strVal
					);
			}
			const intVal = parseInt(r[1], 10);
			return self.new(intVal, storage);
		}
		throw new ContentError(
			'expecting unsigned integer-string',
			'input',
			strVal
		);
	}

	/** Create this hour (local) */
	public static now(storage?: Uint8Array): Hour {
		return self.fromDate(new Date(), storage);
	}

	/** Create this hour (UTC) */
	public static nowUtc(storage?: Uint8Array): Hour {
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

	/**
	 * Deserialize next 4 bits into month of year
	 * Throws if:
	 * - There's not 4 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): Hour {
		const stor = self.setupStor(storage);
		stor[0] = source.readNumber(self.serialBits);
		return new Hour(stor);
	}
}
const self = Hour;
