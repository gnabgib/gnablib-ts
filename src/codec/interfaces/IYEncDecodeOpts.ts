/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IYEncDecodeOpts {
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
