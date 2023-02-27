/*! Copyright 2023 gnabgib MPL-2.0 */

import { nextPow2 } from '../algo/nextPow2.js';
import { OutOfRangeError } from '../primitive/ErrorExt.js';
import { inRangeInclusive } from '../primitive/IntExt.js';
import {
	lenInRangeInclusive,
	lenAtLeast,
	padStart,
} from '../primitive/StringExt.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

//Augmented Backus-Naur Form
//https://datatracker.ietf.org/doc/html/rfc5234

const CONCAT_SEP = ' ';
const CONCAT_SEP_HEX = '.';
const ALT_SEP = ' / ';

export interface IBnfRepeatable {
	get nonPrintable(): boolean;
	descr(asHex: boolean): string;
	/**
	 * Casting to primitive type, debug
	 */
	[Symbol.toPrimitive](/*hint="string"/"number"/"default"*/): string;
	/**
	 * Node specific debug
	 */
	[consoleDebugSymbol](/*depth, options, inspect*/): unknown;
}

export interface IBnfRepeat {
	get rule(): IBnfRepeatable;
	descr(asHex: boolean): string;
}

function bnfCharArrToStr(asHex: boolean, set: BnfChar[]): string {
	return asHex
		? `%x${set.map((c) => c.chrHex).join(CONCAT_SEP_HEX)}`
		: `"${set.map((c) => c.chr).join('')}"`;
}

// -- -- -- -- -- -- -- BNF Types -- -- -- -- -- -- --

class BnfChar implements IBnfRepeatable {
	readonly ord: number;
	readonly caseInsensitive: boolean | undefined;

	/**
	 * Construct with a single character, or a number
	 * @throws @see OutOfRangeError Too many/few characters, null, undefined
	 * @param value
	 */
	constructor(
		value: string | number | BnfChar,
		caseInsensitive: boolean | undefined = undefined
	) {
		// !! BUG: `boolean|undefined=false` will set specific undefined values to false
		// which in some ways is what you imagine it means, but in another specifically
		// providing a value is different from not providing it (the only time you might
		// expect the default to be used).  Consequentially the false coercing happens
		// inside @see smartSensitive
		if (typeof value === 'number') {
			this.ord = value;
		} else if (value instanceof BnfChar) {
			this.ord = value.ord;
			//Override CI preference if not defined
			if (caseInsensitive === undefined) {
				caseInsensitive = value.caseInsensitive;
			}
		} else {
			lenInRangeInclusive(value, 1, 1);
			this.ord = value.charCodeAt(0);
		}
		this.caseInsensitive = BnfChar.smartSensitive(this.ord, caseInsensitive);
	}

	/**
	 * Within ASCII prevent anything but letters from being sensitive/in
	 * .. beyond that, you're on your own kid
	 * @param ord
	 * @param caseInsensitive
	 * @returns
	 */
	static smartSensitive(
		ord: number,
		caseInsensitive: boolean | undefined
	): boolean | undefined {
		//if (caseInsensitive===undefined) return caseInsensitive;
		if (ord < 64) return undefined;
		if (ord < 128) {
			//fold to upper case
			ord = ord & 95;
			if (ord < 65 || ord > 90) return undefined;
		}
		//Default sensitive
		if (caseInsensitive === undefined) caseInsensitive = false;
		return caseInsensitive;
	}

	get nonPrintable(): boolean {
		//@@todo: the no printable space is bigger than this
		return this.ord < 32;
	}

	//Note, case insensitivity is not reflected in the following
	// parameters and method.

	get chrHex(): string {
		const h = this.ord.toString(16).toUpperCase();
		//nextPow2 return 0 and 1 (2^0=1) so filter those out manually
		const outputLen = h.length <= 2 ? 2 : nextPow2(h.length);
		return padStart(h, outputLen, '0');
	}

	get chr(): string {
		if (this.nonPrintable) {
			return '%x' + this.chrHex;
		} else {
			return String.fromCharCode(this.ord);
		}
	}

	descr(): string {
		return this.nonPrintable ? '%x' + this.chrHex : `"${this.chr}"`;
	}

	[Symbol.toPrimitive](): string {
		return this.descr() + (this.caseInsensitive ? '/i' : '');
	}

	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this[Symbol.toPrimitive]();
	}

	public toString(): string {
		return this[Symbol.toPrimitive]();
	}
}

class BnfRange implements IBnfRepeatable, Iterable<BnfChar> {
	readonly start: BnfChar;
	readonly end: BnfChar;
	readonly nonPrintable: boolean;

	constructor(
		startInc: string | number | BnfChar,
		endInc: string | number | BnfChar
	) {
		this.start = new BnfChar(startInc);
		this.end = new BnfChar(endInc);
		if (this.start.caseInsensitive || this.end.caseInsensitive)
			throw new RangeError('You can only specify case sensitive characters.');
		this.nonPrintable = this.start.nonPrintable || this.end.nonPrintable;
		if (this.end.ord <= this.start.ord)
			throw new OutOfRangeError('End (in ASCII)', this.end.chr, this.start.chr);
	}

	get length(): number {
		return this.end.ord - this.start.ord + 1;
	}

	[Symbol.iterator](): Iterator<BnfChar> {
		let ord = this.start.ord;
		const end = this.end.ord;
		return {
			next: function (): IteratorResult<BnfChar> {
				if (ord <= end) {
					return {
						done: false,
						value: new BnfChar(ord++),
					};
				}
				return {
					done: true,
					value: undefined,
				};
			},
		};
	}

	descr(): string {
		//Keep the style in hex if either are non-printable (note the x mod isn't repeated)
		return this.nonPrintable
			? `%x${this.start.chrHex}-${this.end.chrHex}`
			: `${this.start.descr()}-${this.end.descr()}`;
	}

	[Symbol.toPrimitive](): string {
		return `${this.start[Symbol.toPrimitive]()}-${this.end[
			Symbol.toPrimitive
		]()}`;
	}

	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this[Symbol.toPrimitive]();
	}

	public toString(): string {
		return this[Symbol.toPrimitive]();
	}
}

class BnfConcat implements IBnfRepeatable, Iterable<IBnfRepeatable> {
	readonly items: IBnfRepeatable[];
	readonly nonPrintable: boolean;

	constructor(...items: IBnfRepeatable[]) {
		this.items = items;
		//non printable if any of the items are non printable
		this.nonPrintable = items.some((v) => v.nonPrintable);
	}

	[Symbol.iterator](): Iterator<IBnfRepeatable> {
		return this.items[Symbol.iterator]();
	}

	descr(asHex = false): string {
		const ret: string[] = new Array<string>(this.items.length);

		const charSet: BnfChar[] = [];
		let charSetNonPrintable = false;
		let idx = 0;
		for (const item of this.items) {
			//Compress a char sequence into a string
			if (item instanceof BnfChar && item.caseInsensitive) {
				charSet.push(item);
				charSetNonPrintable ||= item.nonPrintable;
			} else {
				if (charSet.length > 0) {
					ret[idx++] = bnfCharArrToStr(asHex || charSetNonPrintable, charSet);
					charSet.length = 0;
				}
				ret[idx++] = item.descr(asHex);
			}
		}
		if (charSet.length > 0) {
			ret[idx++] =
				asHex || charSetNonPrintable
					? `%x${charSet.map((c) => c.chrHex).join('.')}`
					: `"${charSet.map((c) => c.chr).join('')}"`;
			charSet.length = 0;
		}
		//Only bracket if there's >1 element (by description.. there may have been more than one element input)
		return idx <= 1
			? ret.slice(0, idx).join(CONCAT_SEP)
			: `(${ret.slice(0, idx).join(CONCAT_SEP)})`;
	}

	[Symbol.toPrimitive](): string {
		return `(${this.items
			.map((i) => i[Symbol.toPrimitive]())
			.join(CONCAT_SEP)})`;
	}

	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this[Symbol.toPrimitive]();
	}

	public toString(): string {
		return this[Symbol.toPrimitive]();
	}
}

class BnfAlt implements IBnfRepeatable, Iterable<IBnfRepeatable> {
	readonly items: IBnfRepeatable[];
	//While there maybe some nonPrintable elements within, Alt is a boundary
	// (parents shouldn't be concerned)
	readonly nonPrintable = false;

	constructor(...items: IBnfRepeatable[]) {
		this.items = items;
	}

	[Symbol.iterator](): Iterator<IBnfRepeatable> {
		return this.items[Symbol.iterator]();
	}

	descr(asHex = false): string {
		const ret: string[] = new Array<string>(this.items.length);
		let idx = 0;
		for (const item of this.items) {
			ret[idx++] = item.descr(asHex);
		}
		//Only bracket if there's >1 element
		return idx <= 1 ? ret.join(ALT_SEP) : `(${ret.join(ALT_SEP)})`;
	}

	[Symbol.toPrimitive](): string {
		return `(${this.items.map((i) => i[Symbol.toPrimitive]()).join(ALT_SEP)})`;
	}

	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this[Symbol.toPrimitive]();
	}

	public toString(): string {
		return this[Symbol.toPrimitive]();
	}
}

class BnfString
	implements IBnfRepeatable, Iterable<BnfChar>, Iterable<IBnfRepeatable>
{
	private readonly _chars: BnfChar[];
	readonly nonPrintable: boolean;
	/**
	 * True: all chars are insensitive/doesn't matter (SPEC)
	 * False: all chars are sensitive/doesn't matter
	 * Undefined: all characters are undefined (can be true or false)
	 * "Mixed":some chars are sensitive, others insensitive
	 */
	readonly caseInsensitive: boolean | undefined | 'mix';

	/**
	 * ABNF string are case insensitive, setting @param caseInsensitive to true
	 * is beyond spec (turns this into a BnfConcat(...BnfChar[]))
	 * @param value
	 * @param caseInsensitive
	 */
	constructor(value: string | BnfChar[], caseInsensitive = true) {
		let ci: boolean | undefined | 'mix' = caseInsensitive;
		if (value instanceof Array<BnfChar>) {
			this._chars = value;
			let nonPrint = false;
			let ci_all_undef = true;
			let ci_mixed = false;
			value.forEach((c) => {
				//Any are non printable they all are
				nonPrint ||= c.nonPrintable;
				//Any not undef will false
				ci_all_undef &&= c.caseInsensitive === undefined;
				//Any other type
				ci_mixed ||= c.caseInsensitive === !caseInsensitive;
				//(note ALL other type will become mixed.. but what is the dev doing?)
			});
			this.nonPrintable = nonPrint;
			ci = ci_all_undef ? undefined : ci_mixed ? 'mix' : caseInsensitive;
		} else {
			lenAtLeast(value, 2);
			let nonPrint = false;
			let ci_all_undef = true;
			this._chars = value.split('').map((c) => {
				//https://datatracker.ietf.org/doc/html/rfc5234#section-2.3
				// "ABNF strings are case insensitive and the character set for these strings is US-ASCII"
				const bc = new BnfChar(c, caseInsensitive);
				//Any are non printable they all are
				nonPrint ||= bc.nonPrintable;
				//Any not undef will false
				ci_all_undef &&= bc.caseInsensitive === undefined;
				// No need to check for mixed (Char will not invert preference)
				return bc;
			});
			this.nonPrintable = nonPrint;
			ci = ci_all_undef ? undefined : caseInsensitive;
		}
		this.caseInsensitive = ci;
	}

	[Symbol.iterator](): Iterator<BnfChar> {
		return this._chars[Symbol.iterator]();
	}

	get str(): string {
		return this._chars.map((c) => c.chr).join('');
	}

	descr(): string {
		if (this.caseInsensitive === false || this.caseInsensitive === 'mix') {
			//If insensitive, or mixed, we have to fall back to BnfConcat
			return new BnfConcat(...this._chars).descr();
		} else {
			//For sensitive or undefined, we can just show as a string
			return bnfCharArrToStr(this.nonPrintable, this._chars);
		}
	}

	[Symbol.toPrimitive](): string {
		switch (this.caseInsensitive) {
			case true:
				//Note counter to descr insensitive is marked and sensitive is not
				return bnfCharArrToStr(this.nonPrintable, this._chars) + '/i';

			case 'mix':
				//Have to fall back on BnfConcat
				return new BnfConcat(...this._chars)[Symbol.toPrimitive]();

			//case false:
			//case undefined:
			default:
				//False/undefined can just show as a string
				return bnfCharArrToStr(this.nonPrintable, this._chars);
		}
	}

	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this[Symbol.toPrimitive]();
	}

	public toString(): string {
		return this[Symbol.toPrimitive]();
	}
}

class BnfRepeat implements IBnfRepeat {
	readonly min: number;
	readonly max: number;
	readonly rule: IBnfRepeatable;

	/**
	 * Between @see min and @see max repeats of @see rule
	 * `{min,max}` suffix in RegEx
	 * @param rule
	 * @param min Integer, must be >=0
	 * @param max Integer, must be >=@see min
	 */
	constructor(rule: IBnfRepeatable, min = 0, max = Number.MAX_SAFE_INTEGER) {
		//max = infinity, but we cannot measure that..this is a decent equiv for now
		inRangeInclusive(min, 0, Number.MAX_SAFE_INTEGER);
		inRangeInclusive(max, min, Number.MAX_SAFE_INTEGER);
		this.rule = rule;
		this.min = min;
		this.max = max;
	}

	descr(asHex = false): string {
		let prefix = (this.min == 0 ? '' : this.min) + '*';
		if (this.max !== Number.MAX_SAFE_INTEGER) prefix += this.max;
		if (this.min === this.max) prefix = this.min.toString();
		return prefix + this.rule.descr(asHex);
	}

	/**
	 * Zero or more @param rule repeated
	 * `*` suffix in RegEx
	 */
	static ZeroPlus(rule: IBnfRepeatable): BnfRepeat {
		return new BnfRepeat(rule);
	}

	/**
	 * At least one @param rule repeated
	 * `+` suffix in RegEx
	 * @param rule
	 * @returns
	 */
	static OnePlus(rule: IBnfRepeatable): BnfRepeat {
		return new BnfRepeat(rule, 1);
	}

	/**
	 * Zero or one @param rule (aka optional)
	 * `?` suffix in RegEx
	 * @param rule
	 * @returns
	 */
	static Optional(rule: IBnfRepeatable): BnfRepeat {
		return new BnfRepeat(rule, 0, 1);
	}

	/**
	 * @see constructor
	 * `{min,max}` suffix in RegEx
	 */
	static Between(rule: IBnfRepeatable, min: number, max: number): BnfRepeat {
		return new BnfRepeat(rule, min, max);
	}

	/**
	 * @param rule repeated @param value times
	 * `{value}` suffix in RegEx
	 * @param rule
	 * @param value Integer, must be >=0 (probably >0)
	 * @returns
	 */
	static Exactly(rule: IBnfRepeatable, value: number): BnfRepeat {
		return new BnfRepeat(rule, value, value);
	}

	/**
	 * https://datatracker.ietf.org/doc/html/rfc5234#section-3.7
	 * @see Exactly
	 */
	static Specific(rule: IBnfRepeatable, value: number): BnfRepeat {
		return new BnfRepeat(rule, value, value);
	}

	[Symbol.toPrimitive](): string {
		const max = this.max === Number.MAX_SAFE_INTEGER ? '∞' : this.max;
		return this.min + '*' + max + this.rule[Symbol.toPrimitive]();
	}

	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this[Symbol.toPrimitive]();
	}

	public toString(): string {
		return this[Symbol.toPrimitive]();
	}
}

export const bnf = {
	/**
	 * Alternative rules
	 */
	Alt: BnfAlt,
	/**
	 * A concatenation of contiguous rules
	 */
	Concat: BnfConcat,
	/**
	 * Single character, can be non-printable
	 */
	Char: BnfChar,
	/**
	 * An inclusive range of alternative values
	 */
	Range: BnfRange,
	/**
	 * Variable/Specific repetition
	 */
	Repeat: BnfRepeat,
	/**
	 * Literal string text, case insensitive, can contain non-printable chars
	 */
	String: BnfString,
};
