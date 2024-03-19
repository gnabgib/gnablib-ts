/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { color } from '../cli/csi-tables.js';
import { config } from '../runtime/Config.js';

const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const { cyan: noun, gray: g, yellow: num, red: r, reset } = color;

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
		let msg = `Invalid ${noun}${this.noun}${reset}, ${this.reason}`;
		if (this.content === undefined) {
			if (this.start !== undefined)
				msg += ` :${num}${this.start}${reset}-${num}${this.end}${reset}`;
			return msg;
		}
		if (this.start === undefined) return msg + "; '" + this.content + "'";
		else msg += `\n  '${g}${this.content.substring(0, this.start)}`;

		if (this.end)
			return (
				msg +
				`${r}${this.content.substring(this.start, this.end)}${reset}` +
				`${g}${this.content.substring(this.end)}${reset}` +
				`':${num}${this.start}${reset}-${num}${this.end}${reset}`
			);
		return (
			msg +
			`${r}${this.content.charAt(this.start)}${reset}` +
			`${g}${this.content.substring(this.start + 1)}${reset}` +
			`':${num}${this.start}${reset}`
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
		return config.getBool('color')?this.inColor():this.toString();
	}
}
