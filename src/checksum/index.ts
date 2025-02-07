/*! Copyright 2025 the gnablib contributors MPL-1.1 */
/**
 * ## Checksum
 * 
 * A checksum; can be used to prevent/identify accidental changes.
 * 
 * Name|Sum size bits
 * -|-
 * {@link Adler32}|32
 * {@link Bcc |BCC}|8
 * {@link Cksum |cksum}|32
 * {@link Crc24 |CRC24}|24
 * {@link Crc32 |CRC32}|32
 * {@link Fletcher16}|16
 * {@link Fletcher32}|32
 * {@link Fletcher64}|64
 * {@link Lrc |Longitudinal Redundancy Check}|8
 * 
 * The [Luhn](https://en.wikipedia.org/wiki/Luhn_algorithm) algorithm is also support, which only works on
 * {@link luhnInt |integers}/{@link luhnStr |numerical digits} (eg. credit cards, SI numbers)
 * 
 * ## Hashsum
 * 
 * A hash; maps some data to another, often used for hash tables, or to speed up comparison. We use the term
 * hashsum to distinguish from cryptographic-hashes (although *MD5* and *SHA1* were once cryptographically safe)
 * 
 * Name|Sum size bits|Optional parameters
 * -|-|-
 * {@link Lookup2}|32|seed
 * {@link Lookup3}|32+32/64|seed
 * {@link Md5Sum |MD5Sum}|128|
 * {@link Murmur3_32 |Murmur3}|32|seed
 * {@link Sha1Sum |SHA1Sum}|160|
 * {@link Spooky |Spooky v2}|128|seed
 * {@link XxHash32 |xxHash32}|32|seed
 * {@link XxHash64 |xxHash64}|64|seed
 * 
 * @module 
 */
export { Adler32 } from './adler.js';
export { Bcc } from './bcc.js';
export { Cksum } from './cksum.js';
export { Crc24 } from './crc24.js';
export { Crc32 } from './crc32.js';
export { Fletcher16, Fletcher32 } from './fletcher.js';
export { Fletcher64 } from './Fletcher64.js';
export { Lrc } from './lrc.js';

export { luhnStr, luhnInt } from './luhn.js';

export { Lookup2 } from './Lookup2.js';
export { Lookup3 } from './Lookup3.js';
export { Md5Sum } from './md5sum.js';
export { Murmur3_32 } from './Murmur3.js';
export { Sha1Sum } from './sha1sum.js';
export { SpookyShort, SpookyLong, Spooky } from './Spooky.js';
export { XxHash32 } from './XxHash32.js';
export { XxHash64 } from './XxHash64.js';
