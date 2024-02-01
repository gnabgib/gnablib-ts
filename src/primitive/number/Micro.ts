/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Micro';

/** Micro/Millionths (0-999999 range) */
export class Micro implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 3;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 20;
	readonly #v: Uint8Array;

	protected constructor(storage: Uint8Array) {
		this.#v = storage;
	}

	/** Not zero padded (0-999999) */
	public toString(): string {
		return this.valueOf().toString();
	}
	/** Zero padded (000000-999999) */
	public toPadString(): string {
		const s = this.valueOf().toString();
		return ('000000' + s).substring(s.length);
	}

	/** Value as an integer (0-999999) */
	toJSON(): number {
		return (this.#v[0] << 16) | (this.#v[1] << 8) | this.#v[2];
	}

	/** Value as an integer (0-999999) */
	public valueOf(): number {
		return (this.#v[0] << 16) | (this.#v[1] << 8) | this.#v[2];
	}

	/** Serialize into target  - 20 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.valueOf(), Micro.serialBits);
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
	public validate(): Micro {
		safe.int.inRangeInc(this.valueOf(), 0, 999999);
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

	protected static writeValue(target: Uint8Array, v: number): void {
		target[0] = v >> 16;
		target[1] = v >> 8;
		target[2] = v;
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.lengthAtLeast('storage', storage, self.storageBytes);
		return storage;
	}

	/** Create a new micro/millionth, range 0-999999 */
	public static new(v: number, storage?: Uint8Array): Micro {
		safe.int.inRangeInc(v, 0, 999999);
		const stor = self.setupStor(storage);
		self.writeValue(stor, v);
		return new Micro(stor);
	}

	//Partitioned to allow a subclass to override
	protected static doParse(
		input: string,
		strict: boolean,
		storage?: Uint8Array
	): Micro {
		//Only parse integers (no floating point/scientific notation)
		const r = input.match(/^\s*(\d{1,6})\s*$/);
		if (r !== null) {
			if (strict) {
				if (r[1].length != 6)
					throw new ContentError(
						'expecting 6 digit unsigned integer-string',
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
	 * Create a micro/millionth from a string accepts:
	 * 1-6 digit unsigned integer, must be 6 digits if strict
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
	): Micro {
		const strVal = safe.string.nullEmpty(input);
		if (strVal === undefined)
			throw new ContentError('require string content', 'input', input);
		// deepcode ignore StaticAccessThis: Have to use this so children can override
		return this.doParse(strVal, strict, storage);
	}

	/**
	 * Deserialize next 20 bits into micros
	 * Throws if:
	 * - There's not 20 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): Micro {
		const stor = self.setupStor(storage);
		self.writeValue(stor, source.readNumber(self.serialBits));
		return new Micro(stor);
	}
}
//Shame TS/JS doesn't support self ()
const self = Micro;
