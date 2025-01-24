/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IValueMerge<T> {
	(value1: T|undefined, value2: T|undefined): T|undefined;
}