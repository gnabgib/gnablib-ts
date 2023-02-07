import * as bigEndian from '../endian/big';
import * as bitExt from '../primitive/BitExt';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as hex from '../encoding/Hex';
import { SizeError } from '../primitive/ErrorExt';
import { Uint64 } from '../primitive/Uint64';
import { iv, n, sigmas } from './_blake';

const digestSizeBytes = 64; //512 bits
const blockSizeBytes = 128; //1024bits
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const b64rounds = 14; //Blake64 was submitted with 14 rounds, then increased to 16 and renamed blake512
const b512rounds = 16;

//https://en.wikipedia.org/wiki/BLAKE_(hash_function)
//https://ehash.iaik.tugraz.at/uploads/0/06/Blake.pdf

function pad(bytes: Uint8Array): Uint8Array {
	//Require space is actually 1 more bit than this.. is this going to bite us?
	//While these are similar because of JS limitations - we might be able to set the 4th and 3rd largest
	// u64 for size one day (or in a 128bit system)
	const u128SizeBytes = 2 * bitExt.size64Bytes;
	const reqSpace = u128SizeBytes;
	const len =
		bytes.length + reqSpace + blockSizeBytes - ((bytes.length + reqSpace) % blockSizeBytes);
	const padBytes = new Uint8Array(len);
	padBytes.set(bytes, 0);
	//Add a 1 on the end
	padBytes[bytes.length] = 0x80;
	//And end with a 1
	padBytes[len - u128SizeBytes - 1] |= 1;
	//And append the length
	bigEndian.u32IntoBytes((bytes.length / 0x20000000) | 0, padBytes, len - bitExt.size64Bytes);
	//We can't bit-shift down length because of the 32 bit limitation of bit logic, so we divide by 2^29
	bigEndian.u32IntoBytes(bytes.length << 3, padBytes, len - bitExt.size32Bytes);
	return padBytes;
}

function g(
	i: number,
	b: number,
	c: number,
	d: number,
	v: Uint64[],
	m: Uint64[],
	sigma: number[]
): void {
	const a = i & 3, //% 4
		i2 = i << 1,
		j = sigma[i2],
		k = sigma[i2 + 1],
		//Note inverted order of uint constructor (little endian :|)
		nj = new Uint64(n[2 * j + 1], n[2 * j]),
		nk = new Uint64(n[2 * k + 1], n[2 * k]), // n[k],
		mj = m[j],
		mk = m[k];

	//Step 1
	v[a] = v[a].add(v[b]).add(mj.xor(nk)); //a ← a + b + (m[j] ⊕ n[k])
	v[d] = v[d].xor(v[a]).rRot(32); //d ← (d ⊕ a) >>> 32
	//Step 2
	v[c] = v[c].add(v[d]); //c ← c + d
	v[b] = v[b].xor(v[c]).rRot(25); //b ← (b ⊕ c) >>> 25
	//Step 3
	v[a] = v[a].add(v[b]).add(mk.xor(nj)); //a ← a + b + (m[k] ⊕ n[j])
	v[d] = v[d].xor(v[a]).rRot(16); //d ← (d ⊕ a) >>> 16
	//Step 4
	v[c] = v[c].add(v[d]); //c ← c + d
	v[b] = v[b].xor(v[c]).rRot(11); //b ← (b ⊕ c) >>> 11
}

function compress(h: Uint64[], m: Uint64[], counter: number, salt: Uint64[]): void {
	const count64a = new Uint64(counter, (counter / 0x100000000) | 0);
	//const count64b=0;//The counter can never be > a JS number (53 bits) so this will always be 0
	const v = new Array<Uint64>(16);
	let i = 0;
	for (; i < 8; i++) v[i] = h[i];
	//Note inverted order of uint constructor (little endian :|)
	v[8] = new Uint64(n[1], n[0]).xor(salt[0]);
	v[9] = new Uint64(n[3], n[2]).xor(salt[1]);
	v[10] = new Uint64(n[5], n[4]).xor(salt[2]);
	v[11] = new Uint64(n[7], n[6]).xor(salt[3]);
	v[12] = new Uint64(n[9], n[8]).xor(count64a);
	v[13] = new Uint64(n[11], n[10]).xor(count64a);
	v[14] = new Uint64(n[13], n[12]); //.xor(count64b);
	v[15] = new Uint64(n[15], n[14]); //.xor(count64b);

	// console.log(`m=${hex.fromU64s(m,' ')}`);
	// console.log(`vi=${hex.fromU64s(v,' ')}`);
	for (let r = 0; r < b512rounds; r++) {
		const sigma = sigmas[r % 10];
		//column
		g(0, 4, 8, 12, v, m, sigma);
		g(1, 5, 9, 13, v, m, sigma);
		g(2, 6, 10, 14, v, m, sigma);
		g(3, 7, 11, 15, v, m, sigma);

		//diagonal
		g(4, 5, 10, 15, v, m, sigma);
		g(5, 6, 11, 12, v, m, sigma);
		g(6, 7, 8, 13, v, m, sigma);
		g(7, 4, 9, 14, v, m, sigma);
		//console.log(`v${r+1}=${hex.fromU64s(v,' ')}`);
	}

	for (i = 0; i < 8; i++) {
		h[i] = h[i]
			.xor(salt[i & 3])
			.xor(v[i])
			.xor(v[i + 8]);
	}
}

/**
 * Perform a blake-64 hash with 16 rounds (aka blake-512 hash)
 * @param bytes Uint8Array Data to hash
 * @param salt Uint64[4]|undefined must be 4 uint64 long if specified (defaults to zeros)
 * @returns hash Uint8Array[64]
 */
export function blake512(bytes: Uint8Array, salt?: Uint64[]): Uint8Array {
	if (salt) {
		if (salt.length != 4) throw new SizeError('salt', salt.length, 4);
	} else {
		salt = new Array<Uint64>(new Uint64(0), new Uint64(0), new Uint64(0), new Uint64(0));
	}
	const paddedBytes = pad(bytes);
	//console.log(`pad ${hex.fromBytes(paddedBytes)}`);
	const m = new Array<Uint64>(16);
	const chain = new Array<Uint64>(8);
	let i = 0;
	for (; i < 8; i++) chain[i] = new Uint64(iv[2 * i + 1], iv[2 * i]);
	const lastBlock = paddedBytes.length - blockSizeBytes;
	const bitLen = bytes.length << 3;
	const bitLenMod1024 = bitLen & 0x3ff;
	const lastL = bitLenMod1024 > 894 || bitLenMod1024 === 0 ? 0 : bitLen;
	//console.log(`lastL ${lastL} ${bitLenMod1024}`);
	for (i = 0; i < paddedBytes.length; i += blockSizeBytes) {
		//Get message
		bigEndian.u64IntoArrFromBytes(m, 0, 16, paddedBytes, i);

		compress(
			chain,
			m,
			i == lastBlock ? lastL : Math.min(bytes.length, i + blockSizeBytes) << 3,
			salt
		);
	}

	const ret = new Uint8Array(digestSizeBytes);
	//We can use unsafe because we just sized it accurately
	bigEndian.u64ArrIntoBytesUnsafe(chain, ret);
	return ret;
}
