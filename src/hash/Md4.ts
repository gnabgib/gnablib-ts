import * as littleEndian from '../endian/little.js';
import * as bitExt from '../primitive/BitExt.js';

//https://datatracker.ietf.org/doc/html/rfc1320 (1992)
const digestSizeBytes = 16; //128 bits
const blockSizeBytes = 64; //512 bits

//Encode RFC 1320 in JS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/*export*/ function generator() {
	const shiftSets = [
		[3, 7, 11, 19],
		[3, 5, 9, 13],
		[3, 9, 11, 15]
	];
	const rowSet = ['abcd', 'dabc', 'cdab', 'bcda'];
	const addSets = ['', '5A827999', '6ED9EBA1'];
	const posSets = [
		[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'],
		[0, 4, 8, 'c', 1, 5, 9, 'd', 2, 6, 'a', 'e', 3, 7, 'b', 'f'],
		[0, 8, 4, 'c', 2, 'a', 6, 'e', 1, 9, 5, 'd', 3, 'b', 7, 'f']
	];
	const fns = [
		(x:string, y:string, z:string) => '(' + z + ' ^ (' + x + ' & (' + y + ' ^ ' + z + ')))',
		(x:string, y:string, z:string) => '(((' + x + ' | ' + y + ') & ' + z + ')|(' + x + ' & ' + y + '))',
		//(x, y, z) => '((' + x + ' & ' + y + ')|(' + x + ' & ' + z + ')|(' + y + ' & ' + z + '))',
		(x:string, y:string, z:string) => '(' + x + '^' + y + '^' + z + ')'
	];
	//3 blocks (rounds) in MD4
	for (let block = 0; block < 3; block++) {
		const s = shiftSets[block];
		console.log('/* Round', block + 1, '*/');
		console.log('const round' + block + 'col0 = ', s[0], ';');
		console.log('const round' + block + 'col1 = ', s[1], ';');
		console.log('const round' + block + 'col2 = ', s[2], ';');
		console.log('const round' + block + 'col3 = ', s[3], ';');
		const fn = fns[block];
		const pos = posSets[block];
		const add = addSets[block] === '' ? ',' : '+0x' + addSets[block] + ',';
		for (let i = 0; i < 16; i++) {
			const col = i % 4;
			//const row=(i/4)|0;
			const a = rowSet[col][0];
			const b = rowSet[col][1];
			const c = rowSet[col][2];
			const d = rowSet[col][3];
			console.log(
				a,
				'=bitExt.rotLeft32(',
				a,
				'+',
				fn(b, c, d),
				'+ x' + pos[i],
				add,
				'round' + block + 'col' + col,
				');'
			);
		}
		console.log('');
	}
}

/**
 * Pad out the starting amount to be a multiple of @see blockSizeBytes including the bit count
 * @param bytes
 * @returns
 */
export function pad(bytes: Uint8Array): Uint8Array {
	const reqSpace = bitExt.size64Bytes;
	const len =
		bytes.length + reqSpace + blockSizeBytes - ((bytes.length + reqSpace) % blockSizeBytes);
	const padBytes = new Uint8Array(len);
	padBytes.set(bytes, 0);
	padBytes[bytes.length] = 0x80;
	littleEndian.u32IntoBytes(bytes.length << 3, padBytes, len - bitExt.size64Bytes);
	//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
	littleEndian.u32IntoBytes(bytes.length / 0x20000000, padBytes, len - bitExt.size32Bytes);
	return padBytes;
}

export function md4(bytes: Uint8Array): Uint8Array {
	const padBytes = pad(bytes);

	const v = new Uint32Array(4);
	v[0] = 0x67452301;
	v[1] = 0xefcdab89;
	v[2] = 0x98badcfe;
	v[3] = 0x10325476;

	const x = new Uint32Array(16);
	for (let i = 0; i < padBytes.length; i += blockSizeBytes) {
		const aa = v[0];
		const bb = v[1];
		const cc = v[2];
		const dd = v[3];

		littleEndian.u32IntoArrFromBytes(x, 0, 16, padBytes, i);

		//a = (a + F(b,c,d) + X[k]) <<< s
		//F(X,Y,Z) = XY v not(X) Z // (X&Y)|(~X&Z) | X&(Y^Z)  // Z^(X&(Y^Z)) [more efficient]
		/* Round 1. */
		const round0col0 = 3;
		const round0col1 = 7;
		const round0col2 = 11;
		const round0col3 = 19;
		v[0] = bitExt.rotLeft32(v[0] + (v[3] ^ (v[1] & (v[2] ^ v[3]))) + x[0], round0col0);
		v[3] = bitExt.rotLeft32(v[3] + (v[2] ^ (v[0] & (v[1] ^ v[2]))) + x[1], round0col1);
		v[2] = bitExt.rotLeft32(v[2] + (v[1] ^ (v[3] & (v[0] ^ v[1]))) + x[2], round0col2);
		v[1] = bitExt.rotLeft32(v[1] + (v[0] ^ (v[2] & (v[3] ^ v[0]))) + x[3], round0col3);
		v[0] = bitExt.rotLeft32(v[0] + (v[3] ^ (v[1] & (v[2] ^ v[3]))) + x[4], round0col0);
		v[3] = bitExt.rotLeft32(v[3] + (v[2] ^ (v[0] & (v[1] ^ v[2]))) + x[5], round0col1);
		v[2] = bitExt.rotLeft32(v[2] + (v[1] ^ (v[3] & (v[0] ^ v[1]))) + x[6], round0col2);
		v[1] = bitExt.rotLeft32(v[1] + (v[0] ^ (v[2] & (v[3] ^ v[0]))) + x[7], round0col3);
		v[0] = bitExt.rotLeft32(v[0] + (v[3] ^ (v[1] & (v[2] ^ v[3]))) + x[8], round0col0);
		v[3] = bitExt.rotLeft32(v[3] + (v[2] ^ (v[0] & (v[1] ^ v[2]))) + x[9], round0col1);
		v[2] = bitExt.rotLeft32(v[2] + (v[1] ^ (v[3] & (v[0] ^ v[1]))) + x[10], round0col2);
		v[1] = bitExt.rotLeft32(v[1] + (v[0] ^ (v[2] & (v[3] ^ v[0]))) + x[11], round0col3);
		v[0] = bitExt.rotLeft32(v[0] + (v[3] ^ (v[1] & (v[2] ^ v[3]))) + x[12], round0col0);
		v[3] = bitExt.rotLeft32(v[3] + (v[2] ^ (v[0] & (v[1] ^ v[2]))) + x[13], round0col1);
		v[2] = bitExt.rotLeft32(v[2] + (v[1] ^ (v[3] & (v[0] ^ v[1]))) + x[14], round0col2);
		v[1] = bitExt.rotLeft32(v[1] + (v[0] ^ (v[2] & (v[3] ^ v[0]))) + x[15], round0col3);

		//a = (a + G(b,c,d) + X[k] + 5A827999) <<< s
		//G(X,Y,Z) = XY v XZ v YZ // (X&Y)|(X&Z)|(Y&Z) // (((X|Y)&Z)|(X&Y)) [more efficient]
		/* Round 2 */
		const round1col0 = 3;
		const round1col1 = 5;
		const round1col2 = 9;
		const round1col3 = 13;
		const round2Add = 0x5a827999;
		v[0] = bitExt.rotLeft32(
			v[0] + (((v[1] | v[2]) & v[3]) | (v[1] & v[2])) + x[0] + round2Add,
			round1col0
		);
		v[3] = bitExt.rotLeft32(
			v[3] + (((v[0] | v[1]) & v[2]) | (v[0] & v[1])) + x[4] + round2Add,
			round1col1
		);
		v[2] = bitExt.rotLeft32(
			v[2] + (((v[0] | v[1]) & v[3]) | (v[0] & v[1])) + x[8] + round2Add,
			round1col2
		);
		v[1] = bitExt.rotLeft32(
			v[1] + (((v[0] | v[2]) & v[3]) | (v[0] & v[2])) + x[12] + round2Add,
			round1col3
		);
		v[0] = bitExt.rotLeft32(
			v[0] + (((v[1] | v[2]) & v[3]) | (v[1] & v[2])) + x[1] + round2Add,
			round1col0
		);
		v[3] = bitExt.rotLeft32(
			v[3] + (((v[0] | v[1]) & v[2]) | (v[0] & v[1])) + x[5] + round2Add,
			round1col1
		);
		v[2] = bitExt.rotLeft32(
			v[2] + (((v[0] | v[1]) & v[3]) | (v[0] & v[1])) + x[9] + round2Add,
			round1col2
		);
		v[1] = bitExt.rotLeft32(
			v[1] + (((v[0] | v[2]) & v[3]) | (v[0] & v[2])) + x[13] + round2Add,
			round1col3
		);
		v[0] = bitExt.rotLeft32(
			v[0] + (((v[1] | v[2]) & v[3]) | (v[1] & v[2])) + x[2] + round2Add,
			round1col0
		);
		v[3] = bitExt.rotLeft32(
			v[3] + (((v[0] | v[1]) & v[2]) | (v[0] & v[1])) + x[6] + round2Add,
			round1col1
		);
		v[2] = bitExt.rotLeft32(
			v[2] + (((v[0] | v[1]) & v[3]) | (v[0] & v[1])) + x[10] + round2Add,
			round1col2
		);
		v[1] = bitExt.rotLeft32(
			v[1] + (((v[0] | v[2]) & v[3]) | (v[0] & v[2])) + x[14] + round2Add,
			round1col3
		);
		v[0] = bitExt.rotLeft32(
			v[0] + (((v[1] | v[2]) & v[3]) | (v[1] & v[2])) + x[3] + round2Add,
			round1col0
		);
		v[3] = bitExt.rotLeft32(
			v[3] + (((v[0] | v[1]) & v[2]) | (v[0] & v[1])) + x[7] + round2Add,
			round1col1
		);
		v[2] = bitExt.rotLeft32(
			v[2] + (((v[0] | v[1]) & v[3]) | (v[0] & v[1])) + x[11] + round2Add,
			round1col2
		);
		v[1] = bitExt.rotLeft32(
			v[1] + (((v[0] | v[2]) & v[3]) | (v[0] & v[2])) + x[15] + round2Add,
			round1col3
		);

		/* Round 3. */
		//a = (a + H(b,c,d) + X[k] + 6ED9EBA1) <<< s
		//H(X,Y,Z) = X xor Y xor Z // X^Y^Z
		/* Round 3 */
		const round2col0 = 3;
		const round2col1 = 9;
		const round2col2 = 11;
		const round2col3 = 15;
		const round3Add = 0x6ed9eba1;
		v[0] = bitExt.rotLeft32(v[0] + (v[1] ^ v[2] ^ v[3]) + x[0] + round3Add, round2col0);
		v[3] = bitExt.rotLeft32(v[3] + (v[0] ^ v[1] ^ v[2]) + x[8] + round3Add, round2col1);
		v[2] = bitExt.rotLeft32(v[2] + (v[3] ^ v[0] ^ v[1]) + x[4] + round3Add, round2col2);
		v[1] = bitExt.rotLeft32(v[1] + (v[2] ^ v[3] ^ v[0]) + x[12] + round3Add, round2col3);
		v[0] = bitExt.rotLeft32(v[0] + (v[1] ^ v[2] ^ v[3]) + x[2] + round3Add, round2col0);
		v[3] = bitExt.rotLeft32(v[3] + (v[0] ^ v[1] ^ v[2]) + x[10] + round3Add, round2col1);
		v[2] = bitExt.rotLeft32(v[2] + (v[3] ^ v[0] ^ v[1]) + x[6] + round3Add, round2col2);
		v[1] = bitExt.rotLeft32(v[1] + (v[2] ^ v[3] ^ v[0]) + x[14] + round3Add, round2col3);
		v[0] = bitExt.rotLeft32(v[0] + (v[1] ^ v[2] ^ v[3]) + x[1] + round3Add, round2col0);
		v[3] = bitExt.rotLeft32(v[3] + (v[0] ^ v[1] ^ v[2]) + x[9] + round3Add, round2col1);
		v[2] = bitExt.rotLeft32(v[2] + (v[3] ^ v[0] ^ v[1]) + x[5] + round3Add, round2col2);
		v[1] = bitExt.rotLeft32(v[1] + (v[2] ^ v[3] ^ v[0]) + x[13] + round3Add, round2col3);
		v[0] = bitExt.rotLeft32(v[0] + (v[1] ^ v[2] ^ v[3]) + x[3] + round3Add, round2col0);
		v[3] = bitExt.rotLeft32(v[3] + (v[0] ^ v[1] ^ v[2]) + x[11] + round3Add, round2col1);
		v[2] = bitExt.rotLeft32(v[2] + (v[3] ^ v[0] ^ v[1]) + x[7] + round3Add, round2col2);
		v[1] = bitExt.rotLeft32(v[1] + (v[2] ^ v[3] ^ v[0]) + x[15] + round3Add, round2col3);

		v[0] += aa;
		v[1] += bb;
		v[2] += cc;
		v[3] += dd;
	}

	const ret = new Uint8Array(digestSizeBytes);
	littleEndian.u32ArrIntoBytesUnsafe(v, ret);
	return ret;
}
