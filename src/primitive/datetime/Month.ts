/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

/** Month of year (gregorian, julian) */
export class Month implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 1;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 4; //2^4=16
	/** Note there's no zero month, so we shift by one internal (0=Jan, 11=Dec, 12=invalid) */
	readonly #v: Uint8Array;

	private constructor(storage: Uint8Array) {
		this.#v = storage;
	}

	/** Month, not zero padded */
	public toString(): string {
		return (this.#v[0] + 1).toString();
	}
	/** Month ISO8601, zero padded (01-12) */
	public toIsoString(): string {
		const s = (this.#v[0] + 1).toString();
		return ('00' + s).substring(s.length);
	}

	/** Month ISO8601 as an integer (1=January, 12=December) */
	public valueOf(): number {
		return this.#v[0] + 1;
	}

	/** Serialize into target  - 4 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.#v[0], Month.serialBits);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 * @returns
	 */
	public validate(): Month {
		safe.int.inRangeInc(this.#v[0], 0, 11);
		return this;
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(Month.storageBytes);
		safe.lengthAtLeast(storage, Month.storageBytes);
		return storage;
	}

	/** Create a new month of the year, range 1-12 */
	public static new(month: number, storage?: Uint8Array): Month {
		safe.int.inRangeInc(month, 1, 12);
		const stor = this.setupStor(storage);
		stor[0] = month - 1;
		return new Month(stor);
	}

	/**
	 * Create a month from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Month {
		const stor = this.setupStor(storage);
		stor[0] = date.getMonth(); //We store months 0 based too (but we don't trouble the dev with that detail)
		return new Month(stor);
	}

	/**
	 * Create a month from a string, accepts:
	 * 'now', a 1-2 digit unsigned integer, short or long form month (based on local localization)
	 *
	 * Throws if:
	 * - Not a string, or $str is empty
	 * - There's no available $storage
	 * - The integer value of $str is out of range
	 * - The content of $str isn't valid
	 */
	public static parse(
		str: string,
		storage?: Uint8Array,
		strict = false
	): Month {
		const strVal = safe.string.nullEmpty(str);
		if (strVal === undefined)
			throw new ContentError('require string content', str);
		if (strVal.toLowerCase() === 'now') return this.now(storage);

		//Only parse integers (no floating point/scientific notation), but let's be linient
		// in the match here to prevent Date.parse from making up an answer when it's
		// a signed-int, or floating point
		const r = strVal.match(/^\s*([+-])?(\d+)(\.\d+)?\s*$/);
		if (r !== null) {
			const [, sign, int, float] = r;
			if (strict) {
				if (sign != undefined || float != undefined || int.length != 2) {
					throw new ContentError(
						'expecting 2 digit unsigned integer-string',
						strVal
					);
				}
			} else {
				//Still have to catch sign, float, or large ints
				if (sign != undefined || float != undefined || int.length > 2) {
					throw new ContentError(
						'expecting 1-2 digit unsigned integer-string',
						strVal
					);
				}
			}
			const intVal = parseInt(int, 10);
			return this.new(intVal, storage);
		}

		//Try and parse using Date and local settings (16th makes unambiguous day)
		const tmp = Date.parse(strVal + ' 16, 2000');
		if (!isNaN(tmp)) return this.fromDate(new Date(tmp), storage);

		throw new ContentError(
			'expecting unsigned integer-string, or short-form-month',
			strVal
		);
	}

	/** Create this month (local) */
	public static now(storage?: Uint8Array): Month {
		return this.fromDate(new Date(), storage);
	}

	//nowUtc: While TZ may change a month value, it's more of a DateTime concern

	/**
	 * Deserialize next 4 bits into month of year
	 * Throws if:
	 * - There's not 4 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): Month {
		const stor = this.setupStor(storage);
		stor[0] = source.readNumber(Month.serialBits);
		return new Month(stor);
	}
}
