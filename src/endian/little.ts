/*! Copyright 2023 gnabgib MPL-2.0 */

import { SizeError } from '../primitive/ErrorExt.js';
import { Uint64 } from '../primitive/Uint64.js';
import * as fp64 from '../encoding/ieee754-fp64.js';
import * as fp32 from '../encoding/ieee754-fp32.js';
import * as fp16 from '../encoding/ieee754-fp16.js';
import { size64Bytes, size32Bytes, size16Bytes } from '../primitive/BitExt.js';

/**
 * Output a 64 bit unsigned number from @param sourceBytes at position @param sourcePos
 * Requires 8 bytes
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @throws {SizeError} if there's not enough data in @param sourceBytes
 * @returns
 */
export function u64FromBytes(sourceBytes: Uint8Array, sourcePos = 0): Uint64 {
	if (sourcePos + size64Bytes > sourceBytes.length)
		throw new SizeError(
			'sourceBytes',
			sourceBytes.length,
			sourcePos + size64Bytes
		);
	//We can use unsafe because we've already tested length
	return new Uint64(
		u32FromBytesUnsafe(sourceBytes, sourcePos),
		u32FromBytesUnsafe(sourceBytes, sourcePos + size32Bytes)
	);
}

/**
 * Copy the contents of @param sourceBytes at position @param sourcePos into @param target
 * starting at @param targetPos for @param targetSize elements
 * @param target Copy the content into
 * @param targetPos Starting position to put the data
 * @param targetSize Length of data to copy (*8 in bytes)
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @throws {SizeError} If source doesn't have enough data
 * @throws {SizeError} If target doesn't have enough space
 */
export function u64IntoArrFromBytes(
	target: Uint64[],
	targetPos: number,
	targetSize: number,
	sourceBytes: Uint8Array,
	sourcePos = 0
): void {
	const byteCount = targetSize * size64Bytes;
	const n = sourcePos + byteCount;
	if (n > sourceBytes.length)
		throw new SizeError('sourceBytes', sourceBytes.length, n);
	if (targetPos + targetSize > target.length)
		throw new SizeError('target', target.length, targetPos + targetSize);

	for (let rPos = sourcePos; rPos < n; rPos += size64Bytes) {
		target[targetPos++] = new Uint64(
			u32FromBytesUnsafe(sourceBytes, rPos),
			u32FromBytesUnsafe(sourceBytes, rPos + size32Bytes)
		);
	}
}

/**
 * Convert a 64bit number into an eight byte array
 * @param u64
 * @returns
 */
export function u64ToBytes(u64: Uint64): Uint8Array {
	return u64.toBytes().reverse();
}

/**
 * Copy a 64bit number into @param targetBytes
 * WARN: Doesn't confirm there's enough space in @param targetBytes (use @see u64IntoBytes instead)
 * @param u64 Number to copy from
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 */
export function u64IntoBytesUnsafe(
	u64: Uint64,
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	targetBytes.set(u64.toBytes().reverse(), targetPos);
}

/**
 * Copy a 64bit number into @param targetBytes
 * @param u64 Number to copy from
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 * @throws {SizeError} if there's not enough space in @param targetBytes
 */
export function u64IntoBytes(
	u64: Uint64,
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	if (targetPos + size64Bytes > targetBytes.length)
		throw new SizeError(
			'targetBytes',
			targetBytes.length,
			targetPos + size64Bytes
		);
	targetBytes.set(u64.toBytes().reverse(), targetPos);
}

/**
 * Copy the content of an Array<Uint64> into @param targetBytes
 * WARN: Doesn't confirm there's enough space in @param targetBytes (use @see u64arrIntoBytes instead)
 * @param sourceU64s Array to copy from (all will be copied)
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 */
export function u64ArrIntoBytesUnsafe(
	sourceU64s: Uint64[],
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	for (let i = 0; i < sourceU64s.length; i++) {
		const u64 = sourceU64s[i];
		const rPos = targetPos + i * size64Bytes;
		targetBytes.set(u64.toBytes().reverse(), rPos);
	}
}

/**
 * Copy the content of an Array<Uint64> into @param targetBytes
 * @param sourceU64s Array to copy from (all will be copied)
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 * @throws {SizeError} if there's not enough space in @param targetBytes
 */
export function u64ArrIntoBytes(
	sourceU64s: Uint64[],
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	const byteCount = sourceU64s.length * size64Bytes;
	if (targetPos + byteCount > targetBytes.length)
		throw new SizeError(
			'targetBytes',
			targetBytes.length,
			targetPos + byteCount
		);
	for (let i = 0; i < sourceU64s.length; i++) {
		const u64 = sourceU64s[i];
		const rPos = targetPos + i * size64Bytes;
		targetBytes.set(u64.toBytes().reverse(), rPos);
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
	let targetByteCount=targetBytes.length-targetPos;
	let i=0;
	while (targetByteCount>8) {
		if (sourceU64s.length<=i) return;
		targetBytes.set(sourceU64s[i].toBytes().reverse(),targetPos);
		i++;
		targetPos+=size64Bytes;
		targetByteCount-=size64Bytes;
	}
	if (targetByteCount>0) {
		targetBytes.set(sourceU64s[i].toBytes().reverse().slice(0,targetByteCount),targetPos);
	}
}

/**
 * Output a 32bit signed number from @param sourceBytes at position @param sourcePos
 * WARN: If there isn't enough source data zeros will be used (you probably want @see i32FromBytes)
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @returns
 */
export function i32FromBytesUnsafe(
	sourceBytes: Uint8Array,
	sourcePos = 0
): number {
	return (
		sourceBytes[sourcePos] |
		(sourceBytes[sourcePos + 1] << 8) |
		(sourceBytes[sourcePos + 2] << 16) |
		(sourceBytes[sourcePos + 3] << 24)
	);
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
		(sourceBytes[sourcePos] |
			(sourceBytes[sourcePos + 1] << 8) |
			(sourceBytes[sourcePos + 2] << 16) |
			(sourceBytes[sourcePos + 3] << 24)) >>>
		0
	);
}

/**
 * Output a 32bit signed number from @param sourceBytes at position @param sourcePos
 * Requires 4 bytes
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @throws {SizeError} if there's not enough data in @param sourceBytes
 * @returns
 */
export function i32FromBytes(sourceBytes: Uint8Array, sourcePos = 0): number {
	if (sourcePos + size32Bytes > sourceBytes.length)
		throw new SizeError(
			'sourceBytes',
			sourceBytes.length,
			sourcePos + size32Bytes
		);
	return (
		sourceBytes[sourcePos] |
		(sourceBytes[sourcePos + 1] << 8) |
		(sourceBytes[sourcePos + 2] << 16) |
		(sourceBytes[sourcePos + 3] << 24)
	);
}

/**
 * Output a 32bit unsigned number from @param sourceBytes at position @param sourcePos
 * Requires 4 bytes
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @throws {SizeError} if there's not enough data in @param sourceBytes
 * @returns
 */
export function u32FromBytes(sourceBytes: Uint8Array, sourcePos = 0): number {
	if (sourcePos + size32Bytes > sourceBytes.length)
		throw new SizeError(
			'sourceBytes',
			sourceBytes.length,
			sourcePos + size32Bytes
		);
	return (
		(sourceBytes[sourcePos] |
			(sourceBytes[sourcePos + 1] << 8) |
			(sourceBytes[sourcePos + 2] << 16) |
			(sourceBytes[sourcePos + 3] << 24)) >>>
		0
	);
}

/**
 * Convert the contents of @param sourceBytes starting at @param sourcePos for @param targetSize*4 bytes
 * @param targetSize How many u32s to copy out
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @throws {SizeError} if there isn't enough data in @param sourceBytes
 * @returns Uint32Array[@param targetSize]
 */
export function u32ArrFromBytes(
	targetSize: number,
	sourceBytes: Uint8Array,
	sourcePos = 0
): Uint32Array {
	const byteCount = targetSize * size32Bytes;
	if (sourcePos + byteCount > sourceBytes.length)
		throw new SizeError(
			'sourceBytes',
			sourceBytes.length,
			sourcePos + byteCount
		);
	const ret = new Uint32Array(targetSize);
	for (let i = 0; i < targetSize; i++) {
		const rPos = sourcePos + i * size32Bytes;
		ret[i] =
			sourceBytes[rPos] |
			(sourceBytes[rPos + 1] << 8) |
			(sourceBytes[rPos + 2] << 16) |
			(sourceBytes[rPos + 3] << 24);
	}
	return ret;
}

/**
 * Copy the contents of @param sourceBytes at position @param sourcePos into @param target
 * starting at @param targetPos for @param targetSize elements
 * @param target Copy the content into
 * @param targetPos Starting position to put the data
 * @param targetSize Length of data to copy (*4 in bytes)
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @throws {SizeError} If source doesn't have enough data
 * @throws {SizeError} If target doesn't have enough space
 */
export function u32IntoArrFromBytes(
	target: Uint32Array,
	targetPos: number,
	targetSize: number,
	sourceBytes: Uint8Array,
	sourcePos = 0
): void {
	const byteCount = targetSize * size32Bytes;
	const n = sourcePos + byteCount;
	if (n > sourceBytes.length)
		throw new SizeError('sourceBytes', sourceBytes.length, n);
	if (targetPos + targetSize > target.length)
		throw new SizeError('target', target.length, targetPos + targetSize);

	for (let rPos = sourcePos; rPos < n; ) {
		target[targetPos++] =
			sourceBytes[rPos++] |
			(sourceBytes[rPos++] << 8) |
			(sourceBytes[rPos++] << 16) |
			(sourceBytes[rPos++] << 24);
	}
}

/**
 * Convert the 0xFFFFFFFF aspect of a number into a four byte array
 * @param u32
 * @returns
 */
export function u32ToBytes(u32: number): Uint8Array {
	return new Uint8Array([u32, u32 >> 8, u32 >> 16, u32 >> 24]);
}

/**
 * Output a 0-32 bit number as a 1-4 byte array
 * 0-255: 1 byte
 * 256-65535: 2 bytes
 * 65536-16777215: 3 bytes
 * 16777216-4294967295: 4 bytes
 * @param u32
 * @returns Uint8Array[1-4]
 */
export function uintToMinBytes(u32: number): Uint8Array {
	const ret = new Uint8Array(4);
	let outPtr = 0;
	do {
		ret[outPtr++] = u32; // & 0xff; //magic &0xff because of uint8array
		u32 >>>= 8;
	} while (u32 !== 0);
	return ret.slice(0, outPtr);
}

/**
 * Copy the last 32 bits of a number into @param targetBytes
 * WARN: Doesn't confirm there's enough space in @param targetBytes (use @see u32IntoBytes instead)
 * @param u32 Number to copy in (only 0xFFFFFFFF will be used)
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 */
export function u32IntoBytesUnsafe(
	u32: number,
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	targetBytes[targetPos] = u32;
	targetBytes[targetPos + 1] = u32 >> 8;
	targetBytes[targetPos + 2] = u32 >> 16;
	targetBytes[targetPos + 3] = u32 >> 24;
}

/**
 * Copy the last 32 bits of a number into @param targetBytes
 * @param u32 Number to copy in (only 0xFFFFFFFF will be used)
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 * @throws {SizeError} if there's not enough space in @param targetBytes
 */
export function u32IntoBytes(
	u32: number,
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	if (targetPos + size32Bytes > targetBytes.length)
		throw new SizeError(
			'targetBytes',
			targetBytes.length,
			targetPos + size32Bytes
		);
	targetBytes[targetPos] = u32;
	targetBytes[targetPos + 1] = u32 >> 8;
	targetBytes[targetPos + 2] = u32 >> 16;
	targetBytes[targetPos + 3] = u32 >> 24;
}

/**
 * Copy the content of an Uint32Array into @param targetBytes
 * WARN: Doesn't confirm there's enough space in @param targetBytes (use @see u32arrIntoBytes instead)
 * @param sourceU32s Array to copy from (all will be copied)
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 */
export function u32ArrIntoBytesUnsafe(
	sourceU32s: Uint32Array,
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	for (let i = 0; i < sourceU32s.length; i++) {
		const rPos = targetPos + i * size32Bytes;
		const u32 = sourceU32s[i];
		targetBytes[rPos] = u32;
		targetBytes[rPos + 1] = u32 >> 8;
		targetBytes[rPos + 2] = u32 >> 16;
		targetBytes[rPos + 3] = u32 >> 24;
	}
}

/**
 * Copy the content of an Uint32Array into @param targetBytes
 * @param sourceU32s Array to copy from (all will be copied)
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 * @throws {SizeError} if there's not enough space in @param targetBytes
 */
export function u32ArrIntoBytes(
	sourceU32s: Uint32Array,
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	const byteCount = sourceU32s.length * size32Bytes;
	if (targetPos + byteCount > targetBytes.length)
		throw new SizeError(
			'targetBytes',
			targetBytes.length,
			targetPos + byteCount
		);
	for (let i = 0; i < sourceU32s.length; i++) {
		const rPos = targetPos + i * size32Bytes;
		const u32 = sourceU32s[i];
		targetBytes[rPos] = u32;
		targetBytes[rPos + 1] = u32 >> 8;
		targetBytes[rPos + 2] = u32 >> 16;
		targetBytes[rPos + 3] = u32 >> 24;
	}
}

/**
 * Copy the content of an Uint32Array into @param targetBytes
 * - Only as much space as is available in Target will be copied
 * - Only as much source material as is available will be copied
 * @param sourceU64s Array to copy from
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes to start writing
 */
export function u32ArrIntoBytesSafe(
	sourceU32s: Uint32Array,
	targetBytes: Uint8Array,
	targetPos = 0
): void {
	let targetByteCount=targetBytes.length-targetPos;
	let i=0;
	while (targetByteCount>size32Bytes) {
		if (sourceU32s.length<=i) return;
		targetBytes.set(u32ToBytes(sourceU32s[i]),targetPos);
		i++;
		targetPos+=size32Bytes;
		targetByteCount-=size32Bytes;
	}
	if (targetByteCount>0) {
		targetBytes.set(u32ToBytes(sourceU32s[i]).slice(0,targetByteCount),targetPos);
	}
}

/**
 * Get the next two bytes as a word.
 * WARN: Unsafe doesn't confirm you're within bounds of array (@see u16FromBytes recommended)
 * @param sourceBytes
 * @param sourcePos
 * @returns
 */
export function u16FromBytesUnsafe(
	sourceBytes: Uint8Array,
	sourcePos = 0
): number {
	return sourceBytes[sourcePos] | (sourceBytes[sourcePos + 1] << 8);
}

/**
 * Convert the next two bytes into an unsigned 16 bit int
 * @param sourceBytes
 * @param sourcePos
 * @throws {SizeError} If there's not enough @param sourceBytes
 * @returns Uint16 0x0000-0xffff
 */
export function u16FromBytes(sourceBytes: Uint8Array, sourcePos = 0): number {
	if (sourcePos + size16Bytes > sourceBytes.length)
		throw new SizeError(
			'sourceBytes',
			sourceBytes.length,
			sourcePos + size16Bytes
		);
	return sourceBytes[sourcePos] | (sourceBytes[sourcePos + 1] << 8);
}

/**
 * Convert the 0xFFFF aspect of a number into a two byte array
 * @param u16
 * @returns
 */
export function u16ToBytes(u16: number): Uint8Array {
	return new Uint8Array([u16, u16 >> 8]);
}

//No meaning: (endian is about byte order)
// - u8FromBytes
// - u8ToBytes

/**
 * Encode a floating point number to 64 bit precision IEEE754
 * @param float64
 * @returns
 */
export function fp64ToBytes(float64: number): Uint8Array {
	return fp64.fp64ToBytes(float64).reverse();
}

/**
 * Decode 64 bits IEEE754 to a floating point number
 * @param bytes
 * @param pos
 * @returns
 */
export function fp64FromBytes(bytes: Uint8Array, pos = 0): number {
	if (pos + 8 > bytes.length)
		throw new SizeError('bytes', bytes.length, pos + 8);
	return fp64.fp64FromBytesUnsafe(bytes.slice(pos, 8).reverse(), 0);
}

/**
 * Encode a floating point number to 32 bit precision IEEE754
 * @param float32
 * @returns
 */
export function fp32ToBytes(float32: number): Uint8Array {
	return fp32.fp32ToBytes(float32).reverse();
}

/**
 * Decode 32 bits IEEE754 to a floating point number
 * @param bytes
 * @param pos
 * @returns
 */
export function fp32FromBytes(bytes: Uint8Array, pos = 0): number {
	if (pos + 4 > bytes.length)
		throw new SizeError('bytes', bytes.length, pos + 4);
	return fp32.fp32FromBytesUnsafe(bytes.slice(pos, 4).reverse(), 0);
}

/**
 * Encode a floating point number to 16 bit precision IEEE754
 * @param float16
 * @returns
 */
export function fp16ToBytes(float16: number): Uint8Array {
	return fp16.fp16ToBytes(float16).reverse();
}

/**
 * Decode 16 bits IEEE754 to a floating point number
 * @param bytes
 * @param pos
 * @throws SizeError If there aren't enough bytes defined
 * @returns
 */
export function fp16FromBytes(bytes: Uint8Array, pos = 0): number {
	if (pos + 2 > bytes.length)
		throw new SizeError('bytes', bytes.length, pos + 2);
	return fp16.fp16FromBytesUnsafe(bytes.slice(pos, 2).reverse(), 0);
}
