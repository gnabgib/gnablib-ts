import { superSafe as safe } from '../safe/index.js';
import { BitReader } from './BitReader.js';
import { BitWriter } from './BitWriter.js';
import { ContentError } from './error/ContentError.js';
import { ISerializer } from './interfaces/ISerializer.js';

export interface ParseSettings {
	preventUndefined?: boolean;
	allowYes?: boolean;
	allowOn?: boolean;
	pos?: number;
}

//Not this actually only uses the last bit of storage, so it can be combined with
// something using the first 7 bits
export class Bool implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 1;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 1;
	protected readonly _v: Uint8Array;
	protected readonly _mask: number;
	readonly #shift: number;

	protected constructor(storage: Uint8Array, mask: number, shift: number) {
		this._v = storage;
		this._mask = mask;
		this.#shift = shift;
	}

	/** true/false */
	public toString(): string {
		return (this._v[0] & this._mask) === this._mask ? 'true' : 'false';
	}

	/** Value as an int 1=true, 0=false */
	public valueOf(): number {
		return (this._v[0] & this._mask) >> this.#shift;
	}
	/** Value as a boolean */
	public valueBool(): boolean {
		return (this._v[0] & this._mask) === this._mask;
	}

	/** Serialize into target  - 1 bit*/
	public serialize(target: BitWriter): void {
		target.writeNumber(
			(this._v[0] & this._mask) === this._mask ? 1 : 0,
			Bool.serialBits
		);
	}

	//No need to validate

	protected static writeValue(
		target: Uint8Array,
		v: boolean,
		mask: number
	): void {
		if (v) {
			//Set the bit
			target[0] |= mask;
		} else {
			//Unset the last bit
			target[0] &= ~mask; //0xfe;
		}
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.lengthAtLeast('storage', storage, self.storageBytes);
		return storage;
	}

	public static new(value: boolean, storage?: Uint8Array, pos = 0): Bool {
		const stor = self.setupStor(storage);
		const mask = 1 << pos;
		self.writeValue(stor, value, mask);
		return new Bool(stor, mask, pos);
	}

	//Partitioned to allow a subclass to override
	protected static doParse(
		input: string,
		yesVals: string[],
		noVals: string[],
		pos: number,
		storage?: Uint8Array
	): Bool {
		if (yesVals.indexOf(input) >= 0) return self.new(true, storage, pos);
		if (noVals.indexOf(input) >= 0) return self.new(false, storage, pos);
		throw new ContentError(
			'expecting ' + yesVals.join('/') + ' or ' + noVals.join('/'),
			'input',
			input
		);
	}

	/**
	 * Create a boolean from a string accepts:
	 * 'true','false',0,1
	 * - If allowYes: 'yes' ,'no'
	 * - If allowOn: 'on','off'
	 *
	 * Throws if:
	 * - Undefined/null and settings.preventUndefined
	 * - There's no available $storage
	 * - The content of $input isn't valid
	 */
	public static parse(
		input: string,
		storage?: Uint8Array,
		settings?: ParseSettings
	): Bool {
		if (input === undefined || input === null) {
			if (settings?.preventUndefined === true)
				throw new ContentError('require string content', 'input', input);
			input = '';
		}
		//coerce to string
		input = '' + input;
		let yesVals = ['true', '1'];
		let noVals = ['false', '0'];
		if (settings?.allowYes === true) {
			yesVals.push('yes');
			noVals.push('no');
		}
		if (settings?.allowOn === true) {
			yesVals.push('on');
			noVals.push('off');
		}
		const pos = (settings?.pos as number) | 0;
		// deepcode ignore StaticAccessThis: Have to use this so children can override
		return this.doParse(
			input.trim().toLowerCase(),
			yesVals,
			noVals,
			pos,
			storage
		);
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
		const mask = 1 << pos;
		self.writeValue(stor, source.readNumber(self.serialBits) === 1, mask);
		return new Bool(stor, mask, pos);
	}
}
const self = Bool;
