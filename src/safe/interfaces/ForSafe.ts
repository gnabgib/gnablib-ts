/*! Copyright 2024 the gnablib contributors MPL-1.1 */

export interface ISafeNum {
	/** Value as number (you should access via {@link cast}) */
	get value(): number;
	/** Throw an error (if fails validation) or return self (chainable) */
	throwNot(): void | ISafeNum;
	/** Cast value, will either return value or throw an error (if fails validation) */
	cast(): number | never;
	/** Return whether a cast will pass (ie. not throw) */
	is(): this is ISafeNum;
	/** Coerce input to number, note any prior problems will be cleared */
	coerce(): ISafeNum;
	/** Make sure value is <= $lte */
	atMost(lte: number): ISafeNum;
	/** Make sure value is < $lt */
	lt(lt: number): ISafeNum;
	/** Make sure value is >= $gte */
	atLeast(gte: number): ISafeNum;
	/** Make sure value is > $gt */
	gt(gt: number): ISafeNum;
	/** Same as `atLeast(0)` */
	unsigned(): ISafeNum;
	/** Same as `atLeast(1)` - there is some contention as to whether 0 is natural https://en.wikipedia.org/wiki/Natural_number */
	natural(): ISafeNum;
}

export interface ISafeStr {
	/** Value as string (you should access via {@link cast}) */
	get value(): string;
	/** Throw an error (if fails validation) or return self (chainable) */
	throwNot(): void | ISafeStr;
	/** Cast value, will either return value or throw an error (if fails validation) */
	cast(): string | never;
	/** Return whether a cast will pass (ie. not throw) */
	is(): this is ISafeStr;
	/** Coerce input to string, note any prior problems will be cleared */
	coerce(): ISafeStr;
}

export interface ISafeBool {
	/** Value as string (you should access via {@link cast}) */
	get value(): boolean;
	/** Throw an error (if fails validation) or return self (chainable) */
	throwNot(): void | ISafeBool;
	/** Cast value, will either return value or throw an error (if fails validation) */
	cast(): boolean | never;
	/** Return whether a cast will pass (ie. not throw) */
	is(): this is ISafeBool;
	/** Coerce input to string, note any prior problems will be cleared */
	coerce(): ISafeBool;
}

export interface ISafeLen {
	/** Throw an error (if fails validation) or return self (chainable) */
	throwNot(): void | ISafeLen;
	/** Return whether a cast will pass (ie. not throw) */
	is(): this is ISafeLen;
	/** Make sure length is == $eq */
	exactly(eq: number): ISafeLen;
	/** Make sure length is <= $lte */
	atMost(lte: number): ISafeLen;
	/** Make sure length is >= $gte */
	atLeast(gte: number): ISafeLen;
}
