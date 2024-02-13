/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { BitReader } from '../BitReader.js';
import { _BoolCore } from '../Bool.js';
import { WindowStr } from '../WindowStr.js';
import { ContentError } from '../../error/ContentError.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'UtcOrNot';

export class UtcOrNot extends _BoolCore {
	/** UTC indicator (Z) or ? */
	public toString(): string {
		return this.valueOf() ? 'Z' : '?';
	}

	/** UTC indicator (Z) or empty string */
	public toIsoString(): string {
		return this.valueOf() ? 'Z' : '';
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/** Copy this value into provided storage, and return a new object from that */
	public cloneTo(storage: Uint8Array, pos = 0): UtcOrNot {
		this.fill(storage, pos);
		return new UtcOrNot(storage, pos);
	}

	public static new(value: boolean, storage?: Uint8Array, pos = 0): UtcOrNot {
		const stor = self.setupStor(storage);
		self.writeBool(stor, value, pos);
		return new UtcOrNot(stor, pos);
	}

	/**
	 * Parse from a string, accepts: 'z' or empty string
	 *
	 * Surrounding whitespace will be removed
	 *
	 * Throws if:
	 * - Not a string, or $str is empty
	 * - There's no available $storage
	 * - The content of $str isn't valid
	 */
	public static parse(input: WindowStr, storage?: Uint8Array): UtcOrNot {
		const pos = 0;
		const stor = self.setupStor(storage);

		//Don't have m
		const str = input.toString().trim().toLowerCase();
		switch (str) {
			case 'z':
				self.writeBool(stor, true, pos);
				break;
			case '':
				self.writeBool(stor, false, pos);
				break;
			default:
				//We don't actually call out to Bool's parsing since it's illogical for this use case
				throw new ContentError(
					'expecting z or empty string',
					'UtcOrNot',
					input
				);
		}
		input.shrink(input.length);
		return new UtcOrNot(stor, pos);
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
		self.deserializeTo(source,stor,pos);
		return new UtcOrNot(stor, pos);
	}
}

const self = UtcOrNot;
