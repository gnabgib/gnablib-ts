/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { superSafe as safe } from '../../safe/safe.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { WindowStr } from '../WindowStr.js';
import { ContentError } from '../../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Nano';

/** Nano/Billionths (0-999999999 range) */
export class Nano implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 4;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 30;
	private readonly _v: Uint8Array;

	private constructor(storage: Uint8Array) {
		this._v = storage;
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
	toJSON(): number {
		return (
			(this._v[0] << 24) | (this._v[1] << 16) | (this._v[2] << 8) | this._v[3]
		);
	}

	/** Value as an integer (0-999999999) */
	public valueOf(): number {
		return (
			(this._v[0] << 24) | (this._v[1] << 16) | (this._v[2] << 8) | this._v[3]
		);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/** Serialize into target  - 30 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber(this.valueOf(), self.serialBits);
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
	public validate(): Nano {
		safe.uint.atMost('value', this.valueOf(),  999999999);
		return this;
	}

	/** Copy this value into storage */
	protected fill(storage: Uint8Array): void {
		storage[0] = this._v[0];
		storage[1] = this._v[1];
		storage[2] = this._v[2];
		storage[3] = this._v[3];
	}

	/** Copy this value into provided storage, and return a new object from that */
	public cloneTo(storage: Uint8Array): Nano {
		this.fill(storage);
		return new Nano(storage);
	}

	protected static writeValue(target: Uint8Array, v: number): void {
		target[0] = v >> 24;
		target[1] = v >> 16;
		target[2] = v >> 8;
		target[3] = v;
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.len.atLeast('storage', storage, self.storageBytes);
		return storage;
	}

	/** Create a new nano/billionth, range 0-999999999 */
	public static new(v: number, storage?: Uint8Array): Nano {
		safe.uint.atMost('value', v, 999999999);
		const stor = self.setupStor(storage);
		self.writeValue(stor, v);
		return new Nano(stor);
	}

	protected static parseIntoStorage(
		input: WindowStr,
		storage: Uint8Array,
		strict: boolean,
		name = 'input'
	): void {
		input.trimStart();
		//Only parse integers (no floating point/scientific notation)
		const r = input.match(/^(\d+)\s*$/);
		if (r == null)
			throw new ContentError('expecting unsigned integer-string', name, input);

		const [, digits] = r;
		if (strict && digits.length != 9) {
			throw new ContentError(
				'expecting 9 digit unsigned integer-string',
				name,
				input
			);
		}
		const iVal = parseInt(digits, 10);
		safe.uint.atMost(name, iVal, 999999999);
		self.writeValue(storage, iVal);
		input.shrink(digits.length);
	}

	/**
	 * Parse from a string, accepts:
	 * 1-9 digit unsigned integer, must be 9 digits if strict.
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
	): Nano {
		const stor = self.setupStor(storage);
		self.parseIntoStorage(input, stor, strict, 'nano');
		return new Nano(stor);
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
		const stor = self.setupStor(storage);
		self.writeValue(stor, source.readNumber(self.serialBits));
		return new Nano(stor);
	}
}
const self = Nano;
