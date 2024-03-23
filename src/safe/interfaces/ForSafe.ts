/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { ILengther } from "../../primitive/interfaces/ILengther.js";

/** Integer safety checks */
export interface ISafeInt {
	/** May throw if $test is not an integer */
	is(test: unknown): test is number;

    /** May throw if $test <$lowIn or >highInc  */
	inRangeInc(noun: string, test: number, lowInc: number, highInc: number): void;
	/** May throw if $test < $gte */
	gte(noun: string, test: number, gte: number): void;
	/** Make sure that $test is <$lt */
	lt(noun: string, test: number, lt: number): void;
	/** Make sure that $test is <=$lt */
	lte(noun: string, test: number, lte: number): void;
}

export interface ISafeUint {
    /** May throw is $test is not an integer, >=0 */
    is(test:unknown):test is number;

    /** Make sure that $test >=0 <=$lte */
    atMost(noun: string, test: number, lte: number): void;
}

export interface ISafeFloat {
    /** May throw if $test is not a float */
    is(test: unknown): test is number;

    /** Make sure that $test is <$lt */
    lt(noun: string, test: number, lt: number): void;
    /** Make sure that $test is >=0 and <$lt */
    zeroTo(noun: string, test: number, lt: number): void;
}

/** Length safety checks */
export interface ISafeLen {
    /** Make sure that $test is at least $need elements in size (Invalid $name; need $need have $test.length) */
    atLeast(name: string, test: ILengther, need: number): void;
    /** Make sure that $test is exactly $need elements in size (Invalid $noun; need $need have $test.length) */
    exactly(noun: string, test: ILengther, need: number): void;
    /** Make sure that $test is <=$highInc and >=$lowInc */
    inRangeInc(
        noun: string,
        test: ILengther,
        lowInc: number,
        highInc: number
    ): void;
    /** Make sure that $test.length is <= highInc */
    atMost(noun: string, test: ILengther, highInc: number): void;
}

/** String safety checks */
export interface ISafeStr {
    /** May throw if $test is not a string */
    is(test: unknown): test is string;
    /** Null/undefined or empty string are converted to undefined, other values are coerced to string and returned */
    nullEmpty(v: unknown): string | undefined;
}

export interface ISafe {
    int: ISafeInt;
    uint: ISafeUint;
    float: ISafeFloat;
    string: ISafeStr;
    len: ISafeLen;
}