/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const u8MemSize = 1;

export class Second implements ISerializer {
	static readonly serialBits = 6;
	readonly #v: Uint8Array;

	private constructor(storage: Uint8Array) {
		this.#v = storage;
	}

	/** Second, not zero padded (0-59) */
	public toString(): string {
		return this.#v[0].toString();
	}

	/** Second, zero padded (00-59) */
	public toIsoString(): string {
		let r = this.#v[0].toString();
		return ('00' + r).substring(r.length);
	}

	/** Second of minute (0-59) */
	public valueOf(): number {
		return this.#v[0];
	}

	/** Serialize into target  - 6 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.#v[0], Second.serialBits);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Second {
		safe.int.inRangeInc(this.#v[0], 0, 59);
		return this;
	}

	/** Create a new second, range 0-59 */
	public static new(minute: number, storage?: Uint8Array): Second {
		safe.int.inRangeInc(minute, 0, 59);
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		storage[0] = minute;
		return new Second(storage);
	}

	/**
	 * Create a second from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Second {
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		storage[0] = date.getSeconds();
		return new Second(storage);
	}

	/**
	 * Create a second from a string accepts:
	 * 'now', a 1-2 digit unsigned integer
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
	): Second {
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

	/** Create this minute (local) */
	public static now(storage?: Uint8Array): Second {
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
	public static deserialize(source: BitReader, storage?: Uint8Array): Second {
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		storage[0] = source.readNumber(this.serialBits);
		return new Second(storage);
	}
}
