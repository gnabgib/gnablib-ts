/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IAscii85EncodeOpts {
	/**
	 * 1-MAXINT (Default=78)
	 * Length of each encoded line
	 */
	lineLength?: number;
	/**
	 * Default=false
	 * Whether output should be padded (btoa style) or not (Adobe style)
	 */
	pad?: boolean;
}
