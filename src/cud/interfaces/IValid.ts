/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IValid<T> {
	valid(input: T | undefined): Error | undefined;
}
