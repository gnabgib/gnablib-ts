/*! Copyright 2023 the gnablib contributors MPL-1.1 */
//https://datatracker.ietf.org/doc/html/rfc1950

const mod = 65521; //0xfff1

/**
 * # Adler32
 * 
 * - Specified in [RFC-1950]((https://datatracker.ietf.org/doc/html/rfc1950))
 * - Generates a 32 bit checksum
 * 
 * @param bytes Data to checksum
 * @returns 32 bit checksum
 */
export function adler32(bytes: Uint8Array): number {
	//We should add trailing 0 to bytes, but JS allows us to ask for
	// bytes beyond the end (and get back undefined, which coerces to zero)
	let a = 1;
	let b = 0;
	let ptr = 0;
	while (ptr < bytes.length) {
		//JS doesn't overflow until 53 bits we we've got lots of space here
		// (0xffffffff * 0xfff1 (max byte) still fits in 2^48 bits)
		const safeLen = Math.min(0xffffffff, bytes.length);
		for (; ptr < safeLen; ptr++) {
			a += bytes[ptr];
			b += a;
		}
		//The mod operation (%) is in math(53bit max) not bit(32bit max)
		a %= mod;
		b %= mod;
	}
	return ((b << 16) | a) >>> 0;
}
