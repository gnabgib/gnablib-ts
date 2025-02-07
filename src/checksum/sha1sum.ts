/*! Copyright 2022-2025 the gnablib contributors MPL-1.1 */

import { Sha1 } from '../crypto/hash/Sha1.js';
import { IHashsum } from './interfaces/IChecksum.js';

/**
 * Sha1Sum generates a 160bit checksum of a stream of data.
 * The Sha1 hash is described in
 * [RFC-3174](https://datatracker.ietf.org/doc/html/rfc3174)
 * and formerly considered cryptographically secure, but no longer is.
 * 
 * @example
 * ```js
 * import { Sha1Sum } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new Sha1Sum();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0xC12252CEDA8BE8994D5FA0290A47231C1D16AAE3
 * ```
 */
export class Sha1Sum extends Sha1 implements IHashsum {
}