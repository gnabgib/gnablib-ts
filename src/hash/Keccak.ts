import * as littleEndian from '../endian/little.js';
import { Uint64 } from '../primitive/Uint64.js';
import * as intExt from '../primitive/IntExt.js';

//https://en.wikipedia.org/wiki/SHA-3
//https://emn178.github.io/online-tools/keccak_224.html (256,384,512, SHA3 224,256,384,512 Shake 128,256)
//https://keccak.team/keccak.html
//https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf
//https://keccak.team/files/Keccak-submission-3.pdf

//These are in pairs to make Uint64s (MSB first to match docs)
//https://keccak.team/files/Keccak-reference-3.0.pdf
const roundConst = [
	0x00000000, 0x00000001, 0x00000000, 0x00008082, 0x80000000, 0x0000808a, 0x80000000, 0x80008000,
	0x00000000, 0x0000808b, 0x00000000, 0x80000001, 0x80000000, 0x80008081, 0x80000000, 0x00008009,
	0x00000000, 0x0000008a, 0x00000000, 0x00000088, 0x00000000, 0x80008009, 0x00000000, 0x8000000a,
	0x00000000, 0x8000808b, 0x80000000, 0x0000008b, 0x80000000, 0x00008089, 0x80000000, 0x00008003,
	0x80000000, 0x00008002, 0x80000000, 0x00000080, 0x00000000, 0x0000800a, 0x80000000, 0x8000000a,
	0x80000000, 0x80008081, 0x80000000, 0x00008080, 0x00000000, 0x80000001, 0x80000000, 0x80008008
];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function rhoGen() {
	// Rho shift: (t+1)(t+2)/2=t^2+3t+2 mod 64
	// https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf#3.2.2
	const ret = [];
	for (let i = 0; i < 24; i++) ret.push(((i * i + 3 * i + 2) / 2) % 64);
	console.log(`const rhoShift=[${ret.join(', ')}];`);
}
const rhoShift = [
	1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44
];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function piGen() {
	//Pi shift: [(x+3y)%5,x]->[x,y]
	//https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf#3.2.3
	const pullFrom = [];
	for (let i = 0; i < 25; i++) {
		const x = i % 5;
		const y = (i / 5) | 0;
		const p = ((x + 3 * y) % 5) + x * 5;
		//Inverse of formula:
		pullFrom[p] = i;
	}
	const ret = [];
	let st = pullFrom[1];
	//Now follow the money
	for (let i = 0; i < 24; i++) {
		ret.push(st);
		st = pullFrom[st];
	}
	console.log(`const piShift=[${ret.join(', ')}];`);
}
const piShift = [
	10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1
];

const rounds = 24;
const maxBlockSizeU64 = 5 * 5;
const maxBlockSizeBytes = maxBlockSizeU64 << 3; //1600 bits,8*5*5=200
const keccak_suffix = 1;
const sha3_suffix = 6;
const shake_suffix = 0x1f;

class Ctx {
	private _ptr = 0;
	private readonly _bytes: Uint8Array;
	private readonly _blockSizeBytes: number;
	private readonly _capacityBytes: number;
	private readonly _digestSizeBytes: number;
	private readonly _suffix: number;

	/**
	 * @param digestSizeBytes Output digest size (bytes)
	 * @param suffix 1 for Keccak, 6 for SHA3, 0x1f/31 for Shake
	 * @param capacityBytes (default digestSize)
	 */
	constructor(digestSizeBytes: number, suffix: number, capacityBytes = 0) {
		intExt.inRangeInclusive(capacityBytes, 0, maxBlockSizeBytes / 2);
		this._bytes = new Uint8Array(maxBlockSizeBytes);
		this._capacityBytes = 2 * (capacityBytes === 0 ? digestSizeBytes : capacityBytes);

		this._digestSizeBytes = digestSizeBytes;
		this._suffix = suffix;
		this._blockSizeBytes = maxBlockSizeBytes - this._capacityBytes;
	}

	update(input: Uint8Array): void {
		for (let i = 0; i < input.length; i++) {
			this._bytes[this._ptr++] ^= input[i];
			if (this._ptr === this._blockSizeBytes) {
				this.absorb();
				this._ptr = 0;
			}
		}
	}

	private absorb(): void {
		//Copy state-bytes into u64
		const st = new Array<Uint64>(maxBlockSizeU64);
		littleEndian.u64IntoArrFromBytes(st, 0, maxBlockSizeU64, this._bytes);

		const bc = new Array<Uint64>(5);
		let t: Uint64;
		for (let r = 0; r < rounds; r++) {
			// Theta
			//unroll: for (let i = 0; i < 5; i++) bc[i]=st[i].xor(st[i+5]).xor(st[i+10]).xor(st[i+15]).xor(st[i+20]);
			bc[0] = st[0].xor(st[5]).xor(st[10]).xor(st[15]).xor(st[20]);
			bc[1] = st[1].xor(st[6]).xor(st[11]).xor(st[16]).xor(st[21]);
			bc[2] = st[2].xor(st[7]).xor(st[12]).xor(st[17]).xor(st[22]);
			bc[3] = st[3].xor(st[8]).xor(st[13]).xor(st[18]).xor(st[23]);
			bc[4] = st[4].xor(st[9]).xor(st[14]).xor(st[19]).xor(st[24]);
			for (let i = 0; i < 5; i++) {
				t = bc[(i + 4) % 5].xor(bc[(i + 1) % 5].lRot(1));
				st[i] = st[i].xor(t);
				st[i + 5] = st[i + 5].xor(t);
				st[i + 10] = st[i + 10].xor(t);
				st[i + 15] = st[i + 15].xor(t);
				st[i + 20] = st[i + 20].xor(t);
			}

			// Rho & Pi
			t = st[1];
			for (let i = 0; i < 24; i++) {
				const j = piShift[i];
				bc[0] = st[j];
				st[j] = t.lRot(rhoShift[i]);
				t = bc[0];
			}

			//  Chi
			for (let j = 0; j < 25; j += 5) {
				//unroll: for (let i = 0; i < 5; i++) bc[i] = st[j + i];
				bc[0] = st[j];
				bc[1] = st[j + 1];
				bc[2] = st[j + 2];
				bc[3] = st[j + 3];
				bc[4] = st[j + 4];
				//unroll: for (let i = 0; i < 5; i++) st[j+i]=st[j+i].xor(bc[(i + 2) % 5].and(bc[(i + 1) % 5].not()));
				st[j] = st[j].xor(bc[2].and(bc[1].not()));
				st[j + 1] = st[j + 1].xor(bc[3].and(bc[2].not()));
				st[j + 2] = st[j + 2].xor(bc[4].and(bc[3].not()));
				st[j + 3] = st[j + 3].xor(bc[0].and(bc[4].not()));
				st[j + 4] = st[j + 4].xor(bc[1].and(bc[0].not()));
			}

			//  Iota
			st[0] = st[0].xor(new Uint64(roundConst[2 * r + 1], roundConst[2 * r]));
		}
		//Copy the data back to state
		littleEndian.u64ArrIntoBytes(st, this._bytes);
	}

	finalize(): Uint8Array {
		//Add the padding
		this._bytes[this._ptr] ^= this._suffix;
		this._bytes[this._blockSizeBytes - 1] ^= 0x80;
		this.absorb();
		//Squeeze
		return this._bytes.slice(0, this._digestSizeBytes);
	}
}

export function keccak(bytes: Uint8Array, digestSizeBytes: number): Uint8Array {
	const ret = new Ctx(digestSizeBytes, keccak_suffix);
	ret.update(bytes);
	return ret.finalize();
}

export function sha3_224(bytes: Uint8Array): Uint8Array {
	const ret = new Ctx(224 / 8, sha3_suffix);
	ret.update(bytes);
	return ret.finalize();
}
export function sha3_256(bytes: Uint8Array): Uint8Array {
	const ret = new Ctx(256 / 8, sha3_suffix);
	ret.update(bytes);
	return ret.finalize();
}
export function sha3_384(bytes: Uint8Array): Uint8Array {
	const ret = new Ctx(384 / 8, sha3_suffix);
	ret.update(bytes);
	return ret.finalize();
}
export function sha3_512(bytes: Uint8Array): Uint8Array {
	const ret = new Ctx(512 / 8, sha3_suffix);
	ret.update(bytes);
	return ret.finalize();
}
export function shake128(bytes: Uint8Array, digestSizeBytes: number): Uint8Array {
	const ret = new Ctx(digestSizeBytes, shake_suffix, 128 / 8);
	ret.update(bytes);
	return ret.finalize();
}
export function shake256(bytes: Uint8Array, digestSizeBytes: number): Uint8Array {
	const ret = new Ctx(digestSizeBytes, shake_suffix, 256 / 8);
	ret.update(bytes);
	return ret.finalize();
}
