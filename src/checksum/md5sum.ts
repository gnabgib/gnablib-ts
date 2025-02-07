/*! Copyright 2022-2025 the gnablib contributors MPL-1.1 */

import { Md5 } from '../crypto/hash/Md5.js';
import { IHashsum } from './interfaces/IChecksum.js';

/**
 * Md5Sum generates a 128bit checksum of a stream of data.
 * The MD5 hash is described in
 * [RFC-1321](https://datatracker.ietf.org/doc/html/rfc1321)
 * and formerly considered cryptographically secure, but no longer is.
 * 
 * @example
 * ```js
 * import { Md5Sum } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Md5Sum();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0xF96B697D7CB7938D525A2F31AAF161D0
 * ```
 */
export class Md5Sum extends Md5 implements IHashsum {
}