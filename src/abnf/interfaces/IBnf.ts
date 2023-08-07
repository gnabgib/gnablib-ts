/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { IMatchResult } from "../../primitive/interfaces/IMatchResult.js";
import { WindowStr } from "../../primitive/WindowStr.js";

/**
 * BNF interface
 */
export interface IBnf {
	/**
	 * Name of the component (default undefined)
	 */
	get name(): string | undefined;
	/**
	 * Whether non-printable characters are found within
	 */
	get nonPrintable(): boolean;
	/**
	 * Catching length, min/max
	 */
	get length(): [number, number];
	/**
	 * BNF syntax description of the rule
	 * @param asHex
	 */
	descr(asHex: boolean): string;
	/**
	 * Test whether `s` contains this at the beginning
	 * @param s
	 */
	atStartOf(s: WindowStr): IMatchResult;
	/**
	 * Casting to primitive type, debug
	 */
	[Symbol.toPrimitive](/*hint="string"/"number"/"default"*/): string;
}

