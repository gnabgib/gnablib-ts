/*! Copyright 2024 the gnablib contributors MPL-1.1 */
const DBG_RPT = 'LTError';

/**
 * An error representing an invalid value, where it should have been less than a value
 */
export class LTError<T> extends RangeError {
	/** $noun should be <$lt, got $value */
	constructor(
		readonly noun: string,
		readonly value: T,
		readonly lt: T
	) {
		super(`${noun} should be <${lt}, got ${value}`);
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

