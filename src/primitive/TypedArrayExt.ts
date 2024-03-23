/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { nextPow2 } from '../algo/nextPow2.js';
import { IReadTyped } from './interfaces/IReadTyped.js';
import { UInt } from './number/index.js';
import type { IReadArray } from './interfaces/IReadArray.js';
import type { IReadWriteArray } from './interfaces/IReadWriteArray.js';
import { IWriteTyped } from './interfaces/IWriteTyped.js';
import { IBufferer } from './interfaces/IBufferer.js';
import { IBuildable } from './interfaces/IBuildable.js';
import { NotEnoughSpaceError } from '../error/NotEnoughSpaceError.js';
const consoleDebugSymbol = Symbol.for('nodejs.util.inspect.custom');

// Because the interfaces, functions and SharedType<T> are not exported
// (to prevent... other uses) the following are in one file:
// - ReadonlyTyped, FixedTyped, ScalingTyped are all included here (exported)
// - (Readonly|Fixed|Scaling)Uint(8|16|32)Array
// - (Readonly|Fixed|Scaling)Int(8|16|32)Array
// - (Readonly|Fixed|Scaling)Float(32|64)Array
// - (Readonly|Fixed|Scaling)Uint8ClampedArray

const defaultCap = 4;
const linearSwitch = 1024 * 1024;
const emptyBuffer = new ArrayBuffer(0);

/**
 * When <1MB use powers of 2 to allocate memory, after that use nearest 1MB alignment (that's larger)
 * @param v
 * @returns
 */
function goodSize(v: number): number {
	//After 1M (1<<21) let's linear increase size (vs exponent)
	if (v <= defaultCap) return defaultCap;
	if (v < linearSwitch) {
		return v === 0 ? defaultCap : nextPow2(v);
	} else {
		//Round up to next multiple of linearSwitch to accommodate v
		return (v + linearSwitch) / linearSwitch;
	}
}

/**
 * Use the buffer directly, or get it from the .buffer getter.. or return nothing
 * @param b
 * @returns
 */
function bufferize(
	b: ArrayBufferLike | IBufferer
): ArrayBufferLike | undefined {
	// @ ts-expect-error: es2016 doesn't support SharedArrayBuffer, es2017 does
	if (b instanceof SharedArrayBuffer) {
		// @ ts-expect-error: es2016 doesn't support SharedArrayBuffer, es2017 does
		return b;
	} else if (b instanceof ArrayBuffer) {
		// deepcode ignore DuplicateIfBody: On purpose
		return b;
	}

	if (
		typeof b === 'object' &&
		b !== null &&
		'buffer' in b &&
		b.buffer instanceof ArrayBuffer
	) {
		return b.buffer;
	}
	return undefined;
}

/**
 * Convert a negative start value into an offset back from the end of the array (-1 being the last element)
 * @param start -arrLen - arrLen-1, or 0 if not provided, if start<0 arrLen is added to hopefully make >=0 if not, considered invalid
 * @param arrLen
 * @returns
 */
function startFix(start: number | undefined, arrLen: number): number {
	if (!start) return 0;
	if (start < 0) start += arrLen;
	return start;
}

/**
 * Fill `view` with `value` from `start` for `length` elements
 * NOTE: If you name this fill, snyk (BUG) incorrectly thinks the class-fill calls below refer to themselves
 * @param view
 * @param value Value to put in at each place
 * @param start index to start filling the array at. If start is negative, it is treated as length+start where length is the length of the array.
 * @param start Start index (in elements), inclusive, if <0 considered an offset from the end
 * @param length Number of elements to insert
 * @returns
 */
function viewFill<T extends IWriteTyped<T>>(
	view: T,
	value: number,
	start?: number,
	length?: number
) {
	start = startFix(start, view.length);
	length = length ?? view.length;
	//If start is still negative (invalid), or length is less than/equal zero (invalid),
	// then there's nothing to do. TypedArray.fill doesn't throw, so we won't either
	if (start < 0 || length <= 0) return;
	const end = start + length;
	//JS auto handles end being too large, so no need to fix
	view.fill(value, start, end);
}

/**
 * A whole pile of shared features that can operate on an IReadTyped array
 * Note these features are related to reading the VIEW, not writing or creating (excludes clone/span/readonlySpan)
 */
class SharedTyped<T extends IReadTyped<T>> {
	//
	[index: number]: number;

	constructor(protected _view: T) {}

	/**
	 * The length in bytes of the array.
	 */
	get byteLength(): number {
		return this._view.byteLength;
	}

	/**
	 * The offset in bytes of the array.
	 * NOTE: This is probably only relevant if you care about memory-alignment
	 */
	get byteOffset(): number {
		return this._view.byteOffset;
	}

	/**
	 * The size in bytes of each element in the array.
	 */
	get BYTES_PER_ELEMENT(): number {
		return this._view.BYTES_PER_ELEMENT;
	}

	/**
	 * The length of the array (in elements)
	 */
	get length(): number {
		return this._view.length;
	}

	/**
	 * Get capacity in bytes
	 */
	get capacity(): number {
		return this._view.length;
	}

	/**
	 * Get the item at given index, if negative it's used as the distance
	 * back from the end (-1 will return the last element).
	 * @param idx -length - length-1
	 * @returns Element at position, or undefined if `index` is out of range
	 */
	at(idx: number): number | undefined {
		if (idx < 0) idx += this._view.length;
		if (idx < 0 || idx >= this._view.length) return undefined;
		return this._view[idx];
	}

	/**
	 * Returns a copy of section of an array.
	 * NOTE: This mimics TypedArray.slice (which seems misleading given slices in go, like spans in C# are references to the same data)
	 * @param start — The beginning of the specified portion of the array (0 if undefined)
	 * @param end — The end of the specified portion of the array. This is exclusive of the element at the index 'end'.
	 * @returns
	 */
	clone(start?: number | undefined, end?: number | undefined): T {
		return this._view.slice(start, end);
	}

	/**
	 * Returns an iterator of key, value pairs for every entry in the array
	 * @returns
	 */
	entries(): IterableIterator<[number, number]> {
		return this._view.entries();
	}

	/**
	 * Determines whether all the members of an array are truthy for `predicate`
	 * NOTE: `array` is not available (unlike TypedArray.every) since you can mutate values with this reference
	 * @param predicate A function that accepts up to two arguments. The every method calls the predicate function for each element in the array until the predicate returns a value which is coercible to the Boolean value false, or until the end of the array.
	 * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
	 */
	every(
		predicate: (value: number, index: number) => unknown,
		thisArg?: unknown
	): boolean {
		//We have to wrap the predicate to stop someone ignoring TS2345, or using JS from providing a third
		// argument (array) and gaining access
		const p = predicate.bind(thisArg);
		function wrapped(v: number, i: number): unknown {
			return p(v, i);
		}
		return this._view.every(wrapped);
	}

	/**
	 * Returns a new memory segment with the elements that meet the `predicate`
	 * NOTE: `array` is not available (unlike TypedArray.filter) since you can mutate values with this reference
	 * @param predicate A function that accepts up to two arguments. The filter method calls the predicate function one time for each element in the array.
	 * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
	 * @returns
	 */
	filter(
		predicate: (value: number, index: number) => unknown,
		thisArg?: unknown
	): T {
		const p = predicate.bind(thisArg);
		function wrapped(v: number, i: number): unknown {
			return p(v, i);
		}
		return this._view.filter(wrapped);
	}

	/**
	 * Returns the value of the first element in the array where predicate is true, and undefined otherwise.
	 * NOTE: `obj` is not available (unlike TypedArray.find) since you can mutate values with this reference
	 * @param predicate find calls predicate once for each element of the array, in ascending order, until it finds one where predicate returns true. If such an element is found, find immediately returns that element value. Otherwise, find returns undefined.
	 * @param thisArg If provided, it will be used as the this value for each invocation of predicate. If it is not provided, undefined is used instead.
	 * @returns
	 */
	find(
		predicate: (value: number, index: number) => boolean,
		thisArg?: unknown
	): number | undefined {
		const p = predicate.bind(thisArg);
		function wrapped(v: number, i: number): boolean {
			return p(v, i);
		}
		return this._view.find(wrapped);
	}

	/**
	 * Returns the index of the first element in the array where predicate is true, and -1 otherwise.
	 * Unless you need predicate (which could have external state), @see indexOf might be a better fit
	 * NOTE: `obj` is not available (unlike TypedArray.findIndex) since you can mutate values with this reference
	 * @param predicate find calls predicate once for each element of the array, in ascending order, until it finds one where predicate returns true. If such an element is found, findIndex immediately returns that element index. Otherwise, findIndex returns -1.
	 * @param thisArg If provided, it will be used as the this value for each invocation of predicate. If it is not provided, undefined is used instead.
	 * @returns Index, or -1 (not found)
	 */
	findIndex(
		predicate: (value: number, index: number) => boolean,
		thisArg?: unknown
	): number {
		const p = predicate.bind(thisArg);
		function wrapped(v: number, i: number): boolean {
			return p(v, i);
		}
		return this._view.findIndex(wrapped);
	}
	//findLast / findLastIndex?

	/**
	 * Performs the specified action for each element in an array.
	 * @param action A function that accepts up to two arguments. forEach calls the callbackfn function one time for each element in the array.
	 * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
	 */
	forEach(
		action: (value: number, index: number) => void,
		thisArg?: unknown
	): void {
		const a = action.bind(thisArg);
		function wrapped(v: number, i: number) {
			a(v, i);
		}
		this._view.forEach(wrapped);
	}

	/**
	 * Determines whether an array includes a certain element, returning true or false as appropriate.
	 * @param searchElement — The element to search for.
	 * @param fromIndex — The position in this array at which to begin searching for searchElement.
	 * @returns
	 */
	includes(searchElement: number, fromIndex?: number | undefined): boolean {
		return this._view.includes(searchElement, fromIndex);
	}

	/**
	 * Returns the index of the first occurrence of a value in an array.
	 * @param searchElement — The value to locate in the array.
	 * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
	 * @returns Index, or -1 (not found)
	 */
	indexOf(searchElement: number, fromIndex?: number | undefined): number {
		return this._view.indexOf(searchElement, fromIndex);
	}

	/**
	 * Adds all the elements of an array separated by the specified separator string.
	 * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
	 */
	join(separator?: string): string {
		return this._view.join(separator ?? ',');
	}

	/**
	 * Returns an list of keys in the array
	 * @returns
	 */
	keys(): IterableIterator<number> {
		return this._view.keys();
	}

	/**
	 * Returns the index of the last occurrence of a value in an array.
	 * @param searchElement — The value to locate in the array.
	 * @param fromIndex The array index at which to begin the search (inclusive). If fromIndex is omitted, the search starts at the last element (length-1).  If fromIndex is negative search starts that many places back from the end (-1 is the same as undefined or length)
	 * @returns Index, or -1 (not found)
	 */
	lastIndexOf(searchElement: number, fromIndex?: number): number {
		//Alright so V8 (Chrome, Node) coerce the second argument to a number if there is a second argument
		//https://chromium.googlesource.com/v8/v8/+/refs/heads/main/src/builtins/array-lastindexof.tq
		//AND the number is inclusive, and clamped to max allowed value

		//So:
		// ['a','b','c'].lastIndexOf('c') == 2
		// ['a','b','c'].lastIndexOf('c',0) == -1 //Not found
		// ['a','b','c'].lastIndexOf('c',undefined) == -1 //Likewise not found since undefined->0
		// ['a','b','c'].lastIndexOf('c',3) == 2 //Clamped
		// ['a','b','c'].lastIndexOf('c',30) == 2 //Clamped
		// ['a','b','c'].lastIndexOf('a') == 0
		// ['a','b','c'].lastIndexOf('a',0) == 0 //From index is inclusive
		// ['a','b','c'].lastIndexOf('a',undefined) == 0

		//Why would anyone want to look for lastIndexOf in an array with a constraint of only one element? (when fromIndex=0)
		// Good question.  Since negative ranges are supported, and -1 is the same as length+n (where n=-1..+infinity)
		//Either way it is in TS spec (which has the same flaw):
		//https://tc39.es/ecma262/#sec-array.prototype.lastindexof

		//Testing in Firefox shows similar results
		// CoreJS has the same impl https://github.com/zloirock/core-js/blob/master/packages/core-js/internals/array-last-index-of.js
		return this._view.lastIndexOf(searchElement, fromIndex ?? -1);
	}

	/**
	 * Calls a defined callback function on each element of an array, and returns an array that contains the results.
	 * @param callBack A function that accepts up to two arguments. The map method calls the callbackfn function one time for each element in the array.
	 * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
	 * @returns
	 */
	map(
		callBack: (value: number, index: number) => number,
		thisArg?: unknown
	): T {
		//Should a Readonly<T> yield a T (existing) or another Readonly<T>? - :deep_thought:
		const c = callBack.bind(thisArg);
		function wrapped(v: number, i: number): number {
			return c(v, i);
		}
		return this._view.map(wrapped);
	}

	/**
	 * Returns a readonly accessor to a section of an array (with the same underlying storage)
	 * @param start — The beginning of the specified portion of the array.
	 * @param end — The end of the specified portion of the array. This is exclusive of the element at the index 'end'.
	 * @returns
	 */

	/**
	 * Determines whether the specified callback function returns true for any element of an array.
	 * @param predicate A function that accepts up to three arguments. The some method calls the predicate function for each element in the array until the predicate returns a value which is coercible to the Boolean value true, or until the end of the array.
	 * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
	 * @returns
	 */
	some(
		predicate: (value: number, index: number) => unknown,
		thisArg?: unknown
	): boolean {
		const p = predicate.bind(thisArg);
		function wrapped(v: number, i: number): unknown {
			return p(v, i);
		}
		return this._view.some(wrapped);
	}

	/**
	 * Returns an list of values in the array
	 * @returns
	 */
	values(): IterableIterator<number> {
		return this._view.values();
	}

	/**
	 * Returns a string representation
	 */
	toString(): string {
		//Since tests bind us to tostring==join(',') we might as well bind here
		return this._view.join(',');
		//return this._view.toString();
	}

	/**
	 * Override what's shown by JSON.stringify
	 * @returns
	 */
	toJSON(): unknown {
		return Array.from(this._view.values());
	}

	/**
	 * Override what's shown in Console.log (in node) to only show the internal array
	 * @returns
	 */
	[consoleDebugSymbol](/*depth, options, inspect*/) {
		return this._view;
	}

	/**
	 * A method that returns an iterator. Called by the semantics of the for-of and spread statements.
	 */

	[Symbol.iterator](): IterableIterator<number> {
		return this._view[Symbol.iterator]();
	}
}

export class ReadonlyTyped<T extends IReadTyped<T>>
	extends SharedTyped<T>
	implements IReadArray<T>
{
	/**
	 * To be constructed from either a buffer or a TypedArray, consider this a
	 * *readonly view* into the memory (those other references can still mutate the data under)
	 * NOTE: TypedArray constructor uses `offsetByte`, which must be a multiple of `BYTES_PER_ELEMENT` so we just use
	 *   an element count (`start`)
	 * @param base Uint8Array|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|Uint8ClampedArray
	 * @param data Data source
	 * @param startEl Number of elements into the data source to start viewing (converted into bytes using `base.BYTES_PER_ELEMENT`)
	 * @param lengthEls Length of elements to view (converted into bytes using `base.BYTES_PER_ELEMENT`)
	 * @returns
	 */
	constructor(
		private readonly base: IBuildable<T>,
		data: ArrayBufferLike | IBufferer,
		startEl: number | undefined,
		lengthEls: number | undefined
	) {
		let d: ArrayBuffer | undefined;
		if (data instanceof base) {
			d = data.buffer;
		} else {
			d = bufferize(data);
		}
		if (d === undefined)
			throw new TypeError('Expecting ArrayBufferLike|IBufferer');

		//Start needs to be in bytes
		startEl = (startEl ?? 0) * base.BYTES_PER_ELEMENT;
		//Length needs to be in elements (strange inconsistent design choice)
		lengthEls = lengthEls ?? (d.byteLength - startEl) / base.BYTES_PER_ELEMENT;
		const view = new base(d, startEl, lengthEls);

		super(view);
		return new Proxy(this, {
			get(target, prop) {
				if (prop in target) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return target[prop as any];
				}

				// @ts-expect-error:  if prop is wrong, this still returns undefined, which works fine
				return target.at(prop);
			},
			set(): boolean {
				return false;
			},
		});
	}

	/**
	 * Returns a readonly accessor to a section of an array (with the same underlying storage)
	 * @param start — The beginning of the specified portion of the array (in elements).
	 * @param end — The end of the specified portion of the array. This is exclusive of the element at the index 'end'.
	 * @returns
	 */
	readonlySpan(
		start?: number | undefined,
		end?: number | undefined
	): IReadArray<T> {
		const ret = new ReadonlyTyped<T>(this.base, this._view.buffer, start, end);
		return ret;
	}

	get [Symbol.toStringTag](): string {
		return 'Readonly<' + this._view.constructor.name + '>';
	}
}

export class FixedTyped<T extends IWriteTyped<T>>
	extends SharedTyped<T>
	implements IReadWriteArray<T>
{
	/**
	 * The same as a TypedArray, but adhering to our interfaces (there are slight differences)
	 * Unless you know you need this, use TypedArray
	 * NOTE: TypedArray constructor uses `offsetByte`, which must be a multiple of `BYTES_PER_ELEMENT` so we just use
	 *   an element count (`start`)
	 * @param base Uint8Array|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|Uint8ClampedArray
	 * @param data Data source
	 * @param start Number of elements into the data source to start viewing (converted into bytes using `base.BYTES_PER_ELEMENT`)
	 * @param length Length of elements to view (converted into bytes using `base.BYTES_PER_ELEMENT`)
	 * @returns
	 */
	constructor(
		private readonly base: IBuildable<T>,
		data: ArrayBufferLike | IBufferer,
		start: number | undefined,
		length: number | undefined
	) {
		let d: ArrayBuffer | undefined;
		if (data instanceof base) {
			d = data.buffer;
		} else {
			d = bufferize(data);
		}
		if (d === undefined)
			throw new TypeError('Expecting ArrayBufferLike|IBufferer');

		//Start needs to be in bytes
		start = (start ?? 0) * base.BYTES_PER_ELEMENT;
		//Length needs to be in elements (strange inconsistent design choice)
		length = length ?? (d.byteLength - start) / base.BYTES_PER_ELEMENT;
		const view = new base(d, start, length);

		super(view);
		return new Proxy(this, {
			get(target, prop) {
				if (prop in target) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return target[prop as any];
				}

				// @ts-expect-error:  if prop is wrong, this still returns undefined, which works fine
				return target.at(prop);
			},
			set(target, prop, value): boolean {
				const u = UInt.parseDec((prop as string) ?? '');
				if (u !== undefined) {
					target.setEl(u, value);
					return true;
				}
				return false;
			},
		});
	}

	/**
	 * Set the value at `idx`
	 * NOTE: The value is truncated, so
	 * @param idx
	 * @param value
	 */
	setEl(idx: number, value: number): void {
		this._view[idx] = value;
	}

	/**
	 * Changes all array elements from start for length elements to a static value, returns self
	 * NOTE: The third arg (if provided) is LENGTH (like constructor) not end (strange inconsistency)
	 * @param value — value to fill array section with
	 * @param start index to start filling the array at. If start is negative, it is treated as length+start where length is the length of the array.
	 * @param length Number of elements to fill with value, default end of the array.
	 * @returns
	 */
	fill(
		value: number,
		start?: number | undefined,
		length?: number | undefined
	): IReadWriteArray<T> {
		viewFill(this._view, value, start, length);
		return this;
	}

	/**
	 * Returns a readonly accessor to a section of an array (with the same underlying storage)
	 * @param start — The beginning of the specified portion of the array (in elements).
	 * @param end — The end of the specified portion of the array. This is exclusive of the element at the index 'end'.
	 * @returns
	 */
	readonlySpan(
		start?: number | undefined,
		end?: number | undefined
	): IReadArray<T> {
		//This cannot be defined in Shared because we need access to this.base
		const ret = new ReadonlyTyped<T>(this.base, this._view.buffer, start, end);
		return ret;
	}

	/**
	 * Reverses the elements in an Array (in place)
	 * @returns
	 */
	reverse(): IReadWriteArray<T> {
		this._view.reverse();
		return this;
	}

	/**
	 * Sets a value or an array of values
	 * @param array — A typed or untyped array of values to set.
	 * @param offset — The index in the current array at which the values are to be written.
	 */
	set(array: ArrayLike<number>, offset?: number | undefined): void {
		this._view.set(array, offset);
	}

	/**
	 * Sorts an array (in place).
	 * @param compareFn Function used to determine the order of the elements. It is expected to return a negative value if first argument is less than second argument, zero if they're equal and a positive value otherwise. If omitted, the elements are sorted in ascending order.
	 * @returns
	 */
	sort(
		compareFn?: ((a: number, b: number) => number) | undefined
	): IReadWriteArray<T> {
		this._view.sort(compareFn);
		return this;
	}

	/**
	 * Returns a section of an array (with the same underlying storage - allows mutation)
	 * NOTE: This is the same semantics as TypedArray.subarray, which feels ambiguous with Go:slices
	 * @param start — The beginning of the specified portion of the array.
	 * @param length — Number of elements to be included in the new view.
	 * @returns
	 */
	span(
		start?: number | undefined,
		length?: number | undefined
	): IReadWriteArray<T> {
		return new FixedTyped<T>(this.base, this._view.buffer, start, length);
	}

	get [Symbol.toStringTag](): string {
		return 'Fixed<' + this._view.constructor.name + '>';
	}
}

export class ScalingTyped<T extends IWriteTyped<T>>
	extends SharedTyped<T>
	implements IReadWriteArray<T>
{
	private _data: ArrayBuffer;
	private _sizeLocked = false;

	/**
	 * Build a scaling (auto resizing) TypedArray, if no length is provided an empty array is created, if no capacity
	 * is provided one larger than length will be chosen. If elements extend beyond capacity, new memory will be allocated, the
	 * data copied, and the old array dropped.
	 * @param base Uint8Array|Uint16Array|Uint32Array|Int8Array|Int16Array|Int32Array|Float32Array|Float64Array|Uint8ClampedArray
	 * @param length Length of new array in elements (empty/0 if not provided)
	 * @param capacity Capacity of new array in elements (nearest power of 2 that fits length if not provided).  Unless you know
	 *  a reasonable max capacity (in which case @see FixedTyped<T> might be better), you shouldn't provide this.
	 * @returns
	 */
	constructor(
		private readonly base: IBuildable<T>,
		length: number | undefined,
		capacity: number | undefined
	) {
		length = length ?? 0;
		let data: ArrayBuffer;
		if (length === 0) {
			data = emptyBuffer;
		} else {
			capacity = capacity ?? 0;
			if (capacity > 0) {
				//Make sure there's enough space
				if (capacity < length)
					throw new NotEnoughSpaceError('Capacity', length, capacity);
				//Convert from elements to bytes
				capacity *= base.BYTES_PER_ELEMENT;
			} else {
				//When capacity isn't provided choose a power of 2 that fits length*byteSize elements
				capacity = goodSize(length * base.BYTES_PER_ELEMENT);
			}
			data = new ArrayBuffer(capacity);
		}
		const view = new base(data, 0, length);
		super(view);
		this._data = data;
		return new Proxy(this, {
			get(target, prop) {
				if (prop in target) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					return target[prop as any];
				}

				// @ts-expect-error:  if prop is wrong, this still returns undefined, which works fine
				return target.at(prop);
			},
			set(target, prop, value): boolean {
				if (prop in target) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					target[prop as any] = value;
					return true;
				}
				const u = UInt.parseDec((prop as string) ?? '');
				if (u !== undefined) {
					target.setEl(u, value);
					return true;
				}
				return false;
			},
		});
	}

	/**
	 * Shrink or enlarge the buffer, to `sizeBytes`
	 * WARN: Does MALLOC/DEALLOC/data copy (use sparingly) - calling this unnecessarily will bring demons
	 * @param dataSizeBytes Number of bytes the new buffer should be
	 */
	private _resize(dataSizeBytes: number, viewSizeEls: number) {
		if (this._sizeLocked) throw new Error('This array is locked');
		//No need to check dataSizeBytes<= viewSizeEls * bytes per (this is an internal call)
		if (dataSizeBytes < this._data.byteLength) {
			//Downsize
			this._data = this._data.slice(0, dataSizeBytes); //Slice has the benefit of copying the data
			this._view = new this.base(this._data, 0, viewSizeEls); //Update the view for the new size
		} else {
			//Upsize
			const b = new ArrayBuffer(dataSizeBytes);
			const v = new this.base(b, 0, viewSizeEls); //this._view.length);
			v.set(this._view);
			this._data = b;
			this._view = v;
		}
	}

	/**
	 * Make sure there is at least requiredLen of space (in elements)
	 * @param requiredLen
	 */
	private assertSpace(requiredLen: number) {
		//If the view has space.. we're good
		if (this._view.length > requiredLen) return;
		const requiredBytes = requiredLen * this._view.BYTES_PER_ELEMENT;

		if (this._data.byteLength <= requiredBytes) {
			//If there's not enough capacity, expand
			this._resize(requiredBytes, requiredLen);
		} else {
			//Otherwise, just update the view (which might be undersized, mkay)
			this._view = new this.base(this._data, 0, requiredLen);
		}
	}

	/**
	 * Get capacity in elements (a multiple of bytes)
	 */
	get capacity(): number {
		return this._data.byteLength / this.base.BYTES_PER_ELEMENT;
	}
	/**
	 * Set capacity in elements (a multiple of bytes), if different from current this will reallocate
	 * the memory to an array of the new size (larger or smaller)
	 * NOTE: If smaller this will truncate data to `0..capacity`
	 * NOTE: If larger this will extend array with zero values, but not change the @see length
	 */
	set capacity(elCount: number) {
		const capBytes = elCount * this.base.BYTES_PER_ELEMENT;
		//If we have a capacity match, nothing to do
		if (capBytes === this._data.byteLength) return;
		//Otherwise.. resize
		this._resize(
			capBytes,
			this._view.length < elCount ? this._view.length : elCount
		);
	}

	/**
	 * Changes all array elements from start for length elements to a static value, returns self
	 * NOTE: The third arg (if provided) is LENGTH (like constructor) not end (strange inconsistency)
	 * @param value value to fill array section with
	 * @param start index to start filling the array at. If start is negative, it is treated as an offset back from the end of the array (must be within current array)
	 * @param length Number of elements to fill with value, default end of the array, can be greater than existing array size
	 * @returns
	 */
	fill(
		value: number,
		start?: number | undefined,
		length?: number | undefined
	): IReadWriteArray<T> {
		//Fix start if it's <0
		start = startFix(start, this._view.length);
		//If start isn't valid, do nothing
		if (start < 0 || start >= this._view.length) return this;
		//If length isn't provided, use the rest of the view length
		length = length ?? this._view.length - start;
		const end = start + length;
		//Make sure we have capacity (end could be beyond current view/data size)
		this.assertSpace(end);
		viewFill(this._view, value, start, length);
		return this;
	}

	/**
	 * Returns a readonly accessor to a section of an array (with the same underlying storage)
	 * NOTE: This locks the ScalingArray preventing further resize (if there was a resize this span may point to different memory)
	 * @param start — The beginning of the specified portion of the array (in elements).
	 * @param length — Number of elements to be included in the new view.
	 * @returns
	 */
	readonlySpan(
		start?: number | undefined,
		length?: number | undefined
	): IReadArray<T> {
		this._sizeLocked = true;
		const ret = new ReadonlyTyped<T>(
			this.base,
			this._view.buffer,
			start,
			length
		);
		return ret;
	}

	/**
	 * Reverses the elements in an Array (in place)
	 * @returns
	 */
	reverse(): IReadWriteArray<T> {
		this._view.reverse();
		return this;
	}

	/**
	 * Sets a value or an array of values.  If the underlying buffer is too small, it will scale
	 * @param array — A typed or untyped array of values to set.
	 * @param offset — The index in the current array at which the values are to be written.
	 */
	set(array: ArrayLike<number>, offset?: number | undefined): void {
		offset = offset ?? 0;
		//Should this throw or be silent?
		if (offset < 0) return;
		this.assertSpace(offset + array.length);
		this._view.set(array, offset);
	}

	/**
	 * Set the value at `idx`
	 * NOTE: The value is truncated, so
	 * @param idx
	 * @param value
	 */
	setEl(idx: number, value: number): void {
		this.assertSpace(idx + 1);
		this._view[idx] = value;
	}

	/**
	 * Sorts an array (in place).
	 * @param compareFn Function used to determine the order of the elements. It is expected to return a negative value if first argument is less than second argument, zero if they're equal and a positive value otherwise. If omitted, the elements are sorted in ascending order.
	 * @returns
	 */
	sort(
		compareFn?: ((a: number, b: number) => number) | undefined
	): IReadWriteArray<T> {
		this._view.sort(compareFn);
		return this;
	}

	/**
	 * Returns a section of an array (with the same underlying storage - allows mutation)
	 * NOTE: This locks the capacity preventing further resize (if there was a resize this span may point to different memory)
	 * NOTE: This is the same semantics as TypedArray.subarray, which feels ambiguous with Go:slices
	 * @param start — The beginning of the specified portion of the array.
	 * @param length — Number of elements to be included in the new view.
	 * @returns
	 */
	span(
		start?: number | undefined,
		length?: number | undefined
	): IReadWriteArray<T> {
		this._sizeLocked = true;
		const ret = new FixedTyped<T>(this.base, this._data, start, length);
		return ret;
	}

	get [Symbol.toStringTag](): string {
		return 'Scaling<' + this._view.constructor.name + '>';
	}
}

// -- --
// READONLY

export class ReadonlyUint8Array extends ReadonlyTyped<Uint8Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		startEl: number | undefined = undefined,
		lengthEls: number | undefined = undefined
	) {
		super(Uint8Array, data, startEl, lengthEls);
	}
}

export class ReadonlyUint16Array extends ReadonlyTyped<Uint16Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		length: number | undefined = undefined
	) {
		super(Uint16Array, data, start, length);
	}
}

export class ReadonlyUint32Array extends ReadonlyTyped<Uint32Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Uint32Array, data, start, end);
	}
}

// export class ReadonlyUint64Array extends ReadonlyTyped<BigUint64Array>

export class ReadonlyInt8Array extends ReadonlyTyped<Int8Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Int8Array, data, start, end);
	}
}

export class ReadonlyInt16Array extends ReadonlyTyped<Int16Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Int16Array, data, start, end);
	}
}

export class ReadonlyInt32Array extends ReadonlyTyped<Int32Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Int32Array, data, start, end);
	}
}

// export class ReadonlyUint64Array extends ReadonlyTyped<BigInt64Array>

export class ReadonlyFloat32Array extends ReadonlyTyped<Float32Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Float32Array, data, start, end);
	}
}

export class ReadonlyFloat64Array extends ReadonlyTyped<Float64Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Float64Array, data, start, end);
	}
}

export class ReadonlyUint8ClampedArray extends ReadonlyTyped<Uint8ClampedArray> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Uint8ClampedArray, data, start, end);
	}
}

// -- --
// FIXED

export class FixedUint8Array extends FixedTyped<Uint8Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		length: number | undefined = undefined
	) {
		super(Uint8Array, data, start, length);
	}
}

export class FixedUint16Array extends FixedTyped<Uint16Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		length: number | undefined = undefined
	) {
		super(Uint16Array, data, start, length);
	}
}

export class FixedUint32Array extends FixedTyped<Uint32Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Uint32Array, data, start, end);
	}
}

// export class FixedUint64Array extends FixedTyped<BigUint64Array>

export class FixedInt8Array extends FixedTyped<Int8Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Int8Array, data, start, end);
	}
}

export class FixedInt16Array extends FixedTyped<Int16Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Int16Array, data, start, end);
	}
}

export class FixedInt32Array extends FixedTyped<Int32Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Int32Array, data, start, end);
	}
}

// export class FixedUint64Array extends FixedTyped<BigInt64Array>

export class FixedFloat32Array extends FixedTyped<Float32Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Float32Array, data, start, end);
	}
}

export class FixedFloat64Array extends FixedTyped<Float64Array> {
	constructor(
		data: ArrayBufferLike | IBufferer,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Float64Array, data, start, end);
	}
}

export class FixedUint8ClampedArray extends FixedTyped<Uint8ClampedArray> {
	constructor(
		data: ArrayBuffer | Uint8ClampedArray,
		start: number | undefined = undefined,
		end: number | undefined = undefined
	) {
		super(Uint8ClampedArray, data, start, end);
	}
}

// -- --
// SCALING

export class ScalingUint8Array extends ScalingTyped<Uint8Array> {
	constructor(length?: number, capacity?: number) {
		super(Uint8Array, length, capacity);
	}
}

export class ScalingUint16Array extends ScalingTyped<Uint16Array> {
	constructor(length?: number, capacity?: number) {
		super(Uint16Array, length, capacity);
	}
}

export class ScalingUint32Array extends ScalingTyped<Uint32Array> {
	constructor(length?: number, capacity?: number) {
		super(Uint32Array, length, capacity);
	}
}

// export class ScalingUint64Array extends ScalingTyped<BigUint64Array>

export class ScalingInt8Array extends ScalingTyped<Int8Array> {
	constructor(length?: number, capacity?: number) {
		super(Int8Array, length, capacity);
	}
}

export class ScalingInt16Array extends ScalingTyped<Int16Array> {
	constructor(length?: number, capacity?: number) {
		super(Int16Array, length, capacity);
	}
}

export class ScalingInt32Array extends ScalingTyped<Int32Array> {
	constructor(length?: number, capacity?: number) {
		super(Int32Array, length, capacity);
	}
}

// export class ScalingInt64Array extends ScalingTyped<BigInt64Array>

export class ScalingFloat32Array extends ScalingTyped<Float32Array> {
	constructor(length?: number, capacity?: number) {
		super(Float32Array, length, capacity);
	}
}

export class ScalingFloat64Array extends ScalingTyped<Float64Array> {
	constructor(length?: number, capacity?: number) {
		super(Float64Array, length, capacity);
	}
}

export class ScalingUint8ClampedArray extends ScalingTyped<Uint8ClampedArray> {
	constructor(length?: number, capacity?: number) {
		super(Uint8ClampedArray, length, capacity);
	}
}
