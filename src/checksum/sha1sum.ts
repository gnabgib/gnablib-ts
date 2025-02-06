/*! Copyright 2022-2025 the gnablib contributors MPL-1.1 */

import { Sha1 } from '../crypto/hash/Sha1.js';
import { IChecksum } from './interfaces/IChecksum.js';

/**
 * Sha1Sum generates a 160bit checksum of a stream of data.
 * The Sha1 hash is described in
 * [RFC-3174](https://datatracker.ietf.org/doc/html/rfc3174)
 * and formerly considered cryptographically secure, but no longer is
 */
export class Sha1Sum extends Sha1 implements IChecksum {
}