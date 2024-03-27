/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { color } from '../../cli/csi-tables.js';
//import { config } from '../../runtime/Config.js';
import { IProblem } from './interfaces/IProblem.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const { cyan: noun, yellow, magenta, green, reset } = color;

/** A problem raised by something out of range */
export class RangeProblem<T> implements IProblem {
	private _descr: string;
	/** $noun $descr, got: $value */
	constructor(readonly noun: string, descr: string, readonly value: T) {
		this._descr = descr;
	}

	toString(): string {
		let val = '' + this.value;
		if (typeof this.value === 'string') {
			val = "'" + val + "'";
		}
		return `${this.noun} ${this._descr}, got: ${val}`;
	}

	inColor(): string {
		let val = '' + this.value;
		let col = magenta; //undefined|null|true|false
		switch (typeof this.value) {
			case 'string':
				col = green;
				val = "'" + val + "'";
				break;
			case 'number':
				col = yellow;
				break;
		}
		return `${noun}${this.noun}${reset} ${this._descr}, got: ${col}${val}${reset}`;
	}

	/** @hidden */
	get name(): string {
		return 'RangeProblem';
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'RangeProblem';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		/* c8 ignore next*/
		return this.inColor();
		//We cannot consult config without creating a cyclical loop (config can generate problems)
		//return config.getBool('color') ? this.inColor() : this.toString();
	}

	/** $noun should be [$lowInc,$highInc], got $value */
	static IncInc<T>(
		noun: string,
		value: T,
		lowInc: T,
		highInc: T
	): RangeProblem<T> {
		return new RangeProblem(noun, `should be [${lowInc},${highInc}]`, value);
	}

	/** $noun should be <= $highInc, got $value */
	static Lte<T>(noun: string, value: T, highInc: T): RangeProblem<T> {
		return new RangeProblem(noun, `should be <= ${highInc}`, value);
	}

	/** $noun should be < $highExc, got $value */
	static Lt<T>(noun: string, value: T, highExc: T): RangeProblem<T> {
		return new RangeProblem(noun, `should be < ${highExc}`, value);
	}

	/** $noun should be >= $lowInc, got $value */
	static Gte<T>(noun: string, value: T, lowInc: T): RangeProblem<T> {
		return new RangeProblem(noun, `should be >= ${lowInc}`, value);
	}

	/** $noun should be > $lowExc, got $value */
	static Gt<T>(noun: string, value: T, lowExc: T): RangeProblem<T> {
		return new RangeProblem(noun, `should be > ${lowExc}`, value);
	}

	/** $noun should == eq, got $value */
	static Eq<T>(noun: string, value: T, eq: T): RangeProblem<T> {
		return new RangeProblem(noun, `should be == ${eq}`, value);
	}
}
