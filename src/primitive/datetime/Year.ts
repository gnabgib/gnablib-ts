/*! Copyright 2024 the gnablib contributors MPL-1.1 */

//todo: implement switching with safe
import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'Year';
const maxHeYear = 32767; //0x7fff
const maxIsoYear = maxHeYear - 10000;

let min: Year;
let max: Year;

/**
 * A year in the range -10000 - +22767 (ISO), 10001BC - 22767AD (Gregorian), or 0-32767 (Holocene)
 *
 * [Holocene calendar](https://en.wikipedia.org/wiki/Holocene_calendar#Conversion)
 * HE    = ISO8601 Gregory
 * 0     =  -10000 10001BC MIN
 * 10000 =       0     1BC
 * 10001 =       1     1AD
 * 12024 =    2024  2024AD CUR
 * 32767 =   22767 22767AD MAX
 * NOTE: Gregorian calendar has no 0 year, ISO8601 maps 0 to 1BC
 */
export class Year implements ISerializer {
	/**Number of bytes required to store this data */
	static readonly storageBytes = 2;
	/**Number of bits required to serialize this data */
	static readonly serialBits = 15; //2^15=32767
	/** Note stored as holocene year internally 0 - 32767*/
	readonly #v: Uint8Array;

	private constructor(storage: Uint8Array) {
		this.#v = storage;
	}

	/** Minimum year */
	static get min(): Year {
		return min;
	}
	/** Maximum year */
	static get max(): Year {
		return max;
	}

	/** Year, not zero padded, sign only on negative */
	public toString(): string {
		return (((this.#v[0] << 8) | this.#v[1]) - 10000).toString();
	}

	/** Year ISO8601, zero padded if >-1000,<1000, includes sign if >4 digits */
	public toIsoString(): string {
		let v = ((this.#v[0] << 8) | this.#v[1]) - 10000;
		let sign = '';
		if (v > 9999) {
			sign = '+';
		} else if (v < 0) {
			sign = '-';
			v = -v;
		}
		let r = v.toString();
		if (r.length < 4) r = ('0000' + r).substring(r.length);
		return sign + r;
	}

	/** Year in ISO8601 as an integer (0=1BC, -10000=10001BC, 2024=2024AD) */
	toJSON(): number {
		return ((this.#v[0] << 8) | this.#v[1]) - 10000;
	}

	/** Year in ISO8601 as an integer (0=1BC, -10000=10001BC, 2024=2024AD) */
	public valueOf(): number {
		return ((this.#v[0] << 8) | this.#v[1]) - 10000;
	}

	/** Serialize into target  - 15 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber((this.#v[0] << 8) | this.#v[1], Year.serialBits);
	}

	/** Number of bits required to serialize */
	get serialSizeBits(): number {
		return self.serialBits;
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
		target[0] = v >> 8;
		target[1] = v;
	}

	/** If storage empty, builds new, or vets it's the right size */
	protected static setupStor(storage?: Uint8Array): Uint8Array {
		if (!storage) return new Uint8Array(self.storageBytes);
		safe.lengthAtLeast('storage', storage, self.storageBytes);
		return storage;
	}

	// There is no need to validate, this value fits all of the 2^15 space

	/** Create a new year in ISO601 format, range -10000 - +22767 */
	public static new(year: number, storage?: Uint8Array): Year {
		safe.int.inRangeInc(year, -10000, maxIsoYear);
		const stor = self.setupStor(storage);
		self.writeValue(stor, year + 10000);
		return new Year(stor);
	}

	/**
	 * Create a new year in Gregorian format, range 10001BC - 22676AD
	 * @param year 1-22676 if AD, 1-10001 if BC (no zero year)
	 * @param ad True=Anno Domini(AD)/Common Era(CE), False=Before Chris(BC)/Before common era (BCE)
	 */
	public static newGregorian(
		year: number,
		ad = true,
		storage?: Uint8Array
	): Year {
		const stor = self.setupStor(storage);
		if (ad) {
			safe.int.inRangeInc(year, 1, maxIsoYear);
			self.writeValue(stor, year + 10000);
		} else {
			safe.int.inRangeInc(year, 1, 10001);
			self.writeValue(stor, 10001 - year);
		}
		return new Year(stor);
	}

	/** Create a new year in Holocene format, range 0 - 32767*/
	public static newHolocene(year: number, storage?: Uint8Array): Year {
		safe.int.inRangeInc(year, 0, maxHeYear);
		const stor = self.setupStor(storage);
		self.writeValue(stor, year);
		return new Year(stor);
	}

	/**
	 * Create a year from a js Date object
	 * @param date Value used as source
	 */
	public static fromDate(date: Date, storage?: Uint8Array): Year {
		const stor = self.setupStor(storage);
		self.writeValue(stor, date.getFullYear() + 10000);
		return new Year(stor);
	}

	/**
	 * Create a year from a js Date object in UTC
	 * @param date Value used as source
	 */
	public static fromDateUtc(date: Date, storage?: Uint8Array): Year {
		const stor = self.setupStor(storage);
		self.writeValue(stor, date.getUTCFullYear() + 10000);
		return new Year(stor);
	}

	/**
	 * Create a year from a string, accepts:
	 * 'now', an integer with sign, if strict: integer must be 4 digits, when >4 digits must have sign (even +)
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
	): Year {
		const strVal = safe.string.nullEmpty(input);
		if (strVal === undefined)
			throw new ContentError('require string content', 'input', input);
		if (strVal.toLowerCase() === 'now') return self.now(storage);

		//Only parse integers (no floating point/scientific notation)
		// - if there's a sign it must be touching the digits
		const r = strVal.match(/^\s*([+-])?(\d+)\s*$/);
		if (r !== null) {
			const hasSign = r[1] != undefined;
			let yearPart = r[2];
			if (strict) {
				if (yearPart.length > 4 && !hasSign)
					throw new ContentError(
						'expecting >4 digits to be signed',
						'input',
						strVal
					);
				if (yearPart.length < 4)
					throw new ContentError(
						'expecting 4 digit integer-string',
						'input',
						strVal
					);
			}
			if (r[1] === '-') yearPart = '-' + yearPart;
			const intVal = parseInt(yearPart, 10);
			if (!isNaN(intVal)) return self.new(intVal, storage);
		}

		// //Only parse integers (no floating point/scientific notation)
		// //There can be no space between sign and integer
		// //if abs(year)<10000 must be zero padded to 4 digits
		// //if integer is 5 digits or more, must be prefixed by positive/negative sign
		// // RFC/ISO aren't specific, but + MAY prefix a 4 digit year
		// if (/^\s*(-\d{4,}|\+?\d{4}|\+\d{5,})\s*$/.test(strVal)) {
		// //([-+]?\d{4,})\s*$/.test(strVal)) {
		//     const intVal=parseInt(strVal,10);
		//     if (!isNaN(intVal)) return this.new(intVal,storage);
		// }// else console.log(`test: ${strVal} got: ${/^\s*([-+]?\d{4,})\s*$/.test(strVal)}`);
		throw new ContentError('expecting integer-string', 'input', strVal);
	}

	/** Create this year (local) */
	public static now(storage?: Uint8Array): Year {
		return self.fromDate(new Date(), storage);
	}

	/**
	 * Whether the ISO year `y` is a leap year, or not.
	 *
	 * @param y Year integer, can exceed Year range, but cannot exceed Int32 (-2147483648  - 2147483647) because of big logic, floats will be truncated
	 */
	public static isLeap(y: number): boolean {
		y = y | 0;
		//In a 400 year period, there are:
		//   100-4+1 = 97 leap years
		//   400-97  =303 regular old years

		//3 & 15 mask can be done straight off the lower byte
		//Not a multiple of 4 - no leap (300 values | 300)
		if ((y & 3) !== 0) return false;

		//Is a multiple of 16 - leap (25 values | 325)
		//0,16,32,48,64,80,96,112,128,144,160,176,192,208,224,240,256,272,288,304,320,336,352,368,384
		if ((y & 15) === 0) return true;

		//Isn't a multiple of 25 - leap
		//There are only 3 numbers that are multiples of 25 now:
		//(0) (25) (50) (75) 100 (125) (150) (175) 200 (225) (250) (275) 300 (325) (350) (375)
		// .. 100, 200, 300 (the others have already returned being not multiples of 4 or multiples of 16)
		//This could also be %100
		return y % 25 !== 0;
	}

	/**
	 * Deserialize next 15 bits into year.
	 * Throws if:
	 * - There's not 15 bits remaining in $source.buffer
	 * - There's no available $storage
	 * @param source Source to read bits from
	 * @param storage Storage location, if undefined will be built
	 * @returns
	 */
	public static deserialize(source: BitReader, storage?: Uint8Array): Year {
		const stor = self.setupStor(storage);
		self.writeValue(stor, source.readNumber(self.serialBits));
		return new Year(stor);
	}
}
const self = Year;
min = Year.newHolocene(0);
max = Year.newHolocene(32767);
