/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { Color } from '../cli/tty.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const b = Color.cyan.now();
const y = Color.yellow.now();
const g = Color.grey24(16).now();
const r = Color.red.now();
const d = Color.default.now();

/** A problem raised during parsing (could become an error) */
export class ParseProblem {
	/** Invalid $noun, $reason */
	constructor(noun: string, reason: string);
	/** Invalid $noun, $reason\n  '$content' */
	constructor(noun: string, reason: string, content: string);
	/** Invalid $noun, $reason\n  '$content':$at */
	constructor(noun: string, reason: string, content: string, at: number);
	/** Invalid $noun, $reason\n  '$content':$start-$end */
	constructor(
		noun: string,
		reason: string,
		content: string,
		start: number,
		end: number
	);

	constructor(
		readonly noun: string,
		readonly reason: string,
		readonly content?: string,
		readonly start?: number,
		readonly end?: number
	) {
		//If end is defined, and start isn't.. start is set to 0
		if (end !== undefined && start === undefined) this.start = 0;
	}

	renderRange(): string {
		if (this.start === undefined) return '';
		let ret = ':' + this.start;
		if (this.end) ret += '-' + this.end;
		return ret;
	}

	toString(sep = '\n '): string {
		let msg = `Invalid ${this.noun}, ${this.reason}`;
		const r = this.renderRange();
		if (this.content !== undefined) {
			if (r.length > 0) msg += sep + " '" + this.content + "'" + r;
			else msg += "; '" + this.content + "'";
		} else {
			if (r.length > 0) msg += ' ' + r;
		}
		return msg;
	}

	inColor(): string {
		//Note we're managing color ourselves, so we have to remember to reset (${d})
		let msg = `Invalid ${b}${this.noun}${d}, ${this.reason}`;
		if (this.content === undefined) {
			if (this.start !== undefined)
				msg += ` :${y}${this.start}${d}-${y}${this.end}${d}`;
			return msg;
		}
		if (this.start === undefined) return msg + "; '" + this.content + "'";
		else msg += `\n  '${g}${this.content.substring(0, this.start)}${d}`;

		if (this.end)
			return (
				msg +
				`${r}${this.content.substring(this.start, this.end)}${d}` +
				`${g}${this.content.substring(this.end)}${d}` +
				`':${y}${this.start}${d}-${y}${this.end}${d}`
			);
		return (
			msg +
			`${r}${this.content.charAt(this.start)}${d}` +
			`${g}${this.content.substring(this.start + 1)}${d}` +
			`':${y}${this.start}${d}`
		);
	}

	/** @hidden */
	get name(): string {
		return 'ParseProblem';
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return 'ParseProblem';
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this.inColor();
	}
}
