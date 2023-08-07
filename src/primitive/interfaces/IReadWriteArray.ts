/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { IReadArray } from './IReadArray.js';

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
}
