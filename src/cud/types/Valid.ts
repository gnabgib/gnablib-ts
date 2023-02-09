/*! Copyright 2023 gnabgib MPL-2.0 */

export interface Valid<T> {
	valid(input: T | undefined): Error | undefined;
}
