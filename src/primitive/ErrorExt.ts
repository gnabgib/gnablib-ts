/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export class InvalidValueError<T> extends RangeError {
	/**
	 * ${noun} should be in ($values), got $value
	 * @param noun
	 * @param value
	 * @param values
	 */
	constructor(readonly noun: string, readonly value: T, ...values: T[]) {
		super(`${noun} should be in (${values.join(', ')}), got ${value}`);
	}
}

/**
 * $noun should be $lowInc<=x<=$highInc, got: $value
 * $noun should be $lowInc, got: $value
 */
export class OutOfRangeError<T> extends RangeError {
	readonly noun: string;
	readonly value: T;
	readonly low: T;
	readonly high: T;

	/**
	 * $noun should be $lowInc<=x<=$highInc, got: $value
	 * $noun should be $lowInc, got: $value
	 * @param noun
	 * @param value
	 * @param lowInc
	 * @param highInc
	 */
	constructor(noun: string, value: T, lowInc: T, highInc?: T) {
		if (highInc === undefined || highInc === null) {
			super(`${noun} should be >=${lowInc}, got: ${value}`);
		} else if (highInc === lowInc) {
			super(`${noun} should be ${lowInc}, got: ${value}`);
		} else {
			super(`${noun} should be ${lowInc}<=x<=${highInc}, got: ${value}`);
		}

		this.noun = noun;
		this.value = value;
		this.low = lowInc;
		this.high = highInc ?? lowInc;
	}
}

export class NotEnoughDataError extends RangeError {
	/**
	 * `${noun} needs ${length} ${units}, found ${available}`
	 * @param noun
	 * @param units
	 * @param length
	 * @param available
	 */
	constructor(
		readonly noun: string,
		units: string,
		readonly length: number,
		readonly available: number
	) {
		super(`${noun} needs ${length} ${units}, found ${available}`);
	}
}

export class EnforceTypeError extends TypeError {
	/**
	 * Expected ${expectedType}, got: ${typeof value}=${value}
	 * @param expectedType
	 * @param value
	 */
	constructor(readonly expectedType: string, readonly value: unknown) {
		super(`Expected ${expectedType}, got: ${typeof value}=${value}`);
	}
}

export class NullError extends TypeError {
	/**
	 * [$noun ]cannot be null
	 * @param noun
	 */
	constructor(readonly noun?: string) {
		super((noun ? `${noun} ` : '') + `cannot be null`);
	}
}

/**
 * Not supported|$reason
 */
export class NotSupportedError extends TypeError {
	constructor(reason?: string) {
		super(reason ?? 'Not supported');
	}
}