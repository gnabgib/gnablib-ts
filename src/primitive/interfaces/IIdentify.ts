/*! Copyright 2024 the gnablib contributors MPL-1.1 */

/**
 * Identify whether something can be categorized.
 * NOTE: Multiple implementations could identify the same item as a value (eg unsigned-int, int, number)
 */
export interface IIdentify {
	/**
	 * Whether given parameter is valid
	 * @param test 
	 */
	is(test:unknown): boolean;
}

