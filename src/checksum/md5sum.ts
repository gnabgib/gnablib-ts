/*! Copyright 2022-2023 the gnablib contributors MPL-1.1 */

import { Md5 } from '../crypto/hash/Md5.js';

/**
 * Same as MD5
 * MD5 already includes a length, this is just a wrapper
 * @param bytes
 * @returns
 */
export function md5Sum(bytes: Uint8Array): Uint8Array {
	const hash=new Md5();
	hash.write(bytes);
	return hash.sum();
}
