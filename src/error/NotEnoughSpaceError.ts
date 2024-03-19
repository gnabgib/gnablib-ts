/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

/**
 * An error representing a request that cannot be delivered due to memory constraints
 */
export class NotEnoughSpaceError extends RangeError {
	/**
	 * ${noun} needs ${need}, has ${available}
	 * @param noun
	 * @param need
	 * @param available
	 */
	constructor(
		readonly noun: string,
		readonly need: number,
		readonly available: number
	) {
		super(`${noun} needs ${need}, have ${available}`);
	}

	/** @hidden */
	get name(): string {
		return 'NotEnoughSpaceError';
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'NotEnoughSpaceError';
	}
}
