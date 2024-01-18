/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const u8MemSize = 1;

export class Hour implements ISerializer {
	static readonly serialBits = 5;
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
		const r = '0' + this.#v[0].toString();
		return r.substring(r.length - 2);
	}

	/** Hour as a number (0-23) */
	public valueOf(): number {
		return this.#v[0];
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.#v[0], Hour.serialBits);
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

	/** Create a new hour, range 0-23 */
	public static new(hour: number, storage?: Uint8Array): Hour {
		safe.int.inRangeInc(hour, 0, 23);
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		storage[0] = hour;
		return new Hour(storage);
	}

	/**
	 * Create an hour from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Hour {
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		storage[0] = date.getHours();
		return new Hour(storage);
	}

	/**
	 * Create an hour from a string accepts:
	 * 'now', a 1-2 digit unsigned integer
	 *
	 * Throws if:
	 * - Not a string, or $str is empty
	 * - There's no available $storage
	 * - The integer value of $str is out of range
	 * - The content of $str isn't valid
	 */
	public static parse(str: string, storage?: Uint8Array, strict = false): Hour {
		const strVal = safe.string.nullEmpty(str);
		if (strVal === undefined)
			throw new ContentError('require string content', str);
		if (strVal.toLowerCase() === 'now') return this.now(storage);

		//Only parse integers (no floating point/scientific notation)
		const r = strVal.match(/^\s*(\d+)\s*$/);
		if (r !== null) {
			if (strict) {
				if (r[1].length != 2)
					throw new ContentError(
						'expecting 2 digit unsigned integer-string',
						strVal
					);
			} else {
				if (r[1].length > 2)
					throw new ContentError(
						'expecting 1-2 digit unsigned integer-string',
						strVal
					);
			}
			const intVal = parseInt(r[1], 10);
			return this.new(intVal, storage);
		}
		throw new ContentError('expecting unsigned integer-string', strVal);
	}

	/** Create this hour (local) */
	public static now(storage?: Uint8Array): Hour {
		return this.fromDate(new Date(), storage);
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
		return this.fromDate(nUtc, storage);
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
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		storage[0] = source.readNumber(Hour.serialBits);
		return new Hour(storage);
	}
}
