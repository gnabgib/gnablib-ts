/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { WindowStr } from '../WindowStr.js';
import { ContentError } from '../../error/ContentError.js';
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
		safe.int.inRangeInc('value', this.valueOf(), 0, 999999);
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

	/** Copy this value into storage */
	protected fill(storage: Uint8Array): void {
		storage[0] = this.#v[0];
		storage[1] = this.#v[1];
		storage[2] = this.#v[2];
	}

	/** Copy this value into provided storage, and return a new object from that */
	public cloneTo(storage: Uint8Array): Micro {
		this.fill(storage);
		return new Micro(storage);
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
		safe.int.inRangeInc('value', v, 0, 999999);
		const stor = self.setupStor(storage);
		self.writeValue(stor, v);
		return new Micro(stor);
	}

	protected static parseIntoStorage(
		input: WindowStr,
		storage: Uint8Array,
		strict: boolean,
		left: boolean,
		name = 'input'
	): void {
		input.trimStart();
		//Only parse integers (no floating point/scientific notation)
		const r = input.match(/^(\d+)\s*$/);
		//We should match unlimited digits because it could be zero pad (!left).. 00001 is still just 1
		if (r === null)
			throw new ContentError('expecting unsigned integer-string', name, input);

		const [, digits] = r;
		let effDigits = digits;
		if (strict && digits.length != 6) {
			throw new ContentError(
				'expecting 6 digit unsigned integer-string',
				name,
				input
			);
		} else if (digits.length < 6 && left) {
			//If we're short digits, implied zeros at the end, but only if "left mode"
			effDigits = (digits + '000000').substring(0, 6);
		}
		const iVal = parseInt(effDigits, 10);
		safe.int.inRangeInc(name, iVal, 0, 999999);
		self.writeValue(storage, iVal);
		input.shrink(digits.length);
	}

	/**
	 * Parse from a string, accepts:
	 * 1-6 digit unsigned integer, must be 6 digits if strict.
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
		left = false,
		storage?: Uint8Array
	): Micro {
		const stor = self.setupStor(storage);
		self.parseIntoStorage(input, stor, strict, left, 'micro');
		return new Micro(stor);
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
