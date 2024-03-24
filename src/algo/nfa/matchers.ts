/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { utf } from '../../primitive/Utf.js';
import { safe } from '../../safe/safe.js';
import { IMatcher } from '../interfaces/IMatcher.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

/**
 * A single character (control, numeric, or case-sensitive)
 */
export class CharMatch implements IMatcher {
	private readonly _code: number;

	constructor(code: number | string) {
		if (typeof code === 'string') {
			safe.len.atLeast('code', code, 1);
			this._code = code.charCodeAt(0);
		} else {
			this._code = code;
		}
	}

	match(charCode: number): boolean {
		return this._code === charCode;
	}

	toString(): string {
		return utf.printable(this._code)
			? "'" + String.fromCharCode(this._code) + "'"
			: '\\d' + this._code;
	}

	/* c8 ignore next 3 */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this.toString();
	}
}

/**
 * A single character of it's case variant
 */
export class InsensitiveMatch implements IMatcher {
	private readonly _code: number;

	constructor(code: number | string) {
		if (typeof code === 'string') {
			safe.len.atLeast('code', code, 1);
			code = code.charCodeAt(0);
		}
		if (utf.asciiCased(code)) {
			this._code = code | 0x20;
		} else {
			this._code = code;
		}
	}

	match(charCode: number): boolean {
		return this._code === (charCode | 0x20);
	}

	toString(): string {
		return this._code + '/i';
	}

	/* c8 ignore next 3 */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this.toString();
	}
}

export class RangeMatch implements IMatcher {
	private readonly _low: number;
	private readonly _high: number;

	constructor(low: number, high: number) {
		this._low = low;
		this._high = high;
	}

	match(charCode: number): boolean {
		if (charCode < this._low) return false;
		if (charCode > this._high) return false;
		return true;
	}

	toString(): string {
		return this._low + '-' + this._high;
	}
}
