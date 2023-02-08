import { NotEnoughSpaceError, OutOfRangeError, SizeError } from './ErrorExt.js';
import * as intExt from './IntExt.js';

export function pushInt(
	value: number,
	bitSize: number,
	bytes: Uint8Array,
	currentBitPos: number
): number {
	const finalPos = currentBitPos + bitSize;
	const arrayBitLen = bytes.length << 3;
	if (bitSize < 0) throw new OutOfRangeError('Value size', bitSize, 0);
	if (bitSize < 1) return currentBitPos;
	if (finalPos > arrayBitLen)
		throw new NotEnoughSpaceError('bytes', currentBitPos + bitSize, arrayBitLen);

	const startBitPos = currentBitPos & 7;
	const bytePos = currentBitPos >> 3;

	const bitSizeOffset = bitSize & 7;
	//const lastBytePos = (currentBitPos + bitSize - 1) >> 3;

	//0 [________][________] s<<1      [sssssss_][________]
	//1 [x_______][________] s<<0      [xsssssss][________]
	//2 [xx______][________] s>>1      [xxssssss][s_______]
	//3 [xxx_____][________] s>>2,s<<6 [xxxsssss][ss______]
	//4 [xxxx____][________] s>>3,s<<5 [xxxxssss][sss_____]
	//5 [xxxxx___][________] s>>4,s<<4 [xxxxxsss][ssss____]
	//6 [xxxxxx__][________] s>>5,s<<3 [xxxxxxss][sssss___]
	//7 [xxxxxxx_][________] s>>6,s<<2 [xxxxxxxs][ssssss__]

	bytes[bytePos] =
		(bytes[bytePos] << (8 - startBitPos)) | (value << (8 - bitSizeOffset - startBitPos));

	// let i=bytePos;
	// while(i<=lastBytePos) {
	//     byte
	// }
	return finalPos;
}

/**
 * Encode arbitrary binary data as a set of bytes, the first byte indicating how
 * many bytes follow.
 * @param input A series of bytes 0-256 in length
 * @param start Where in the input stream to start (default: begining)
 * @param end Where in the input stream to end (default: end)
 */
export function toSizedBytes(input: Uint8Array, start = 0, end = 0): Uint8Array {
	intExt.inRangeInclusive(start, 0, input.length - 1);
	intExt.inRangeInclusive(end, 0, input.length - start);
	if (end === 0) end = input.length;
	const len = end - start;
	if (len > 255) throw new SizeError('input length', len, start, end);
	return new Uint8Array([len, ...input.slice(start, len)]);
}
