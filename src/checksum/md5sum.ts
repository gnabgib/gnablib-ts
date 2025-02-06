/*! Copyright 2022-2025 the gnablib contributors MPL-1.1 */

import { Md5 } from '../crypto/hash/Md5.js';
import { IChecksum } from './interfaces/IChecksum.js';

/**
 * Md5Sum generates a 128bit checksum of a stream of data.
 * The MD5 hash is described in
 * [RFC-1321](https://datatracker.ietf.org/doc/html/rfc1321)
 * and formerly considered cryptographically secure, but no longer is
 */
export class Md5Sum extends Md5 implements IChecksum {
}