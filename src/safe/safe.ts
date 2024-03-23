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
import { InclusiveRangeError } from '../error/InclusiveRangeError.js';
import { LTError } from '../error/LTError.js';
import { LengthError } from '../error/LengthError.js';
import { ILengther } from '../primitive/interfaces/ILengther.js';
import { ISafe, ISafeFloat, ISafeLen, ISafeStr } from './interfaces/ForSafe.js';

function uint_atMost(noun: string, test: number, lte: number): void {
	if (test >= 0 && test <= lte) return;
	throw new InclusiveRangeError(noun, test, 0, lte);
}

const safeFloat: ISafeFloat = {
	/**
	 * Whether `test` is a float, which all numbers are.. but note you probably still
	 * want to exclude `NaN` `Number.POSITIVE_INFINITY` and `Number.NEGATIVE_INFINITY`
	 * @param test
	 * @returns
	 */
	is: function (test: unknown): test is number {
		if (typeof test === 'number') return true;
		throw new TypeError(`Not a float: ${test}`);
	},
	//coerce:+value

	lt(noun: string, test: number, lt: number) {
		if (test < lt) return;
		//Range constraint (note the message won't mention zero but that's ok?)
		throw new LTError(noun, test, lt);
	},
	zeroTo(noun: string, test: number, lt: number) {
		if (test >= 0 && test < lt) return;
		//Range constraint (note the message won't mention zero but that's ok?)
		throw new LTError(noun, test, lt);
	},
};

const safeString: ISafeStr = {
	is: function (test: unknown): test is string {
		if (typeof test === 'string') return true;
		throw new TypeError(`Not a string: ${test}`);
	},
	//coerce: ''+input (but note undefined/null go to 'undefined'/'null')
	//coerce: input.toString (but not undefined/null will throw)

	nullEmpty: function (v: unknown): string | undefined {
		if (v === null || v === undefined) return undefined;
		//Coerce to string
		const str = '' + v;
		if (str.length === 0) return undefined;
		return str;
	},
};

const safeLen: ISafeLen = {
	atLeast: function (name: string, test: ILengther, need: number): void {
		if (test.length < need) throw new LengthError(need, name, test.length);
	},
	exactly: function (noun: string, test: ILengther, need: number): void {
		if (test.length !== need) throw new LengthError(need, noun, test.length);
	},
	inRangeInc: function (
		noun: string,
		test: ILengther,
		lowInc: number,
		highInc: number
	): void {
		if (test.length >= lowInc && test.length <= highInc) return;
		throw new InclusiveRangeError(
			noun + '.length',
			test.length,
			lowInc,
			highInc
		);
	},
	atMost: function (noun: string, test: ILengther, lte: number): void {
		if (test.length <= lte) return;
		throw new AtMostError(noun + '.length', test.length, lte);
	},
};

/** Performs range checks, but not type checks */
export const somewhatSafe: ISafe = {
	int: {
		/** Confirm `test` is a number (or throws) */
		is: function (test: unknown): test is number {
			if (typeof test === 'number') return true;
			throw new TypeError(`Not a number: ${test}`);
		},
		//coerce: input|0

		inRangeInc: function (
			noun: string,
			test: number,
			lowInc: number,
			highInc: number
		) {
			//By catching the in range, NaN values are excluded
			if (test >= lowInc && test <= highInc) return;
			throw new InclusiveRangeError(noun, test, lowInc, highInc);
		},
		gte(noun: string, test: number, gte: number) {
			if (test >= gte) return;
			throw new GTEError(noun, test, gte);
		},
		lt(noun: string, test: number, lt: number) {
			if (test < lt) return;
			throw new LTError(noun, test, lt);
		},
		lte(noun: string, test: number, lte: number) {
			if (test <= lte) return;
			throw new AtMostError(noun, test, lte);
		},
	},
	uint: {
		is: function (test: unknown): test is number {
			if (typeof test === 'number' && test >= 0) return true;
			throw new TypeError(`Expecting a number >0, got ${test}`);
		},
		//coerce: input|0

		atMost: uint_atMost,
	},
	float: safeFloat,
	string: safeString,
	len: safeLen,
};

/** Performs range and type checks */
export const superSafe: ISafe = {
	int: {
		/** Confirm `test` is a integer (or throws) */
		is: function (test: unknown): test is number {
			// TS-BUG: `isInteger(number: unknown)`: boolean; should be `isInteger(number: unknown): number is number;`
			if (Number.isSafeInteger(test)) return true;
			throw new TypeError(`Not an integer: ${test}`);
		},
		//coerce: input|0

		inRangeInc: function (
			noun: string,
			test: number,
			lowInc: number,
			highInc: number
		) {
			if (!Number.isSafeInteger(test))
				throw new TypeError(`Not an integer: ${test}`);
			if (test < lowInc || test > highInc)
				throw new InclusiveRangeError(noun, test, lowInc, highInc);
		},
		gte(noun: string, test: number, gte: number) {
			if (!Number.isSafeInteger(test))
				throw new TypeError(`Not an integer: ${test}`);
			if (test >= gte) return;
			throw new GTEError(noun, test, gte);
		},
		lt(noun: string, test: number, lt: number) {
			if (!Number.isSafeInteger(test))
				throw new TypeError(`Not an integer: ${test}`);
			if (test < lt) return;
			throw new LTError(noun, test, lt);
		},
		lte(noun: string, test: number, lte: number) {
			if (!Number.isSafeInteger(test))
				throw new TypeError(`Not an integer: ${test}`);
			if (test <= lte) return;
			throw new AtMostError(noun, test, lte);
		},
	},
	uint: {
		is: function (test: unknown): test is number {
			// TS-BUG: `isSafeInteger(number: unknown)`: boolean; should be `isSafeInteger(number: unknown): number is number;`
			if (Number.isSafeInteger(test) && (test as number) >= 0) return true;
			throw new TypeError(`Expecting a number >0, got ${test}`);
		},
		//coerce: input|0

		atMost: uint_atMost,
	},
	float: safeFloat,
	string: safeString,
	len: safeLen,
};

// export const safe:ISafe=superSafe;
// safe.
