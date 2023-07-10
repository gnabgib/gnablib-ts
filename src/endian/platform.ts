// IBM s390x is big endian
// https://github.com/multiarch/qemu-user-static
// https://community.ibm.com/community/user/ibmz-and-linuxone/blogs/javier-perez1/2021/01/19/endianness-guidance-for-open-source-projects
// sudo podman run --rm --privileged docker.io/multiarch/qemu-user-static --reset -p yes
// podman run -it docker.io/s390x/ubuntu
// podman run -it docker.io/s390x/node
//  uname -m =s390x

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
	/**
	 * Maybe switch byte order
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many i16 to correct (default 1)
	 */
	i16(b: Uint8Array, pos = 0, count = 1): void {
		do {
			const t = b[pos];
			b[pos] = b[pos + 1];
			b[pos + 1] = t;
			pos += 2;
		} while (--count > 0);
	},
	/**
	 * Maybe switch byte order
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many i32 to correct (default 1)
	 */
	i32(b: Uint8Array, pos = 0, count = 1): void {
		let t: number;
		do {
			t = b[pos];
			b[pos] = b[pos + 3];
			b[pos + 3] = t;
			t = b[pos + 1];
			b[pos + 1] = b[pos + 2];
			b[pos + 2] = t;
			pos += 4;
		} while (--count > 0);
	},
	/**
	 * Maybe switch byte order
	 * @param b Byte array
	 * @param pos Position of first byte
	 * @param count How many i64 to correct (default 1)
	 */
	i64(b: Uint8Array, pos = 0, count = 1): void {
		let t: number;
		do {
			t = b[pos];
			b[pos] = b[pos + 7];
			b[pos + 7] = t;
			t = b[pos + 1];
			b[pos + 1] = b[pos + 6];
			b[pos + 6] = t;
			t = b[pos + 2];
			b[pos + 2] = b[pos + 5];
			b[pos + 5] = t;
			t = b[pos + 3];
			b[pos + 3] = b[pos + 4];
			b[pos + 4] = t;
			pos += 8;
		} while (--count > 0);
	},
	/**
	 * Write 4 bytes into the array as a u32/i32
	 * 
	 * @param b
	 * @param i32Pos Position in i32 form to write (*4 for bytes)
	 * @param b0 First byte (endian dependent)
	 * @param b1 Second byte (endian dependent)
	 * @param b2 Third byte (endian dependent)
	 * @param b3 Last byte (endian dependent)
	 */
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
		b[i32Pos++] = b3;
		b[i32Pos++] = b2;
		b[i32Pos++] = b1;
		b[i32Pos] = b0;
	},
};

const leave = {
	// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
	i16(_b: Uint8Array, _pos = 0, _count = 1): void {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
	i32(_b: Uint8Array, _pos = 0, _count = 1): void {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
	i64(_b: Uint8Array, _pos = 0, _count = 1): void {},
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

/**
 * If platform is LE, this does nothing.  Otherwise bytes are switched from BE order
 */
export const asLE = isLE ? leave : invert;
/**
 * If platform is BE, this does nothing.  Otherwise bytes are switched from LE order
 */
export const asBE = isLE ? invert : leave;
export function asE(isBE: boolean) {
	return isBE ? asBE : asLE;
}
