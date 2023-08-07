/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IYEncEncodeOpts {
	/**
	 * (Default=128)
	 * Length of each encoded line, the spec suggests 128 or 256 as defaults
	 * however if transporting over email 76 is suggested
	 */
	lineLength?: number;
	/**
	 * (Default=42)
	 * Byte-shift offset
	 */
	offset?: number;
	/**
	 * (Default `=`)
	 * Escape character (will also be escaped)
	 */
	escapeChar?: string;
}
