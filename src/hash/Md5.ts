import * as littleEndian from '../endian/little.js';
import * as bitExt from '../primitive/BitExt.js';

//https://datatracker.ietf.org/doc/html/rfc1321
const digestSizeBytes = 16; //128 bits
const blockSizeBytes = 64; //512 bits
//const size32Bytes=4;//32bits

export function md5(inBytes: Uint8Array): Uint8Array {
	const reqSpace = 2 * bitExt.size32Bytes;
	const len =
		inBytes.length + reqSpace + blockSizeBytes - ((inBytes.length + reqSpace) % blockSizeBytes);
	const bytes = new Uint8Array(len);
	bytes.set(inBytes, 0);
	bytes[inBytes.length] = 0x80;
	littleEndian.u32IntoBytes(inBytes.length << 3, bytes, len - bitExt.size64Bytes);
	littleEndian.u32IntoBytes(inBytes.length >>> 13, bytes, len - bitExt.size32Bytes);

	//Big endian 0-ff-0
	const v = new Uint32Array(4);
	v[0] = 0x67452301;
	v[1] = 0xefcdab89;
	v[2] = 0x98badcfe;
	v[3] = 0x10325476;

	const x = new Uint32Array(16);
	for (let i = 0; i < len; i += blockSizeBytes) {
		//console.log(i, n);
		const aa = v[0];
		const bb = v[1];
		const cc = v[2];
		const dd = v[3];

		littleEndian.u32IntoArrFromBytes(x, 0, 16, bytes, i);

		/* Round 1. */
		//a = b + ((a + F(b,c,d) + X[k] + T[i]) <<< s)
		//F(X,Y,Z) = XY v not(X) Z // (X&Y)|(~X&Z) | X&(Y^Z)  // Z^(X&(Y^Z)) [more efficient]
		const round0col0 = 7;
		const round0col1 = 12;
		const round0col2 = 17;
		const round0col3 = 22;
		v[0] =
			v[1] +
			bitExt.rotLeft32((((v[2] ^ v[3]) & v[1]) ^ v[3]) + v[0] + x[0] + 0xd76aa478, round0col0);
		v[3] =
			v[0] +
			bitExt.rotLeft32((((v[1] ^ v[2]) & v[0]) ^ v[2]) + v[3] + x[1] + 0xe8c7b756, round0col1);
		v[2] =
			v[3] +
			bitExt.rotLeft32((((v[0] ^ v[1]) & v[3]) ^ v[1]) + v[2] + x[2] + 0x242070db, round0col2);
		v[1] =
			v[2] +
			bitExt.rotLeft32((((v[3] ^ v[0]) & v[2]) ^ v[0]) + v[1] + x[3] + 0xc1bdceee, round0col3);

		v[0] =
			v[1] +
			bitExt.rotLeft32((((v[2] ^ v[3]) & v[1]) ^ v[3]) + v[0] + x[4] + 0xf57c0faf, round0col0);
		v[3] =
			v[0] +
			bitExt.rotLeft32((((v[1] ^ v[2]) & v[0]) ^ v[2]) + v[3] + x[5] + 0x4787c62a, round0col1);
		v[2] =
			v[3] +
			bitExt.rotLeft32((((v[0] ^ v[1]) & v[3]) ^ v[1]) + v[2] + x[6] + 0xa8304613, round0col2);
		v[1] =
			v[2] +
			bitExt.rotLeft32((((v[3] ^ v[0]) & v[2]) ^ v[0]) + v[1] + x[7] + 0xfd469501, round0col3);

		v[0] =
			v[1] +
			bitExt.rotLeft32((((v[2] ^ v[3]) & v[1]) ^ v[3]) + v[0] + x[8] + 0x698098d8, round0col0);
		v[3] =
			v[0] +
			bitExt.rotLeft32((((v[1] ^ v[2]) & v[0]) ^ v[2]) + v[3] + x[9] + 0x8b44f7af, round0col1);
		v[2] =
			v[3] +
			bitExt.rotLeft32((((v[0] ^ v[1]) & v[3]) ^ v[1]) + v[2] + x[10] + 0xffff5bb1, round0col2);
		v[1] =
			v[2] +
			bitExt.rotLeft32((((v[3] ^ v[0]) & v[2]) ^ v[0]) + v[1] + x[11] + 0x895cd7be, round0col3);

		v[0] =
			v[1] +
			bitExt.rotLeft32((((v[2] ^ v[3]) & v[1]) ^ v[3]) + v[0] + x[12] + 0x6b901122, round0col0);
		v[3] =
			v[0] +
			bitExt.rotLeft32((((v[1] ^ v[2]) & v[0]) ^ v[2]) + v[3] + x[13] + 0xfd987193, round0col1);
		v[2] =
			v[3] +
			bitExt.rotLeft32((((v[0] ^ v[1]) & v[3]) ^ v[1]) + v[2] + x[14] + 0xa679438e, round0col2);
		v[1] =
			v[2] +
			bitExt.rotLeft32((((v[3] ^ v[0]) & v[2]) ^ v[0]) + v[1] + x[15] + 0x49b40821, round0col3);

		/* Round 2. */
		//a = b + ((a + G(b,c,d) + X[k] + T[i]) <<< s)
		//G(X,Y,Z) = XZ v Y not(Z) // (X&Z)|(Y&~Z) //  Y^(Z&(X^Y))
		const round1col0 = 5;
		const round1col1 = 9;
		const round1col2 = 14;
		const round1col3 = 20;
		v[0] =
			v[1] +
			bitExt.rotLeft32((((v[1] ^ v[2]) & v[3]) ^ v[2]) + v[0] + x[1] + 0xf61e2562, round1col0);
		v[3] =
			v[0] +
			bitExt.rotLeft32((((v[0] ^ v[1]) & v[2]) ^ v[1]) + v[3] + x[6] + 0xc040b340, round1col1);
		v[2] =
			v[3] +
			bitExt.rotLeft32((((v[3] ^ v[0]) & v[1]) ^ v[0]) + v[2] + x[11] + 0x265e5a51, round1col2);
		v[1] =
			v[2] +
			bitExt.rotLeft32((((v[2] ^ v[3]) & v[0]) ^ v[3]) + v[1] + x[0] + 0xe9b6c7aa, round1col3);

		v[0] =
			v[1] +
			bitExt.rotLeft32((((v[1] ^ v[2]) & v[3]) ^ v[2]) + v[0] + x[5] + 0xd62f105d, round1col0);
		v[3] =
			v[0] +
			bitExt.rotLeft32((((v[0] ^ v[1]) & v[2]) ^ v[1]) + v[3] + x[10] + 0x02441453, round1col1);
		v[2] =
			v[3] +
			bitExt.rotLeft32((((v[3] ^ v[0]) & v[1]) ^ v[0]) + v[2] + x[15] + 0xd8a1e681, round1col2);
		v[1] =
			v[2] +
			bitExt.rotLeft32((((v[2] ^ v[3]) & v[0]) ^ v[3]) + v[1] + x[4] + 0xe7d3fbc8, round1col3);

		v[0] =
			v[1] +
			bitExt.rotLeft32((((v[1] ^ v[2]) & v[3]) ^ v[2]) + v[0] + x[9] + 0x21e1cde6, round1col0);
		v[3] =
			v[0] +
			bitExt.rotLeft32((((v[0] ^ v[1]) & v[2]) ^ v[1]) + v[3] + x[14] + 0xc33707d6, round1col1);
		v[2] =
			v[3] +
			bitExt.rotLeft32((((v[3] ^ v[0]) & v[1]) ^ v[0]) + v[2] + x[3] + 0xf4d50d87, round1col2);
		v[1] =
			v[2] +
			bitExt.rotLeft32((((v[2] ^ v[3]) & v[0]) ^ v[3]) + v[1] + x[8] + 0x455a14ed, round1col3);

		v[0] =
			v[1] +
			bitExt.rotLeft32((((v[1] ^ v[2]) & v[3]) ^ v[2]) + v[0] + x[13] + 0xa9e3e905, round1col0);
		v[3] =
			v[0] +
			bitExt.rotLeft32((((v[0] ^ v[1]) & v[2]) ^ v[1]) + v[3] + x[2] + 0xfcefa3f8, round1col1);
		v[2] =
			v[3] +
			bitExt.rotLeft32((((v[3] ^ v[0]) & v[1]) ^ v[0]) + v[2] + x[7] + 0x676f02d9, round1col2);
		v[1] =
			v[2] +
			bitExt.rotLeft32((((v[2] ^ v[3]) & v[0]) ^ v[3]) + v[1] + x[12] + 0x8d2a4c8a, round1col3);

		/* Round 3. */
		//a = b + ((a + H(b,c,d) + X[k] + T[i]) <<< s)
		//H(X,Y,Z) = X xor Y xor Z // X^Y^Z
		const round2col0 = 4;
		const round2col1 = 11;
		const round2col2 = 16;
		const round2col3 = 23;
		v[0] = v[1] + bitExt.rotLeft32((v[1] ^ v[2] ^ v[3]) + v[0] + x[5] + 0xfffa3942, round2col0);
		v[3] = v[0] + bitExt.rotLeft32((v[0] ^ v[1] ^ v[2]) + v[3] + x[8] + 0x8771f681, round2col1);
		v[2] = v[3] + bitExt.rotLeft32((v[3] ^ v[0] ^ v[1]) + v[2] + x[11] + 0x6d9d6122, round2col2);
		v[1] = v[2] + bitExt.rotLeft32((v[2] ^ v[3] ^ v[0]) + v[1] + x[14] + 0xfde5380c, round2col3);

		v[0] = v[1] + bitExt.rotLeft32((v[1] ^ v[2] ^ v[3]) + v[0] + x[1] + 0xa4beea44, round2col0);
		v[3] = v[0] + bitExt.rotLeft32((v[0] ^ v[1] ^ v[2]) + v[3] + x[4] + 0x4bdecfa9, round2col1);
		v[2] = v[3] + bitExt.rotLeft32((v[3] ^ v[0] ^ v[1]) + v[2] + x[7] + 0xf6bb4b60, round2col2);
		v[1] = v[2] + bitExt.rotLeft32((v[2] ^ v[3] ^ v[0]) + v[1] + x[10] + 0xbebfbc70, round2col3);

		v[0] = v[1] + bitExt.rotLeft32((v[1] ^ v[2] ^ v[3]) + v[0] + x[13] + 0x289b7ec6, round2col0);
		v[3] = v[0] + bitExt.rotLeft32((v[0] ^ v[1] ^ v[2]) + v[3] + x[0] + 0xeaa127fa, round2col1);
		v[2] = v[3] + bitExt.rotLeft32((v[3] ^ v[0] ^ v[1]) + v[2] + x[3] + 0xd4ef3085, round2col2);
		v[1] = v[2] + bitExt.rotLeft32((v[2] ^ v[3] ^ v[0]) + v[1] + x[6] + 0x04881d05, round2col3);

		v[0] = v[1] + bitExt.rotLeft32((v[1] ^ v[2] ^ v[3]) + v[0] + x[9] + 0xd9d4d039, round2col0);
		v[3] = v[0] + bitExt.rotLeft32((v[0] ^ v[1] ^ v[2]) + v[3] + x[12] + 0xe6db99e5, round2col1);
		v[2] = v[3] + bitExt.rotLeft32((v[3] ^ v[0] ^ v[1]) + v[2] + x[15] + 0x1fa27cf8, round2col2);
		v[1] = v[2] + bitExt.rotLeft32((v[2] ^ v[3] ^ v[0]) + v[1] + x[2] + 0xc4ac5665, round2col3);

		/* Round 4. */
		//a = b + ((a + I(b,c,d) + X[k] + T[i]) <<< s)
		//I(X,Y,Z) = Y xor (X v not(Z)) // Y^(X|~Z)
		const round3col0 = 6;
		const round3col1 = 10;
		const round3col2 = 15;
		const round3col3 = 21;
		v[0] = v[1] + bitExt.rotLeft32((v[2] ^ (v[1] | ~v[3])) + v[0] + x[0] + 0xf4292244, round3col0);
		v[3] = v[0] + bitExt.rotLeft32((v[1] ^ (v[0] | ~v[2])) + v[3] + x[7] + 0x432aff97, round3col1);
		v[2] = v[3] + bitExt.rotLeft32((v[0] ^ (v[3] | ~v[1])) + v[2] + x[14] + 0xab9423a7, round3col2);
		v[1] = v[2] + bitExt.rotLeft32((v[3] ^ (v[2] | ~v[0])) + v[1] + x[5] + 0xfc93a039, round3col3);

		v[0] = v[1] + bitExt.rotLeft32((v[2] ^ (v[1] | ~v[3])) + v[0] + x[12] + 0x655b59c3, round3col0);
		v[3] = v[0] + bitExt.rotLeft32((v[1] ^ (v[0] | ~v[2])) + v[3] + x[3] + 0x8f0ccc92, round3col1);
		v[2] = v[3] + bitExt.rotLeft32((v[0] ^ (v[3] | ~v[1])) + v[2] + x[10] + 0xffeff47d, round3col2);
		v[1] = v[2] + bitExt.rotLeft32((v[3] ^ (v[2] | ~v[0])) + v[1] + x[1] + 0x85845dd1, round3col3);

		v[0] = v[1] + bitExt.rotLeft32((v[2] ^ (v[1] | ~v[3])) + v[0] + x[8] + 0x6fa87e4f, round3col0);
		v[3] = v[0] + bitExt.rotLeft32((v[1] ^ (v[0] | ~v[2])) + v[3] + x[15] + 0xfe2ce6e0, round3col1);
		v[2] = v[3] + bitExt.rotLeft32((v[0] ^ (v[3] | ~v[1])) + v[2] + x[6] + 0xa3014314, round3col2);
		v[1] = v[2] + bitExt.rotLeft32((v[3] ^ (v[2] | ~v[0])) + v[1] + x[13] + 0x4e0811a1, round3col3);

		v[0] = v[1] + bitExt.rotLeft32((v[2] ^ (v[1] | ~v[3])) + v[0] + x[4] + 0xf7537e82, round3col0);
		v[3] = v[0] + bitExt.rotLeft32((v[1] ^ (v[0] | ~v[2])) + v[3] + x[11] + 0xbd3af235, round3col1);
		v[2] = v[3] + bitExt.rotLeft32((v[0] ^ (v[3] | ~v[1])) + v[2] + x[2] + 0x2ad7d2bb, round3col2);
		v[1] = v[2] + bitExt.rotLeft32((v[3] ^ (v[2] | ~v[0])) + v[1] + x[9] + 0xeb86d391, round3col3);

		v[0] += aa;
		v[1] += bb;
		v[2] += cc;
		v[3] += dd;
	}

	const ret = new Uint8Array(digestSizeBytes);
	littleEndian.u32ArrIntoBytesUnsafe(v, ret);
	return ret;
}
