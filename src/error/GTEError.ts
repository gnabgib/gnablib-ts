/*! Copyright 2024 the gnablib contributors MPL-1.1 */
const DBG_RPT = 'GTEError';

/**
 * An error representing an invalid value, where it should have been greater than or equal to a value
 */
export class GTEError extends RangeError {
	/** $noun should be >=$gte, got $value */
	constructor(
		readonly noun: string,
		readonly value: number,
		readonly gte: number
	) {
		super(`${noun} should be >=${gte}, got ${value}`);
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
