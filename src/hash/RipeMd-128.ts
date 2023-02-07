import * as littleEndian from '../endian/little';
import * as bits from '../primitive/BitExt';
import * as prv from './_RipeMd';
import { pad } from './Md4';

const digestSizeBytes = 16; //128 bits

//https://homes.esat.kuleuven.be/~bosselae/ripemd/rmd128.txt

export function ripeMd128(bytes: Uint8Array): Uint8Array {
	const padBytes = pad(bytes);

	const v = new Uint32Array(4);
	v[0] = prv.iv[0];
	v[1] = prv.iv[1];
	v[2] = prv.iv[2];
	v[3] = prv.iv[3];

	let t: number;

	const x = new Uint32Array(16);
	for (let i = 0; i < padBytes.length; i += prv.blockSizeBytes) {
		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3];
		let aa = v[0],
			bb = v[1],
			cc = v[2],
			dd = v[3];

		littleEndian.u32IntoArrFromBytes(x, 0, 16, padBytes, i);

		for (let j = 0; j < 64; j++) {
			const round = Math.floor(j / 16);
			t = bits.rotLeft32(a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round], prv.s[j]);
			//Using the rare , to show this is a big swap
			(a = d), (d = c), (c = b), (b = t);
			t = bits.rotLeft32(
				aa + prv.f[3 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk128[round],
				prv.ss[j]
			);
			//Using the rare , to show this is a big swap
			(aa = dd), (dd = cc), (cc = bb), (bb = t);
		}
		//Using the rare , to show this is a big swap
		(t = v[1] + c + dd),
			(v[1] = v[2] + d + aa),
			(v[2] = v[3] + a + bb),
			(v[3] = v[0] + b + cc),
			(v[0] = t);
	}

	const ret = new Uint8Array(digestSizeBytes);
	littleEndian.u32ArrIntoBytes(v, ret, 0);
	return ret;
}
