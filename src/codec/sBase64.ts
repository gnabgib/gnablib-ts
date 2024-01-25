/*! Copyright 2024 the gnablib contributors MPL-1.1 */
/**
 * # Shift Base 64
 * 
 * - An idea that surely exists (but can't find an existing definition).
 * - Using ASCII which which only supports up to 7 bits (128 values), the
 *  best we can do with bit based encoding is 64.. because we have to
 *  drop a few values from ASCII (control characters, and ideally; whitespace).
 * - {@link codec.base64 Base64} and {@link codec.b64 B64}  both use disparate 
 *  sections of the ASCII table, while this uses a sequential block of characters 
 *  from `?` - `~` (`0x3F` - `0x7E`).  This allows encode/decode to use JUST 
 *  arithmetic (instead of lookup tables).
 * - Identifiable by lack of numeric digits.
 * - Included symbols: ``?@[\]^_`{|}~``
 *
 * ## Benefits
 * 
 * - Can contain binary data in a text medium.
 * - You can include arbitrary whitespace (space, horizontal/vertical tab,
 *   newline, carriage return) in the data.
 * - Encoding is an arithmetic operation only (fast).
 * - Excludes common delimiters: `,:;/&.`
 * - Excludes XML symbols: `<>/&;`
 * - Excludes mathematical symbols: `+-/*=<>` (but not `^`)
 * - Can be embedded in a JSON string (no use of `'"`)
 * - Can be embedded in an XML property (no use of `&<>"`)
 *
 * ## Disadvantages
 * 
 * - A new format, that looks like existing (could lead to confusion)
 * - Not human readable (nor are {@link codec.base64 base64}, {@link codec.base64url base64url}, {@link codec.b64 b64})
 * - Not designed with reading/listening in mind (includes `O/o` `I/i/L/l` and two bracket types)
 * - Includes common escape characters: ``\`?`` (but not `"$&'`)
 * - Includes regex symbols: `?[]^{|}`
 * - Includes email symbol: `@` (but not `.`)
 *
 * ## Suitable
 * 
 * - Encoding binary data in a text stream (eg web-content, web-url, mail-content)
 * - Anywhere you might consider {@link codec.base64 base64}
 *
 * @packageDocumentation
 */

import { ContentError } from '../primitive/error/ContentError.js';

const last6Bits = 0b111111;
const first2Bits = 0b11000000;
const last2Bits = 0b11;
const sh = 63;

/**
 * Convert an array of bytes into shift-base64 text.  Similar to 
 * {@link codec.base64 base64}
 * 
 * Text will be composed of the characters:
 * ``?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~``
 * 
 * @param src Bytes to encode
 * @returns Encoded string - at most `Ceil(src.length*4/3)` in length
 * 
 * @example
 * ```js
 * import { sBase64, hex } from 'gnablib/codec';
 * 
 * sBase64.fromBytes(hex.toBytes('DEADBEEF')); // viu}zo
 * ```
 */
export function fromBytes(src: Uint8Array): string {
	let i = 2;
	let out = 0;
	//First write values to a byte array
	const ret = new Uint8Array(Math.ceil((src.length * 4) / 3));
	for (; i < src.length; i += 3) {
		//  [aaaaaabb][bbbbcccc][ccdddddd]
		ret[out++] = sh + (src[i - 2] >> 2);
		ret[out++] = sh + (((src[i - 2] & last2Bits) << 4) | (src[i - 1] >> 4));
		ret[out++] = sh + (((src[i - 1] << 2) | (src[i] >> 6)) & last6Bits);
		ret[out++] = sh + (src[i] & last6Bits);
	}
	//Undo the last shift, and move to "next"
	i -= 2;
	switch (src.length - i) {
		case 0:
			//Multiple of 3 bytes
			break;
		case 1:
			ret[out++] = sh + (src[i] >> 2);
			ret[out++] = sh + ((src[i] & last2Bits) << 4);
			break;
		case 2:
			ret[out++] = sh + (src[i] >> 2);
			ret[out++] = sh + (((src[i] & last2Bits) << 4) | (src[i + 1] >> 4));
			ret[out++] = sh + ((src[i + 1] << 2) & last6Bits);
	}
	//Now convert bytes to text
	const td = new TextDecoder();
	return td.decode(ret.subarray(0, out));
}

/**
 * Decode shift-base64 data into bytes
 * 
 * @param src Shift-base64 encoded data
 * @returns Decoded bytes
 *
 * @throws {@link primitive.error.ContentError ContentError} 
 * Bad source character
 * @throws {@link primitive.error.ContentError ContentError} 
 * Spurious character found (length must be `4x + (0|2|3)`)
 * 
 * @example
 * ```js
 * import { sBase64, utf8 } from 'gnablib/codec';
 * 
 * utf8.fromBytes(sBase64.toBytes('QETkZE{`')); // Hello!
 * ```
 */
export function toBytes(src: string): Uint8Array {
	//We expect the source to be 1 byte/char, although it could be 2-3
	// that is exceptional and so it's ok if we the decode fails
	const bytes = new Uint8Array(src.length);
	const te = new TextEncoder();
	//Note encode into stops early if it runs out of space, so this decreases
	// memory risk if src includes non-ascii chars
	te.encodeInto(src, bytes);

	function decode(u: Uint8Array, p: number): number {
		u[p] -= sh;
		//Validate character
		if ((u[p] & first2Bits) != 0)
			throw new ContentError('char', 'source', src.charAt(p));
		return u[p];
	}

	let i = 3;
	let out = 0;
	const ret = new Uint8Array(Math.ceil((bytes.length * 3) / 4));
	for (; i < bytes.length; i += 4) {
		decode(bytes, i - 3);
		decode(bytes, i - 2);
		decode(bytes, i - 1);
		decode(bytes, i);

		// [aaaaaa][aabbbb][bbbbcc][cccccc]
		ret[out++] = (bytes[i - 3] << 2) | (bytes[i - 2] >> 4);
		ret[out++] = (bytes[i - 2] << 4) | (bytes[i - 1] >> 2);
		ret[out++] = (bytes[i - 1] << 6) | bytes[i];
	}
	//Undo last shift, and move to the "next"
	i -= 3;
	switch (bytes.length - i) {
		case 0:
			//A multiple of 4 chars
			break;
		case 1:
			throw new ContentError('one extra character found', src.charAt(i + 1));
		case 2:
			decode(bytes, i);
			decode(bytes, i + 1);
			ret[out++] = (bytes[i] << 2) | (bytes[i + 1] >> 4);
			break;
		case 3:
			decode(bytes, i);
			decode(bytes, i + 1);
			decode(bytes, i + 2);
			ret[out++] = (bytes[i] << 2) | (bytes[i + 1] >> 4);
			ret[out++] = (bytes[i + 1] << 4) | (bytes[i + 2] >> 2);
			break;
		//Cannot be 4 (above for loop would have consumed)
	}
	return ret.subarray(0, out);
}

/**
 * Decode shift-base64 encoded data into bytes, rather than testing
 * each character, it's masked so it can only be one of `2^6` (64)
 * values.  Meaning dodgy input (including non-ASCII) will still be
 * converted without exceptions. (unpredictable results)
 *
 * @param src Shift-base64 encoded data
 * @returns decoded bytes
 * @throws {@link primitive.error.ContentError ContentError} 
 * Spurious character found (length must be `4x + (0|2|3)`)
 * 
 * @example Normal/safe decode
 * ```js
 * import { sBase64, utf8 } from 'gnablib/codec';
 * 
 * utf8.fromBytes(sBase64.toBytesFast('QETkZE{`')); // Hello!
 * ```
 * 
 * @example Wonky decode (not recommended)
 * ```js
 * import { sBase64, hex } from 'gnablib/codec';
 * 
 * //Both `€`, `1` invalid
 * hex.fromBytes(sBase64.toBytesFast('€1')); // 04
 * //€=0xE282AC in utf8
 * //This doesn't fit into 2 bytes allocated
 * //Therefore no data is added to the buffer (=0x0000)
 * //Once shifted and encoded, this results in 0x04 with a carry of 0b0001
 * ```
 * 
 * @example Wonky decode (not recommended)
 * ```js
 * import { sBase64, hex } from 'gnablib/codec';
 * 
 * //All chars invalid
 * hex.fromBytes(sBase64.toBytesFast('€10')); // 8C3B
 * 
 * //€=0xE282AC in utf8
 * //This does fit into the allocated buffer (ignoring 2nd/3rd chars)
 * //Once shifted and encoded, this results in 0x8C3B, with a carry of 0b01
 * 
 * //NOTE: Any 2 chars after € will yield the same, since they're ignored
 * ```
 */
export function toBytesFast(src: string): Uint8Array {
	const bytes = new Uint8Array(src.length);
	const te = new TextEncoder();
	te.encodeInto(src, bytes);

	let i = 3;
	let out = 0;
	const ret = new Uint8Array(Math.ceil((bytes.length * 3) / 4));
	for (; i < bytes.length; i += 4) {
		bytes[i - 3] = (bytes[i - 3] - sh) & last6Bits;
		bytes[i - 2] = (bytes[i - 2] - sh) & last6Bits;
		bytes[i - 1] = (bytes[i - 1] - sh) & last6Bits;
		bytes[i] = (bytes[i] - sh) & last6Bits;

		// [aaaaaa][aabbbb][bbbbcc][cccccc]
		ret[out++] = (bytes[i - 3] << 2) | (bytes[i - 2] >> 4);
		ret[out++] = (bytes[i - 2] << 4) | (bytes[i - 1] >> 2);
		ret[out++] = (bytes[i - 1] << 6) | bytes[i];
	}
	//Undo last shift, and move to the "next" character
	i -= 3;
	switch (bytes.length - i) {
		case 0:
			//A multiple of 4 chars
			break;
		case 1:
			throw new ContentError('one extra character found', src.charAt(i + 1));
		case 2:
			bytes[i] = (bytes[i] - sh) & last6Bits;
			bytes[i + 1] = (bytes[i + 1] - sh) & last6Bits;
			ret[out++] = (bytes[i] << 2) | (bytes[i + 1] >> 4);
			break;
		case 3:
			bytes[i] = (bytes[i] - sh) & last6Bits;
			bytes[i + 1] = (bytes[i + 1] - sh) & last6Bits;
			bytes[i + 2] = (bytes[i + 2] - sh) & last6Bits;
			ret[out++] = (bytes[i] << 2) | (bytes[i + 1] >> 4);
			ret[out++] = (bytes[i + 1] << 4) | (bytes[i + 2] >> 2);
			break;
		//Cannot be 4 (above for loop would have consumed)
	}
	return ret.subarray(0, out);
}
