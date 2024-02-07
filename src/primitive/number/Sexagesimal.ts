/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Sexagesimal';

/** Sexagesimal (0-59 range) */
export class Sexagesimal implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 1;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 6;
	protected readonly _v: Uint8Array;

	protected constructor(storage: Uint8Array) {
		this._v = storage;
	}

	/** Not zero padded (0-59) */
	public toString(): string {
		return this.valueOf().toString();
	}
	/** Zero padded (00-59) */
	public toPadString(): string {
		const s = this.valueOf().toString();
		return ('00' + s).substring(s.length);
	}

	/** Value as an integer (0-59) */
	toJSON(): number {
		return this._v[0];
	}

	/** Value as an integer (0-59) */
	public valueOf(): number {
		return this._v[0];
	}

	/** Serialize into target  - 20 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this._v[0], Sexagesimal.serialBits);
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
	public validate(): Sexagesimal {
		safe.int.inRangeInc(this.valueOf(), 0, 59);
		return this;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	protected [consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.lengthAtLeast('storage', storage, self.storageBytes);
		return storage;
	}

	/** Create a new sexagesimal number, range 0-59 */
	public static new(v: number, storage?: Uint8Array): Sexagesimal {
		safe.int.inRangeInc(v, 0, 59);
		const stor = self.setupStor(storage);
		stor[0] = v;
		return new Sexagesimal(stor);
	}

	//Partitioned to allow a subclass to override
	protected static doParse(
		input: string,
		strict: boolean,
		storage?: Uint8Array
	): Sexagesimal {
		//Only parse integers (no floating point/scientific notation)
		const r = input.match(/^\s*(\d{1,2})\s*$/);
		if (r !== null) {
			if (strict) {
				if (r[1].length != 2)
					throw new ContentError(
						'expecting 2 digit unsigned integer-string',
						'input',
						input
					);
			}
			const iVal = parseInt(r[1], 10);
			return self.new(iVal, storage);
		}
		throw new ContentError('expecting unsigned integer-string', 'input', input);
	}

	/**
	 * Parse a sexagesimal number from a string, accepts:
	 * 1-2 digit unsigned integer, must be 2 digits if strict
	 *
	 * Throws if:
	 * - Not a string, or $str is empty
	 * - There's no available $storage
	 * - The integer value of $str is out of range
	 * - The content of $str isn't valid
	 */
	public static parse(
		input: string,
		storage?: Uint8Array,
		strict = false
	): Sexagesimal {
		const strVal = safe.string.nullEmpty(input);
		if (strVal === undefined)
			throw new ContentError('require string content', 'input', input);
		// deepcode ignore StaticAccessThis: Have to use this so children can override
		return this.doParse(strVal, strict, storage);
	}

	/**
	 * Deserialize next 6 bits into a sexagesimal number
	 * Throws if:
	 * - There's not 6 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(
		source: BitReader,
		storage?: Uint8Array
	): Sexagesimal {
		const stor = self.setupStor(storage);
		stor[0] = source.readNumber(this.serialBits);
		return new Sexagesimal(stor);
	}
}
const self = Sexagesimal;
