/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../../endian/platform.js';
import { U32 } from '../../primitive/number/U32Static.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

const blockSize = 16;
// prettier-ignore
const k=[0xc3efe9db, 0x44626b02, 0x79e27c8a, 0x78df30ec, 0x715ea49e, 0xc785da0a, 0xe04ef22a, 0xe5c40957];

abstract class ALea {
	readonly blockSize = blockSize; //128bit
	readonly #keys: Uint32Array[];
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

export class Lea128 extends ALea implements IBlockCrypt {
    constructor(key:Uint8Array) {
        sLen('key',key).exactly(128/8).throwNot();
        const rounds=24;
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
        super(rounds,keys);
    }
}
export class Lea192 extends ALea implements IBlockCrypt {
    constructor(key:Uint8Array) {
        sLen('key',key).exactly(192/8).throwNot();
        const rounds=28;
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
        super(rounds,keys);
    }
}

/**
 * Lightweight Encryption Algorithm (LEA)
 * ([Wiki](https://en.wikipedia.org/wiki/LEA_(cipher)))
 *
 * First published: *2013*
 * Block size: *16 bytes*
 * Key Size: *16, 24, 32 bytes* 2/3/4 32
 * Nonce size: *0 bytes*
 * Rounds: *24, 28, 32* (key size dependent)
 *
 * Specified in
 * - [ISO/IEC 29192-2:2019](https://www.iso.org/standard/78477.html)
 */
export class Lea128a implements IBlockCrypt {
	readonly blockSize = blockSize; //128bit
	readonly #keys: Uint32Array[];
	//readonly #key: Uint8Array;
	readonly rounds: number;

	constructor(key: Uint8Array) {
		//In theory check size of key for 16/24/32

		// 16 -> 24, 24 -> 28, 32 -> 32
		this.rounds = key.length + (32 - key.length) / 2;
		this.#keys = Lea128._keySchedule128(this.rounds, key);
	}

	private static _keySchedule128(
		rounds: number,
		key: Uint8Array
	): Uint32Array[] {
		const ret: Uint32Array[] = [];
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
			ret.push(Uint32Array.of(t[0], t[1], t[2], t[1], t[3], t[1]));
		}
		return ret;
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
