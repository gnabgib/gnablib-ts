/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */
/**
 * # Codec
 * 
 * ## Base32
 * 
 * - {@link codec.base32 base32}
 * - {@link codec.base32hex base32hex}
 * - {@link codec.crockford32 crockford32}
 * - {@link codec.zBase32 zBase32}
 * 
 * ## Base64
 * 
 * - {@link codec.base64 base64}
 * - {@link codec.base64url base64url}
 * - {@link codec.b64 b64}
 * - {@link codec.sBase64 sBase64}
 * 
 * @module
 */
export type { IAscii85EncodeOpts } from './interfaces/IAscii85EncodeOpts.js';
export type { IQuotedPrintableEncodeOpts } from './interfaces/IQuotedPrintableEncodeOpts.js';
export type { IUriDecodeOpts } from './interfaces/IUriDecodeOpts.js';
export type { IUucodeEncodeOpts } from './interfaces/IUucodeEncodeOpts.js';
export type { IUucodeFile } from './interfaces/IUucodeFile.js';
export type { IYEncEncodeOpts } from './interfaces/IYEncEncodeOpts.js';
export type { IYEncDecodeOpts } from './interfaces/IYEncDecodeOpts.js';

export { ascii85 } from './Ascii85.js';
export { base32, zBase32, base32hex, crockford32 } from './Base32.js';
export { base64, base64url, b64 } from './Base64.js';
export * as sBase64 from './sBase64.js';
export { bfloat16 } from './bfloat16.js';
export {
	fromDense2,
	toDense2Unsafe,
	toDense2,
	fromDense3Unsafe,
	fromDense3,
	toDense3Unsafe,
	toDense3,
	push2DigitsToBytes,
	push3DigitsToBytes,
	type bcd
} from './DenselyPackedDecimal.js';
export { hex } from './Hex.js';
export { fpb16, fpb32, fpb64 } from './ieee754-fpb.js';
export * as proquint from './proquint.js';
export { quotedPrintable } from './QuotedPrintable.js';
export { shift as rot13 } from './Rot13.js';
export { shift as rot13_5 } from './Rot13_5.js';
export { shift as rot47 } from './Rot47.js';
/**
 * [Scream Cipher](https://xkcd.com/3054/)
 *
 * XKCD only defines uppercase letter encoding, we extend that to assume lower-case encoding matches.
 * Any letter (character code) not a-zA-Z will be left alone, which allows space and exclamation mark
 * to pass through (as in the cartoon) but also could cause ambiguity if input includes a-diacritic
 * values that are used in encoding (during encoding they will be left alone, however decoding will
 * convert back to base character)
 *
 * - There is some support for whole-character values (vs a+diacritic values) in decoding
 * - Some of the diacritics are value calls (eg. is z `a+Combining Short Solidus Overlay` or 
 * `a+Combining Long Solidus Overlay` - we went with long)
 */
export * as scream from './Scream.js'
export { uri } from './Uri.js';
export { utf8 } from './Utf8.js';
export { uucode } from './Uucode.js';
export { yEnc } from './YEnc.js';
