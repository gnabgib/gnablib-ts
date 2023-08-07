/**
 * The least we need out of a TypedArray for reading (mostly taken from MDN)
 */

import { IBufferer } from "./IBufferer.js";

export interface IReadTyped<T> extends IBufferer {
	[index: number]: number;
	get BYTES_PER_ELEMENT(): number;
	get byteLength(): number;
	get byteOffset(): number;
	get length(): number;
	slice(start?: number | undefined, end?: number | undefined): T;
	entries(): IterableIterator<[number, number]>;
	every(
		predicate: (value: number, index: number, array: T) => unknown,
		thisArg?: unknown
	): boolean;
	filter(
		predicate: (value: number, index: number, array: T) => unknown,
		thisArg?: unknown
	): T;
	find(
		predicate: (value: number, index: number, obj: T) => boolean,
		thisArg?: unknown
	): number | undefined;
	findIndex(
		predicate: (value: number, index: number, obj: T) => boolean,
		thisArg?: unknown
	): number;
	forEach(
		action: (value: number, index: number, array: T) => void,
		thisArg?: unknown
	): void;
	includes(searchElement: number, fromIndex?: number | undefined): boolean;
	indexOf(searchElement: number, fromIndex?: number | undefined): number;
	join(separator: string): string;
	keys(): IterableIterator<number>;
	lastIndexOf(searchElement: number, fromIndex?: number | undefined): number;
	map(
		callbackfn: (value: number, index: number, array: T) => number,
		thisArg?: unknown
	): T;
	some(
		predicate: (value: number, index: number, array: T) => unknown,
		thisArg?: unknown
	): boolean;
	values(): IterableIterator<number>;
	[Symbol.iterator](): IterableIterator<number>;
}
