/*! Copyright 2024 the gnablib contributors MPL-1.1 */
import { BgColor, Color, tty } from '../tty/index.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

/** A problem raised during parsing (could become an error) */
export class ParseProblem {
	/** Invalid $noun, $reason */
	constructor(noun: string, reason: string);
	/** Invalid $noun, $reason\n  '$content' */
	constructor(noun: string, reason: string, content: string);
	/** Invalid $noun, $reason\n  '$content':$start-len($content) */
	constructor(noun: string, reason: string, content: string, start: number);
    /** Invalid $noun, $reason\n  '$content':$start-$end */
    constructor(noun: string, reason: string, content: string, start: number, end:number);
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
		if (start !== undefined && end === undefined) end = content?.length;
	}

	renderRange(): string {
		const ret =
			(this.start === undefined ? '' : this.start) +
			(this.end === undefined ? '' : '-' + this.end);
		return ret.length > 0 ? ':' + ret : '';
	}

	toString(sep = '\n '): string {
		let msg = `Invalid ${this.noun}, ${this.reason}`;
        if (this.content!==undefined) {
            msg+=sep + " '" + this.content + "'"+this.renderRange();
        } else {
            const r=this.renderRange();
            if (r.length>0) msg+=' '+r;    
        }
		return msg;
	}

	inColor(): string {
		let msg = tty`Invalid ${Color.cyan}${this.noun}${Color.default}, ${this.reason}`;
		if (this.content !== undefined) {
			if (this.start !== undefined) {
				msg +=
					tty`\n  '${Color.grey24(16)}${this.content.substring(
						0,
						this.start
					)}` +
					tty`${BgColor.red}${this.content.substring(this.start, this.end)}` +
					tty`${Color.grey24(16)}${this.content.substring(this.end!)}` +
					tty`':${Color.yellow}${this.start}${Color.default}-${Color.yellow}${this.end}`;
			} else {
				msg += ': ' + this.content;
			}
		} else if (this.start !== undefined)
			msg += tty` :${Color.yellow}${this.start}${Color.default}-${Color.yellow}${this.end}`;
		return msg;
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
