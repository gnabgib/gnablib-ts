/*! Copyright 2023 gnabgib MPL-2.0 */

import * as littleEndian from '../endian/little.js';
import * as bits from '../primitive/BitExt.js';
import * as prv from './_RipeMd.js';
import { pad } from './Md4.js';

const digestSizeBytes = 40; //320 bits

//https://homes.esat.kuleuven.be/~bosselae/ripemd/rmd320.txt

export function ripeMd320(bytes: Uint8Array): Uint8Array {
	const padBytes = pad(bytes);

	const v = new Uint32Array(10);
	for (let i = 0; i < 5; i++) {
		v[i] = prv.iv[i];
		v[i + 5] = prv.iv2[i];
	}
	let t: number;

	const x = new Uint32Array(16);
	for (let i = 0; i < padBytes.length; i += prv.blockSizeBytes) {
		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3],
			e = v[4];
		let aa = v[5],
			bb = v[6],
			cc = v[7],
			dd = v[8],
			ee = v[9];

		littleEndian.u32IntoArrFromBytes(x, 0, 16, padBytes, i);

		let j = 0;
		let round = 0;
		for (; j < 16; j++) {
			t =
				e +
				bits.rotLeft32(
					a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round],
					prv.s[j]
				);
			//Using the rare , to show this is a big swap
			(a = e), (e = d), (d = bits.rotLeft32(c, 10)), (c = b), (b = t);
			t =
				ee +
				bits.rotLeft32(
					aa + prv.f[4 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk[round],
					prv.ss[j]
				);
			//Using the rare , to show this is a big swap
			(aa = ee), (ee = dd), (dd = bits.rotLeft32(cc, 10)), (cc = bb), (bb = t);
		}
		(t = b), (b = bb), (bb = t);

		round = 1;
		for (; j < 32; j++) {
			t =
				e +
				bits.rotLeft32(
					a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round],
					prv.s[j]
				);
			(a = e), (e = d), (d = bits.rotLeft32(c, 10)), (c = b), (b = t);
			t =
				ee +
				bits.rotLeft32(
					aa + prv.f[4 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk[round],
					prv.ss[j]
				);
			(aa = ee), (ee = dd), (dd = bits.rotLeft32(cc, 10)), (cc = bb), (bb = t);
		}
		(t = d), (d = dd), (dd = t);

		round = 2;
		for (; j < 48; j++) {
			t =
				e +
				bits.rotLeft32(
					a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round],
					prv.s[j]
				);
			(a = e), (e = d), (d = bits.rotLeft32(c, 10)), (c = b), (b = t);
			t =
				ee +
				bits.rotLeft32(
					aa + prv.f[4 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk[round],
					prv.ss[j]
				);
			(aa = ee), (ee = dd), (dd = bits.rotLeft32(cc, 10)), (cc = bb), (bb = t);
		}
		(t = a), (a = aa), (aa = t);

		round = 3;
		for (; j < 64; j++) {
			t =
				e +
				bits.rotLeft32(
					a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round],
					prv.s[j]
				);
			(a = e), (e = d), (d = bits.rotLeft32(c, 10)), (c = b), (b = t);
			t =
				ee +
				bits.rotLeft32(
					aa + prv.f[4 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk[round],
					prv.ss[j]
				);
			(aa = ee), (ee = dd), (dd = bits.rotLeft32(cc, 10)), (cc = bb), (bb = t);
		}
		(t = c), (c = cc), (cc = t);

		round = 4;
		for (; j < 80; j++) {
			t =
				e +
				bits.rotLeft32(
					a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round],
					prv.s[j]
				);
			(a = e), (e = d), (d = bits.rotLeft32(c, 10)), (c = b), (b = t);
			t =
				ee +
				bits.rotLeft32(
					aa + prv.f[4 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk[round],
					prv.ss[j]
				);
			(aa = ee), (ee = dd), (dd = bits.rotLeft32(cc, 10)), (cc = bb), (bb = t);
		}
		(t = e), (e = ee), (ee = t);

		//Using the rare , to show this is a big swap
		(v[0] += a), (v[1] += b), (v[2] += c), (v[3] += d), (v[4] += e);
		(v[5] += aa), (v[6] += bb), (v[7] += cc), (v[8] += dd), (v[9] += ee);
	}

	const ret = new Uint8Array(digestSizeBytes);
	littleEndian.u32ArrIntoBytes(v, ret, 0);
	return ret;
}
