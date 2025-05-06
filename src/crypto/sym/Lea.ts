/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../../endian/platform.js';
import { U32 } from '../../primitive/number/U32Static.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

const blockSize = 16;
// prettier-ignore
const k=[0xc3efe9db, 0x44626b02, 0x79e27c8a, 0x78df30ec, 0x715ea49e, 0xc785da0a, 0xe04ef22a, 0xe5c40957];

abstract class ALea {
    /** Block size in bytes */
	readonly blockSize = blockSize; //128bit
	readonly #keys: Uint32Array[];
    /** Number of rounds */
    readonly rounds: number;
	constructor(rounds: number, keys: Uint32Array[]) {
		this.rounds = rounds;
		this.#keys = keys;
	}

	private _encBlock(data: Uint8Array) {
		const x = new Uint32Array(data.buffer, data.byteOffset, 4);
		asLE.i32(data, 0, 4);
		for (let r = 0; r < this.rounds; r++) {
			const t = x[0];
			x[0] = U32.lRot((x[0] ^ this.#keys[r][0]) + (x[1] ^ this.#keys[r][1]), 9);
			x[1] = U32.rRot((x[1] ^ this.#keys[r][2]) + (x[2] ^ this.#keys[r][3]), 5);
			x[2] = U32.rRot((x[2] ^ this.#keys[r][4]) + (x[3] ^ this.#keys[r][5]), 3);
			x[3] = t;
		}
		asLE.i32(data, 0, 4);
	}

	private _decBlock(data: Uint8Array) {
		const x = new Uint32Array(data.buffer, data.byteOffset, 4);
		asLE.i32(data, 0, 4);
		// prettier-ignore
		for (let r = this.rounds - 1; r >= 0; r--) {
			const cur = x.slice();
			x[0] = cur[3];
			x[1] = (U32.rRot(cur[0], 9) - (x[0] ^ this.#keys[r][0])) ^ this.#keys[r][1];
			x[2] = (U32.lRot(cur[1], 5) - (x[1] ^ this.#keys[r][2])) ^ this.#keys[r][3];
			x[3] = (U32.lRot(cur[2], 3) - (x[2] ^ this.#keys[r][4])) ^ this.#keys[r][5];
		}
		asLE.i32(data, 0, 4);
	}

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#decryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	decryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * blockSize;
		sLen('block', block)
			.atLeast(byteStart + blockSize)
			.throwNot();
		this._decBlock(block.subarray(byteStart, byteStart + blockSize));
	}

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#encryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	encryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * blockSize;
		sLen('block', block)
			.atLeast(byteStart + blockSize)
			.throwNot();
		this._encBlock(block.subarray(byteStart, byteStart + blockSize));
	}
}

/**
 * [Lightweight Encryption Algorithm (LEA) 128](https://seed.kisa.or.kr/kisa/Board/20/detailView.do)
 * ([Wiki](https://en.wikipedia.org/wiki/LEA_(cipher)))
 * 
 * A 128-bit block cipher developed by South Korea in 2013 to provide confidentiality 
 * in high-speed environments such as big data and cloud computing, as well as 
 * lightweight environments such as IoT devices and mobile devices.
 *
 * First published: *2013*  
 * Block size: *16 bytes*  
 * Key Size: *16 bytes*  
 * Nonce size: *0 bytes*  
 * Rounds: *24*
 *
 * Specified in
 * - [ISO/IEC 29192-2:2019](https://www.iso.org/standard/78477.html)
 */
export class Lea128 extends ALea implements IBlockCrypt {
	constructor(key: Uint8Array) {
		sLen('key', key)
			.exactly(128 / 8)
			.throwNot();
		const rounds = 24;
		// keySchedule
		const keys: Uint32Array[] = [];
		const t = new Uint32Array(
			key.buffer,
			key.byteOffset,
			key.length / 4
		).slice();
		for (let i = 0; i < rounds; i++) {
			const dm = k[i % 4];
			t[0] = U32.lRot(t[0] + U32.lRot(dm, i), 1);
			t[1] = U32.lRot(t[1] + U32.lRot(dm, i + 1), 3);
			t[2] = U32.lRot(t[2] + U32.lRot(dm, i + 2), 6);
			t[3] = U32.lRot(t[3] + U32.lRot(dm, i + 3), 11);
			keys.push(Uint32Array.of(t[0], t[1], t[2], t[1], t[3], t[1]));
		}
		super(rounds, keys);
	}
}

/**
 * [Lightweight Encryption Algorithm (LEA) 192](https://seed.kisa.or.kr/kisa/Board/20/detailView.do)
 * ([Wiki](https://en.wikipedia.org/wiki/LEA_(cipher)))
 * 
 * A 128-bit block cipher developed by South Korea in 2013 to provide confidentiality 
 * in high-speed environments such as big data and cloud computing, as well as 
 * lightweight environments such as IoT devices and mobile devices.
 *
 * First published: *2013*  
 * Block size: *16 bytes*  
 * Key Size: *24 bytes*  
 * Nonce size: *0 bytes*  
 * Rounds: *28*
 *
 * Specified in
 * - [ISO/IEC 29192-2:2019](https://www.iso.org/standard/78477.html)
 */
export class Lea192 extends ALea implements IBlockCrypt {
	constructor(key: Uint8Array) {
		sLen('key', key)
			.exactly(192 / 8)
			.throwNot();
		const rounds = 28;
		// keySchedule
		const keys: Uint32Array[] = [];
		const t = new Uint32Array(
			key.buffer,
			key.byteOffset,
			key.length / 4
		).slice();
		for (let i = 0; i < rounds; i++) {
			const dm = k[i % 6];
			t[0] = U32.lRot(t[0] + U32.lRot(dm, i), 1);
			t[1] = U32.lRot(t[1] + U32.lRot(dm, i + 1), 3);
			t[2] = U32.lRot(t[2] + U32.lRot(dm, i + 2), 6);
			t[3] = U32.lRot(t[3] + U32.lRot(dm, i + 3), 11);
			t[4] = U32.lRot(t[4] + U32.lRot(dm, i + 4), 13);
			t[5] = U32.lRot(t[5] + U32.lRot(dm, i + 5), 17);
			keys.push(Uint32Array.of(t[0], t[1], t[2], t[3], t[4], t[5]));
		}
		super(rounds, keys);
	}
}

/**
 * [Lightweight Encryption Algorithm (LEA) 256](https://seed.kisa.or.kr/kisa/Board/20/detailView.do)
 * ([Wiki](https://en.wikipedia.org/wiki/LEA_(cipher)) )
 * 
 * A 128-bit block cipher developed by South Korea in 2013 to provide confidentiality 
 * in high-speed environments such as big data and cloud computing, as well as 
 * lightweight environments such as IoT devices and mobile devices.
 *
 * First published: *2013*  
 * Block size: *16 bytes*  
 * Key Size: *32 bytes*  
 * Nonce size: *0 bytes*  
 * Rounds: *32*
 *
 * Specified in
 * - [ISO/IEC 29192-2:2019](https://www.iso.org/standard/78477.html)
 */
export class Lea256 extends ALea implements IBlockCrypt {
	constructor(key: Uint8Array) {
		sLen('key', key)
			.exactly(256 / 8)
			.throwNot();
		const rounds = 32;
		// keySchedule
		const keys: Uint32Array[] = [];
		const t = new Uint32Array(
			key.buffer,
			key.byteOffset,
			key.length / 4
		).slice();
		for (let i = 0; i < rounds; i++) {
			const dm = k[i % 8];
			const i0 = (6 * i) % 8;
			const i1 = (6 * i + 1) % 8;
			const i2 = (6 * i + 2) % 8;
			const i3 = (6 * i + 3) % 8;
			const i4 = (6 * i + 4) % 8;
			const i5 = (6 * i + 5) % 8;
			t[i0] = U32.lRot(t[i0] + U32.lRot(dm, i), 1);
			t[i1] = U32.lRot(t[i1] + U32.lRot(dm, i + 1), 3);
			t[i2] = U32.lRot(t[i2] + U32.lRot(dm, i + 2), 6);
			t[i3] = U32.lRot(t[i3] + U32.lRot(dm, i + 3), 11);
			t[i4] = U32.lRot(t[i4] + U32.lRot(dm, i + 4), 13);
			t[i5] = U32.lRot(t[i5] + U32.lRot(dm, i + 5), 17);
			keys.push(Uint32Array.of(t[i0], t[i1], t[i2], t[i3], t[i4], t[i5]));
		}
		super(rounds, keys);
	}
}
