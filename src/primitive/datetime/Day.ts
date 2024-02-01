/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitWriter } from '../BitWriter.js';
import { BitReader } from '../BitReader.js';
import { ISerializer } from '../interfaces/ISerializer.js';
import { ContentError } from '../error/ContentError.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'DayOfMonth';

/** Day of month */
export class Day implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 1;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 5; //2^5=32
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
	public toIsoString(): string {
		const s = (this.#v[0] + 1).toString();
		return ('00' + s).substring(s.length);
	}

	/** Day of the month ISO8601 as a number (1-31) */
	toJSON(): number {
		return this.#v[0] + 1;
	}

	/** Day of the month ISO8601 as a number (1-31) */
	public valueOf(): number {
		return this.#v[0] + 1;
	}

	/** Serialize into target  - 5 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.#v[0], Day.serialBits);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return self.serialBits;
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

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.lengthAtLeast('storage', storage, self.storageBytes);
		return storage;
	}

	/** Create a new day of the month, range 1-31 */
	public static new(day: number, storage?: Uint8Array): Day {
		safe.int.inRangeInc(day, 1, 31);
		const stor = self.setupStor(storage);
		stor[0] = day - 1;
		return new Day(stor);
	}

	/**
	 * Create a day from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Day {
		const stor = self.setupStor(storage);
		stor[0] = date.getDate() - 1; //Days are 0 based
		return new Day(stor);
	}

	/**
	 * Create a day from a js Date object in UTC
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): Day {
		const stor = self.setupStor(storage);
		stor[0] = date.getUTCDate() - 1; //Days are 0 based
		return new Day(stor);
	}

	/**
	 * Create a day from a string, accepts:
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
	): Day {
		const strVal = safe.string.nullEmpty(input);
		if (strVal === undefined)
			throw new ContentError('require string content', 'input', input);
		if (strVal.toLowerCase() === 'now') return self.now(storage);

		//Only parse integers (no floating point/scientific notation)
		const r = strVal.match(/^\s*(\d\d?)\s*$/);
		if (r !== null) {
			if (strict) {
				if (r[1].length != 2)
					throw new ContentError(
						'expecting 2 digit unsigned integer-string',
						'input',
						strVal
					);
			}
			const intVal = parseInt(r[1], 10);
			return self.new(intVal, storage);
		}
		throw new ContentError(
			'expecting 1-2 digit unsigned integer-string',
			'input',
			strVal
		);
	}

	/** Create this day of the month (local) */
	public static now(storage?: Uint8Array): Day {
		return self.fromDate(new Date(), storage);
	}

	//nowUtc: While TZ may change a day value, it's more of a DateTime concern

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
		const stor = self.setupStor(storage);
		stor[0] = source.readNumber(self.serialBits);
		return new Day(stor);
	}
}
const self = Day;
