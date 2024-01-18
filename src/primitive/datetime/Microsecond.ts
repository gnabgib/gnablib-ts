/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const u8MemSize = 3;

export class Microsecond implements ISerializer {
	static readonly serialBits = 20;
	readonly #v: Uint8Array;

	private constructor(storage: Uint8Array) {
		this.#v = storage;
	}

	/** Microseconds, not zero padded (0-999999) */
	public toString(): string {
		return this.valueOf().toString();
		//return stringExt.padStart(this.valueOf().toString(),6,'0');
	}

	/** Microseconds, zero padded (000000-999999) */
	public toIsoString(): string {
		const r = this.valueOf().toString();
		return ('000000' + r).substring(r.length);
	}

	/** Microseconds (0-999999) */
	public valueOf(): number {
		return (this.#v[0] << 16) | (this.#v[1] << 8) | this.#v[2];
	}

	/** Serialize into target  - 20 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.valueOf(), Microsecond.serialBits);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Microsecond {
		safe.int.inRangeInc(this.valueOf(), 0, 999999);
		return this;
	}

	private static writeValue(target: Uint8Array, us: number): void {
		target[0] = us >> 16;
		target[1] = us >> 8;
		target[2] = us;
	}

	/** Create a new MicroSecond, range 0-999999 */
	public static new(microSecond: number, storage?: Uint8Array): Microsecond {
		safe.int.inRangeInc(microSecond, 0, 999999);
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		this.writeValue(storage, microSecond);
		return new Microsecond(storage);
	}

	/**
	 * WARNING: Date only has millisecond accuracy, use .now() instead
	 * Create a microSecond from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Microsecond {
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		this.writeValue(storage, date.getMilliseconds() * 1000);
		return new Microsecond(storage);
	}

	/**
	 * Create a microsecond from a string accepts:
	 * 'now', a 1-6 digit unsigned integer
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
	): Microsecond {
		const strVal = safe.string.nullEmpty(str);
		if (strVal === undefined)
			throw new ContentError('require string content', str);
		if (strVal.toLowerCase() === 'now') return this.now(storage);

		//Only parse integers (no floating point/scientific notation)
		const r = strVal.match(/^\s*(\d{1,6})\s*$/);
		if (r !== null) {
			if (strict) {
				if (r[1].length != 6)
					throw new ContentError(
						'expecting 6 digit unsigned integer-string',
						strVal
					);
			}
			const intVal = parseInt(r[1], 10);
			return this.new(intVal, storage);
		}
		throw new ContentError('expecting unsigned integer-string', strVal);
	}

	/** Create this microSecond (local) */
	public static now(storage?: Uint8Array): Microsecond {
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		const now = performance.timeOrigin + performance.now();
		const ms = now % 1000;
		this.writeValue(storage, Math.floor(ms * 1000));
		return new Microsecond(storage);
	}

	//nowUtc makes no sense: there's no TZ that's off by microSecond

	/**
	 * Deserialize next 20 bits into microSeconds
	 * Throws if:
	 * - There's not 20 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(
		source: BitReader,
		storage?: Uint8Array
	): Microsecond {
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		const us = source.readNumber(this.serialBits);
		this.writeValue(storage, us);
		return new Microsecond(storage);
	}
}
