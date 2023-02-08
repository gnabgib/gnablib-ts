import * as littleEndian from '../endian/little.js';
import * as bits from '../primitive/BitExt.js';
import * as prv from './_RipeMd.js';
import { pad } from './Md4.js';

const digestSizeBytes = 20; //160 bits

//https://en.wikipedia.org/wiki/RIPEMD
//https://homes.esat.kuleuven.be/~bosselae/ripemd/rmd160.txt

export function ripeMd160(bytes: Uint8Array): Uint8Array {
	const padBytes = pad(bytes);

	const v = new Uint32Array(5);
	for (let i = 0; i < 5; i++) v[i] = prv.iv[i];

	let t: number;
	const x = new Uint32Array(16);
	for (let i = 0; i < padBytes.length; i += prv.blockSizeBytes) {
		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3],
			e = v[4];
		let aa = v[0],
			bb = v[1],
			cc = v[2],
			dd = v[3],
			ee = v[4];

		littleEndian.u32IntoArrFromBytes(x, 0, 16, padBytes, i);

		for (let j = 0; j < 80; j++) {
			const round = Math.floor(j / 16);
			t = e + bits.rotLeft32(a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round], prv.s[j]);
			//Using the rare , to show this is a big swap
			(a = e), (e = d), (d = bits.rotLeft32(c, 10)), (c = b), (b = t);
			t =
				ee +
				bits.rotLeft32(aa + prv.f[4 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk[round], prv.ss[j]);
			//Using the rare , to show this is a big swap
			(aa = ee), (ee = dd), (dd = bits.rotLeft32(cc, 10)), (cc = bb), (bb = t);
		}

		t = v[1] + c + dd;
		//Using the rare , to show this is a big swap
		(v[1] = v[2] + d + ee),
			(v[2] = v[3] + e + aa),
			(v[3] = v[4] + a + bb),
			(v[4] = v[0] + b + cc),
			(v[0] = t);
	}

	const ret = new Uint8Array(digestSizeBytes);
	littleEndian.u32ArrIntoBytes(v, ret, 0);
	return ret;
}
