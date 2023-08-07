/*! Copyright 2023 the gnablib contributors MPL-1.1 */

export interface IUriDecodeOpts {
	/**
	 * What to do with invalid characters in the encoded stream
	 * - 'throw' (default) throw an exception
	 * - 'ignore' ignore the character and continue processing
	 * - 'copy' copy the value to the output even though this isn't valid encoding
	 */
	invalid: 'throw' | 'ignore' | 'copy';
	/**
	 * Amount to over-provision the output buffer size by when using invalid=copy
	 * this may be necessary because the input string.length<bytes.length (since the
	 * invalid characters may be >1 byte).  Default=8
	 */
	overProvisionOutput?: number;
}
