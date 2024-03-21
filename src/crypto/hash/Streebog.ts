/*! Copyright 2023-2024 the gnablib contributors MPL-1.1 */

import { somewhatSafe } from '../../safe/safe.js';

const blockSize256Bytes = 32; //512bits
const blockSize512Bytes = 64; //512bits

class Ctx {
	private readonly _buff = new Uint8Array(blockSize512Bytes);
	private readonly _hash = new Uint8Array(blockSize512Bytes);
	private readonly _h = new Uint8Array(blockSize512Bytes);
	private readonly _n = new Uint8Array(blockSize512Bytes);
	private readonly _signma = new Uint8Array(blockSize512Bytes);
	private readonly _digestSizeBytes;

	constructor(digestSize256: number) {
		somewhatSafe.int.inRangeInc('digestSize256',digestSize256,1,2);
		this._digestSizeBytes = digestSize256 * 256;
		if (digestSize256 === 1) {
			for (let i = 0; i < blockSize512Bytes; i++) this._h[i] = 0x01;
		}
		//Else: all zeros
	}

	// finalize(): Uint8Array {
	// 	// //stage3(CTX);
	// 	// CTX->bufsize = 0;
	// 	// if (CTX->digest_size == 256)
	// 	//     memcpy(digest, &(CTX->hash.QWORD[4]), 32);
	// 	// else
	// 	//     memcpy(digest, &(CTX->hash.QWORD[0]), 64);
	// }
	// size_t bufsize;
	// unsigned int digest_size;
}

export function streebog512(bytes: Uint8Array): Uint8Array {
	const ret = new Uint8Array(blockSize512Bytes);
	return ret;
	// GOST34112012Init(CTX, 512);
	// GOST34112012Update(CTX, in, (size_t) inlen);
	// GOST34112012Final(CTX, out);

	// const ctx = new Ctx();
	// ctx.update(bytes);
	// return ctx.finalize();
}
