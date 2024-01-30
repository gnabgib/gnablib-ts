/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { superSafe } from '../safe/index.js';

const max32p1 = 4294967296;
const bit8 = 0b10000000;

// IBM s390x is big endian
// https://github.com/multiarch/qemu-user-static
// https://community.ibm.com/community/user/ibmz-and-linuxone/blogs/javier-perez1/2021/01/19/endianness-guidance-for-open-source-projects
// sudo podman run --rm --privileged docker.io/multiarch/qemu-user-static --reset -p yes
// podman run -it docker.io/s390x/ubuntu
// podman run -it docker.io/s390x/node
//  uname -m =s390x

/**
 * Whether the runtime platform is little endian (`true`) or not.
 *
 * Most platforms **are** *little endian*
 */
export const isLE = (() => {
	//Since TypedArrays use system-endianness, putting 1 in a U16 will be:
	// bigEndian: 0x0001
	// littleEndian: 0x0100
	//Mapping a uint8 array over the top, we can check if the first byte is not zero (LE)
	const u8 = new Uint8Array(Uint16Array.of(1).buffer);
	return u8[0] > 0;

	//JS seems to assume platform can only be little or big (by only using boolean endian flags)
	// .. presumably any implementations using middle will accommodate this
})();

const invert = {
	i16(b: Uint8Array, pos = 0, count = 1): void {
		// prettier-ignore
		do {
			const t = b[pos]; b[pos] = b[pos + 1]; b[pos + 1] = t;
			pos += 2;
		} while (--count > 0);
	},
	i32(b: Uint8Array, pos = 0, count = 1): void {
		let t: number;
		// prettier-ignore
		do {
			t = b[pos]; b[pos] = b[pos + 3]; b[pos + 3] = t;
			t = b[pos + 1]; b[pos + 1] = b[pos + 2]; b[pos + 2] = t;
			pos += 4;
		} while (--count > 0);
		//S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
		//       (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);
	},
	i64(b: Uint8Array, pos = 0, count = 1): void {
		let t: number;
		// prettier-ignore
		do {
			t = b[pos]; b[pos] = b[pos + 7]; b[pos + 7] = t; 
			t = b[pos + 1]; b[pos + 1] = b[pos + 6]; b[pos + 6] = t;
			t = b[pos + 2]; b[pos + 2] = b[pos + 5]; b[pos + 5] = t;
			t = b[pos + 3]; b[pos + 3] = b[pos + 4]; b[pos + 4] = t;
			pos += 8;
		} while (--count > 0);
	},
	i128(b: Uint8Array, pos = 0, count = 1): void {
		do {
			b.subarray(pos, pos + 16).reverse();
			pos += 16;
		} while (--count > 0);
	},
	set32(
		target: Uint8Array,
		i32Pos: number,
		b0: number,
		b1: number,
		b2: number,
		b3: number
	): void {
		//Switch i32Pos to bytes
		i32Pos <<= 2;
		target[i32Pos++] = b3;
		target[i32Pos++] = b2;
		target[i32Pos++] = b1;
		target[i32Pos] = b0;
	},
	// set32(
	// 	target: Uint8Array,
	// 	i32Pos: number,
	// 	b0: number,
	// 	b1: number,
	// 	b2: number,
	// 	b3: number
	// ): void {
	// 	//Switch i32Pos to bytes
	// 	i32Pos <<= 2;
	// 	target[i32Pos++] = b3;
	// 	target[i32Pos++] = b2;
	// 	target[i32Pos++] = b1;
	// 	target[i32Pos] = b0;
	// },
};

const leave = {
	// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
	i16(_b: Uint8Array, _pos = 0, _count = 1): void {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
	i32(_b: Uint8Array, _pos = 0, _count = 1): void {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
	i64(_b: Uint8Array, _pos = 0, _count = 1): void {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
	i128(_b: Uint8Array, _pos = 0, _count = 1): void {},
	set32(
		b: Uint8Array,
		i32Pos: number,
		b0: number,
		b1: number,
		b2: number,
		b3: number
	): void {
		//Switch i32Pos to bytes
		i32Pos <<= 2;
		b[i32Pos++] = b0;
		b[i32Pos++] = b1;
		b[i32Pos++] = b2;
		b[i32Pos] = b3;
	},
};

/** n must be <=4294967295, returns updated pos  */
function p32Bytes(n: number, pos: number, u: Uint8Array): number {
	// deepcode ignore BitwiseOperationSignChecked: this is fine we already know the number is positive and U32 max
	while (n > 0) {
		u[pos++] = n;
		n >>>= 8;
	}
	return pos;
}
function n32bytes(n: number, pos: number, u: Uint8Array): number {
	while (n < -1) {
		u[pos++] = n;
		n >>= 8;
	}
	return pos;
}
function uintMinBytes(n: number): Uint8Array {
	superSafe.int.is(n);
	//Since JS supports ints up to 2^52, we'll need 7 bytes max
	const ret = new Uint8Array(7);
	if (n === 0) return ret.subarray(0, 1);
	let pos = 0;
	let low = n;
	if (n >= max32p1) {
		// prettier-ignore
		{
			ret[pos++] = low; low >>>= 8;
			ret[pos++] = low; low >>>= 8;
			ret[pos++] = low; low >>>= 8;
			ret[pos++] = low;
		}
		n = (n / max32p1) | 0;
	}
	pos = p32Bytes(n, pos, ret);
	return ret.subarray(0, pos);
}
function intMinBytes(n: number): Uint8Array {
	superSafe.int.is(n);
	const ret = new Uint8Array(7);
	if (n === 0) return ret.subarray(0, 1);
	let pos = 0;
	let low = n;
	if (n >= max32p1) {
		// prettier-ignore
		{
			ret[pos++] = low; low >>>= 8;
			ret[pos++] = low; low >>>= 8;
			ret[pos++] = low; low >>>= 8;
			ret[pos++] = low;
		}
		n = (n / max32p1) | 0;
		pos = p32Bytes(n, pos, ret);
		//Make sure leading 0
		if ((ret[pos - 1] & bit8) !== 0) ret[pos++] = 0;
	} else if (n > 0) {
		pos = p32Bytes(n, pos, ret);
		//Make sure leading 0
		if ((ret[pos - 1] & bit8) !== 0) ret[pos++] = 0;
	} else if (n < -2147483649) {
		// prettier-ignore
		{
			ret[pos++] = low; low >>>= 8;
			ret[pos++] = low; low >>>= 8;
			ret[pos++] = low; low >>>= 8;
			ret[pos++] = low;
		}
		n = Math.floor(n / max32p1);
		pos = n32bytes(n, pos, ret);
		//Make sure leading 1
		if ((ret[pos - 1] & bit8) !== bit8) ret[pos++] = 0xff;
	} else {
		pos = n32bytes(n, pos, ret);
		//Make sure leading 1
		if ((ret[pos - 1] & bit8) !== bit8) ret[pos++] = 0xff;
	}
	return ret.subarray(0, pos);
}

const leSpec = {
	minBytes: (b: Uint8Array): Uint8Array => {
		let start = 0;
		for (; start < b.length; start++) if (b[start] != 0) break;
		return b.subarray(start);
	},
	uintMinBytes,
	intMinBytes,
};
const beSpec = {
	minBytes: (b: Uint8Array): Uint8Array => {
		let end = b.length - 1;
		for (; end > 0; end--) if (b[end] != 0) break;
		return b.subarray(0, end);
	},
	uintMinBytes: (u: number): Uint8Array => {
		const r = uintMinBytes(u);
		return r.reverse();
	},
	intMinBytes: (u: number): Uint8Array => {
		const r = intMinBytes(u);
		return r.reverse();
	},
};

/**
 * # [Little Endian](https://en.wikipedia.org/wiki/Endianness)
 *
 * In little-endian (LE), the least-significant byte is stored at the smallest address.
 * LE is the dominant ordering for modern processor architectures (x86, most ARM, RISC-V).
 * @namespace
 *
 * @example
 * The number twelve is written `21` in LE, `2*1 + 1*10`
 */
export let asLE: {
	/**
	 * Make sure `$count` 2 byte sequences are in little endian
	 * (will switch if opposite from platform)
	 *
	 * Note: Will work on signed and unsigned integers (int,uint)
	 *
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many to correct
	 */
	i16(b: Uint8Array, pos?: number, count?: number): void;
	/**
	 * Make sure `$count` 4 byte sequences are in little endian
	 * (will switch if opposite from platform)
	 *
	 * Note: Will work on signed and unsigned integers (int,uint)
	 *
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many to correct
	 */
	i32(b: Uint8Array, pos?: number, count?: number): void;
	/**
	 * Make sure `$count` 8 byte sequences are in little endian
	 * (will switch if opposite from platform)
	 *
	 * Note: Will work on signed and unsigned integers (int,uint)
	 *
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many to correct
	 */
	i64(b: Uint8Array, pos?: number, count?: number): void;
	/**
	 * Make sure `$count` 16 byte sequences are in little endian
	 * (will switch if opposite from platform)
	 *
	 * Note: Will work on signed and unsigned integers (int,uint)
	 *
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many to correct
	 */
	i128(b: Uint8Array, pos?: number, count?: number): void;
	/**
	 * Write 4 bytes into the array as a u32/i32 in little endian order
	 *
	 * @param target
	 * @param i32Pos Position in i32 form to write (*4 for bytes)
	 * @param b0 First byte (endian dependent)
	 * @param b1 Second byte (endian dependent)
	 * @param b2 Third byte (endian dependent)
	 * @param b3 Last byte (endian dependent)
	 */
	set32(
		target: Uint8Array,
		i32Pos: number,
		b0: number,
		b1: number,
		b2: number,
		b3: number
	): void;
	/**
	 * Decrease the size of `$b` to the minimum length with the same
	 * meaning.  That is, drop trailing `0x00` and `0xFF` (signed only) bytes
	 *
	 * @param b Data to compress
	 * @returns Subarray (same storage) of `$b` in minimal form
	 */
	minBytes(b: Uint8Array): Uint8Array;
	/**
	 * Present `$n` in as few bytes as possible, no trailing
	 * `0x00` bytes.
	 *
	 * NOTE: `0` generates a one byte result
	 *
	 * @param n Integer [0 - 9007199254740991]
	 * @returns `$n` in minimal form, 1-7 bytes long
	 */
	uintMinBytes(n: number): Uint8Array;
	/**
	 * Present `$n` in as few bytes as possible, as few trailing
	 * `0x00` or `0xFF` bytes as possible.
	 *
	 * NOTE: `0` generates a one byte result
	 *
	 * @param n Integer [-9007199254740991 - 9007199254740991]
	 * @returns `$n` in minimal form, 1-7 bytes long
	 */
	intMinBytes(n: number): Uint8Array;
};

/**
 * # [Big Endian](https://en.wikipedia.org/wiki/Endianness)
 *
 * In big-endian (BE), the most significant byte is stored at the smallest memory address.
 * Big-endian is thus closer to the way the digits of numbers are written left-to-right in
 * English, comparing digits to bytes.
 * @namespace
 *
 * @example
 * The number twelve is written `12` in BE, `1*10 + 2*1`
 */
export let asBE: {
	/**
	 * Make sure `$count` 2 byte sequences are in big endian
	 * (will switch if opposite from platform)
	 *
	 * Note: Will work on signed and unsigned integers (int,uint)
	 *
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many to correct
	 */
	i16(b: Uint8Array, pos?: number, count?: number): void;
	/**
	 * Make sure `$count` 4 byte sequences are in big endian
	 * (will switch if opposite from platform)
	 *
	 * Note: Will work on signed and unsigned integers (int,uint)
	 *
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many to correct
	 */
	i32(b: Uint8Array, pos?: number, count?: number): void;
	/**
	 * Make sure `$count` 8 byte sequences are in big endian
	 * (will switch if opposite from platform)
	 *
	 * Note: Will work on signed and unsigned integers (int,uint)
	 *
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many to correct
	 */
	i64(b: Uint8Array, pos?: number, count?: number): void;
	/**
	 * Make sure `$count` 16 byte sequences are in big endian
	 * (will switch if opposite from platform)
	 *
	 * Note: Will work on signed and unsigned integers (int,uint)
	 *
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many to correct
	 */
	i128(b: Uint8Array, pos?: number, count?: number): void;
	/**
	 * Write 4 bytes into the array as a u32/i32 in big endian order
	 *
	 * @param target
	 * @param i32Pos Position in i32 form to write (*4 for bytes)
	 * @param b0 First byte (endian dependent)
	 * @param b1 Second byte (endian dependent)
	 * @param b2 Third byte (endian dependent)
	 * @param b3 Last byte (endian dependent)
	 */
	set32(
		target: Uint8Array,
		i32Pos: number,
		b0: number,
		b1: number,
		b2: number,
		b3: number
	): void;
	/**
	 * Decrease the size of `$b` to the minimum length with the same
	 * meaning.  That is, drop leading `0x00` and `0xFF` (signed only) bytes
	 *
	 * @param b Data to compress
	 * @returns Subarray (same storage) of `$b` in minimal form
	 */
	minBytes(b: Uint8Array): Uint8Array;
	/**
	 * Present `$n` in as few bytes as possible, no leading
	 * `0x00` bytes.
	 *
	 * NOTE: `0` generates a one byte result
	 *
	 * @param n Integer [0 - 9007199254740991]
	 * @returns `$n` in minimal form, 1-7 bytes long
	 */
	uintMinBytes(n: number): Uint8Array;
	/**
	 * Present `$n` in as few bytes as possible, as few leading
	 * `0x00` or `0xFF` bytes as possible. (Preserving a leading `1`
	 * bit when negative, and `0` bit when positive)
	 *
	 * NOTE: `0` generates a one byte result
	 *
	 * @param n Integer [-9007199254740991 - 9007199254740991]
	 * @returns `$n` in minimal form, 1-7 bytes long
	 */
	intMinBytes(n: number): Uint8Array;
};

if (isLE) {
	asLE = { ...leave, ...leSpec } as const;
	asBE = { ...invert, ...beSpec } as const;
} else {
	asLE = { ...invert, ...leSpec } as const;
	asBE = { ...leave, ...beSpec } as const;
}

// /** If platform is LE, this does nothing.  Otherwise bytes are switched from BE order */
// export const asLE: IEndian = { ...(isLE ? leave : invert), ...leSpec } as const;
// /** If platform is BE, this does nothing.  Otherwise bytes are switched from LE order */
// export const asBE = isLE ? invert : leave;
export function asE(isBE: boolean) {
	return isBE ? asBE : asLE;
}
