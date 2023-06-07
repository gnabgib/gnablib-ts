/*! Copyright 2023 gnabgib MPL-2.0 */

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
		} else if (highInc===lowInc) {
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

/**
 * $noun should not be negative, got: $value
 */
export class NegativeError extends RangeError {
	readonly noun: string;
	readonly value: number;

	/**
	 * $noun should not be negative, got: $value
	 * @param noun
	 * @param value
	 */
	constructor(noun: string, value: number) {
		super(`${noun} should not be negative, got: ${value}`);
		this.noun = noun;
		this.value = value;
	}
}

/**
 * $noun must $reason='not be' 0
 */
export class ZeroError extends RangeError {
	readonly noun: string;

	/**
	 * ${noun} must ${reason=not be} 0
	 * @param noun string
	 * @param reason string='not be'
	 */
	constructor(noun: string, reason = 'not be') {
		super(`${noun} must ${reason} 0`);
		this.noun = noun;
	}
}

export class NotEnoughSpaceError extends RangeError {
	readonly noun: string;
	readonly need: number;
	readonly available: number;
	constructor(noun: string, need: number, available: number) {
		super(`${noun} needs ${need}, has ${available}`);
		this.noun = noun;
		this.need = need;
		this.available = available;
	}
}
export class NotEnoughDataError extends RangeError {
	readonly noun: string;
	readonly length: number;
	readonly available: number;
	constructor(noun: string, units: string, length: number, available: number) {
		super(`${noun} needs ${length} ${units}, found ${available}`);
		this.noun = noun;
		this.length = length;
		this.available = available;
	}
}

export interface VariedRangeConditions<T> {
	'>'?: T;
	'>='?: T;
	'<'?: T;
	'<='?: T;
}

/**
 * $noun should be conditions.l <= | < x < | <= conditions.g, got $value
 * $noun should be <= | < conditions.l, got $value
 * $noun should be > | >= conditions.h, got $value
 */
export class VariedRangeError<T> extends RangeError {
	readonly noun: string;
	readonly value: T;
	readonly conditions: VariedRangeConditions<T>;

	constructor(noun: string, value: T, conditions: VariedRangeConditions<T>) {
		super(VariedRangeError.reason(noun, value, conditions));
		this.noun = noun;
		this.value = value;
		this.conditions = conditions;
	}

	private static reason<T>(noun: string, value: T, conditions: VariedRangeConditions<T>): string {
		interface Op<T> {
			o:string,
			v:T
		}
		let lt:Op<T>|undefined=undefined;
		let gt:Op<T>|undefined=undefined;

		if (conditions['<'] !== undefined) {
			lt={o:'<',v:conditions['<']}
			// lto = '<';
			// ltv = conditions['<'];
		} else if (conditions['<='] !== undefined) {
			lt={o:'<=',v:conditions['<=']}
		}
		if (conditions['>'] !== undefined) {
			gt={o:'>',v:conditions['>']}
		} else if (conditions['>='] !== undefined) {
			gt={o:'>=',v:conditions['>=']}
		}

		if (lt != undefined) {
			if (gt != undefined) {
				return `${noun} should be ${lt.v}${lt.o}x${gt.o}${gt.v}, got: ${value}`;
			}
			return `${noun} should be ${lt.o}${lt.v}, got: ${value}`;
		} else if (gt!=undefined) {
			return `${noun} should be ${gt.o}${gt.v}, got: ${value}`;
		} else {
			return 'missing conditions';
		}
	}
}

/**
 * $noun should be $low-$high in length, got $count |
 * $noun should be $low in length, got: $count
 */
export class SizeError extends RangeError {
	readonly noun: string;
	readonly count: number;
	readonly low: number;
	readonly high: number;
	/**
	 * $noun should be $low-$high in length, got $count |
	 * $noun should be $low in length, got: $count
	 * @param noun
	 * @param count
	 * @param low
	 * @param high
	 */
	constructor(noun: string, count: number, low: number, high?: number) {
		if (high !== undefined) {
			super(`${noun} should be ${low}-${high} in length, got: ${count}`);
		} else {
			super(`${noun} should be ${low} in length, got: ${count}`);
		}
		this.noun = noun;
		this.count = count;
		this.low = low;
		this.high = high ?? low;
	}
}

/**
 * Expected {$expectedType}, got: typeof($value)=$value
 */
export class EnforceTypeError extends TypeError {
	readonly type: string;
	readonly value: unknown;
	constructor(expectedType: string, value: unknown) {
		super(`Expected ${expectedType}, got: ${typeof value}=${value}`);
		this.type = expectedType;
		this.value = value;
	}
}

/**
 * Invalid $noun; $reason ($value)
 */
export class ContentError extends SyntaxError {
	readonly noun: string;
	readonly value: unknown;
	readonly reason: string;

	constructor(noun: string, reason: string, value?: unknown) {
		super(`Invalid ${noun}; ${reason} (${value})`);
		this.noun = noun;
		this.reason = reason;
		this.value = value;
	}
}

/**
 * $noun cannot be null ($value)
 * Cannot be null ($value)
 */
export class NullError extends TypeError {
	readonly noun: string | undefined;
	constructor(noun?: string) {
		super((noun ? `${noun} c` : 'C') + `annot be null`);
		this.noun = noun;
	}
}

/**
 * Not supported|$reason
 */
export class NotSupportedError extends TypeError {
	constructor(reason?:string) {
		super(reason??"Not supported");
	}
}

export class Grievous extends Error {
	readonly reason: string;
	constructor(reason: string) {
		super('Most grievous of situations (log a bug): ' + reason);
		this.reason = reason;
	}
}

