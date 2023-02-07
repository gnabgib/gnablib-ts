import * as bigEndian from '../endian/big';
import { Uint64 } from '../primitive/Uint64';
import * as hex from '../encoding/Hex';

//https://en.wikipedia.org/wiki/Whirlpool_(hash_function)
//https://web.archive.org/web/20171129084214/http://www.larc.usp.br/~pbarreto/WhirlpoolPage.html
//https://github.com/angeal185/whirlpool-js/blob/master/dist/whirlpool-js.js
//https://github.com/jzelinskie/whirlpool/blob/master/whirlpool.go
//https://www2.seas.gwu.edu/~poorvi/Classes/CS381_2007/Whirlpool.pdf

//Favour compact size (means building roundConstants and circulant table on first run)
const blockSizeBytes = 64; //512bits
const blockSizeU64 = blockSizeBytes >> 3;
const rounds = 10;
const substitutionBox = new Uint8Array([
	//block 0
	0x18, 0x23, 0xc6, 0xe8, 0x87, 0xb8, 0x01, 0x4f, 0x36, 0xa6, 0xd2, 0xf5, 0x79, 0x6f, 0x91, 0x52,
	0x60, 0xbc, 0x9b, 0x8e, 0xa3, 0x0c, 0x7b, 0x35, 0x1d, 0xe0, 0xd7, 0xc2, 0x2e, 0x4b, 0xfe, 0x57,
	0x15, 0x77, 0x37, 0xe5, 0x9f, 0xf0, 0x4a, 0xda, 0x58, 0xc9, 0x29, 0x0a, 0xb1, 0xa0, 0x6b, 0x85,
	0xbd, 0x5d, 0x10, 0xf4, 0xcb, 0x3e, 0x05, 0x67, 0xe4, 0x27, 0x41, 0x8b, 0xa7, 0x7d, 0x95, 0xd8,
	//block 1
	0xfb, 0xee, 0x7c, 0x66, 0xdd, 0x17, 0x47, 0x9e, 0xca, 0x2d, 0xbf, 0x07, 0xad, 0x5a, 0x83, 0x33,
	0x63, 0x02, 0xaa, 0x71, 0xc8, 0x19, 0x49, 0xd9, 0xf2, 0xe3, 0x5b, 0x88, 0x9a, 0x26, 0x32, 0xb0,
	0xe9, 0x0f, 0xd5, 0x80, 0xbe, 0xcd, 0x34, 0x48, 0xff, 0x7a, 0x90, 0x5f, 0x20, 0x68, 0x1a, 0xae,
	0xb4, 0x54, 0x93, 0x22, 0x64, 0xf1, 0x73, 0x12, 0x40, 0x08, 0xc3, 0xec, 0xdb, 0xa1, 0x8d, 0x3d,
	//block 2
	0x97, 0x00, 0xcf, 0x2b, 0x76, 0x82, 0xd6, 0x1b, 0xb5, 0xaf, 0x6a, 0x50, 0x45, 0xf3, 0x30, 0xef,
	0x3f, 0x55, 0xa2, 0xea, 0x65, 0xba, 0x2f, 0xc0, 0xde, 0x1c, 0xfd, 0x4d, 0x92, 0x75, 0x06, 0x8a,
	0xb2, 0xe6, 0x0e, 0x1f, 0x62, 0xd4, 0xa8, 0x96, 0xf9, 0xc5, 0x25, 0x59, 0x84, 0x72, 0x39, 0x4c,
	0x5e, 0x78, 0x38, 0x8c, 0xd1, 0xa5, 0xe2, 0x61, 0xb3, 0x21, 0x9c, 0x1e, 0x43, 0xc7, 0xfc, 0x04,
	//block 3
	0x51, 0x99, 0x6d, 0x0d, 0xfa, 0xdf, 0x7e, 0x24, 0x3b, 0xab, 0xce, 0x11, 0x8f, 0x4e, 0xb7, 0xeb,
	0x3c, 0x81, 0x94, 0xf7, 0xb9, 0x13, 0x2c, 0xd3, 0xe7, 0x6e, 0xc4, 0x03, 0x56, 0x44, 0x7f, 0xa9,
	0x2a, 0xbb, 0xc1, 0x53, 0xdc, 0x0b, 0x9d, 0x6c, 0x31, 0x74, 0xf6, 0x46, 0xac, 0x89, 0x14, 0xe1,
	0x16, 0x3a, 0x69, 0x09, 0x70, 0xb6, 0xd0, 0xed, 0xcc, 0x42, 0x98, 0xa4, 0x28, 0x5c, 0xf8, 0x86
]);

const circulantTable = new Array<Uint64>(8 * 256);
const roundConstants = new Array<Uint64>(rounds);

function init() {
	for (let x = 0; x < 256; x++) {
		const v1 = substitutionBox[x];
		let v2 = v1 << 1;
		if (v2 >= 0x100) v2 ^= 0x11d;
		let v4 = v2 << 1;
		if (v4 >= 0x100) v4 ^= 0x11d;
		const v5 = v4 ^ v1;
		let v8 = v4 << 1;
		if (v8 >= 0x100) v8 ^= 0x11d;
		const v9 = v8 ^ v1;
		circulantTable[x] = new Uint64(
			((v8 << 24) | (v5 << 16) | (v2 << 8) | v9) >>> 0,
			((v1 << 24) | (v1 << 16) | (v4 << 8) | v1) >>> 0
		);
		for (let t = 1; t < 8; t++) {
			circulantTable[(t << 8) | x] = circulantTable[((t - 1) << 8) | x].rRot(8);
		}
	}

	for (let r = 0; r < rounds; r++) {
		let r8 = r << 3;
		roundConstants[r] = circulantTable[r8++]
			.and(new Uint64(0, 0xff000000))
			.xor(circulantTable[(1 << 8) | r8++].and(new Uint64(0, 0x00ff0000)))
			.xor(circulantTable[(2 << 8) | r8++].and(new Uint64(0, 0x0000ff00)))
			.xor(circulantTable[(3 << 8) | r8++].and(new Uint64(0, 0x000000ff)))
			.xor(circulantTable[(4 << 8) | r8++].and(new Uint64(0xff000000, 0)))
			.xor(circulantTable[(5 << 8) | r8++].and(new Uint64(0x00ff0000, 0)))
			.xor(circulantTable[(6 << 8) | r8++].and(new Uint64(0x0000ff00, 0)))
			.xor(circulantTable[(7 << 8) | r8].and(new Uint64(0x000000ff, 0)));
	}
}
init();

class Ctx {
	private _countBytes = new Uint64(0);
	private _ptr = 0;
	private readonly _buff = new Uint8Array(blockSizeBytes);
	private readonly _hash = new Array<Uint64>(blockSizeU64);

	constructor() {
		for (let i = 0; i < blockSizeU64; i++) {
			this._hash[i] = new Uint64(0);
		}
	}

	private transform() {
		const state = new Array<Uint64>(blockSizeU64);
		const w = new Array<Uint64>(blockSizeU64);
		const K = new Array<Uint64>(blockSizeU64);
		const L = new Array<Uint64>(blockSizeU64);
		bigEndian.u64IntoArrFromBytes(w, 0, 8, this._buff);

		//Initialize K and state
		for (let i = 0; i < 8; i++) {
			K[i] = this._hash[i];
			state[i] = w[i].xor(K[i]);
		}
		for (let r = 0; r < rounds; r++) {
			for (let i = 0; i < 8; i++) {
				// //Loop unroll:
				// L[i] = new Uint64(0);
				// for (let t = 0; t < 8; t++) {
				// 	const s=56-(t<<3);
				// 	const ctPos=t<<8|((K[(i - t) & 7].rRot(s)).lowU32 & 0xff);
				//     L[i]=L[i].xor(circulantTable[ctPos]);
				// }
				L[i] = circulantTable[K[i].rShift(56).lowU32 & 0xff]
					.xor(circulantTable[256 | (K[(i - 1) & 7].rShift(48).lowU32 & 0xff)])
					.xor(circulantTable[512 | (K[(i - 2) & 7].rShift(40).lowU32 & 0xff)])
					.xor(circulantTable[768 | (K[(i - 3) & 7].rShift(32).lowU32 & 0xff)])
					.xor(circulantTable[1024 | (K[(i - 4) & 7].rShift(24).lowU32 & 0xff)])
					.xor(circulantTable[1280 | (K[(i - 5) & 7].rShift(16).lowU32 & 0xff)])
					.xor(circulantTable[1536 | (K[(i - 6) & 7].rShift(8).lowU32 & 0xff)])
					.xor(circulantTable[1792 | (K[(i - 7) & 7].lowU32 & 0xff)]);
			}
			L[0] = L[0].xor(roundConstants[r]);
			for (let i = 0; i < 8; i++) {
				//Update K for next round, because L used K we need to do this separately
				K[i] = L[i];

				// //Loop unroll:
				// L[i]=K[i];
				// for (let t = 0; t < 8; t++) {
				// 	const s=56-(t<<3);
				// 	const ctPos=t<<8|((state[(i - t) & 7].rRot(s)).lowU32 & 0xff);
				// 	L[i]=L[i].xor(circulantTable[ctPos]);
				// }
				L[i] = L[i]
					.xor(circulantTable[state[i].rShift(56).lowU32 & 0xff])
					.xor(circulantTable[256 | (state[(i - 1) & 7].rShift(48).lowU32 & 0xff)])
					.xor(circulantTable[512 | (state[(i - 2) & 7].rShift(40).lowU32 & 0xff)])
					.xor(circulantTable[768 | (state[(i - 3) & 7].rShift(32).lowU32 & 0xff)])
					.xor(circulantTable[1024 | (state[(i - 4) & 7].rShift(24).lowU32 & 0xff)])
					.xor(circulantTable[1280 | (state[(i - 5) & 7].rShift(16).lowU32 & 0xff)])
					.xor(circulantTable[1536 | (state[(i - 6) & 7].rShift(8).lowU32 & 0xff)])
					.xor(circulantTable[1792 | (state[(i - 7) & 7].lowU32 & 0xff)]);
			}
			//Because L used state, we need to do this separately
			for (let i = 0; i < 8; i++) {
				state[i] = L[i];
			}
		}
		//Apply the Miyaguchi-Preneel compression function:
		for (let i = 0; i < 8; i++) {
			this._hash[i] = this._hash[i].xor(state[i].xor(w[i]));
		}
	}

	update(input: Uint8Array): void {
		let i = 0;
		if (this._ptr === 0) {
			const safeLen = ((input.length / blockSizeBytes) | 0) * blockSizeBytes;
			for (; i < safeLen; i += blockSizeBytes) {
				this._buff.set(input.slice(i, blockSizeBytes));
				this._countBytes = this._countBytes.addNumber(blockSizeBytes);
				this.transform();
			}
		}

		for (; i < input.length; i++) {
			this._buff[this._ptr++] = input[i];
			this._countBytes = this._countBytes.addNumber(1);

			if (this._ptr === blockSizeBytes) {
				this.transform();
				this._ptr = 0;
			}
		}
	}

	finalize(): Uint8Array {
		this._buff[this._ptr++] = 0x80;
		if (this._ptr > 32) {
			this._buff.set(new Uint8Array(64 - this._ptr), this._ptr);
			this.transform();
			this._ptr = 0;
		}
		//Set rest of this block to zero
		this._buff.set(new Uint8Array(64 - this._ptr), this._ptr);
		//Multiply the count (in bytes) by 8  to get bit-count
		//Uint64.fromBytes
		bigEndian.u64IntoBytes(this._countBytes.rShift(61), this._buff, 64 - 16);
		bigEndian.u64IntoBytes(this._countBytes.lShift(3), this._buff, 64 - 8);
		this.transform();
		this._ptr = 0;

		const ret = new Uint8Array(blockSizeBytes);
		bigEndian.u64ArrIntoBytesUnsafe(this._hash, ret);
		return ret;
	}
}

export function whirlpool(bytes: Uint8Array): Uint8Array {
	const ctx = new Ctx();
	ctx.update(bytes);
	return ctx.finalize();
}
