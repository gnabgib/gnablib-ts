/*! Copyright 2023 gnabgib MPL-2.0 */

export interface IReadArray<A> {
	[index: number]: number;

	get byteLength(): number;

	get byteOffset(): number;

	get BYTES_PER_ELEMENT(): number;

	get length(): number;

	get capacity(): number;

	at(idx: number): number | undefined;

	clone(start?: number | undefined, end?: number | undefined): A;

	entries(): IterableIterator<[number, number]>;

	every(
		predicate: (value: number, index: number) => unknown,
		thisArg?: unknown
	): boolean;

	filter(predicate: (value: number, index: number) => unknown, thisArg?: unknown): A;

	find(
		predicate: (value: number, index: number) => boolean,
		thisArg?: unknown
	): number | undefined;

	findIndex(
		predicate: (value: number, index: number) => boolean,
		thisArg?: unknown
	): number;

	forEach(action: (value: number, index: number) => void, thisArg?: unknown): void;

	includes(searchElement: number, fromIndex?: number | undefined): boolean;

	indexOf(searchElement: number, fromIndex?: number | undefined): number;

	join(separator?: string): string;

	keys(): IterableIterator<number>;

	lastIndexOf(searchElement: number, fromIndex?: number | undefined): number;

	map(callbackfn: (value: number, index: number) => number, thisArg?: unknown): A;

	readonlySpan(
		start?: number | undefined,
		end?: number | undefined
	): IReadArray<A>;

	some(
		predicate: (value: number, index: number) => unknown,
		thisArg?: unknown
	): boolean;

	values(): IterableIterator<number>;

	toString(): string;

	[Symbol.iterator](): IterableIterator<number>;

	get [Symbol.toStringTag](): string;

	// map<U>(callbackfn: (value: string, index: number, array: string[]) => U, thisArg?: any): U[];
	// slice(start?: number | undefined, end?: number | undefined): IReadArray<T>;
}

export interface IReadWriteArray<T> extends IReadArray<T> {
	setEl(idx: number, value: number): void;

	fill(
		value: number,
		start?: number | undefined,
		length?: number | undefined
	): IReadWriteArray<T>;

	reverse(): IReadWriteArray<T>;

	set(array: ArrayLike<number>, offset?: number | undefined): void;

	sort(
		compareFn?: ((a: number, b: number) => number) | undefined
	): IReadWriteArray<T>;

	span(
		start?: number | undefined,
		length?: number | undefined
	): IReadWriteArray<T>;

	// Subarray actually creates a go-slice, a C#-span.. same backing store. Ambiguous. Instead use @see span
	// subarray(begin?: number | undefined, end?: number | undefined): IReadWriteArray<T>;
}
