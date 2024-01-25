/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IValueMerge<T> {
	(value1: T, value2: T): T;
}