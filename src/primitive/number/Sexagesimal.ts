/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { WindowStr } from '../WindowStr.js';
import { ContentError } from '../../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';
import { sLen, sNum } from '../../safe/safe.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Sexagesimal';
/** max value (exclusive) */
const max = 60;

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
		//Because this is internal (and stored as uint) we don't need to check >0
		sNum('value', this._v[0]).lt(max).throwNot();
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
		sLen('storage', storage).atLeast(self.storageBytes).throwNot();
		return storage;
	}

	/** Create a new sexagesimal number, range 0-59 */
	public static new(sexa: number, storage?: Uint8Array): Sexagesimal {
		sNum('sexa', sexa).unsigned().lt(max).throwNot();
		const stor = self.setupStor(storage);
		stor[0] = sexa;
		return new Sexagesimal(stor);
	}

	protected static parseIntoStorage(
		input: WindowStr,
		storage: Uint8Array,
		strict: boolean,
		name = 'input'
	): void {
		input.trimStart();
		//Only parse unsigned integers
		const r = input.match(/^(\d+)\s*$/);
		if (r == null)
			throw new ContentError('expecting unsigned integer-string', name, input);

		const [, digits] = r;
		if (strict && digits.length != 2) {
			throw new ContentError(
				'expecting 2 digit unsigned integer-string',
				name,
				input
			);
		}
		const iVal = parseInt(digits, 10);
		sNum('value', iVal).unsigned().lt(max).throwNot();
		storage[0] = iVal;
		input.shrink(digits.length);
	}

	/**
	 * Parse from a string, accepts:
	 * 1-2 digit unsigned integer, must be 2 digits if strict.
	 *
	 * Leading whitespace will be removed, trailing whitespace will be ignored (but not removed from window)
	 *
	 * Throws if:
	 * - Not a string, or $str is empty
	 * - There's no available $storage
	 * - The integer value of $str is out of range
	 * - The content of $str isn't valid
	 */
	public static parse(
		input: WindowStr,
		strict = false,
		storage?: Uint8Array
	): Sexagesimal {
		const stor = self.setupStor(storage);
		self.parseIntoStorage(input, stor, strict, 'sexagesimal');
		return new Sexagesimal(stor);
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
