/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { WindowStr } from '../primitive/WindowStr.js';
import { ParseProblem } from '../error/ParseProblem.js';
import { StackEntry } from './StackEntry.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

export class StackTrace {
	constructor(readonly entries: StackEntry[]) {}

	toString(color = true): string {
		return this.entries.map((e) => e.toString(color)).join('\n');
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'StackTrace';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this.toString();
	}

	static parse(
		stack: string | undefined,
		v: { back?: number; localOnly?: boolean } = {}
	): StackTrace | undefined {
		if (!stack) return;
		let { back, localOnly } = v;
		if (!back) back = 0;
		if (!localOnly) localOnly = false;
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
		ptr += back;

		const entries: StackEntry[] = [];
		while (ptr < lines.length) {
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
		v: { back?: number; localOnly?: boolean } = {}
	): StackTrace | undefined {
		if (!v.back) v.back = 0;
		if (!v.localOnly) v.localOnly = false;
		v.back += 1;
		return StackTrace.parse(new Error().stack, v);
	}
}
