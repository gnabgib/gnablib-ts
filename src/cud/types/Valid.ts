/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface Valid<T> {
	valid(input: T | undefined): Error | undefined;
}
