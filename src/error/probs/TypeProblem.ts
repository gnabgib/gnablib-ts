/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { color } from '../../cli/csi-tables.js';
import { config } from '../../runtime/Config.js';
import { IProblem } from './interfaces/IProblem.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const { cyan: noun, magenta: typ, reset } = color;

/** A problem raised due to type mismatch (could become an error) */
export class TypeProblem implements IProblem {
	protected constructor(
		readonly noun: string,
		private readonly _beforeExpect: string,
		private readonly _expect: string,
		private readonly _afterExpect = '',
		private readonly _got = ''
	) {}

	toString(): string {
		return `${this.noun} ${this._beforeExpect}${this._expect}${this._afterExpect}${this._got}`;
	}

	inColor(): string {
		return (
			`${noun}${this.noun}${reset} ` +
			`${this._beforeExpect}${typ}${this._expect}${reset}` +
			`${this._afterExpect}${typ}${this._got}${reset}`
		);
	}

	/** @hidden */
	get name(): string {
		return 'TypeProblem';
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'TypeProblem';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		/* c8 ignore next*/
		return config.getBool('color') ? this.inColor() : this.toString();
	}

	/** $noun should be $expect, got {typeof $value} */
	static UnexpVal(noun: string, value: unknown, expect: string): TypeProblem {
		return new TypeProblem(noun, `should be `, expect, ', got ', typeof value);
	}

	/** $noun cannot be null */
	static Null(noun: string): TypeProblem {
		return new TypeProblem(noun, 'cannot be ', 'null');
	}
}
