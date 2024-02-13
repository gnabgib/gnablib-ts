/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { EnforceTypeError, NotInRangeError, NullError } from './ErrorExt.js';
import { LengthError } from '../error/LengthError.js';
import { ILengther } from './interfaces/ILengther.js';

/** @namespace */
export const safety = {
	/**
	 * Make sure `test` is a number, and is an integer
	 * @param test Value to test
	 * @param noun
	 *
	 * @throws {@link ./EnforceTypeError}
	 * Expected [$noun as] integer, got: typeof($value)=$value
	 */
	isInt: function (test: unknown, noun?: string): number {
		if (noun === undefined) noun = 'integer';
		else noun += ' as integer';

		if (!Number.isInteger(test)) throw new EnforceTypeError(noun, test);

		// @ts-expect-error: We're casting bool->number on purpose
		return test | 0;
	},

	/**
	 * Make sure `test` is an int, at a min `low` (inclusive) and max `high` (inclusive)
	 * @param test Value to test
	 * @param lowInc Lowest allowed value
	 * @param highInc Highest allowed value
	 * @param noun
	 *
	 * @throws {@link ./EnforceTypeError}
	 * Expected [$noun as] integer, got: typeof($value)=$value
	 *
	 * @throws {@link ./NotInRangeError}
	 * $noun/value should be [$lowInc-$highInc], got: $value
	 */
	intInRangeInc: function (
		test: number,
		lowInc: number,
		highInc: number,
		noun?: string
	): void {
		if (noun === undefined) noun = 'value';
		this.isInt(test, noun);
		if (test < lowInc || test > highInc)
			throw new NotInRangeError(noun, test, '<=', lowInc, '<=', highInc);
	},

	/**
	 * Requires that `test` is an integer, and at a min `low` (inclusive) and less than `high` (exclusive)
	 * @param test Value to test
	 * @param lowInc Lowest possible value
	 * @param highExc First integer above highest value
	 * @param noun Value description (default ='value')
	 *
	 * @throws {@link ./EnforceTypeError}
	 * Expected [$noun as] integer, got: typeof($value)=$value
	 *
	 * @throws {@link ./NotInRangeError}
	 * $noun/value should be [$lowInc-$highInc), got: $value
	 */
	intInRangeIncExc: function (
		test: number,
		lowInc: number,
		highExc: number,
		noun?: string
	): void {
		this.isInt(test, noun);
		if (noun === undefined) noun = 'value';
		if (test < lowInc || test >= highExc)
			throw new NotInRangeError(noun, test, '<=', lowInc, '<', highExc);
	},

	/**
	 * Requires that `test` is an integer, and at a min `gte` (inclusive)
	 * @param test Value to test
	 * @param gte Lowest possible value
	 * @param noun Value description (default='value')
	 *
	 * @throws {@link ./EnforceTypeError}
	 * Expected [$noun as] integer, got: typeof($value)=$value
	 *
	 * @throws {@link ./NotInRangeError}
	 * $noun/value should be x>=${gte}, got: $value
	 */
	intGte: function (test: number, gte: number, noun?: string): void {
		this.isInt(test, noun);
		if (noun === undefined) noun = 'value';
		if (test < gte)
			throw new NotInRangeError(noun, test, undefined, undefined, '>=', gte);
	},

	/**
	 * Requires that `test` is an integer, and more than `gt` (exclusive)
	 * @param test Value to test
	 * @param gt Below lowest value (exclusive)
	 * @param noun Value description (default=value)
	 *
	 * @throws {@link ./EnforceTypeError}
	 * Expected [$noun as] integer, got: typeof($value)=$value
	 *
	 * @throws {@link ./NotInRangeError}
	 * $noun/value should be x>${gt}, got: $value
	 */
	intGt: function (test: number, gt: number, noun?: string): void {
		this.isInt(test, noun);
		if (noun === undefined) noun = 'value';
		if (test <= gt)
			throw new NotInRangeError(noun, test, undefined, undefined, '>', gt);
	},

	/**
	 * Requires that `test` is an integer, and rules(test)==true
	 * @param test Value to test
	 * @param rules Rule set, true=pass, false=fail
	 * @param message Message to report on failure (default=Unacceptable value)
	 *
	 * @throws {@link primitive.EnforceTypeError}
	 * Expected [$noun as] integer, got: typeof($value)=$value
	 *
	 * @throws {RangeError}
	 * $message/Unacceptable value
	 */
	intSatisfies(
		test: number,
		rules: (test: number) => boolean,
		message?: string
	): void {
		this.isInt(test);
		if (message === undefined) message = 'Unacceptable value';
		if (!rules(test)) throw new RangeError(message);
	},

	/**
	 * If @param obj is null or undefined a @see NullError is thrown
	 * @param obj
	 * @param noun
	 *
	 * @throws {@link ./NullError}
	 * [$noun ]cannot be null
	 */
	notNull: function (obj: unknown, noun?: string): void {
		if (obj === null || obj === undefined) throw new NullError(noun);
	},

	/**
	 * Requires that `test` isn't null, and length is at a min `lowInc` and a max `highInc
	 * @param test Value to test
	 * @param lowInc Min length (inclusive)
	 * @param highInc Max length (inclusive)
	 * @param noun Value description (default='value')
	 *
	 * @throws {@link ./NullError}
	 * [$noun ]cannot be null
	 *
	 * @throws {@link ./NotInRangeError}
	 * $noun/value length should be $lowInc<=x<=$highInc, got: $test.length
	 */
	lenInRangeInc: function (
		test: ILengther,
		lowInc: number,
		highInc: number,
		noun?: string
	): void {
		this.notNull(test, noun);
		if (noun === undefined) noun = 'value';
		noun += ' length';
		if (test.length < lowInc || test.length > highInc)
			throw new NotInRangeError(noun, test.length, '<=', lowInc, '<=', highInc);
	},

	/**
	 * Requires that `test` isn't null, and length is exactly `len`
	 * @param test Value to test
	 * @param len Exact length
	 * @param noun Value description (default='value')
	 *
	 * @throws {@link ./NullError}
	 * [$noun ]cannot be null
	 *
	 * @throws {@link ./NotInRangeError}
	 * $noun/value length should be x==$eq, got: $test.length
	 */
	lenExactly: function (test: ILengther, len: number, noun?: string): void {
		this.notNull(test, noun);
		if (noun === undefined) noun = 'value';
		noun += ' length';
		if (test.length != len)
			throw new NotInRangeError(
				noun,
				test.length,
				undefined,
				undefined,
				'==',
				len
			);
	},

	/**
	 * Request that `test` isn't null, and length is at least `gte`
	 * @param test Value to test
	 * @param gte Min length (inclusive)
	 * @param noun Value description (default='value')
	 *
	 * @throws {@link ./NullError}
	 * [$noun ]cannot be null
	 *
	 * @throws {@link ./NotInRangeError}
	 * $noun/value length should be x>=$gte, got: $test.length
	 */
	lenGte: function (test: ILengther, gte: number, noun?: string): void {
		this.notNull(test, noun);
		if (noun === undefined) noun = 'value';
		noun += ' length';
		if (test.length < gte)
			throw new NotInRangeError(
				noun,
				test.length,
				undefined,
				undefined,
				'>=',
				gte
			);
	},

	/**
	 * Request that `test` is a multiple of `mul` in length (no leftovers)
	 * @param test
	 * @param mul
	 * @param noun
	 *
	 * @throws {@link ./InvalidLengthError}
	 * $noun length needs to be be a multiple of $mul, has $rem extra
	 */
	lenMultiple: function (test: ILengther, mul: number, noun?: string): void {
		if (noun === undefined) noun = 'value';
		noun += ' length';
		const rem = test.length % mul;
		if (rem !== 0) {
			throw LengthError.mulOf(mul, noun, test.length);
			//throw new InvalidLengthError(noun,`to be a multiple of ${mul}`,`${rem} extra`);
		}
	},

	/**
	 * Request that `test` is at least `lowInc` and less than `highInc`
	 * @param test Value to test
	 * @param lowInc Min value (inclusive)
	 * @param highExc Max value (exclusive)
	 * @param noun Value description (default='pos')
	 *
	 * @throws {@link ./NotInRangeError}
	 * $noun/pos should be $lowInc<=x<$highExc, got: $value
	 */
	numInRangeIncExc: function (
		test: number,
		lowInc: number,
		highExc: number,
		noun?: string
	): void {
		if (noun === undefined) noun = 'pos';
		if (test < lowInc || test >= highExc)
			throw new NotInRangeError(noun, test, '<=', lowInc, '<', highExc);
	},

	/**
	 * Request that `test` is at least `lowInc` and at most `highInc`
	 * @param test Value to test
	 * @param lowInc Min value (inclusive)
	 * @param highInc Max value (inclusive)
	 * @param noun Value description (default='pos')
	 *
	 * @throws {@link ./NotInRangeError}
	 * $noun/pos should be $lowInc<=x<=$highExc, got: $value
	 */
	numInRangeInc: function (
		test: number,
		lowInc: number,
		highInc: number,
		noun?: string
	): void {
		if (noun === undefined) noun = 'pos';
		if (test < lowInc || test > highInc)
			throw new NotInRangeError(noun, test, '<=', lowInc, '<=', highInc);
	},

	/**
	 * Request that `test` is at least `gte`
	 * @param test Value to test
	 * @param gte Min value (inclusive)
	 * @param noun Value description (default='pos')
	 *
	 * @throws {@link ./NotInRangeError}
	 * $noun/pos should be x>=$gte, got: $value
	 */
	numGte: function (test: number, gte: number, noun?: string): void {
		if (noun === undefined) noun = 'pos';
		if (test < gte)
			throw new NotInRangeError(noun, test, undefined, undefined, '>=', gte);
	},
};
