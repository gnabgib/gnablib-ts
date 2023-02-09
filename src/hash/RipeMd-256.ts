/*! Copyright 2023 gnabgib MPL-2.0 */

import * as littleEndian from '../endian/little.js';
import * as bits from '../primitive/BitExt.js';
import * as prv from './_RipeMd.js';
import { pad } from './Md4.js';

const digestSizeBytes = 32; //256 bits

//https://homes.esat.kuleuven.be/~bosselae/ripemd/rmd256.txt

export function ripeMd256(bytes: Uint8Array): Uint8Array {
	const padBytes = pad(bytes);

	const v = new Uint32Array(8);
	for (let i = 0; i < 4; i++) {
		v[i] = prv.iv[i];
		v[i + 4] = prv.iv2[i];
	}

	let t: number;
	const x = new Uint32Array(16);
	for (let i = 0; i < padBytes.length; i += prv.blockSizeBytes) {
		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3];
		let aa = v[4],
			bb = v[5],
			cc = v[6],
			dd = v[7];

		littleEndian.u32IntoArrFromBytes(x, 0, 16, padBytes, i);

		let j = 0;
		let round = 0;
		for (; j < 16; j++) {
			t = bits.rotLeft32(
				a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round],
				prv.s[j]
			);
			//Using the rare , to show this is a big swap
			(a = d), (d = c), (c = b), (b = t);
			t = bits.rotLeft32(
				aa + prv.f[3 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk128[round],
				prv.ss[j]
			);
			//Using the rare , to show this is a big swap
			(aa = dd), (dd = cc), (cc = bb), (bb = t);
		}
		(t = a), (a = aa), (aa = t);

		round = 1;
		for (; j < 32; j++) {
			t = bits.rotLeft32(
				a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round],
				prv.s[j]
			);
			(a = d), (d = c), (c = b), (b = t);
			t = bits.rotLeft32(
				aa + prv.f[3 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk128[round],
				prv.ss[j]
			);
			(aa = dd), (dd = cc), (cc = bb), (bb = t);
		}
		(t = b), (b = bb), (bb = t);

		round = 2;
		for (; j < 48; j++) {
			t = bits.rotLeft32(
				a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round],
				prv.s[j]
			);
			(a = d), (d = c), (c = b), (b = t);
			t = bits.rotLeft32(
				aa + prv.f[3 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk128[round],
				prv.ss[j]
			);
			(aa = dd), (dd = cc), (cc = bb), (bb = t);
		}
		(t = c), (c = cc), (cc = t);

		round = 3;
		for (; j < 64; j++) {
			t = bits.rotLeft32(
				a + prv.f[round](b, c, d) + x[prv.r[j]] + prv.k[round],
				prv.s[j]
			);
			(a = d), (d = c), (c = b), (b = t);
			t = bits.rotLeft32(
				aa + prv.f[3 - round](bb, cc, dd) + x[prv.rr[j]] + prv.kk128[round],
				prv.ss[j]
			);
			(aa = dd), (dd = cc), (cc = bb), (bb = t);
		}
		(t = d), (d = dd), (dd = t);

		(v[0] += a), (v[1] += b), (v[2] += c), (v[3] += d);
		(v[4] += aa), (v[5] += bb), (v[6] += cc), (v[7] += dd);
	}

	const ret = new Uint8Array(digestSizeBytes);
	littleEndian.u32ArrIntoBytes(v, ret, 0);
	return ret;
}
