import { superSafe as safe } from '../safe/index.js';
import { BitReader } from './BitReader.js';
import { BitWriter } from "./BitWriter.js";
import { ContentError } from './error/ContentError.js';
import { ISerializer } from "./interfaces/ISerializer.js";

export interface ParseSettings {
    preventUndefined?:boolean,
    allowYes?:boolean,
    allowOn?:boolean,
    pos?:number
}

//Not this actually only uses the last bit of storage, so it can be combined with
// something using the first 7 bits
export class Bool implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 1;
	/**Number of bits required to serialize this data */
    static readonly serialBits = 1;
	readonly #v: Uint8Array;
    readonly #mask:number;
    readonly #shift:number;

	private constructor(storage: Uint8Array,mask:number,shift:number) {
		this.#v = storage;
        this.#mask=mask;
        this.#shift=shift;
	}

	/** true/false */
	public toString(): string {
		return (this.#v[0] & this.#mask) === this.#mask ? 'true':'false';
	}

	/** Value as an int 1=true, 0=false */
	public valueOf(): number {
		return (this.#v[0] & this.#mask) >> this.#shift;
	}
	/** Value as a boolean */
	public valueBool(): boolean {
		return (this.#v[0] & this.#mask) === this.#mask;
	}

	/** Serialize into target  - 1 bit*/
	public serialize(target: BitWriter): void {
		target.writeNumber(((this.#v[0] & this.#mask) === this.#mask)?1:0, Bool.serialBits);
	}

	//No need to validate

	protected static writeValue(target: Uint8Array, v: boolean, mask:number): void {
		if (v) {
			//Set the bit
			target[0] |= mask;
		} else {
			//Unset the last bit
			target[0] &= ~mask;//0xfe;
		}
	}

    /** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(Bool.storageBytes);
		safe.lengthAtLeast(storage, Bool.storageBytes);
		return storage;
	}

	public static new(value: boolean, storage?: Uint8Array,pos=0): Bool {
        const stor=this.setupStor(storage);
        const mask=1<<pos;
		this.writeValue(stor, value,mask);
		return new Bool(stor,mask,pos);
	}

    //Partitioned to allow a subclass to override
	protected static doParse(
		test: string,
        yesVals:string[],
        noVals:string[],
        pos:number,
        storage?: Uint8Array
	): Bool {
        if (yesVals.indexOf(test)>=0) return this.new(true,storage,pos);
        if (noVals.indexOf(test)>=0) return this.new(false,storage,pos);
        throw new ContentError('expecting '+yesVals.join('/')+' or '+noVals.join('/'),test);
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
	 * - The content of $str isn't valid
	 */
	public static parse(str: string, storage?: Uint8Array,settings?:ParseSettings): Bool {
        if (str===undefined || str===null) {
            if (settings?.preventUndefined===true)
                throw new ContentError('require string content',str);
            str='';
        }
        //coerce to string
        str=''+str;
        let yesVals=['true','1'];
        let noVals=['false','0'];
        if (settings?.allowYes===true) {
            yesVals.push('yes');
            noVals.push('no');
        }
        if (settings?.allowOn===true) {
            yesVals.push('on');
            noVals.push('off');
        }
        const pos=(settings?.pos as number)|0;
        return this.doParse(str.trim().toLowerCase(),yesVals,noVals,pos,storage);
	}

	/**
	 * Deserialize next 1 bit into bool
	 * Throws if:
	 * - There's not 1 bits remaining in $source.buffer
	 * - There's no available $storage
	 * @param source Source to read bit from
	 * @param storage Storage location, if undefined will be built
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array,pos=0): Bool {
        const stor = this.setupStor(storage);
        const mask=1<<pos;
		this.writeValue(stor, source.readNumber(this.serialBits) === 1,mask);
		return new Bool(stor,mask,pos);
	}
}