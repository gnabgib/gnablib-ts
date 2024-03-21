/*! Copyright 2023 the gnablib contributors MPL-1.1 */

import { Uint64 } from '../primitive/Uint64.js';
import { size64Bytes, size32Bytes } from '../primitive/BitExt.js';
import { Int64 } from '../primitive/Int64.js';
import { somewhatSafe } from '../safe/safe.js';

/**
 * Copy the contents of @param sourceBytes at position @param sourcePos into @param target
 * starting at @param targetPos for @param targetSize elements
 * @param target Copy the content into
 * @param targetPos Starting position to put the data
 * @param targetSize Length of data to copy (*8 in bytes)
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @throws {OutOfRangeError} If source doesn't have enough data
 * @throws {OutOfRangeError} If target doesn't have enough space
 */
export function u64IntoArrFromBytes(
	target: Uint64[],
	targetPos: number,
	targetSize: number,
	sourceBytes: Uint8Array,
	sourcePos = 0
): void {
	const byteCount = targetSize * size64Bytes;
	somewhatSafe.uint.atMost(
		'sourcePos',
		sourcePos,
		sourceBytes.length - byteCount
	);
	somewhatSafe.uint.atMost('targetPos', targetPos, target.length - targetSize);

	const n = sourcePos + byteCount;
	for (let rPos = sourcePos; rPos < n; rPos += size64Bytes) {
		target[targetPos++] = new Uint64(
			u32FromBytesUnsafe(sourceBytes, rPos + size32Bytes),
			u32FromBytesUnsafe(sourceBytes, rPos)
		);
	}
}

/**
 * Copy the content of an Array<Uint64> into @param targetBytes
 * - Only as much space as is available in Target will be copied
 * - Only as much source material as is available will be copied
 * @param sourceU64s Array to copy from
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes to start writing
 */
export function u64ArrIntoBytesSafe(
	sourceU64s: Uint64[],
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	let targetByteCount = targetBytes.length - targetPos;
	let i = 0;
	while (targetByteCount > 8) {
		if (sourceU64s.length <= i) return;
		targetBytes.set(sourceU64s[i].toBytes(), targetPos);
		i++;
		targetPos += size64Bytes;
		targetByteCount -= size64Bytes;
	}
	if (targetByteCount > 0) {
		targetBytes.set(
			sourceU64s[i].toBytes().slice(0, targetByteCount),
			targetPos
		);
	}
}

/**
 * Output a 32bit unsigned number from @param sourceBytes at position @param sourcePos
 * WARN: If there isn't enough source data zeros will be used (you probably want @see u32FromBytes)
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @returns
 */
export function u32FromBytesUnsafe(
	sourceBytes: Uint8Array,
	sourcePos = 0
): number {
	return (
		((sourceBytes[sourcePos] << 24) |
			(sourceBytes[sourcePos + 1] << 16) |
			(sourceBytes[sourcePos + 2] << 8) |
			sourceBytes[sourcePos + 3]) >>>
		0
	);
}

/**
 * Output a 0-32 bit number as a 1-4 byte array
 * 0-255: 1 byte
 * 256-65535: 2 bytes
 * 65536-16777215: 3 bytes
 * 16777216-4294967295: 4 bytes
 * @param uint
 * @returns Uint8Array[1-4]
 */
export function uintToMinBytes(uint: number | Uint64): Uint8Array {
	let u64: Uint64;
	if (typeof uint === 'number') {
		u64 = Uint64.fromNumber(uint);
	} else {
		u64 = uint as Uint64;
	}
	const ret = new Uint8Array(8);
	const zero = Uint64.zero;
	let ptr = 0;
	do {
		ret[ptr++] = u64.lowU32;
		u64 = u64.rShift(8);
	} while (!u64.equals(zero));
	return ret.slice(0, ptr).reverse();

	// let outPtr = 0;
	// do {
	// 	ret[outPtr++] = u32; //magic &0xff because of uint8array
	// 	u32 >>>= 8;
	// } while (u32 !== 0);
	// return ret.slice(0, outPtr).reverse();
}
/**
 * Output a 0-64 bit signed number as a 1-8 byte array
 * @param int
 * @returns UInt8Array[1-8]
 */
export function intToMinBytes(int: number | Int64): Uint8Array {
	let i64: Int64;
	if (typeof int === 'number') {
		i64 = Int64.fromNumber(int);
	} else {
		i64 = int as Int64;
	}
	return i64.toMinBytes();
}

/**
 * Copy the last 32 bits of a number into @param targetBytes
 * @param u32 Number to copy in (only 0xFFFFFFFF will be used)
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 * @throws {OutOfRangeError} if there's not enough space in @param targetBytes
 */
export function u32IntoBytes(
	u32: number,
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	somewhatSafe.uint.atMost(
		'targetBytes',
		targetPos,
		targetBytes.length - size32Bytes
	);
	targetBytes[targetPos] = u32 >> 24;
	targetBytes[targetPos + 1] = u32 >> 16;
	targetBytes[targetPos + 2] = u32 >> 8;
	targetBytes[targetPos + 3] = u32;
}

//No meaning: (endian is about byte order)
// - u8FromBytes
// - u8ToBytes
