/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { color } from '../../cli/csi-tables.js';
import { config } from '../../runtime/Config.js';
import { IProblem } from './interfaces/IProblem.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const { cyan: noun, reset } = color;

/** A problem raised by something out of range */
export class RangeProblem<T> implements IProblem {
	private _descr: string;
	/** $noun $descr, got: $value */
	constructor(readonly noun: string, descr: string, readonly value: T) {
		this._descr = descr;
	}

	toString(): string {
		return `${this.noun} ${this._descr}, got ${this.value}`;
	}

	inColor(): string {
		return `${noun}${this.noun}${reset} ${this._descr}, got: ${this.value}`;
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
		return config.getBool('color') ? this.inColor() : this.toString();
	}

    static IncInc<T>(noun:string,value:T,lowInc:T,highInc:T):RangeProblem<T> {
        return new RangeProblem(noun,`should be [${lowInc},${highInc}]`,value);
    }
}
