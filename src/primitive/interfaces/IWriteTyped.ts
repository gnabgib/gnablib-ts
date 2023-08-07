import { IReadTyped } from './IReadTyped.js';

/**
 * The least we need out of a TypedArray for reading+writing (mostly taken from MDN)
 */

export interface IWriteTyped<T> extends IReadTyped<T> {
	fill(value: number, start?: number | undefined, end?: number | undefined): T;
	reverse(): T;
	set(array: ArrayLike<number>, offset?: number | undefined): void;
	sort(compareFn?: ((a: number, b: number) => number) | undefined): T;
}
