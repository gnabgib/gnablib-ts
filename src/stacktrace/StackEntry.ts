/*! Copyright 2024 the gnablib contributors MPL-1.1 */

import { WindowStr } from '../primitive/WindowStr.js';
import { Color, tty } from '../tty/index.js';
import { ParseProblem } from '../error/ParseProblem.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

export class StackEntry {
	constructor(
		/** File the stack entry is from */
		readonly file: string,
		/** Line number in the file */
		readonly line: number,
		/** Character number on the line */
		readonly char: number,
		/** Method '.' means it was a root level element */
		readonly method: string
	) {}

	/** Render this entry in v8/Chrome/Node/Chromium/IE(?)/Opera/Brave style */
	v8Style(): string {
		return `    at ${this.method} (${this.file}:${this.line}:${this.char})`;
	}

	/** Render this entry in Firefox/Safari/Tor style */
	spiderStyle(): string {
		return `${this.method}@${this.file}:${this.line}:${this.char}`;
	}

	/** Describe this entry (with TTY colors by default) */
	toString(color = true): string {
		if (color) {
			return (
				tty`${Color.cyan}${this.method} ${Color.grey24(16)}${this.file}` +
				tty`:${Color.yellow}${this.line}${Color.default}:${Color.yellow}${this.char}`
			);
		} else {
			return `${this.method} ${this.file}:${this.line}:${this.char}`;
		}
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'StackEntry';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this.toString();
	}

	/** Parse a v8/Chrome/Node/Chromium/IE(?)/Opera/Brave line into an entry (or return problem) */
	static parseV8(stackLine: WindowStr): StackEntry | ParseProblem {
		const noun = 'v8 stack line';
		//Remove any whitespace
		const reset = stackLine.getReset();
		stackLine.trimStart();
		stackLine.trimEnd();

		let ptr = stackLine.indexOf('at ');
		if (ptr < 0) {
			const [sd, ld] = reset();
			return new ParseProblem(
				noun,
				"missing starting 'at'",
				stackLine.toString(),
				sd,
				ld
			);
		}
		stackLine.shrink(ptr + 3);

		ptr = stackLine.indexOf(' (');
		let method = '.';
		if (ptr > 0) {
			method = stackLine.substring(0, ptr);
			stackLine.shrink(ptr + 2);
			if (stackLine.charAt(stackLine.length - 1) != ')') {
				const [sd, ld] = reset();
				return new ParseProblem(
					noun,
					"missing closing ')'",
					stackLine.toString(),
					sd,
					ld
				);
			}
			stackLine.shrink(0, 1);
		}

		ptr = stackLine.lastIndexOf(':');
		if (ptr < 0) {
			const [sd, ld] = reset();
			return new ParseProblem(
				noun,
				"missing trailing ':'",
				stackLine.toString(),
				sd,
				ld
			);
		}
		const charPos = stackLine.substring(ptr + 1);
		stackLine.shrink(0, stackLine.length - ptr);

		ptr = stackLine.lastIndexOf(':');
		if (ptr < 0) {
			const [sd, ld] = reset();
			return new ParseProblem(
				noun,
				"missing second last ':'",
				stackLine.toString(),
				sd,
				ld
			);
		}
		const lineNum = stackLine.substring(ptr + 1);
		stackLine.shrink(0, stackLine.length - ptr);

		if (stackLine.startsWith('async ')) {
			method = 'async';
			stackLine.shrink(6);
		}
		const file = stackLine.toString();

		return new StackEntry(file, +lineNum, +charPos, method);
		// var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code])?$/;
	}

	/** Parse a Firefox/Safari/Tor line into an entry (or return problem) */
	static parseSpider(stackLine: WindowStr): StackEntry | ParseProblem {
		const noun = 'spiderMoney stack line';
		//Remove any whitespace
		const reset = stackLine.getReset();
		stackLine.trimStart();
		stackLine.trimEnd();

		let ptr = stackLine.indexOf('@');
		if (ptr < 0) {
			const [sd, ld] = reset();
			return new ParseProblem(noun, 'missing @', stackLine.toString(), sd, ld);
		}
		const method = ptr == 0 ? '.' : stackLine.substring(0, ptr);
		stackLine.shrink(ptr + 1);

		ptr = stackLine.lastIndexOf(':');
		if (ptr < 0) {
			const [sd, ld] = reset();
			return new ParseProblem(
				noun,
				"missing trailing ':'",
				stackLine.toString(),
				sd,
				ld
			);
		}
		const charPos = stackLine.substring(ptr + 1);
		stackLine.shrink(0, stackLine.length - ptr);

		ptr = stackLine.lastIndexOf(':');
		if (ptr < 0) {
			const [sd, ld] = reset();
			return new ParseProblem(
				noun,
				"missing second last ':'",
				stackLine.toString(),
				sd,
				ld
			);
		}
		const lineNum = stackLine.substring(ptr + 1);
		stackLine.shrink(0, stackLine.length - ptr);

		const file = stackLine.toString();
		return new StackEntry(file, +lineNum, +charPos, method);
		// const re=/([^@]+)?@(.*):(\d+):(\d+)$/;
	}
}
