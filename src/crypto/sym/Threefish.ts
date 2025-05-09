/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64Mut, U64MutArray } from '../../primitive/number/U64.js';
import { sLen } from '../../safe/safe.js';
import { IBlockCrypt } from '../interfaces/IBlockCrypt.js';

const rounds = 72;
/** Seemingly arbitrary constant C */
const C = U64.fromI32s(0xa9fc1a22, 0x1bd11bda);

abstract class AThreefish {
	/** Block size in bytes */
	readonly blockSize: number;
	/** Round Key */
	readonly #rk: U64MutArray[];

	constructor(blockSize: number, key: Uint8Array, tweak: Uint8Array) {
		this.blockSize = blockSize;
		sLen('key', key).exactly(blockSize).throwNot();
		sLen('tweak', tweak).exactly(16).throwNot();

		const k32 = new Uint32Array(key.buffer, key.byteOffset, key.length / 4);
		const k64 = U64MutArray.mount(k32);
		const n = blockSize / 8;
		const k = U64MutArray.fromLen(n + 1);
		k.set(k64);

		const parity = k.at(n);
		for (let i = 0; i < n; i++) parity.xorEq(k.at(i));
		parity.xorEq(C);

		const t32 = new Uint32Array(tweak.buffer, tweak.byteOffset, 4);
		const t64 = U64MutArray.mount(t32);
		const t = U64MutArray.fromLen(3);
		t.set(t64);
		t.at(2).set(t.at(1)).xorEq(t.at(0));

		const rk: U64MutArray[] = [];
		const rkn = rounds / 4;
		for (let s = 0; s <= rkn; s++) {
			const l = U64MutArray.fromLen(n);
			for (let i = 0; i < n; i++) {
				l.at(i).set(k.at((s + i) % (n + 1)));
				switch (i) {
					case n - 3:
						l.at(i).addEq(t.at(s % 3));
						break;
					case n - 2:
						l.at(i).addEq(t.at((s + 1) % 3));
						break;
					case n - 1:
						l.at(i).addEq(U64.fromInt(s));
						break;
				}
			}
			rk.push(l);
		}
		this.#rk = rk;
		// console.log(`k=${k.at(0).toString().toLowerCase()} ${k.at(1).toString().toLowerCase()} ${k.at(2).toString().toLowerCase()} ${k.at(3).toString().toLowerCase()} ${k.at(4).toString().toLowerCase()}`)
		// console.log(`t=${t.at(0).toString().toLowerCase()} ${t.at(1).toString().toLowerCase()} ${t.at(2).toString().toLowerCase()}`)
		// for(let i=0;i<rk.length;i++) {
		//     let ret='';
		//     for(let j=0;j<rk[i].length;j++)
		//         ret+=rk[i].at(j).toString()+' ';
		//     console.log(`[${ret}]`)
		// }
		//console.log(rk);
	}

	protected addRk(d: U64MutArray, idx: number) {
		d.at(0).addEq(this.#rk[idx].at(0));
		d.at(1).addEq(this.#rk[idx].at(1));
		d.at(2).addEq(this.#rk[idx].at(2));
		d.at(3).addEq(this.#rk[idx].at(3));
	}
	protected subRk(d: U64MutArray, idx: number) {
		d.at(0).subEq(this.#rk[idx].at(0));
		d.at(1).subEq(this.#rk[idx].at(1));
		d.at(2).subEq(this.#rk[idx].at(2));
		d.at(3).subEq(this.#rk[idx].at(3));
	}

	protected abstract _encBlock(data: Uint8Array): void;
	protected abstract _decBlock(data: Uint8Array): void;

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#encryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	encryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * this.blockSize;
		sLen('block', block)
			.atLeast(byteStart + this.blockSize)
			.throwNot();
		this._encBlock(block.subarray(byteStart, byteStart + this.blockSize));
	}

	/**
	 * {@inheritDoc interfaces.IBlockCrypt#decryptBlock}
	 *
	 * @throws {@link error.NotEnoughSpaceError}
	 * If there's not enough bytes in `block` (`offset+1`*`blockSize`)
	 */
	decryptBlock(block: Uint8Array, offset = 0): void {
		const byteStart = offset * this.blockSize;
		sLen('block', block)
			.atLeast(byteStart + this.blockSize)
			.throwNot();
		this._decBlock(block.subarray(byteStart, byteStart + this.blockSize));
	}
}

export class Threefish256 extends AThreefish implements IBlockCrypt {
	constructor(key: Uint8Array, tweak: Uint8Array) {
		super(32, key, tweak);
	}

	protected _encBlock(data: Uint8Array) {
		const d64 = U64MutArray.mount(
			new Uint32Array(data.buffer, data.byteOffset, data.length / 4)
		);
		const t = U64Mut.fromInt(0);
		const swap13 = () => {
			t.set(d64.at(1));
			d64.at(1).set(d64.at(3));
			d64.at(3).set(t);
		};
		///*DBUG*/const log=()=>console.log(d64.at(0).toString().toLowerCase()+' '+d64.at(1).toString().toLowerCase()+' '+d64.at(2).toString().toLowerCase()+' '+d64.at(3).toString().toLowerCase());
		const rn = rounds / 4;
		let r = 0;
		do {
			//Even round
			//Add roundkey
			this.addRk(d64, r++);
			///*DBUG*/log();

			//Mix and permute
			d64.at(0).addEq(d64.at(1));
			d64.at(1).lRotEq(14).xorEq(d64.at(0));
			d64.at(2).addEq(d64.at(3));
			d64.at(3).lRotEq(16).xorEq(d64.at(2));
			swap13();
			///*DBUG*/log();

			d64.at(0).addEq(d64.at(1));
			d64.at(1).lRotEq(52).xorEq(d64.at(0));
			d64.at(2).addEq(d64.at(3));
			d64.at(3).lRotEq(57).xorEq(d64.at(2));
			swap13();
			///*DBUG*/log();

			d64.at(0).addEq(d64.at(1));
			d64.at(1).lRotEq(23).xorEq(d64.at(0));
			d64.at(2).addEq(d64.at(3));
			d64.at(3).lRotEq(40).xorEq(d64.at(2));
			swap13();
			///*DBUG*/log();

			d64.at(0).addEq(d64.at(1));
			d64.at(1).lRotEq(5).xorEq(d64.at(0));
			d64.at(2).addEq(d64.at(3));
			d64.at(3).lRotEq(37).xorEq(d64.at(2));
			swap13();
			///*DBUG*/log();

			//Odd Round
			//Add roundkey
			this.addRk(d64, r++);
			///*DBUG*/log();

			//Mix and permute
			d64.at(0).addEq(d64.at(1));
			d64.at(1).lRotEq(25).xorEq(d64.at(0));
			d64.at(2).addEq(d64.at(3));
			d64.at(3).lRotEq(33).xorEq(d64.at(2));
			swap13();
			///*DBUG*/log();

			d64.at(0).addEq(d64.at(1));
			d64.at(1).lRotEq(46).xorEq(d64.at(0));
			d64.at(2).addEq(d64.at(3));
			d64.at(3).lRotEq(12).xorEq(d64.at(2));
			swap13();
			///*DBUG*/log();

			d64.at(0).addEq(d64.at(1));
			d64.at(1).lRotEq(58).xorEq(d64.at(0));
			d64.at(2).addEq(d64.at(3));
			d64.at(3).lRotEq(22).xorEq(d64.at(2));
			swap13();
			///*DBUG*/log();

			d64.at(0).addEq(d64.at(1));
			d64.at(1).lRotEq(32).xorEq(d64.at(0));
			d64.at(2).addEq(d64.at(3));
			d64.at(3).lRotEq(32).xorEq(d64.at(2));
			swap13();
			///*DBUG*/log();
			///*DBUG*/console.log(" ");
		} while (r < rn);
		//Final round key
		this.addRk(d64, r);
		///*DBUG*/log();
	}

	protected _decBlock(data: Uint8Array) {
		const d64 = U64MutArray.mount(
			new Uint32Array(data.buffer, data.byteOffset, data.length / 4)
		);
		const t = U64Mut.fromInt(0);
		///*DBUG*/const log=()=>console.log(d64.at(0).toString().toLowerCase()+' '+d64.at(1).toString().toLowerCase()+' '+d64.at(2).toString().toLowerCase()+' '+d64.at(3).toString().toLowerCase());
		const swap13 = () => {
			t.set(d64.at(1));
			d64.at(1).set(d64.at(3));
			d64.at(3).set(t);
		};
		let r = rounds / 4;
		this.subRk(d64, r--);
		do {
			// Four rounds of permute and unmix
			swap13();
			d64.at(3).xorEq(d64.at(2)).rRotEq(32);
			d64.at(2).subEq(d64.at(3));
			d64.at(1).xorEq(d64.at(0)).rRotEq(32);
			d64.at(0).subEq(d64.at(1));
			///*DBUG*/log();

			swap13();
			d64.at(3).xorEq(d64.at(2)).rRotEq(22);
			d64.at(2).subEq(d64.at(3));
			d64.at(1).xorEq(d64.at(0)).rRotEq(58);
			d64.at(0).subEq(d64.at(1));
			///*DBUG*/log();

			swap13();
			d64.at(3).xorEq(d64.at(2)).rRotEq(12);
			d64.at(2).subEq(d64.at(3));
			d64.at(1).xorEq(d64.at(0)).rRotEq(46);
			d64.at(0).subEq(d64.at(1));
			///*DBUG*/log();

			swap13();
			d64.at(3).xorEq(d64.at(2)).rRotEq(33);
			d64.at(2).subEq(d64.at(3));
			d64.at(1).xorEq(d64.at(0)).rRotEq(25);
			d64.at(0).subEq(d64.at(1));
			///*DBUG*/log();

			// Subtract round key
			this.subRk(d64, r--);
			///*DBUG*/log();

			// Four rounds of permute and unmix
			swap13();
			d64.at(3).xorEq(d64.at(2)).rRotEq(37);
			d64.at(2).subEq(d64.at(3));
			d64.at(1).xorEq(d64.at(0)).rRotEq(5);
			d64.at(0).subEq(d64.at(1));
			///*DBUG*/log();

			swap13();
			d64.at(3).xorEq(d64.at(2)).rRotEq(40);
			d64.at(2).subEq(d64.at(3));
			d64.at(1).xorEq(d64.at(0)).rRotEq(23);
			d64.at(0).subEq(d64.at(1));
			///*DBUG*/log();

			swap13();
			d64.at(3).xorEq(d64.at(2)).rRotEq(57);
			d64.at(2).subEq(d64.at(3));
			d64.at(1).xorEq(d64.at(0)).rRotEq(52);
			d64.at(0).subEq(d64.at(1));
			///*DBUG*/log();

			swap13();
			d64.at(3).xorEq(d64.at(2)).rRotEq(16);
			d64.at(2).subEq(d64.at(3));
			d64.at(1).xorEq(d64.at(0)).rRotEq(14);
			d64.at(0).subEq(d64.at(1));
			///*DBUG*/log();

			this.subRk(d64, r--);
			///*DBUG*/log();
			///*DBUG*/console.log('');
		} while (r >= 0);
	}
}
