/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { safe } from '../../safe/safe.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { WindowStr } from '../WindowStr.js';
import { ContentError } from '../../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Milli';

/** Milli/Thousandths (0-999 range) */
export class Milli implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 2;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 10;
	private readonly _v: Uint8Array;

	protected constructor(storage: Uint8Array) {
		this._v = storage;
	}

	/** Not zero padded (0-999) */
	public toString(): string {
		return ((this._v[0] << 8) | this._v[1]).toString();
	}
	/** Zero padded (000-999) */
	public toPadString(): string {
		const s = this.toString();
		return ('000' + s).substring(s.length);
	}

	/** Value as an integer (0-999) */
	toJSON(): number {
		return (this._v[0] << 8) | this._v[1];
	}

	/** Value as an integer (0-999) */
	public valueOf(): number {
		return (this._v[0] << 8) | this._v[1];
	}

	/** Serialize into target  - 10 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber((this._v[0] << 8) | this._v[1], Milli.serialBits);
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
	public validate(): Milli {
		safe.uint.atMost('value', (this._v[0] << 8) | this._v[1], 999);
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
		storage[0] = this._v[0];
		storage[1] = this._v[1];
	}

	/** Copy this value into provided storage, and return a new object from that */
	public cloneTo(storage: Uint8Array): Milli {
		this.fill(storage);
		return new Milli(storage);
	}

	protected static writeValue(target: Uint8Array, v: number): void {
		target[0] = v >> 8;
		target[1] = v;
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.len.atLeast('storage', storage, self.storageBytes);
		return storage;
	}

	/** Create a new milli/thousandth, range 0-999 */
	public static new(v: number, storage?: Uint8Array): Milli {
		safe.uint.atMost('value', v, 999);
		const stor = self.setupStor(storage);
		self.writeValue(stor, v);
		return new Milli(stor);
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
		if (r == null)
			throw new ContentError('expecting unsigned integer-string', name, input);

		const [, digits] = r;
		let effDigits = digits;
		if (strict && digits.length != 3) {
			throw new ContentError(
				'expecting 3 digit unsigned integer-string',
				name,
				input
			);
		} else if (digits.length < 3 && left) {
			effDigits = (digits + '000').substring(0, 3);
		}
		const iVal = parseInt(effDigits, 10);
		safe.uint.atMost(name, iVal, 999);
		self.writeValue(storage, iVal);
		input.shrink(digits.length);
	}

	/**
	 * Parse from a string, accepts:
	 * 1-3 digit unsigned integer, must be 3 digits if strict.
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
	): Milli {
		const stor = self.setupStor(storage);
		self.parseIntoStorage(input, stor, strict, left, 'milli');
		return new Milli(stor);
	}

	/**
	 * Deserialize next 10 bits into millis
	 * Throws if:
	 * - There's not 10 bits remaining in $source.buffer
	 * - There's no available $storage
	 * It's recommended you call .validate() after
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): Milli {
		const stor = self.setupStor(storage);
		self.writeValue(stor, source.readNumber(self.serialBits));
		return new Milli(stor);
	}
}
//Shame TS/JS doesn't support self ()
const self = Milli;
