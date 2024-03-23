/*! Copyright 2024 the gnablib contributors MPL-1.1 */

export class NotSupportedError extends SyntaxError {
	/** $reason | not supported */
	constructor(reason?: string) {
		super(reason ?? 'not supported');
	}

	/** @hidden */
	get name(): string {
		return 'NotSupportedError';
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'NotSupportedError';
	}
}
