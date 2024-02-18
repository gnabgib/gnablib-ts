import { superSafe as safe } from '../safe/index.js';
import { BitReader } from './BitReader.js';
import { BitWriter } from './BitWriter.js';
import { WindowStr } from './WindowStr.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from './interfaces/ISerializer.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Bool';

export interface IParseSettings {
	preventUndefined?: boolean;
	allowYes?: boolean;
	allowOn?: boolean;
	pos?: number;
}

const masks = [1, 2, 4, 8, 16, 32, 64, 128];

//Note this actually only uses the last bit of storage, so it can be combined with
// something using the first 7 bits
/** @hidden */
export class _BoolCore implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 1;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 1;
	readonly #v: Uint8Array;
	readonly #shift: number;

	protected constructor(storage: Uint8Array, shift: number) {
		this.#v = storage;
		this.#shift = shift;
	}

	/** Value as a boolean */
	toJSON(): boolean {
		return (this.#v[0] & masks[this.#shift]) === masks[this.#shift];
	}

	/** Value as an int 1=true, 0=false */
	public valueOf(): number {
		return (this.#v[0] & masks[this.#shift]) >> this.#shift;
	}
	/** Value as a boolean */
	public valueBool(): boolean {
		return (this.#v[0] & masks[this.#shift]) === masks[this.#shift];
	}

	/** Serialize into target  - 1 bit*/
	public serialize(target: BitWriter): void {
		target.writeNumber(
			(this.#v[0] & masks[this.#shift]) === masks[this.#shift] ? 1 : 0,
			_BoolCore.serialBits
		);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return _BoolCore.serialBits;
	}

	//No need to validate

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this.toString()})`;
	}

	/** Copy this value into storage */
	protected fill(storage: Uint8Array, pos: number): void {
		const shift = this.#shift - pos;
		storage[0] = (this.#v[0] & masks[shift]) >> shift;
	}

	protected static writeBool(
		target: Uint8Array,
		v: boolean,
		pos: number
	): void {
		if (v) {
			//Set the bit
			target[0] |= masks[pos];
		} else {
			//Unset the last bit
			target[0] &= ~masks[pos]; //0xfe;
		}
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.len.atLeast('storage', storage, self.storageBytes);
		return storage;
	}

	protected static deserializeTo(
		source: BitReader,
		storage: Uint8Array,
		pos: number
	) {
		_BoolCore.writeBool(storage, source.readNumber(self.serialBits) === 1, pos);
	}
}

export class Bool extends _BoolCore {
	/** true/false */
	public toString(): string {
		return this.valueBool() ? 'true' : 'false';
	}

	/** Copy this value into provided storage, and return a new object from that */
	public cloneTo(storage: Uint8Array, pos = 0): Bool {
		this.fill(storage, pos);
		return new Bool(storage, pos);
	}

	public static new(value: boolean, storage?: Uint8Array, pos = 0): Bool {
		const stor = self.setupStor(storage);
		self.writeBool(stor, value, pos);
		return new Bool(stor, pos);
	}

	protected static parseIntoStorage(
		input: WindowStr,
		storage: Uint8Array,
		yesVals: string[],
		noVals: string[],
		pos: number,
		name = 'input'
	): void {
		input.trimStart().trimEnd();
		const str = input.toString().toLowerCase();
		for (const y of yesVals) {
			if (str === y) {
				input.shrink(y.length);
				self.writeBool(storage, true, pos);
				return;
			}
		}
		for (const n of noVals) {
			if (str === n) {
				input.shrink(n.length);
				self.writeBool(storage, false, pos);
				return;
			}
		}
		throw new ContentError(
			'expecting ' + yesVals.join('/') + ' or ' + noVals.join('/'),
			name,
			input
		);
	}
	/**
	 * Parse from a string, accepts:
	 * 'true','false',0,1
	 * - If allowYes: 'yes' ,'no'
	 * - If allowOn: 'on','off'
	 *
	 * Surrounding whitespace will be removed
	 *
	 * Throws if:
	 * - Not a string, or $str is empty
	 * - There's no available $storage
	 * - The content of $str isn't valid
	 */
	public static parse(
		input: WindowStr,
		settings?: IParseSettings,
		storage?: Uint8Array
	): Bool {
		const stor = self.setupStor(storage);
		const yesVals = ['true', '1'];
		const noVals = ['false', '0'];
		if (settings?.allowYes === true) {
			yesVals.push('yes');
			noVals.push('no');
		}
		if (settings?.allowOn === true) {
			yesVals.push('on');
			noVals.push('off');
		}
		const pos = (settings?.pos as number) | 0;
		self.parseIntoStorage(input, stor, yesVals, noVals, pos, 'bool');
		return new Bool(stor, pos);
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
	): Bool {
		const stor = self.setupStor(storage);
		self.deserializeTo(source, stor, pos);
		return new Bool(stor, pos);
	}
}
const self = Bool;
