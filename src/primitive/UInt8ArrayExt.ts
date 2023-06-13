/*! Copyright 2023 gnabgib MPL-2.0 */

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
 * @param len How many bytes to include
 */
export function toSizedBytes(input: Uint8Array, start = 0, len?:number): Uint8Array {
	if (len===undefined) len=input.length-start;
	if (len > 255) throw new SizeError('len', len, 0, 255);
	const ret=new Uint8Array(len+1);
	ret[0]=len;
	ret.set(input.subarray(start,start+len),1);
	return ret;
}

/**
 * Compare byte array contents in constant time
 * **NOTE** will immediately exit/false if array lengths don't match
 * @param a 
 * @param b 
 * @returns 
 */
export function ctEq(a:Uint8Array,b:Uint8Array):boolean {
	if (a.length!=b.length) return false;
	let zero=0;
	for(let i=0;i<a.length;i++)
		zero|=a[i]^b[i];
	return zero===0;
}

/**
 * Constant time select `a` if `first==true` or `b` if `first==false`
 * @param a 
 * @param b 
 * @param first 
 * @throws If arrays are different things
 * @returns A clone of a or b
 */
export function ctSelect(a:Uint8Array,b:Uint8Array,first:boolean):Uint8Array {
	if (a.length!=b.length) throw new Error('Inputs are of different length');
	// @ts-expect-error: We're casting bool->number on purpose
	const fNum = (first | 0) - 1; //-1 or 0
	const ret=new Uint8Array(a.length);
	for(let i=0;i<a.length;i++) {
		ret[i]=((~fNum)&a[i]) | (fNum&b[i]);
	}
	return ret;
}