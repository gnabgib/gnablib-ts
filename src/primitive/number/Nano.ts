/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

/** Nano/Billionths (0-999999999 range) */
export class Nano implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 4;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 30;
	readonly #v: Uint8Array;

	private constructor(storage: Uint8Array) {
		this.#v = storage;
	}

	/** Not zero padded (0-999999999) */
	public toString(): string {
		return this.valueOf().toString();
	}
	/** Zero padded (000000000-999999999) */
	public toPadString(): string {
		const s = this.valueOf().toString();
		return ('000000000' + s).substring(s.length);
	}

	/** Value as an integer (0-999999999) */
	public valueOf(): number {
		return (
			(this.#v[0] << 24) | (this.#v[1] << 16) | (this.#v[2] << 8) | this.#v[3]
		);
	}

	/** Serialize into target  - 30 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.valueOf(), Nano.serialBits);
	}

	/**
	 * Test internal state is valid, throws if it's not
	 * You should call this after a deserialize unless you trust the source
	 * @returns self (chainable)
	 */
	public validate(): Nano {
		safe.int.inRangeInc(this.valueOf(), 0, 999999999);
		return this;
	}

	protected static writeValue(target: Uint8Array, v: number): void {
		target[0] = v >> 24;
		target[1] = v >> 16;
		target[2] = v >> 8;
		target[3] = v;
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(Nano.storageBytes);
		safe.lengthAtLeast(storage, Nano.storageBytes);
		return storage;
	}

	/** Create a new nano/billionth, range 0-999999999 */
	public static new(v: number, storage?: Uint8Array): Nano {
		safe.int.inRangeInc(v, 0, 999999999);
		const stor = this.setupStor(storage);
		this.writeValue(stor, v);
		return new Nano(stor);
	}

	//Partitioned to allow a subclass to override
	protected static doParse(
		str: string,
		strict: boolean,
		storage?: Uint8Array
	): Nano {
		//Only parse integers (no floating point/scientific notation)
		const r = str.match(/^\s*(\d{1,9})\s*$/);
		if (r !== null) {
			if (strict) {
				if (r[1].length != 9)
					throw new ContentError(
						'expecting 9 digit unsigned integer-string',
						str
					);
			}
			const iVal = parseInt(r[1], 10);
			return this.new(iVal, storage);
		}
		throw new ContentError('expecting unsigned integer-string', str);
	}

	/**
	 * Create a nano/billionth from a string accepts:
	 * 1-9 digit unsigned integer, must be 9 digits if strict
	 *
	 * Throws if:
	 * - Not a string, or $str is empty
	 * - There's no available $storage
	 * - The integer value of $str is out of range
	 * - The content of $str isn't valid
	 */
	public static parse(str: string, storage?: Uint8Array, strict = false): Nano {
		const strVal = safe.string.nullEmpty(str);
		if (strVal === undefined)
			throw new ContentError('require string content', str);
		return this.doParse(strVal, strict, storage);
	}

	/**
	 * Deserialize next 30 bits into nanos
	 * Throws if:
	 * - There's not 30 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): Nano {
		const stor = this.setupStor(storage);
		this.writeValue(stor, source.readNumber(this.serialBits));
		return new Nano(stor);
	}
}
