/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

/**
 * An error representing a value that's out of range
 */
export class NotInRangeError<T> extends RangeError {
	/**
	 * ${noun} should be ${low}${lowOp}x${highOp}${high}, got ${value}
	 * @param noun
	 * @param value
	 * @param lowOp <|<=
	 * @param low
	 * @param highOp <|<=
	 * @param high
	 */
	constructor(readonly noun: string, readonly value: T, readonly lowOp: string | undefined, readonly low: T | undefined, readonly highOp: string, readonly high: T) {
		super(`${noun} should be ${low}${lowOp}x${highOp}${high}, got ${value}`);
	}

	/** @hidden */
	get name(): string {
		return 'NotInRangeError';
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'NotInRangeError';
	}
}

