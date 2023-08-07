/*! Copyright 2023 the gnablib contributors MPL-1.1 */

/**
 * Used to harvest the buffer from TypedArray implementations
 * You can fool this by adhering to this interface (providing a .buffer getter)
 * NAME: Uses go paradigm of feature +er
 */
export interface IBufferer {
	get buffer(): ArrayBuffer;
}
