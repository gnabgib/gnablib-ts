/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { WindowStr } from '../primitive/WindowStr.js';
import { color, style } from '../cli/csi-tables.js';
import { ParseProblem } from '../error/ParseProblem.js';
import { config } from './Config.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const { cyan: method, gray, yellow: num } = color;
const { reset, underline } = style;
const file=gray+underline;

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
	toString(): string {
		return `${this.method} ${this.file}:${this.line},${this.char}`;
	}

	inColor(): string {
		//If undefined, config.color will be false (second param for get bool), however if the
		// tty file has been visited, config.color will be true unless the environment tells 
		// it otherwise.. so:
		// no env check - no color (default)
		// env check and all clear - color
		// env check and constraint (term)/request (no-color) - no color
		if (!config.getBool('color')) return this.toString();
		//Note we're managing color and style ourselves, so we have to remember reset
		return (
			`${method}${this.method} ${file}${this.file}${reset}` +
			`:${num}${this.line}${reset},${num}${this.char}${reset}`
		);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'StackEntry';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		//By default try and render in color during debugging 
		return this.inColor();
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
