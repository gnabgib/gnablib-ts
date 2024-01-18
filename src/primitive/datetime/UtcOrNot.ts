/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../ErrorExt.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const u8MemSize = 1;

export class UtcOrNot implements ISerializer {
	static readonly serialBits = 1;
	readonly #v: Uint8Array;

	private constructor(storage: Uint8Array) {
		this.#v = storage;
	}

	/** UTC indicator (Z) or ? */
	public toString(): string {
		return (this.#v[0] & 1) === 1 ? 'Z' : '?';
	}

	/** UTC indicator (Z) or empty string */
	public toIsoString(): string {
		return (this.#v[0] & 1) === 1 ? 'Z' : '';
	}

	/** Whether is UTC (0-not, 1-is) */
	public valueOf(): number {
		return this.#v[0] & 1;
	}
	/** Whether is UTC or not */
	public valueBool(): boolean {
		return (this.#v[0] & 1) === 1;
	}

	/** Serialize into target  - 1 bit*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.#v[0], UtcOrNot.serialBits);
	}

	//No need to validate

	private static writeValue(target: Uint8Array, isUtc: boolean): void {
		if (isUtc) {
			//Set the last bit
			target[0] |= 1;
		} else {
			//Unset the last bit
			target[0] &= 0xfe;
		}
	}

	public static new(isUtc: boolean, storage?: Uint8Array): UtcOrNot {
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		this.writeValue(storage, isUtc);
		return new UtcOrNot(storage);
	}

	//fromDate - makes no sense

	/**
	 * Create a second+ms from a string accepts:
	 * 'z' or blank
	 *
	 * Throws if:
	 * - Not a string
	 * - There's no available $storage
	 * - The content of $str isn't valid
	 */
	public static parse(str: string, storage?: Uint8Array): UtcOrNot {
		if (str === undefined || str === null)
			throw new ContentError('require string content', str);
		const strVal = ('' + str).trim();
		if (strVal.length === 0) {
			return this.new(false, storage);
		}
		if (strVal.toUpperCase() === 'Z') {
			return this.new(true, storage);
		}
		throw new ContentError('expecting z or empty string', strVal);
	}

	//now - makes no sense
	//nowUtc - makes no sense

	/**
	 * Deserialize next 1 bit into Utc indicator
	 * Throws if:
	 * - There's not 1 bits remaining in $source.buffer
	 * - There's no available $storage
	 * @param source Source to read bit from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): UtcOrNot {
		if (!storage) {
			storage = new Uint8Array(u8MemSize);
		} else {
			safe.lengthAtLeast(storage, u8MemSize);
		}
		this.writeValue(storage, source.readNumber(this.serialBits) === 1);
		return new UtcOrNot(storage);
	}
}
