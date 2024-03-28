/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { RangeProblem } from '../error/probs/RangeProblem.js';
import { TypeProblem } from '../error/probs/TypeProblem.js';
import { IProblem } from '../error/probs/interfaces/IProblem.js';
import { ILengther } from '../primitive/interfaces/ILengther.js';
import {
	ISafeBool,
	ISafeLen,
	ISafeNum,
	ISafeStr,
} from './interfaces/ForSafe.js';

//export type PlausibleUnknown = null|undefined|boolean|number|string;

function coerceFloat(v: unknown): number {
	//By default null->0, and undefined->NaN.. let's be consistent
	if (v == undefined) return Number.NaN;
	//Fix symbol throwing
	//if (typeof v === 'symbol') return Number.NaN;
	return +(v as number);
}

function coerceInt(v: unknown): number {
	//By default null->0, and undefined->NaN.. mwoi, let's consistently 0
	if (v == undefined) return Number.NaN;
	// //Fix symbol throwing
	// if (typeof v === 'symbol') return Number.NaN;
	return Math.trunc(+(v as number));
}

class SafeNum implements ISafeNum {
	private _prob: IProblem | undefined = undefined;
	private _nVal: number | undefined;

	/** Build a number processor, if $expect has content then a type problem is created */
	constructor(
		readonly noun: string,
		private readonly _uVal: unknown,
		expect?: string,
		private readonly _coercer = coerceFloat
	) {
		if (expect) this._prob = TypeProblem.UnexpVal(noun, _uVal, expect);
	}

	get value(): number {
		if (this._nVal === undefined) {
			this._nVal = this._coercer(this._uVal);
		}
		return this._nVal;
	}

	throwNot(): void | ISafeNum {
		if (this._prob === undefined) return this;
		throw new Error(this._prob.toString());
	}

	cast(): number | never {
		if (this._prob === undefined) return this.value;
		throw new Error(this._prob.toString());
	}

	is(): this is ISafeNum {
		return this._prob === undefined;
	}

	coerce(): ISafeNum {
		//We coerce on .value access, so we just need to clear
		// any problems.. which may also not exist, so this could be a nop
		this._prob = undefined;
		return this;
	}

	atMost(lte: number): ISafeNum {
		//If there's already a problem.. no check
		if (this._prob !== undefined) return this;
		//If it's valid.. all good - note by explicitly checking it's valid
		// we filter NaN from valid results (since it never compares)
		if (this.value <= lte) return this;
		//Otherwise build a new problem
		this._prob = RangeProblem.Lte(this.noun, this.value, lte);
		return this;
	}

	lt(lt: number): ISafeNum {
		//If there's already a problem.. no check
		if (this._prob !== undefined) return this;
		//If it's valid.. all good - note by explicitly checking it's valid
		// we filter NaN from valid results (since it never compares)
		if (this.value < lt) return this;
		//Otherwise build a new problem
		this._prob = RangeProblem.Lt(this.noun, this.value, lt);
		return this;
	}

	atLeast(gte: number): ISafeNum {
		//If there's already a problem.. no check
		if (this._prob !== undefined) return this;
		//If it's valid.. all good - note by explicitly checking it's valid
		// we filter NaN from valid results (since it never compares)
		if (this.value >= gte) return this;
		//Otherwise build a new problem
		this._prob = RangeProblem.Gte(this.noun, this.value, gte);
		return this;
	}

	gt(gt: number): ISafeNum {
		//If there's already a problem.. no check
		if (this._prob !== undefined) return this;
		//If it's valid.. all good - note by explicitly checking it's valid
		// we filter NaN from valid results (since it never compares)
		if (this.value > gt) return this;
		//Otherwise build a new problem
		this._prob = RangeProblem.Lt(this.noun, this.value, gt);
		return this;
	}

	unsigned(): ISafeNum {
		//If there's already a problem.. no check
		if (this._prob !== undefined) return this;
		//If it's valid.. all good - note by explicitly checking it's valid
		// we filter NaN from valid results (since it never compares)
		if (this.value >= 0) return this;
		//Otherwise build a new problem
		this._prob = RangeProblem.Gte(this.noun, this.value, 0);
		return this;
	}

	natural(): ISafeNum {
		//If there's already a problem.. no check
		if (this._prob !== undefined) return this;
		//If it's valid.. all good - note by explicitly checking it's valid
		// we filter NaN from valid results (since it never compares)
		if (this.value >= 1) return this;
		//Otherwise build a new problem
		this._prob = RangeProblem.Gt(this.noun, this.value, 0);
		return this;
	}
}

class SafeStr implements ISafeStr {
	private _prob: IProblem | undefined = undefined;
	private _sVal: string = '';

	constructor(
		readonly noun: string,
		private readonly _uVal: unknown,
		expect?: string
	) {
		if (expect) this._prob = TypeProblem.UnexpVal(noun, _uVal, expect);
	}

	get value(): string {
		return this._sVal;
	}

	throwNot(): void | ISafeStr {
		if (this._prob === undefined) return this;
		throw new Error(this._prob.toString());
	}

	cast(): string {
		if (this._prob === undefined) return this.coerce().value;
		throw new Error(this._prob.toString());
	}

	is(): this is ISafeStr {
		return this._prob === undefined;
	}

	coerce(): ISafeStr {
		//Clear any problems (which might not exist)
		this._prob = undefined;

		//Since sVal starts as an empty strings, we can nop for some inputs
		//Fix undefined|null coercing to the words
		if (this._uVal == undefined) return this;
		else this._sVal = '' + this._uVal;
		//Could also have used this._value.toString(), but it'll convert symbol->string

		return this;
	}
}

class SafeBool implements ISafeBool {
	private _prob: IProblem | undefined = undefined;
	private _bVal: boolean | undefined = undefined;

	constructor(
		readonly noun: string,
		private readonly _uVal: unknown,
		expect?: string
	) {
		if (expect) this._prob = TypeProblem.UnexpVal(noun, _uVal, expect);
	}

	get value(): boolean {
		if (this._bVal === undefined) {
			this._bVal = !!this._uVal;
		}
		return this._bVal!;
	}
	throwNot(): void | ISafeBool {
		if (this._prob === undefined) return this;
		throw new Error(this._prob.toString());
	}
	cast(): boolean {
		if (this._prob === undefined) return this.value;
		throw new Error(this._prob.toString());
	}
	is(): this is ISafeBool {
		return this._prob === undefined;
	}
	coerce(): ISafeBool {
		//Clear any problems (which might not exist)
		this._prob = undefined;
		return this;
	}
}

class SafeLen implements ISafeLen {
	private _prob: IProblem | undefined = undefined;

	constructor(readonly noun: string, private readonly _lVal: ILengther) {}

	throwNot(): void | ISafeLen {
		if (this._prob === undefined) return this;
		throw new Error(this._prob.toString());
	}

	is(): this is ISafeLen {
		return this._prob === undefined;
	}

	exactly(eq: number): ISafeLen {
		//If there's already a problem.. no check
		if (this._prob !== undefined) return this;
		if (this._lVal.length !== eq)
			this._prob = RangeProblem.Eq(
				this.noun + '.length',
				this._lVal.length,
				eq
			);
		return this;
	}

	atMost(lte: number): ISafeLen {
		//If there's already a problem.. no check
		if (this._prob !== undefined) return this;
		if (this._lVal.length > lte)
			this._prob = RangeProblem.Lte(
				this.noun + '.length',
				this._lVal.length,
				lte
			);
		return this;
	}

	atLeast(gte: number): ISafeLen {
		//If there's already a problem.. no check
		if (this._prob !== undefined) return this;
		if (this._lVal.length < gte)
			this._prob = RangeProblem.Gte(
				this.noun + '.length',
				this._lVal.length,
				gte
			);
		return this;
	}
}

/**
 * Safe number, could be integer or float, signed or unsigned, but only the
 * number-type is enforced. Further range constraints are available (see
 * return).
 *
 * **Coercions**
 * - Null¹|undefined - NaN
 * - Bool - 0|1
 * - (number - number)
 * - String - number(only digits/sign/decimal/e)|NaN
 * - Object - NaN
 * - Symbol - *throws*
 * - Function - NaN
 *
 * ¹ - Differs from JS default
 *
 * @param noun Name of element (useful in debugging, trust me)
 * @param test Item to test/you're not sure of provenance
 */
export function sNum(noun: string, test: unknown): ISafeNum {
	const expect =
		typeof test !== 'number' || Number.isNaN(test) ? 'number' : undefined;
	return new SafeNum(noun, test, expect);
}

/**
 * Safe integer, could be unsigned, limited to MIN_SAFE_INT - MAX_SAFE_INT range
 * (by JS/limitations of using *binary-floating-64bit*).
 * Further range constraints are available (see return).
 *
 * Will `coerce` by truncating decimal places (not by rounding)
 *
 * **Coercions**
 * - Null¹|undefined - NaN
 * - Bool - 0|1
 * - (integer - integer)
 * - float - integer
 * - String - number(only digits/sign/decimal/e)|NaN
 * - Object - NaN
 * - Symbol - *throws*
 * - Function - NaN
 *
 * ¹ - Differs from JS default
 *
 * @param noun Name of element (useful in debugging)
 * @param test Item to test/you're not sure of provenance
 */
export function sInt(noun: string, test: unknown): ISafeNum {
	const expect = !Number.isSafeInteger(test) ? 'integer' : undefined;
	return new SafeNum(noun, test, expect, coerceInt);
}

/**
 * Safe float, could be integer or float, signed or unsigned, only the
 * number-type is enforced.  Ostensibly the same as {@link sNum} except the
 * problems report `float` instead of `number`.  {@link sNum} should be used
 * as a "lower overhead sInt" while `sFloat` should be used when dealing
 * with floating point numbers.
 *
 * **Coercions**
 * - Null¹|undefined - NaN
 * - Bool - 0|1
 * - (number - number)
 * - String - number(only digits/sign/decimal/e)|NaN
 * - Object - NaN
 * - Symbol - *throws*
 * - Function - NaN
 *
 * ¹ - Differs from JS default
 *
 * @param noun Name of element (useful in debugging)
 * @param test Item to test/you're not sure of provenance
 */
export function sFloat(noun: string, test: unknown): ISafeNum {
	const expect =
		typeof test !== 'number' || Number.isNaN(test) ? 'float' : undefined;
	return new SafeNum(noun, test, expect);
}

/**
 * Safe string.
 *
 * **Coercions**
 * - Null¹|undefined¹ - ''
 * - Bool - 'true'|'false'
 * - Number - string form
 * - (string - string)
 * - Object - '[object Object]' (etc)
 * - Array - elements.toString().join(',')
 * - Symbol - *throws*
 * - Function - attempts to stringify
 *
 * ¹ - Differs from JS default
 *
 * @param noun Name of element (useful in debugging)
 * @param test Item to test/you're not sure of provenance
 */
export function sStr(noun: string, test: unknown): ISafeStr {
	const expect = typeof test !== 'string' ? 'string' : undefined;
	return new SafeStr(noun, test, expect);
}

/**
 * Safe boolean.
 *
 * **Coercions**
 * - Null|undefined - false
 * - (bool - bool)
 * - Number - false(0)|true(!0)
 * - String - false(empty)|true(!empty)
 * - Object - true
 * - Array - true
 * - Symbol - true
 * - Function - true
 *
 * @param noun Name of element (useful in debugging)
 * @param test Item to test/you're not sure of provenance
 */
export function sBool(noun: string, test: unknown): ISafeBool {
	const expect = typeof test !== 'boolean' ? 'boolean' : undefined;
	return new SafeBool(noun, test, expect);
}

/**
 * Safe lengthed item (eg string, array, TypedArray) - anything with a
 * `get length():number` property.  Further range constraints are available
 * (see return).
 *
 * @param noun Name of item
 * @param test Item with length to test/you're not sure of provenance
 */
export function sLen(noun: string, test: ILengther): ISafeLen {
	return new SafeLen(noun, test);
}
