/*! Copyright 2024 the gnablib contributors MPL-1.1 */

//todo: implement switching with safe
import { superSafe as safe } from '../../safe/index.js';
import { BitReader } from '../BitReader.js';
import { BitWriter } from '../BitWriter.js';
import { ContentError } from '../error/ContentError.js';
import { ISerializer } from '../interfaces/ISerializer.js';

// Year + Month + Day: Ser in 24 bits, d=5, m=4, leaving 15 bits [32768] for year
const maxHeYear = 32767; //0x7fff
const maxIsoYear = maxHeYear - 10000;

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

	/** Whether this is a leap year */
	public get isLeap(): boolean {
		//3 & 15 mask can be done straight off the lower bit
		if ((this.#v[1] & 3) !== 0) return false;
		if ((this.#v[1] & 15) === 0) return true;
		return ((this.#v[0] << 8) | this.#v[1]) % 25 !== 0;
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
	public valueOf(): number {
		return ((this.#v[0] << 8) | this.#v[1]) - 10000;
	}

	/** Serialize into target  - 15 bits*/
	public serialize(target: BitWriter): void {
		target.writeNumber((this.#v[0] << 8) | this.#v[1], Year.serialBits);
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

// y: 2
// m: 1
// d: 1 do=4 (p=3)
// h: 1
// i: 1
// s: 1
// ms:2 tom=5 (p=4)
// us:3 to=6 (p=5)
// dt=10 (p=8)
// do yymd
// in mem: yymdssssh
// y=15, m=4, d=5|24
// h=5 m=6, s=6, us=20|37
//999=10b
//59,999,999 = 26b