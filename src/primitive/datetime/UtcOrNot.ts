/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { BitReader } from '../BitReader.js';
import { Bool } from '../Bool.js';
import { ContentError } from '../error/ContentError.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'UtcOrNot';

export class UtcOrNot extends Bool {
	/** UTC indicator (Z) or ? */
	public toString(): string {
		return (this._v[0] & this._mask) === this._mask ? 'Z' : '?';
	}

	/** UTC indicator (Z) or empty string */
	public toIsoString(): string {
		return (this._v[0] & this._mask) === this._mask ? 'Z' : '';
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/** Return a copy of this value (using provided storage/different memory) */
	public clone(storage?: Uint8Array): UtcOrNot {
		const stor = self.setupStor(storage);
		//Note we keep the mask/shift, but we mask out any other values that may be nearby
		// todo: Should we correct the shift? causes some clone problems, but so does zeroing
		stor[0] = this._v[0] & this._mask;
		return new UtcOrNot(stor, this._mask, this._shift);
	}

	public static new(value: boolean, storage?: Uint8Array, pos = 0): UtcOrNot {
		const stor = self.setupStor(storage);
		const mask = 1 << pos;
		self.writeValue(stor, value, mask);
		return new UtcOrNot(stor, mask, pos);
	}

	public static parse(input: string, storage?: Uint8Array): UtcOrNot {
		if (input === undefined || input === null) {
			throw new ContentError('require string content', 'input', input);
		}
		input = input.trim().toLowerCase();
		if (input == 'z') {
			return self.new(true, storage);
		} else if (input == '') {
			return self.new(false, storage);
		}
		throw new ContentError('expecting z or empty string', 'input', input);
	}

	/**
	 * Deserialize next 1 bit into bool
	 * Throws if:
	 * - There's not 1 bits remaining in $source.buffer
	 * - There's no available $storage
	 * @param source Source to read bit from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(
		source: BitReader,
		storage?: Uint8Array,
		pos = 0
	): UtcOrNot {
		const stor = self.setupStor(storage);
		const mask = 1 << pos;
		const deser = source.readNumber(self.serialBits);
		self.writeValue(stor, deser === 1, mask);
		return new UtcOrNot(stor, mask, pos);
	}
}

const self = UtcOrNot;
