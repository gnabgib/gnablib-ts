/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const u8MemSize = 2;

/** Second and millisecond (0-59999 range) */
export class SecondMs implements ISerializer {
	static readonly serialBits = 16;
	readonly #v: Uint8Array;

	private constructor(storage: Uint8Array) {
		this.#v = storage;
	}

	/** Second of minute (0-59) */
	public get second(): number {
		return (((this.#v[0] << 8) | this.#v[1]) / 1000) | 0;
	}
	/** Thousandths of a second (milliseconds - 0-999) */
	public get millisecond(): number {
		return ((this.#v[0] << 8) | this.#v[1]) % 1000;
	}

	/** Second, not zero padded 0.000-59.999 */
	public toString(): string {
		return (((this.#v[0] << 8) | this.#v[1]) / 1000).toFixed(3);
	}

	/** Second, zero padded (00.000-59.000) */
	public toIsoString(): string {
		let r = ((this.#v[0] << 8) | this.#v[1]).toString();
		r = ('00000' + r).substring(r.length);
		return r.substring(0, 2) + '.' + r.substring(2);
	}

	/** Second as a floating-number (0.000-59.999) */
	public valueOf(): number {
		return ((this.#v[0] << 8) | this.#v[1]) / 1000;
	}
	/** Number of ms in minute, integer (0-59999) */
	public valueMs(): number {
		return (this.#v[0] << 8) | this.#v[1];
	}

	/** Serialize into target  - 16 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber((this.#v[0] << 8) | this.#v[1], SecondMs.serialBits);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): SecondMs {
		safe.int.inRangeInc((this.#v[0] << 8) | this.#v[1], 0, 59999);
		return this;
	}

	private static writeValue(target: Uint8Array, ms: number): void {
		target[0] = ms >> 8;
		target[1] = ms;
	}

	/** Create a new millisecond, range 0-59999 */
	public static new(millisecond: number, storage?: Uint8Array): SecondMs {
		safe.int.inRangeInc(millisecond, 0, 59999);
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		this.writeValue(storage, millisecond);
		return new SecondMs(storage);
	}

	/**
	 * Create a second from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): SecondMs {
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		this.writeValue(storage, date.getSeconds() * 1000 + date.getMilliseconds());
		return new SecondMs(storage);
	}

	/**
	 * Create a second+ms from a string accepts:
	 * 'now', a 1-2 digit unsigned integer, a 2-5 digit unsigned float
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
	): SecondMs {
		const strVal = safe.string.nullEmpty(str);
		if (strVal === undefined)
			throw new ContentError('require string content', str);
		if (strVal.toLowerCase() === 'now') return this.now(storage);

		//Only parse integers (no floating point/scientific notation)
		const r = strVal.match(/^\s*(\d\d?)(?:\.(\d{1,3}))?\s*$/);
		if (r !== null) {
			if (strict) {
				if (r[1].length != 2 || r[2].length != 3)
					throw new ContentError(
						'expecting ##.### unsigned float-string',
						strVal
					);
			}
			const i1 = parseInt(r[1], 10);
			let i2 = 0;
			if (r[2]) {
				i2 = parseInt(r[2]);
				i2 *= 10 ** (3 - r[2].length);
			}
			return this.new(i1 * 1000 + i2, storage);
		}
		throw new ContentError('expecting unsigned float-string', strVal);
	}

	/** Create this minute (local) */
	public static now(storage?: Uint8Array): SecondMs {
		return this.fromDate(new Date(), storage);
	}

	//nowUtc makes no sense: there's no TZ that's off by seconds

	/**
	 * Deserialize next 6 bits into seconds
	 * Throws if:
	 * - There's not 6 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): SecondMs {
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		this.writeValue(storage, source.readNumber(this.serialBits));
		return new SecondMs(storage);
	}
}
