import { SizeError } from '../primitive/ErrorExt';
import { Uint64 } from '../primitive/Uint64';
import { size64Bytes, size32Bytes, size16Bytes } from '../primitive/BitExt';
import { Int64 } from '../primitive/Int64';
import { inRangeInclusive } from '../primitive/IntExt';

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
	if (n > sourceBytes.length) throw new SizeError('sourceBytes', sourceBytes.length, n);
	if (targetPos + targetSize > target.length)
		throw new SizeError('target', target.length, targetPos + targetSize);

	for (let rPos = sourcePos; rPos < n; rPos += size64Bytes) {
		target[targetPos++] = new Uint64(
			u32FromBytesUnsafe(sourceBytes, rPos + size32Bytes),
			u32FromBytesUnsafe(sourceBytes, rPos)
		);
	}
}

/**
 * Copy a 64bit number into @param targetBytes
 * @param u64 Number to copy from
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 * @throws {SizeError} if there's not enough space in @param targetBytes
 */
export function u64IntoBytes(u64: Uint64, targetBytes: Uint8Array, targetPos = 0): void {
	if (targetPos + size64Bytes > targetBytes.length)
		throw new SizeError('targetBytes', targetBytes.length, targetPos + size64Bytes);
	targetBytes.set(u64.toBytes(), targetPos);
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
		targetBytes.set(sourceU64s[i].toBytes(), targetPos + i * size64Bytes);
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
		throw new SizeError('targetBytes', targetBytes.length, targetPos + byteCount);
	for (let i = 0; i < sourceU64s.length; i++) {
		targetBytes.set(sourceU64s[i].toBytes(), targetPos + i * size64Bytes);
	}
}

/**
 * Output a 32bit signed number from @param sourceBytes at position @param sourcePos
 * WARN: If there isn't enough source data zeros will be used (you probably want @see i32FromBytes)
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @returns
 */
export function i32FromBytesUnsafe(sourceBytes: Uint8Array, sourcePos = 0): number {
	return (
		(sourceBytes[sourcePos] << 24) |
		(sourceBytes[sourcePos + 1] << 16) |
		(sourceBytes[sourcePos + 2] << 8) |
		sourceBytes[sourcePos + 3]
	);
}

/**
 * Output a 32bit unsigned number from @param sourceBytes at position @param sourcePos
 * WARN: If there isn't enough source data zeros will be used (you probably want @see u32FromBytes)
 * @param sourceBytes Source data
 * @param sourcePos Starting position in @param sourceBytes
 * @returns
 */
export function u32FromBytesUnsafe(sourceBytes: Uint8Array, sourcePos = 0): number {
	return (
		((sourceBytes[sourcePos] << 24) |
			(sourceBytes[sourcePos + 1] << 16) |
			(sourceBytes[sourcePos + 2] << 8) |
			sourceBytes[sourcePos + 3]) >>>
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
		throw new SizeError('sourceBytes', sourceBytes.length, sourcePos + size32Bytes);
	return (
		(sourceBytes[sourcePos] << 24) |
		(sourceBytes[sourcePos + 1] << 16) |
		(sourceBytes[sourcePos + 2] << 8) |
		sourceBytes[sourcePos + 3]
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
		throw new SizeError('sourceBytes', sourceBytes.length, sourcePos + size32Bytes);
	return (
		((sourceBytes[sourcePos] << 24) |
			(sourceBytes[sourcePos + 1] << 16) |
			(sourceBytes[sourcePos + 2] << 8) |
			sourceBytes[sourcePos + 3]) >>>
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
	const n = sourcePos + byteCount;
	if (n > sourceBytes.length) throw new SizeError('sourceBytes', sourceBytes.length, n);
	const ret = new Uint32Array(targetSize);
	let i = 0;
	for (let rPos = sourcePos; rPos < n; ) {
		ret[i++] =
			(sourceBytes[rPos++] << 24) |
			(sourceBytes[rPos++] << 16) |
			(sourceBytes[rPos++] << 8) |
			sourceBytes[rPos++];
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
	if (n > sourceBytes.length) throw new SizeError('sourceBytes', sourceBytes.length, n);
	if (targetPos + targetSize > target.length)
		throw new SizeError('target', target.length, targetPos + targetSize);

	for (let rPos = sourcePos; rPos < n; ) {
		target[targetPos++] =
			(sourceBytes[rPos++] << 24) |
			(sourceBytes[rPos++] << 16) |
			(sourceBytes[rPos++] << 8) |
			sourceBytes[rPos++];
	}
}

/**
 * Convert the last 32 bits of a number into a four byte array
 * @param u32
 * @returns Uint8Array[4]
 */
export function u32ToBytes(u32: number): Uint8Array {
	return new Uint8Array([u32 >> 24, u32 >> 16, u32 >> 8, u32]);
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
export function uintToMinBytes(uint: number | Uint64): Uint8Array {
	let u64: Uint64;
	if (typeof uint === 'number') {
		u64 = Uint64.fromNumber(uint);
	} else {
		u64 = uint as Uint64;
	}
	const ret = new Uint8Array(8);
	const zero = new Uint64(0);
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
export function i32FromMinBytes(sourceBytes: Uint8Array, len = 4, sourcePos = 0): number {
	inRangeInclusive(len, 0, 4);
	const end = sourcePos + len;
	if (end >= sourceBytes.length)
		throw new SizeError('sourceBytes', sourceBytes.length - sourcePos, len);
	let ret = 0;
	for (let i = sourcePos; i < end; i++) {
		ret = (ret << 8) | sourceBytes[i];
	}
	return ret;
}
/**
 * Copy the last 32 bits of a number into @param targetBytes
 * WARN: Doesn't confirm there's enough space in @param targetBytes (use @see u32IntoBytes instead)
 * @param u32 Number to copy in (only 0xFFFFFFFF will be used)
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 */
export function u32IntoBytesUnsafe(u32: number, targetBytes: Uint8Array, targetPos = 0): void {
	targetBytes[targetPos] = u32 >> 24;
	targetBytes[targetPos + 1] = u32 >> 16;
	targetBytes[targetPos + 2] = u32 >> 8;
	targetBytes[targetPos + 3] = u32;
}

/**
 * Copy the last 32 bits of a number into @param targetBytes
 * @param u32 Number to copy in (only 0xFFFFFFFF will be used)
 * @param targetBytes Destination of data starting at @param targetPos
 * @param targetPos Starting position in @param targetBytes
 * @throws {SizeError} if there's not enough space in @param targetBytes
 */
export function u32IntoBytes(u32: number, targetBytes: Uint8Array, targetPos = 0): void {
	if (targetPos + size32Bytes > targetBytes.length)
		throw new SizeError('targetBytes', targetBytes.length, targetPos + size32Bytes);
	targetBytes[targetPos] = u32 >> 24;
	targetBytes[targetPos + 1] = u32 >> 16;
	targetBytes[targetPos + 2] = u32 >> 8;
	targetBytes[targetPos + 3] = u32;
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
		targetBytes[rPos] = u32 >> 24;
		targetBytes[rPos + 1] = u32 >> 16;
		targetBytes[rPos + 2] = u32 >> 8;
		targetBytes[rPos + 3] = u32;
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
		throw new SizeError('targetBytes', targetBytes.length, targetPos + byteCount);
	for (let i = 0; i < sourceU32s.length; i++) {
		const rPos = targetPos + i * size32Bytes;
		const u32 = sourceU32s[i];
		targetBytes[rPos] = u32 >> 24;
		targetBytes[rPos + 1] = u32 >> 16;
		targetBytes[rPos + 2] = u32 >> 8;
		targetBytes[rPos + 3] = u32;
	}
}

/**
 * Get the next two bytes as a word.
 * WARN: Unsafe doesn't confirm you're within bounds of array (@see u16FromBytes recommended)
 * @param sourceBytes
 * @param sourcePos
 * @returns
 */
export function u16FromBytesUnsafe(sourceBytes: Uint8Array, sourcePos = 0): number {
	return (sourceBytes[sourcePos] << 8) | sourceBytes[sourcePos + 1];
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
		throw new SizeError('sourceBytes', sourceBytes.length, sourcePos + size16Bytes);
	return (sourceBytes[sourcePos] << 8) | sourceBytes[sourcePos + 1];
}

/**
 * Convert the 0xFFFF aspect of a number into a two byte array
 * @param u16
 * @returns
 */
export function u16ToBytes(u16: number): Uint8Array {
	return new Uint8Array([u16 >> 8, u16]);
}

//No meaning: (endian is about byte order)
// - u8FromBytes
// - u8ToBytes

export { fp64ToBytes, fp64FromBytes } from '../encoding/ieee754-fp64';
export { fp32ToBytes, fp32FromBytes } from '../encoding/ieee754-fp32';
export { fp16ToBytes, fp16FromBytes } from '../encoding/ieee754-fp16';
