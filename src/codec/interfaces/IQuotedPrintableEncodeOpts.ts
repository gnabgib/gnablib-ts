/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IQuotedPrintableEncodeOpts {
	/**
	 * 3-998 (Default=76)
	 * Length of each encoded line, RFC2045 requires this be 76 or less,
	 * RFC6532 allows it to be 998 or less
	 */
	lineLength: number;
}
