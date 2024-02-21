/*! Copyright 2024 the gnablib contributors MPL-1.1 */
export interface IDurationExactParts {
	/** Days >=0 */
	d?: number;
	/** Hours >=0*/
	h?: number;
	/** Minutes >=0*/
	i?: number;
	/** Seconds >=0*/
	s?: number;
	/** Microseconds >=0*/
	us?: number;
}
export interface IDurationParts extends IDurationExactParts {
	/** Years >=0 */
	y?: number;
	/** Months >=0 */
	m?: number;
}
