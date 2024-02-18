/*! Copyright 2024 the gnablib contributors MPL-1.1 */
const DBG_RPT = 'GTError';

/**
 * An error representing an invalid value, where it should have been greater than a value
 */
export class GTError extends RangeError {
	/** $noun should be >$gt, got $value */
	constructor(
		readonly noun: string,
		readonly value: number,
		readonly gt: number
	) {
		super(`${noun} should be >${gt}, got ${value}`);
	}

	/** @hidden */
	get name(): string {
		return DBG_RPT;
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}
}
