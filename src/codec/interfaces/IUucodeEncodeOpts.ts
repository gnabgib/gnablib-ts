/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IUucodeEncodeOpts {
	/**
	 * Whether to use backtick(`, ord=96) [DEFAULT] or space( ,ord=32) for zero character
	 * - UU spec says space, but most tools use backtick
	 */
	cSpaceZero?: boolean;
}
