/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitWriter } from '../BitWriter.js';
import { BitReader } from '../BitReader.js';
import { ISerializer } from '../interfaces/ISerializer.js';
import { ContentError } from '../error/ContentError.js';

const byteMemSize = 1;

/** Day of month */
export class Day implements ISerializer {
	static readonly serialBits = 5;
	/** Note there's no zero day in a month, so we shift by one internally (0=1st, 30=31st, 31=invalid) */
	readonly #v: Uint8Array;

	private constructor(storage: Uint8Array) {
		this.#v = storage;
	}

	/** Day, not zero padded (1-31) */
	public toString(): string {
		return (this.#v[0] + 1).toString();
	}
	/** Day ISO8601, zero padded (01-31) */
	public toIsoString():string {
		const r='0'+(this.#v[0] + 1).toString();
		return r.substring(r.length-2);
	}

	/** Day of the month ISO8601 as a number (1-31) */
	public valueOf(): number {
		return this.#v[0] + 1;
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.#v[0], Day.serialBits);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Day {
		safe.int.inRangeInc(this.#v[0], 0, 30);
		return this;
	}

	/** Create a new day of the month, range 1-31 */
	public static new(day: number, storage?: Uint8Array): Day {
		safe.int.inRangeInc(day, 1, 31);
		if (!storage) {
			storage = new Uint8Array(byteMemSize);
		} else {
			safe.lengthAtLeast(storage, byteMemSize);
		}
		storage[0] = day - 1;
		return new Day(storage);
	}

	/**
	 * Create a day from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Day {
		if (!storage) {
			storage = new Uint8Array(byteMemSize);
		} else {
			safe.lengthAtLeast(storage, byteMemSize);
		}
		storage[0] = date.getDate() - 1;
		return new Day(storage);
	}

	/**
	 * Create a day from a string, accepts:
	 * 'now', a 2 digit unsigned integer
	 *
	 * Throws if:
	 * - Not a string, or $str is empty
	 * - There's no available $storage
	 * - The integer value of $str is out of range
	 * - The content of $str isn't valid
	 */
	public static parse(str: string, storage?: Uint8Array, strict = false): Day {
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

	/** Create this day of the month (local) */
	public static now(storage?: Uint8Array): Day {
		return this.fromDate(new Date(), storage);
	}

	/**
	 * Deserialize next 5 bits into day of month.
	 * Throws if:
	 * - There's not 5 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 * @returns
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): Day {
		if (!storage) {
			storage = new Uint8Array(byteMemSize);
		} else {
			safe.lengthAtLeast(storage, byteMemSize);
		}
		storage[0] = source.readNumber(Day.serialBits);
		return new Day(storage);
	}
}
