/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { safe as safe } from '../safe/safe.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const DBG_RPT = 'WindowStr';
const NOT_FOUND = -1;
const WHITESPACE = [' ', '\t', '\n', '\r', '\v', '\f'];
// file deepcode ignore BadWrapperObjectCreation: <please specify a reason of ignoring this>

// eslint-disable-next-line @typescript-eslint/ban-types
export type WindowOrString = WindowStr | string;

export class WindowStr {
	//Strings are immutable in JS
	//We want this to be the object type (for peerOf, otherwise we'd get content comparison)
	// eslint-disable-next-line @typescript-eslint/ban-types
	private readonly _src: String;
	private _start: number;
	private _len: number;

	//We want source to be String not string
	// eslint-disable-next-line @typescript-eslint/ban-types
	protected constructor(source: String, start: number, len: number) {
		this._src = source;
		this._start = start;
		//this._start + this._len is ALWAYS <=_src.length
		this._len = len;
	}

	/** Length/size of the window (in characters) */
	get length(): number {
		return this._len;
	}

	/** Window is empty (has no length) */
	get empty(): boolean {
		return this._len == 0;
	}

	/**
	 * Extract a copy of the string contained within the present window
	 * @returns
	 * @pure
	 */
	toString(): string {
		return this._src.substring(this._start, this._start + this._len);
	}

	/** @hidden */
	get [Symbol.toStringTag](): string {
		return DBG_RPT;
	}

	/** @hidden */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return `${DBG_RPT}(${this._src.toString()}, ${this._start}, ${this._len})`;
	}

	/** @hidden */
	debug(): string {
		return `${DBG_RPT}(${this._src.toString()}, ${this._start}, ${this._len})`;
	}

	/**
	 * Return the Unicode character at the specific index, unlike
	 * [String.charAt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt)
	 * this will turn a surrogate pair into a single character (lone surrogates are not a risk)
	 *
	 * @throws EnforceTypeError idx not an integer
	 * @throws OutOfRangeError idx invalid value
	 * @param idx Integer [0 - {@link length})
	 * @returns character|''
	 * @pure
	 */
	charAt(idx: number): string {
		safe.uint.atMost('idx', idx, this.length - 1);
		const cp = this._src.codePointAt(idx + this._start);
		//if (cp === undefined) return '';
		//@ts-ignore - We've already tested out of range idx (above), so we know it's a number
		return String.fromCodePoint(cp);
	}

	/**
	 * Return the UTF-16 code point of the character at the specific index
	 * @throws OutOfRangeError idx invalid value
	 * @param idx Integer [0 - {@link length})
	 * @returns Integer [0 - 1114111]
	 * @pure
	 */
	codePointAt(idx: number): number {
		safe.uint.atMost('idx', idx, this.length - 1);
		//@ts-ignore - We've already tested out of range idx (above), so we know it's a number
		return this._src.codePointAt(idx + this._start);
	}

	/**
	 * Whether the window ends with the given string (exactly)
	 * @param searchString
	 * @returns
	 * @pure
	 */
	endsWith(searchString: string): boolean {
		return this._src.endsWith(searchString, this._start + this._len);
	}

	// /**
	//  * Whether the *content* of this window matches string or another  another (does not require using the
	//  * same storage, ie a.equals(b)==true, while a.peerOf(b)==false)
	//  * @pure
	//  */
	// equals(other: string | WindowStr): boolean {
	// 	if (other instanceof WindowStr) {
	// 		return this.toString() === other.toString();
	// 	} else {
	// 		return this.toString() === other;
	// 	}
	// }

	/**
	 * Search for the first occurrence of the given string
	 * @throws OutOfRangeError start invalid value
	 * @param searchString
	 * @param start Integer, starting point to search from, [0 - {@link length}) (default=0/whole window)
	 * @returns Index or -1
	 * @pure
	 */
	indexOf(searchString: string, start?: number): number {
		if (!start) start = 0;
		else safe.uint.atMost('start', start, this._len);
		let pos = this._src.indexOf(searchString, this._start + start);
		//Not found - return
		if (pos < 0) return NOT_FOUND;
		//Correct scope
		pos -= this._start;
		//Filter out positions out of scope
		return pos <= this._len - searchString.length ? pos : NOT_FOUND;
	}

	/**
	 * Search for the first occurrence of any of the given strings,
	 * the earliest of any of the values will be returned (all will be checked)
	 * @throws {@link OutOfRangeError} start invalid
	 * @param search strings to search for
	 * @param start Integer, starting point to search from [0 - {@link length}) (default 0/all)
	 * @returns Index or -1
	 * @pure
	 */
	indexOfAny(search: string[], start?: number): number {
		if (!start) start = 0;
		else safe.uint.atMost('start', start, this._len);

		const effLen = this._start + this._len;
		let earliest = effLen;
		for (const s of search) {
			const pos = this._src.indexOf(s, this._start + start);
			//If not found, or found and it exceeds the window.. ignore
			if (pos < 0) continue;
			if (pos + s.length > effLen) continue;
			//Possibly make it the earliest
			if (pos < earliest) earliest = pos;
		}
		//Make sure something was found
		if (earliest == effLen) return NOT_FOUND;
		//Correct scope
		earliest -= this._start;
		//console.log(`str=${this.toString()} s=${this._start} l=${this._len} e=${earliest}`);
		return earliest;
	}

	/**
	 * Search for the last occurrence of the given string
	 * @param searchString What to search for
	 * @param length Integer, [0 - {@link length}) (default=length/whole window)
	 * @returns Index or -1
	 * @pure
	 */
	lastIndexOf(searchString: string, length?: number): number {
		if (length == undefined) {
			length = this._len;
		} else {
			safe.uint.atMost('length', length, this._len);
		}
		const lastIndexPos = this._start + length - searchString.length;
		//Because JS treats <=0 as 0 in lastIndexPos we need to catch negative
		if (lastIndexPos < 0) return NOT_FOUND;
		let pos = this._src.lastIndexOf(searchString, lastIndexPos);
		//Correct scope
		pos -= this._start;
		//Filter out positions out of scope
		return pos < 0 ? NOT_FOUND : pos;
	}

	/**
	 * Search for the last occurrence of any of the given strings
	 * @param search strings to search for
	 * @param length Integer, [0 - {@link length}) (default=length/whole window)
	 * @returns Index or -1
	 * @pure
	 */
	lastIndexOfAny(search:string[],length?:number):number {
		if (length == undefined) {
			length = this._len;
		} else {
			safe.uint.atMost('length', length, this._len);
			length+=this._start;
		}
		let latest=this._start-1;
		for(const s of search) {
			const pos=this._src.lastIndexOf(s,length-s.length);
			if (pos<latest) continue;
			latest=pos;
		}
		//Make sure something was found
		if (latest==this._start-1) return NOT_FOUND;
		//Correct scope
		latest -=this._start;
		return latest;
	}

	/**
	 * A new window, on the same storage, using the first `length` characters of this
	 * @throws OutOfRangeError length invalid value
	 * @param length Integer [0 - {@link length})
	 * @returns
	 * @pure
	 */
	left(length: number): WindowStr {
		safe.uint.atMost('length', length, this.length);
		return new WindowStr(this._src, this._start, length);
	}

	/**
	 * Retrieves the result of matching this window against a
	 * [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)
	 * @param regexp A regular expression object, or something that has a `Symbol.match` method
	 * @returns  An array of matches, or null if no matches are found
	 * @pure
	 */
	match(regexp: {
		[Symbol.match](string: string): RegExpMatchArray | null;
	}): RegExpMatchArray | null {
		return this._src
			.substring(this._start, this._start + this._len)
			.match(regexp);
	}

	/**
	 * Whether a WindowStr shares it's storage with another
	 * @pure
	 */
	peerOf(other: WindowStr): boolean {
		return this._src === other._src;
	}

	/**
	 * Create a reset point, calling the returned function will return this window to
	 * the state it is in when this function is requested.  Useful for backing out
	 * a multi-step parse that fails at a later step.  Like a transaction that auto-
	 * commits
	 */
	getReset(): () => [number,number] {
		const s = this._start;
		const l = this._len;
		return () => {
			const sd=this._start-s;
			const ld=this._len+this._start;
			this._start = s;
			this._len = l;
			return [sd,ld];
		};
	}

	/**
	 * A new window, on the same storage, using the last `length` characters of this
	 * @throws OutOfRangeError length invalid value
	 * @param length Integer [0 - {@link length})
	 * @returns
	 * @pure
	 */
	right(length: number): WindowStr {
		safe.uint.atMost('length', length, this.length);
		const start = this._start + this._len - length;
		return new WindowStr(this._src, start, length);
	}

	/**
	 * Shrink this window by forwarding the start by `startBy` and
	 * decreasing the length by `lengthBy`.  Mutates state.
	 *
	 * Perhaps obvious from the name, but you **cannot** provide negative
	 * values to make a window larger (even if the storage may be larger)
	 *
	 * @param startBy Integer [0 - {@link length})
	 * @param lengthBy Integer [0 - ({@link length}-`startBy`))
	 * @returns This (chainable)
	 */
	shrink(startBy?: number, lengthBy?: number): WindowStr {
		if (!startBy) startBy = 0;
		else safe.uint.atMost('startBy', startBy,  this._len);
		if (!lengthBy) lengthBy = 0;
		else safe.uint.atMost('lengthBy', lengthBy, this._len - startBy);

		this._start += startBy;
		this._len = this._len - startBy - lengthBy;

		return this;
	}

	/**
	 * A new window, on the same storage, starting `start` characters in and using `length` characters
	 * @param start Integer [0 - {@link length})
	 * @param length Integer [0 - ({@link length}-`start`)) (default rest of space)
	 * @returns
	 */
	span(start: number, length?: number): WindowStr {
		//If start is low, add length (-1 will give you the last char)
		safe.uint.atMost('start', start, this._len);
		if (length == undefined) {
			length = this._len - start;
		} else {
			safe.uint.atMost('length', length, this._len - start);
		}
		return new WindowStr(this._src, this._start + start, length);
	}

	/**
	 * Breaks into pieces at `separator`, returning new windows on the same storage
	 * NOTE: Doesn't support zero length separator (unlike string.split)
	 * Note: Even if there are no splits, the returned set will include a different object from the source
	 * @param separator String to divide by, length>0
	 * @param limit Limit on the number of sub windows to create, left overs will be excluded (default: undefined/no limit)
	 * @returns
	 * @pure
	 */
	split(separator: string, limit?: number): WindowStr[] {
		//Not sure we can support Symbol.split (splitter in TS)
		const ret: WindowStr[] = [];
		if (limit === 0 || separator.length === 0) return ret;
		if (limit === 1) return [this.span(0)];
		if (!limit) limit = Number.MAX_SAFE_INTEGER;
		limit -= 1;
		let start = 0;
		let first = this.indexOf(separator);
		while (first >= 0) {
			ret.push(this.span(start, first - start));
			start = first + separator.length;
			//See if we've got to the limit
			if (ret.length === limit) break;
			first = this.indexOf(separator, start);
		}
		ret.push(this.span(start));
		return ret;
	}

	/**
	 * Whether the window starts with the given string (exactly)
	 * @param searchString
	 * @returns
	 * @pure
	 */
	startsWith(searchString: string): boolean {
		return this._src.startsWith(searchString, this._start);
	}

	/**
	 * Return part of the window from the start index up to and excluding the end index, or to the end of the window
	 * if no end index is supplied.
	 * @param start The index of the first character to include in the returned substring
	 * @param end The index of the first character to exclude from the returned substring
	 * @pure
	 */
	substring(start: number, end?: number): string {
		if (!end) end = this._len;
		return this._src.substring(this._start + start, this._start + end);
	}

	/**
	 * Executes a search with given regular expression, returns true if there's a match, false otherwise
	 * @param regexp A regular expression object
	 * @returns Whether there's a match or not
	 * @pure
	 */
	test(regexp: RegExp): boolean {
		return regexp.test(
			this._src.substring(this._start, this._start + this._len)
		);
	}

	trim(chars?:string[]):WindowStr {
		if (!chars) chars = WHITESPACE;
		restart: while (this._len > 0) {
			for (const c of chars) {
				if (this._src.startsWith(c, this._start)) {
					this._start += c.length;
					this._len -= c.length;
					//Restart the search at the new start
					continue restart;
				}
			}
			//No match - done here
			break;
		}
		restart: while (this._len > 0) {
			for (const c of chars) {
				if (this._src.endsWith(c, this._start + this._len)) {
					this._len -= c.length;
					//Restart the search at the new end
					continue restart;
				}
			}
			//No match - done here
			break;
		}
		return this;
	}

	/**
	 * Remove `chars` from the end of the window, by decreasing the size of the window.
	 * This mutates internal state.
	 *
	 * See similar notes/examples as {@link trimStart}
	 * @param chars Array of chars/strings to remove (default whitespace)
	 * @param limit Maximum number of trim-steps (note steps and not chars) (default 0/unlimited)
	 * @returns This (chainable)
	 */
	trimEnd(chars?: string[], limit = 0): WindowStr {
		if (!chars) chars = WHITESPACE;
		restart: while (this._len > 0) {
			for (const c of chars) {
				if (this._src.endsWith(c, this._start + this._len)) {
					this._len -= c.length;
					if (--limit == 0) break restart;
					//Restart the search at the new end
					continue restart;
				}
			}
			//No match - done here
			break;
		}
		return this;
	}

	/**
	 * Remove `chars` from the beginning of the window, by decreasing the size of the window.
	 * This mutates internal state
	 *
	 * *Note*: You can provide strings instead of chars for trimming (for example `\r\n` if you
	 * only want to remove that sequence).  Order is important - if you have ['\r\n','\r'] then:
	 * `\r\nhi` -> `hi`
	 * `\rhi` => `hi`
	 * `\nhi` => `\nhi`
	 *
	 * If you use:
	 *
	 * @param chars Array of chars/strings to remove (default whitespace)
	 * @param limit Maximum number of trim-steps (note steps and not chars) (default 0/unlimited)
	 * @returns This (chainable)
	 *
	 * @example
	 * ```js
	 * import {WindowStr} from 'gnablib/primitive';
	 *
	 * const trim=['\r\n','\r'];
	 * WindowString.new('\r\nhi').trimStart(trim); // hi
	 * WindowString.new('\rhi').trimStart(trim); // hi
	 * WindowString.new('\nhi').trimStart(trim); // \nhi
	 *
	 * const trim2=['\r,'\r\n'];
	 * WindowString.new('\r\nhi').trimStart(trim2); // \nhi
	 * WindowString.new('\rhi').trimStart(trim2); // hi
	 * WindowString.new('\nhi').trimStart(trim2); // \nhi
	 * ```
	 */
	trimStart(chars?: string[], limit = 0): WindowStr {
		if (!chars) chars = WHITESPACE;
		restart: while (this._len > 0) {
			for (const c of chars) {
				if (this._src.startsWith(c, this._start)) {
					this._start += c.length;
					this._len -= c.length;
					if (--limit == 0) break restart;
					//Restart the search at the new start
					continue restart;
				}
			}
			//No match - done here
			break;
		}
		return this;
	}

	[Symbol.iterator](): Iterator<string> {
		let next = this._start;
		const src = this._src;
		const end = this._start + this._len;
		return {
			next: function (): IteratorResult<string> {
				if (next < end) {
					const cp = src.codePointAt(next++);
					//@ts-ignore - We know it's in range
					//If we're more than a single UTF16 codepoint value, eat a second character
					if (cp > 65535) next++;
					return {
						done: false,
						//@ts-ignore - We know it's in range
						value: String.fromCodePoint(cp),
					};
				}
				return {
					done: true,
					value: undefined,
				};
			},
		};
	}

	/**
	 * Build a new window into the content of `$source`.
	 * You may want to call
	 * [source.normalize()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
	 * if this was user input (corrects Unicode variance)
	 * @param source
	 * @param start
	 * @param length
	 * @returns
	 */
	static new(source: string, start?: number, length?: number): WindowStr {
		if (!source) source = '';
		if (!start) start = 0;
		else safe.uint.atMost('start', start, source.length);
		if (length == undefined) length = source.length - start;
		else safe.uint.atMost('length', length, source.length - start);
		// eslint-disable-next-line @typescript-eslint/ban-types
		return new WindowStr(new String(source), start, length);
	}

	/**
	 * Guarantee a resulting window - if `source` already is than *the same object*
	 * will be returned.  If, however, the `source` is a string this is the same
	 * as calling {@link new}
	 * Build a new window into the content of `$source`, if
	 * @param source
	 */
	static coerce(source: WindowOrString): WindowStr {
		if (source instanceof WindowStr) return source;
		return new WindowStr(new String(source), 0, source.length);
	}
}
