import * as bigEndian from '../endian/big';
import * as bitExt from '../primitive/BitExt';
import { iv384, k, pad } from './_Sha2';
import { Uint64 } from '../primitive/Uint64';

const digestSizeBytes = bitExt.size64Bytes * 6; //384bits
const blockSizeBytes = 128; //1024 bits
const wSize = 80;

export function sha2_384(bytes: Uint8Array): Uint8Array {
	const paddedBytes = pad(bytes, blockSizeBytes);

	const v = new Array<Uint64>(8);
	for (let i = 0; i < 16; i += 2) v[i >> 1] = new Uint64(iv384[i + 1], iv384[i]);

	const w = new Array<Uint64>(wSize);
	for (let i = 0; i < paddedBytes.length; i += blockSizeBytes) {
		//Copy
		bigEndian.u64IntoArrFromBytes(w, 0, 16, paddedBytes, i);

		//Expand
		let j = 16;
		for (; j < wSize; j++) {
			const w15 = w[j - 15];
			const w2 = w[j - 2];
			const s0 = w15.rRot(1).xor(w15.rRot(8)).xor(w15.rShift(7));
			const s1 = w2.rRot(19).xor(w2.rRot(61)).xor(w2.rShift(6));
			w[j] = w[j - 16]
				.add(s0)
				.add(w[j - 7])
				.add(s1);
		}

		let a = v[0],
			b = v[1],
			c = v[2],
			d = v[3],
			e = v[4],
			f = v[5],
			g = v[6],
			h = v[7];

		for (j = 0; j < wSize; j++) {
			const kU64 = new Uint64(k[j * 2 + 1], k[j * 2]);
			const s1 = e.rRot(14).xor(e.rRot(18)).xor(e.rRot(41));
			const ch = g.xor(e.and(f.xor(g))); //Same as MD4-r1
			const temp1 = h.add(s1).add(ch).add(kU64).add(w[j]);

			const s0 = a.rRot(28).xor(a.rRot(34)).xor(a.rRot(39));
			const maj = a.xor(b).and(c).xor(a.and(b)); //Similar to MD4-r2 (| -> ^)
			const temp2 = s0.add(maj);

			(h = g),
				(g = f),
				(f = e),
				(e = d.add(temp1)),
				(d = c),
				(c = b),
				(b = a),
				(a = temp1.add(temp2));
		}
		v[0] = v[0].add(a);
		v[1] = v[1].add(b);
		v[2] = v[2].add(c);
		v[3] = v[3].add(d);
		v[4] = v[4].add(e);
		v[5] = v[5].add(f);
		v[6] = v[6].add(g);
		v[7] = v[7].add(h);
	}

	const ret = new Uint8Array(digestSizeBytes);
	bigEndian.u64ArrIntoBytesUnsafe(v.slice(0, 6), ret);
	return ret;
}
