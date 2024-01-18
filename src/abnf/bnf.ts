/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { nextPow2 } from '../algo/nextPow2.js';
import {
	MatchFail,
	MatchSuccess,
} from '../primitive/MatchResult.js';
import { IMatchResult } from "../primitive/interfaces/IMatchResult.js";
import { IMatchDetail } from "../primitive/interfaces/IMatchDetail.js";
import { safety } from '../primitive/Safety.js';
import { stringExt } from '../primitive/StringExt.js';
import { utf } from '../primitive/Utf.js';
import type { WindowStr } from '../primitive/WindowStr.js';
import { IBnf } from './interfaces/IBnf.js';
import { IBnfRepeat } from './interfaces/IBnfRepeat.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

//Augmented Backus-Naur Form
//https://datatracker.ietf.org/doc/html/rfc5234

const CONCAT_SEP = ' ';
const CONCAT_SEP_HEX = '.';
const ALT_SEP = ' / ';


function bnfCharArrToStr(asHex: boolean, set: BnfChar[]): string {
	return asHex
		? `%x${set.map((c) => c.chrHex).join(CONCAT_SEP_HEX)}`
		: `"${set.map((c) => c.chr).join('')}"`;
}

// -- -- -- -- -- -- -- BNF Types -- -- -- -- -- -- --

/**
 * Single character, can be non-printable
 */
export class BnfChar implements IBnf {
	name: string | undefined = undefined;
	readonly ord: number;
	readonly caseInsensitive: boolean | undefined;

	/**
	 * Construct with a single character, or a number
	 * @throws {NotInRangeError} Too many/few characters, null, undefined
	 * @param value
	 */
	constructor(
		value: string | number | BnfChar,
		caseInsensitive?: boolean,
		name?: string
	) {
		// Warning: boolean|undefined=false will set specific undefined values to false
		//  which you might expect, but doesn't seem the same as not specifying
		if (typeof value === 'number') {
			this.ord = value;
		} else if (value instanceof BnfChar) {
			this.ord = value.ord;
			//Override CI preference if not defined
			if (caseInsensitive === undefined) {
				caseInsensitive = value.caseInsensitive;
			}
		} else {
			safety.lenExactly(value, 1, 'value');
			this.ord = value.charCodeAt(0);
		}
		this.caseInsensitive = BnfChar.smartSensitive(this.ord, caseInsensitive);
		this.name = name;
	}

	/**
	 * Within ASCII prevent anything but letters from being sensitive/in
	 * .. beyond that, you're on your own kid
	 * @param ord
	 * @param caseInsensitive
	 * @returns
	 */
	private static smartSensitive(
		ord: number,
		caseInsensitive: boolean | undefined
	): boolean | undefined {
		if (utf.asciiCased(ord)) {
			//default sensitive
			if (caseInsensitive === undefined) return false;
			return caseInsensitive;
		}
		return undefined;
	}

	get nonPrintable(): boolean {
		return !utf.printable(this.ord);
	}

	get length(): [number, number] {
		return [1, 1];
	}

	//Note, case insensitivity is not reflected in the following
	// parameters and method.

	get chrHex(): string {
		const h = this.ord.toString(16).toUpperCase();
		//nextPow2 return 0 and 1 (2^0=1) so filter those out manually
		const outputLen = h.length <= 2 ? 2 : nextPow2(h.length);
		return stringExt.padStart(h, outputLen, '0');
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

	atStartOf(s: WindowStr): IMatchResult {
		if (s.length === 0) return new MatchFail(0);
		let match = false;
		if (this.caseInsensitive) {
			//Fold to lower case (upper case will break other codepoints)
			const c = s.codePointAt(0) | 0x20;
			match = c === (this.ord | 0x20);
		} else {
			match = s.codePointAt(0) === this.ord;
		}
		if (!match) {
			return new MatchFail(0);
		}
		return new MatchSuccess(s.sub(1), { name: this.name, value: s.left(1) });
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

/**
 * An inclusive range of alternative values
 */
export class BnfRange implements IBnf, Iterable<BnfChar> {
	name: string | undefined = undefined;
	readonly start: BnfChar;
	readonly end: BnfChar;
	readonly nonPrintable: boolean;

	constructor(
		startInc: string | number | BnfChar,
		endInc: string | number | BnfChar,
		name?: string
	) {
		this.start = new BnfChar(startInc);
		this.end = new BnfChar(endInc);
		if (this.start.caseInsensitive || this.end.caseInsensitive)
			throw new RangeError('You can only specify case sensitive characters.');
		this.nonPrintable = this.start.nonPrintable || this.end.nonPrintable;
		safety.intGt(this.end.ord, this.start.ord, 'this.end.ord');
		this.name = name;
	}

	get length(): [number, number] {
		return [1, 1];
	}

	/**
	 * Number of potential characters
	 */
	get rangeLength(): number {
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

	atStartOf(s: WindowStr): IMatchResult {
		if (s.length === 0) return new MatchFail(0);
		const c = s.codePointAt(0);
		if (c < this.start.ord || c > this.end.ord) {
			return new MatchFail(0);
		}
		return new MatchSuccess(s.sub(1), { name: this.name, value: s.left(1) });
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

/**
 * Literal string text, case insensitive, can contain non-printable chars
 */
export class BnfString implements IBnf, Iterable<BnfChar>, Iterable<IBnf> {
	name: string | undefined = undefined;
	private readonly _chars: BnfChar[];
	readonly nonPrintable=false;
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
	constructor(value: string | BnfChar[], caseInsensitive = true, name?: string) {
		let ci: boolean | undefined | 'mix' = caseInsensitive;
		if (Array.isArray(value)) {
			if (!value.every(v=>v instanceof BnfChar)) {
				this._chars=[];
				return;
			}
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
			safety.lenGte(value, 2, 'value');
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
		this.name = name;
	}

	get length(): [number, number] {
		return [this._chars.length, this._chars.length];
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

	atStartOf(s: WindowStr): IMatchResult {
		//Make a copy of the original
		let ptr = s.sub(0);
		let i = 0;
		for (; i < this._chars.length; i++) {
			const match = this._chars[i].atStartOf(ptr);
			if (match.fail || match.remain===undefined) {
				return new MatchFail(s.length - ptr.length);
			}
			//We could capture the component parts, but a string is a basic primitive
			// so that could be confusing.
			ptr = match.remain;
		}
		//Catch the full match
		const full = s.left(s.length - ptr.length);
		return new MatchSuccess(ptr, { name: this.name, value: full });
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

/**
 * A concatenation of contiguous rules
 */

export class BnfConcat implements IBnf, Iterable<IBnf> {
	name: string | undefined = undefined;
	suppressComponents = false;
	readonly items: IBnf[];
	readonly nonPrintable: boolean;

	constructor(...items: IBnf[]) {
		this.items = items;
		//non printable if any of the items are non printable
		this.nonPrintable = items.some((v) => v.nonPrintable);
	}

	get length(): [number, number] {
		let min = 0;
		let max = 0;
		for (const item of this.items) {
			const [iMin, iMax] = item.length;
			min += iMin;
			max += iMax;
		}
		return [min, max];
	}

	[Symbol.iterator](): Iterator<IBnf> {
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

	atStartOf(s: WindowStr): IMatchResult {
		const components: IMatchDetail[] = [];
		let ptr = s.sub(0);
		for (const item of this.items) {
			const match = item.atStartOf(ptr);
			if (match.fail || match.remain===undefined) {
				return new MatchFail(s.length - ptr.length);
			}
			ptr = match.remain;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			components.push(match.result!);
			// if (match.components.length>0) {
			//     if (match.result.name!==undefined) components.push(match.result);
			//     components.push(...match.components);
			// } else {
			//     components.push(match.result);
			// }
		}
		//Catch the full match
		const full = s.left(s.length - ptr.length);
		if (this.suppressComponents) {
			return new MatchSuccess(ptr, { name: this.name, value: full });
		}
		return new MatchSuccess(ptr, {
			name: this.name,
			value: full,
			components: components,
		});
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

/**
 * Alternative rules
 */
export class BnfAlt implements IBnf, Iterable<IBnf> {
	name: string | undefined = undefined;
	suppressComponents = false;
	readonly items: IBnf[] = [];
	//While there maybe some nonPrintable elements within, Alt is a boundary
	// (parents shouldn't be concerned)
	readonly nonPrintable = false;

	constructor(...items: IBnf[]) {
		//Unwrap sub-alts
		for (const item of items) {
			if (item instanceof BnfAlt) {
				this.items.push(...item.items);
			} else {
				this.items.push(item);
			}
		}
		//this.items = items;
	}

	get length(): [number, number] {
		let min = Number.MAX_SAFE_INTEGER;
		let max = 0;
		for (const item of this.items) {
			const [iMin, iMax] = item.length;
			if (iMin < min) min = iMin;
			if (iMax > max) max = iMax;
		}
		return [min, max];
	}

	[Symbol.iterator](): Iterator<IBnf> {
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

	atStartOf(s: WindowStr): IMatchResult {
		for (const item of this.items) {
			const match = item.atStartOf(s);
			if (!match.fail && match.remain!==undefined) {
				//We have to recreate the result to capture our name
				const detail:IMatchDetail={
					name: this.name,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					value: match.result!.value,
				}
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (!this.suppressComponents) detail.components=[match.result!];
				return new MatchSuccess(match.remain, detail);
				// if (match.result.name!==undefined) {
				//     //Keep an old name if it's found
				//     return new MatchSuccess(match.remain,{name:this.name,value:match.result.value,components:[match.result]});
				// } else {
				//     return new MatchSuccess(match.remain,{name:this.name,value:match.result.value},match.components);
				// }
			}
		}
		return new MatchFail(0);
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

	/**
	 * Compose an alternate from a series of characters
	 * @param chars
	 * @param caseInsensitive
	 * @returns
	 */
	static Split(
		chars: string,
		caseInsensitive: boolean | undefined = undefined,
		name?: string
	): BnfAlt {
		const ret = new BnfAlt(
			...chars.split('').map((c) => new BnfChar(c, caseInsensitive))
		);
		ret.name = name;
		return ret;
	}
}

/**
 * Variable/Specific repetition
 */
export class BnfRepeat implements IBnfRepeat {
	name: string | undefined = undefined;
	suppressComponents = false;
	readonly min: number;
	readonly max: number;
	readonly rule: IBnf;

	/**
	 * Between @see min and @see max repeats of @see rule
	 * `{min,max}` suffix in RegEx
	 * @param rule
	 * @param min Integer, must be >=0 (default 0)
	 * @param max Integer, must be >=@see min (default MAX_INT)
	 */
	private constructor(rule: IBnf, min: number, max: number, name?: string) {
		//max = infinity, but we cannot measure that..this is a decent equiv for now
		safety.intGte(min, 0, 'min');
		safety.intGte(max, min, 'max');
		this.rule = rule;
		this.min = min;
		this.max = max;
		this.name = name;
	}

	get nonPrintable(): boolean {
		return this.rule.nonPrintable;
	}

	get length(): [number, number] {
		const [rMin, rMax] = this.rule.length;
		const min = rMin * this.min;
		const max =
			this.max === Number.MAX_SAFE_INTEGER
				? Number.MAX_SAFE_INTEGER
				: rMax * this.max;
		return [min, max];
	}

	descr(asHex = false): string {
		let prefix = (this.min == 0 ? '' : this.min) + '*';
		if (this.max !== Number.MAX_SAFE_INTEGER) prefix += this.max;
		if (this.min === this.max) prefix = this.min.toString();
		return prefix + this.rule.descr(asHex);
	}

	atStartOf(s: WindowStr): IMatchResult {
		const components: IMatchDetail[] = [];
		let ptr = s.sub(0);
		//Must have at least min matches
		for (let i = 0; i < this.min; i++) {
			const match = this.rule.atStartOf(ptr);
			if (match.fail || match.remain===undefined) {
				return new MatchFail(s.length - ptr.length);
			}
			ptr = match.remain;
			//There must be a result if it didn't fail
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			components.push(match.result!);
		}
		//May have up to max matches
		for (let i = this.min; i < this.max; i++) {
			const match = this.rule.atStartOf(ptr);
			if (match.fail || match.remain===undefined) break;
			ptr = match.remain;
			//There must be a result if it didn't fail
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			components.push(match.result!);
			// if (match.components.length>0) {
			//     components.push(...match.components);
			// } else {
			//     components.push(match.result);
			// }
		}
		//Catch the full match
		const full = s.left(s.length - ptr.length);
		return new MatchSuccess(ptr, {
			name: this.name,
			value: full,
			components: this.suppressComponents ? [] : components,
		});
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

	/**
	 * Zero or more @param rule repeated
	 * `*` suffix in RegEx
	 */
	static ZeroPlus(rule: IBnf, name?: string): BnfRepeat {
		return new BnfRepeat(rule, 0, Number.MAX_SAFE_INTEGER, name);
	}

	/**
	 * At least one @param rule repeated
	 * `+` suffix in RegEx
	 * @param rule
	 * @returns
	 */
	static OnePlus(rule: IBnf, name?: string): BnfRepeat {
		return new BnfRepeat(rule, 1, Number.MAX_SAFE_INTEGER, name);
	}

	/**
	 * Zero or one @param rule (aka optional)
	 * `?` suffix in RegEx
	 * @param rule
	 * @returns
	 */
	static Optional(rule: IBnf, name?: string): BnfRepeat {
		return new BnfRepeat(rule, 0, 1, name);
	}

	/**
	 * Between @see min and @see max repeats of @see rule
	 * `{min,max}` suffix in RegEx
	 * @param min Integer, must be >=0
	 * @param max Integer, must be >=@see min
	 * @param rule
	 * @param name
	 * @returns
	 */
	static Between(min: number, max: number, rule: IBnf, name?: string): BnfRepeat {
		return new BnfRepeat(rule, min, max, name);
	}

	/**
	 * @param rule repeated @param value times
	 * `{value}` suffix in RegEx
	 * @param count Integer, must be >=0 (probably >0)
	 * @param rule
	 * @returns
	 */
	static Exactly(count: number, rule: IBnf): BnfRepeat {
		return new BnfRepeat(rule, count, count);
	}
}