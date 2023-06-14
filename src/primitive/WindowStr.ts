/*! Copyright 2023 gnabgib MPL-2.0 */

import { safety } from './Safety.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');
const NOT_FOUND = -1;
// type splitter= {
//     [Symbol.split](string: string, limit?: number | undefined): string[];
// }

// eslint-disable-next-line @typescript-eslint/ban-types
export type WindowStrish = WindowStr | string | String;

export class WindowStr {
	//Strings are immutable in JS
	//We want this to be the object type (for peerOf, otherwise we'd get content comparison)
	// eslint-disable-next-line @typescript-eslint/ban-types
	private readonly _src: String;
	private readonly _start: number;
	private readonly _length: number;

	/**
	 * Build from source
	 * You'll almost always want to `source.normalize()` if this is user-input
	 * @throws EnforceTypeError start/end not an integer (if provided)
	 * @throws OutOfRangeError idx invalid value
	 * @param source
	 * @param start Integer 0 < source.length (default 0)
	 * @param end Integer 0 < (source.length-start) (default source.length-start)
	 */
	constructor(source: string | WindowStr, start = 0, length?: number) {
		safety.intInRangeInc(start, 0, source.length, 'start');
		if (length === undefined) {
			length = source.length - start;
		} else {
			safety.intInRangeInc(length, 0, source.length - start, 'length');
		}
		if (source instanceof WindowStr) {
			this._src = source._src;
			this._start = source._start + start;
		} else {
			this._src = new String(source);
			this._start = start;
		}
		this._length = length;
	}

	/**
	 * Length/size of the window (in characters)
	 */
	get length(): number {
		return this._length;
	}

	private get _end(): number {
		return this._start + this._length;
	}

	/**
	 * Whether the window is empty
	 */
	get empty(): boolean {
		return this._length === 0;
	}

	/**
	 * Return the character at the specific index
	 * @throws EnforceTypeError idx not an integer
	 * @throws OutOfRangeError idx invalid value
	 * @param idx Integer -length < (length-1), if negative used as offset from end
	 * @returns character (UTF16)|''
	 */
	charAt(idx: number): string {
		if (idx < 0) idx += this._length;
		safety.intInRangeIncExc(idx, 0, this._length, 'idx');
		return this._src.charAt(idx + this._start);
	}

	/**
	 * Return the unicode value of the character at the specific index
	 * @throws EnforceTypeError idx not an integer
	 * @throws OutOfRangeError idx invalid value
	 * @param idx Integer 0 < (length-1)
	 * @returns Integer 0-65535|NaN
	 */
	charCodeAt(idx: number): number {
		safety.intInRangeIncExc(idx, 0, this._length, 'idx');
		return this._src.charCodeAt(idx + this._start);
	}

	// /**
	//  * Return the unicode code point unicode value of the character at the specific index
	//  * @throws EnforceTypeError idx not an integer
	//  * @throws OutOfRangeError idx invalid value
	//  * @param idx Integer 0 < (length-1)
	//  * @returns Integer 0-4294967295
	//  */
	// codePointAt(idx: number): number | undefined {
	// 	inRangeInclusive(idx, 0, this._length - 1, 'idx');
	// 	return this._src.codePointAt(idx + this._start);
	// }

	/**
	 * Whether the window ends with the given string (exactly)
	 * @param searchString
	 * @returns
	 */
	endsWith(searchString: string): boolean {
		return this._src.endsWith(searchString, this._end);
	}

	/**
	 * Search for the first occurrence of the given string
	 * @throws EnforceTypeError start not an integer
	 * @throws OutOfRangeError start invalid value
	 * @param searchString
	 * @param start Integer, starting point to search from, 0 < length (default=0/whole window)
	 * @returns
	 */
	indexOf(searchString: string, start?: number): number {
		if (start === undefined) start = 0;
		safety.intInRangeInc(start, 0, this._length, 'start');
		let pos = this._src.indexOf(searchString, this._start + start);
		//Not found - return
		if (pos < 0) return NOT_FOUND;
		//Correct scope
		pos -= this._start;
		//Filter out positions out of scope
		return pos <= this._length - searchString.length ? pos : NOT_FOUND;
	}

	/**
	 *
	 * @param searchString
	 * @param length Integer, 0 < length - length of window to search in (default=length/whole window)
	 */
	lastIndexOf(searchString: string, length?: number): number {
		if (length === undefined) {
			length = this._length;
		} else {
			safety.intInRangeInc(length, 0, this._length, 'length');
		}
		const lastIndexPos = this._start + length - searchString.length;
		//Because JS treats <=0 as 0 in lastIndexPos we need to catch negative
		if (lastIndexPos < 0) return NOT_FOUND;
		let pos = this._src.lastIndexOf(searchString, lastIndexPos);
		//Not found - return
		if (pos < 0) return pos;
		//Correct scope
		pos -= this._start;
		//Filter out positions out of scope
		return pos < 0 ? NOT_FOUND : pos;
	}

	/**
	 * Return a window using the first `length` characters,
	 * @throws EnforceTypeError length not an integer
	 * @throws OutOfRangeError length invalid value
	 * @param length Integer >=0, <=@see this.length
	 * @returns
	 */
	left(length: number): WindowStr {
		safety.intInRangeInc(length, 0, this._length, 'length');
		return new WindowStr(this, 0, length);
	}

	/**
	 * Whether another WindowStr is a window to the same source
	 * @param other
	 */
	peerOf(other: WindowStr): boolean {
		return this._src === other._src;
	}

	/**
	 * Return a window using the last `length` characters,
	 * @throws EnforceTypeError length not an integer
	 * @throws OutOfRangeError length invalid value
	 * @param length Integer >=0, <=@see this.length
	 * @returns
	 */
	right(length: number): WindowStr {
		safety.intInRangeInc(length, 0, this._length, 'length');
		return new WindowStr(this, this._length - length);
	}

	/**
	 * Breaks a way at `separator` into sub windows
	 * NOTE: Doesn't support zero length separator (unlike string.split)
	 * @param separator String to divide by, length>0
	 * @param limit Limit on the number of sub windows to create, left overs will be excluded (default: undefined/no limit)
	 * @returns
	 */
	split(separator: string, limit?: number): WindowStr[] {
		//Not sure we can support Symbol.split (splitter in TS)
		const ret: WindowStr[] = [];
		if (limit === 0 || separator.length === 0) return ret;
		let start = 0;
		let first = this.indexOf(separator);
		while (first >= 0) {
			ret.push(this.sub(start, first - start));
			//See if we've got to the limit
			if (limit && ret.length === limit) return ret;
			start = first + separator.length;
			first = this.indexOf(separator, start);
		}
		ret.push(this.sub(start));
		return ret;
	}

	/**
	 * Whether the window starts with the given string (exactly)
	 * @param searchString
	 * @returns
	 */
	startsWith(searchString: string): boolean {
		return this._src.startsWith(searchString, this._start);
	}

	/**
	 * Compare whether the rendering of this is the same as other
	 * @param other
	 */
	stringEqual(other: string | WindowStr): boolean {
		if (other instanceof WindowStr) {
			return this.toString() === other.toString();
		} else {
			return this.toString() === other;
		}
	}

	/**
	 * Extract a section of the WindowStr as a new WindowStr
	 * @param start Integer -length - length, if negative taken as an offset back from the end
	 * @param length Integer 0 - (length-start) (default length-start)
	 * @returns
	 */
	sub(start: number, length?: number): WindowStr {
		//If start is low, add length (-1 will give you the last char)
		if (start < 0) start += this._length;
		return new WindowStr(this, start, length);
	}

	/**
	 * Extract a copy of the string contained within the present window
	 * @returns
	 */
	toString(): string {
		return this._src.substring(this._start, this._end);
	}

	//Used in string casts
	[Symbol.toPrimitive](): string {
		return `WindowStr(${this.toString()})`;
	}

	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this[Symbol.toPrimitive]();
	}

	/**
	 * Coerce a string or String into a WindowStr if it isn't already
	 * @param value
	 * @returns
	 */
	static coerce(value: WindowStrish): WindowStr {
		if (value instanceof WindowStr) {
			return value;
		}
		if (value instanceof String) {
			return new WindowStr(value.valueOf());
		} else {
			return new WindowStr(value);
		}
	}
}
