/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { WindowStr } from '../primitive/WindowStr.js';
import { ParseProblem } from '../error/probs/ParseProblem.js';
import { StackEntry } from './StackEntry.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

export class StackTrace {
	constructor(readonly entries: StackEntry[]) {}

	toString(): string {
		return this.entries.map((e) => e.toString()).join('\n');
	}
	inColor():string {
		return this.entries.map((e) => e.inColor()).join('\n');
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'StackTrace';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this.inColor();
	}

	static parse(
		stack: string | undefined,
		v: { back?: number; localOnly?: boolean; limit?:number } = {}
	): StackTrace {
		//If this logic changes, make sure callFrom also works
		if (!stack) return new StackTrace([]);
		const { back, localOnly,limit } = v;
		let parse = StackEntry.parseSpider;

		//console.log(stack);
		const window = WindowStr.new(stack);
		const lines = window.split('\n');
		let ptr = 0;
		//Behold our v8 detection script, the first line will be the error-message (unlike FF/CoreJS)
		if (lines[0].startsWith('Error')) {
			ptr++;
			parse = StackEntry.parseV8;
		}
		if (back) ptr+=back;

		const entries: StackEntry[] = [];
		const n = limit ? ptr+limit : lines.length;
		while (ptr < n) {
			const e = parse(lines[ptr++]);
			if (e instanceof ParseProblem) continue;
			if (localOnly) {
				if (e.file.includes('\\node_modules\\')) break;
				if (e.file.includes('/node_modules/')) break;
			}
			entries.push(e);
		}
		return new StackTrace(entries);
	}

	static new(
		v: { back?: number; localOnly?: boolean; limit?:number } = {}
	): StackTrace {
		if (!v.back) v.back = 0;
		v.back += 1;
		return StackTrace.parse(new Error().stack, v);
	}
}
