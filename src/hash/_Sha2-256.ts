/*! Copyright 2023 gnabgib MPL-2.0 */

import * as bigEndian from '../endian/big.js';
import * as bitExt from '../primitive/BitExt.js';
import { iv512, k, pad } from './_Sha2.js';

const digestSizeBytes = bitExt.size32Bytes * 8; //32 bytes, 256 bits
const blockSizeBytes = 64; //512 bits
const wSize = 64;

export function sha2_256(bytes: Uint8Array): Uint8Array {
	const paddedBytes = pad(bytes, blockSizeBytes);

	const v = new Uint32Array(8);
	for (let i = 0; i < 8; i++) v[i] = iv512[i << 1];

	const w = new Uint32Array(wSize);
	for (let i = 0; i < paddedBytes.length; i += blockSizeBytes) {
		//Copy
		bigEndian.u32IntoArrFromBytes(w, 0, 16, paddedBytes, i);

		//Expand
		let j = 16;
		for (; j < wSize; j++) {
			const w15 = w[j - 15];
			const w2 = w[j - 2];
			const s0 = bitExt.rotRight32(w15, 7) ^ bitExt.rotRight32(w15, 18) ^ (w15 >>> 3);
			const s1 = bitExt.rotRight32(w2, 17) ^ bitExt.rotRight32(w2, 19) ^ (w2 >>> 10);
			w[j] = w[j - 16] + s0 + w[j - 7] + s1;
		}

		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3],
			e = v[4],
			f = v[5],
			g = v[6],
			h = v[7];

		for (j = 0; j < blockSizeBytes; j++) {
			const s1 = bitExt.rotRight32(e, 6) ^ bitExt.rotRight32(e, 11) ^ bitExt.rotRight32(e, 25);
			//const ch=(e&f)^((~e)&g);//Same as MD4-r1
			const ch = g ^ (e & (f ^ g)); //Same as MD4-r1
			const temp1 = h + s1 + ch + k[j * 2] + w[j];
			const s0 = bitExt.rotRight32(a, 2) ^ bitExt.rotRight32(a, 13) ^ bitExt.rotRight32(a, 22);
			//const maj=(a&b)^(a&c)^(b&c);
			const maj = ((a ^ b) & c) ^ (a & b); //Similar to MD4-r2 (| -> ^)
			const temp2 = s0 + maj;

			(h = g), (g = f), (f = e), (e = d + temp1), (d = c), (c = b), (b = a), (a = temp1 + temp2);
		}

		v[0] += a;
		v[1] += b;
		v[2] += c;
		v[3] += d;
		v[4] += e;
		v[5] += f;
		v[6] += g;
		v[7] += h;
	}

	const ret = new Uint8Array(digestSizeBytes);
	bigEndian.u32ArrIntoBytesUnsafe(v, ret);
	return ret;
}
