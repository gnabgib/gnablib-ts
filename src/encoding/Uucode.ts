import { ContentError, VariedRangeError } from '../primitive/ErrorExt.js';
/**
 * Support: (Uint8Array)
 * Chrome, Android webview, ChromeM >=38
 * Edge >=12
 * Firefox, FirefoxM >=4
 * IE: 10
 * Opera: 11.6
 * OperaM: 12
 * Safari: >=5.1
 * SafariM: 4.2
 * Samsung: >=1.0
 * Node: >=1.0
 * Deno: >=0.10
 */

export const tbl = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`';
const final_line = '`';
const last6Bits = 0x3f; // 00111111
const notSeventhBit = 0xbf; //1011 1111

/**
 * Options for Base64 encoding
 */
export interface EncodeOpts {
	/**
	 * Whether to use backtick(`, ord=96) [DEFAULT] or space( ,ord=32) for zero character
	 * - UU spec says space, but most tools use backtick
	 */
	cSpaceZero?: boolean;
}

export interface Uufile {
	mode: number;
	filename: string;
	bin: Uint8Array;
}

/**
 * Convert a UUE char into an integer [0-63]
 * @param char
 * @returns 0-63 or -1 if invalid char
 */
function mapUueCharToInt(char: string): number {
	return (char.charCodeAt(0) - 32) & notSeventhBit;
}

/**
 * Convert 0-45 bytes to a line
 * @param bytes
 * @param opts
 * @returns
 */
function mapLine(bytes: Uint8Array, charMap: (int: number) => string): string {
	if (bytes.length > 45) throw new VariedRangeError('Bytes', bytes.length, { '<=': 45 });
	//Start with size char
	let ret = charMap(bytes.length);
	let i = 0;
	const safeLen = bytes.length - 2;
	while (i < safeLen) {
		const b0 = bytes[i++];
		const b1 = bytes[i++];
		const b2 = bytes[i++];
		//Encoded
		const u0 = b0 >> 2;
		const u1 = ((b0 << 4) | (b1 >> 4)) & last6Bits;
		const u2 = ((b1 << 2) | (b2 >> 6)) & last6Bits;
		const u3 = b2 & last6Bits;
		ret += charMap(u0) + charMap(u1) + charMap(u2) + charMap(u3);
	}
	if (i < bytes.length) {
		//1-2 bytes left (cannot be 0/3: while would have coded)
		const b0 = bytes[i++];
		const b1 = i < bytes.length ? bytes[i++] : 0;
		//Encoded
		const u0 = b0 >> 2;
		const u1 = ((b0 << 4) | (b1 >> 4)) & last6Bits;
		const u2 = (b1 << 2) & last6Bits;
		ret += charMap(u0) + charMap(u1) + charMap(u2) + charMap(0);
	}
	return ret + '\n';
}

/**
 * Convert an array of bytes into an uuencoded string
 * @param bytes
 * @param opts
 * @returns
 */
export function fromBytes(bytes: Uint8Array, opts?: EncodeOpts): string {
	opts = opts || {};

	//Convert an integer [0-63] into a Uue character
	const charMap = opts.cSpaceZero
		? (int: number) => String.fromCharCode(int + 32) //0-63, SP-_
		: (int: number) => String.fromCharCode(((int + 63) % 64) + 33); //1-64, !-`

	let ret = '';
	let ptr = 0;
	while (ptr < bytes.length) {
		ret += mapLine(bytes.slice(ptr, ptr + 45), charMap);
		ptr += 45;
	}
	return ret + final_line + '\n';
}

/**
 * Convert uuencoded text into an array of bytes
 * @param uuencoded
 * @returns
 */
export function toBytes(uuencoded: string): Uint8Array {
	const arr = new Uint8Array(Math.ceil((uuencoded.length * 3) / 4));
	let inPtr = 0;
	let outPtr = 0;
	while (inPtr < uuencoded.length) {
		const byteStart = outPtr;
		const byteLen = mapUueCharToInt(uuencoded[inPtr++]);
		const lineLen = inPtr + Math.ceil(byteLen / 3) * 4;
		while (inPtr < lineLen) {
			const u0 = mapUueCharToInt(uuencoded[inPtr++]);
			const u1 = mapUueCharToInt(uuencoded[inPtr++]);
			const u2 = mapUueCharToInt(uuencoded[inPtr++]);
			const u3 = mapUueCharToInt(uuencoded[inPtr++]);
			arr[outPtr++] = (u0 << 2) | (u1 >> 4);
			arr[outPtr++] = (u1 << 4) | (u2 >> 2);
			arr[outPtr++] = (u2 << 6) | u3;
		}
		//Drop the padding bytes on output
		outPtr = byteStart + byteLen;
		if (uuencoded[inPtr++] != '\n')
			throw new ContentError('Uuencoded', 'Unknown char @ pos ' + inPtr, uuencoded[inPtr - 1]);
	}
	return arr.slice(0, outPtr);
}
