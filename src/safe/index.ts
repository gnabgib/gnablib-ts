/*! Copyright 2024 the gnablib contributors MPL-1.1 */

/*

somewhatSafe - Does range checks, but not type checks
superSafe - Does range and type checks
safe - Defaults to superSafe, but can be switched by setting safe.super=false;

if (safe.super) will throw on bad types

safe.super:boolean
safe.int.is(test:unknown) //May throw TypeError
safe.int.inRangeInclusive(test:number,low:number,high:number) //May throw RangeError

*/

import { AtMostError } from '../error/AtMostError.js';
import { GTEError } from '../error/GTEError.js';
import { GTError } from '../error/GTError.js';
import { InclusiveRangeError } from '../error/InclusiveRangeError.js';
import { LTError } from '../error/LTError.js';
import { LengthError } from '../error/LengthError.js';
import { NaNError } from '../error/NaNError.js';
import { ILengther } from '../primitive/interfaces/ILengther.js';

function noTest() {}

/** Integer safety checks */
export interface ISafeInt {
	/** May throw if $test is not an integer */
	is(test: unknown): void;
	/** May throw if $test <$lowIn or >highInc  */
	inRangeInc(noun: string, test: number, lowInc: number, highInc: number): void;
	/** Coerce $input into an integer :: that will fit in $bytes bytes */
	coerce(input: unknown): number;
	/** May throw if $test <= $gt */
	gt(noun: string, test: number, gt: number): void;
	/** May throw if $test < $gte */
	gte(noun: string, test: number, gte: number): void;
	/** Make sure that $test is <$lt */
	lt(noun: string, test: number, lt: number): void;
	/** Make sure that $test is <=$lt */
	lte(noun:string,test:number,lte:number):void;
}

export interface ISafeFloat {
	is(test: unknown): void;
	coerce(input: unknown): number;
	/** Make sure that $test is <$lt */
	lt(noun: string, test: number, lt: number): void;
	/** Make sure that $test is >=0 and <$lt */
	zeroTo(noun: string, test: number, lt: number): void;
}

/** String safety checks */
export interface ISafeStr {
	/** May throw if $test is not a string */
	is(test: unknown): void;
	/** Null/undefined or empty string are converted to undefined, other values are coerced to string and returned */
	nullEmpty(v: unknown): string | undefined;
}

/** Length safety checks */
export interface ISafeLen {
	/** Make sure that $test is at least $need elements in size (Invalid length; need $need have $test.length) */
	atLeast(test: ILengther, need: number): void;
	/** Make sure that $test is at least $need elements in size (Invalid $name; need $need have $test.length) */
	atLeast(name: string, test: ILengther, need: number): void;
	/** Make sure that $test is exactly $need elements in size (Invalid $noun; need $need have $test.length) */
	exactly(noun: string, test: ILengther, need: number): void;
}

export interface ISafe {
	int: ISafeInt;
	float: ISafeFloat;
	string: ISafeStr;
	len: ISafeLen;
}

/** Performs range checks, but not type checks */
export const somewhatSafe: ISafe = {
	int: {
		is: noTest,
		inRangeInc: function (
			noun: string,
			test: number,
			lowInc: number,
			highInc: number
		) {
			//So! When you're expecting an int, this looks best:
			//if (test < lowInc || test > highInc)
			//	throw new InclusiveRangeError(noun, test, lowInc, highInc);
			//But.. NaN can't be compared, so neither of those conditions pass.. and it sneaks through
			//Rather, let's check in-range as OK (which NaN can't be)
			if (test >= lowInc && test <= highInc) return true;
			//Then exclude NaN with a different error (extra compare, but this is unhappy path)
			if (Number.isNaN(test)) throw new NaNError(noun);
			//And finally talk about the range constraint
			throw new InclusiveRangeError(noun, test, lowInc, highInc);
		},
		coerce(input: unknown): number {
			//todo: byte concern?
			// if (bytes) this.inRangeInc(bytes,0,6);//JS supports 53 bit ints max, in terms of bytes 2^48 is the max
			// else bytes=6;
			return (input as number) | 0;
		},
		gt(noun: string, test: number, gt: number) {
			if (test > gt) return;
			if (Number.isNaN(test)) throw new NaNError(noun);
			throw new GTError(noun, test, gt);
		},
		gte(noun: string, test: number, gte: number) {
			if (test >= gte) return;
			if (Number.isNaN(test)) throw new NaNError(noun);
			throw new GTEError(noun, test, gte);
		},
		lt(noun: string, test: number, lt: number) {
			if (test < lt) return;
			//Range constraint (note the message won't mention zero but that's ok?)
			throw new LTError(noun, test, lt);
		},
		lte(noun: string, test: number, lte: number) {
			if (test <= lte) return;
			//Range constraint (note the message won't mention zero but that's ok?)
			throw new AtMostError(noun,test,lte);
		},
	},
	float: {
		is: noTest,
		coerce: function (input: unknown): number {
			return +(input as number);
		},
		lt(noun: string, test: number, lt: number) {
			if (test < lt) return;
			//Range constraint (note the message won't mention zero but that's ok?)
			throw new LTError(noun, test, lt);
		},
		zeroTo(noun: string, test: number, to: number) {
			if (test >= 0 && test < to) return;
			//Range constraint (note the message won't mention zero but that's ok?)
			throw new LTError(noun, test, to);
		},
	},
	string: {
		is: noTest,
		nullEmpty: function (v: unknown): string | undefined {
			if (v === null || v === undefined) return undefined;
			//Coerce to string
			const str = '' + v;
			if (str.length === 0) return undefined;
			return str;
		},
	},
	len: {
		atLeast(
			nameOrTest: string | ILengther,
			testOrNeed: ILengther | number,
			need?: number
		) {
			if (need !== undefined) {
				const len = (testOrNeed as ILengther).length;
				if (len < need) throw new LengthError(need, '' + nameOrTest, len);
			} else {
				const len = (nameOrTest as ILengther).length;
				need = testOrNeed as number;
				if (len < need) throw new LengthError(need, len);
			}
		},
		exactly(noun: string, test: ILengther, need: number) {
			if (test.length !== need) throw new LengthError(need, noun, test.length);
		},
	},
};

/** Performs range and type checks */
export const superSafe: ISafe = {
	int: {
		is: function (test: unknown) {
			if (!Number.isSafeInteger(test))
				throw new TypeError(`Not an integer: ${test}`);
		},
		inRangeInc: function (
			noun: string,
			test: number,
			lowInc: number,
			highInc: number
		) {
			superSafe.int.is(test);
			somewhatSafe.int.inRangeInc(noun, test, lowInc, highInc);
		},
		coerce: somewhatSafe.int.coerce,
		gt(noun: string, test: number, gt: number) {
			superSafe.int.is(test);
			somewhatSafe.int.gt(noun, test, gt);
		},
		gte(noun: string, test: number, gte: number) {
			superSafe.int.is(test);
			somewhatSafe.int.gte(noun, test, gte);
		},
		lt(noun: string, test: number, lt: number) {
			superSafe.int.is(test);
			somewhatSafe.int.lt(noun, test, lt);
		},
		lte(noun: string, test: number, lte: number) {
			superSafe.int.is(test);
			somewhatSafe.int.lte(noun, test, lte);
		},
	},
	float: {
		is: function (test: unknown): void {
			if (!(typeof test === 'number'))
				throw new TypeError(`Not a float: ${test}`);
		},
		coerce: somewhatSafe.float.coerce,
		lt: somewhatSafe.float.lt,
		zeroTo: somewhatSafe.float.zeroTo,
	},
	string: {
		is: function (test: unknown) {
			if (typeof test !== 'string')
				throw new TypeError(`Not a string: ${test}`);
		},
		nullEmpty: somewhatSafe.string.nullEmpty,
	},
	len: somewhatSafe.len,
};

// export const safe:ISafe=superSafe;
// safe.
