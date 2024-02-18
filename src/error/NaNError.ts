/*! Copyright 2024 the gnablib contributors MPL-1.1 */
const DBG_RPT = 'NaNError';

/**
 * An error representing an invalid value, where it should have been greater than or equal to zero,
 * but was found to be negative
 */
export class NaNError extends RangeError {
	/** $noun should be a number, got NaN */
	constructor(readonly noun: string) {
		super(`${noun} should be a number, got NaN`);
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

