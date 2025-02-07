/*! Copyright 2023-2025 the gnablib contributors MPL-1.1 */

import { asLE } from '../endian/platform.js';
import { U32 } from '../primitive/number/U32Static.js';
import { U64, U64Mut, U64MutArray } from '../primitive/number/U64.js';
import { AHashsum64 } from './_AHashsum64.js';

//https://www.pelock.com/products/hash-calculator

const blockSizeEls = 4;
const p64_1 = U64.fromI32s(0x85ebca87, 0x9e3779b1); //11400714785074694791
const p64_2 = U64.fromI32s(0x27d4eb4f, 0xc2b2ae3d); //14029467366897019727
const p64_3 = U64.fromI32s(0x9e3779f9, 0x165667b1); //1609587929392839161
const p64_4 = U64.fromI32s(0xc2b2ae63, 0x85ebca77); //9650029242287828579
const p64_5 = U64.fromI32s(0x165667c5, 0x27d4eb2f); //2870177450012600261

/**
 * XxHash64 generates a 64bit hashsum of a stream of data.  Described in
 * [xxHash](https://cyan4973.github.io/xxHash/)
 * 
 * Related:
 * - Also available as a {@link XxHash32 |32bit} checksum
 * 
 * @example
 * ```js
 * import { XxHash64 } from 'gnablib/checksum';
 * import { hex, utf8 } from 'gnablib/codec';
 *
 * const sum=new XxHash64();
 * sum.write(utf8.toBytes('message digest'));
 * console.log(hex.fromBytes(sum.sum()));// 0x066ED728FCEEB3BE
 * ```
 */
export class XxHash64 extends AHashsum64 {
	/** Runtime state of the hash */
	private readonly _state = U64MutArray.fromLen(blockSizeEls);
	/** Temp processing block */
	private readonly _b64 = U64MutArray.fromBytes(this._b8.buffer);
	/** Starting seed */
	private readonly _seed: U64;

	constructor(seed = U64.zero) {
		super(8, 32);
		this._seed = seed;
		this._state.at(0).set(this._seed.mut().addEq(p64_1).addEq(p64_2));
		this._state.at(1).set(this._seed.mut().addEq(p64_2));
		this._state.at(2).set(this._seed);
		this._state.at(3).set(this._seed).subEq(p64_1);
	}

	protected hash() {
		asLE.i32(this._b8, 0, blockSizeEls * 2);
		this._state
			.at(0)
			.addEq(this._b64.at(0).mulEq(p64_2))
			.lRotEq(31)
			.mulEq(p64_1);
		this._state
			.at(1)
			.addEq(this._b64.at(1).mulEq(p64_2))
			.lRotEq(31)
			.mulEq(p64_1);
		this._state
			.at(2)
			.addEq(this._b64.at(2).mulEq(p64_2))
			.lRotEq(31)
			.mulEq(p64_1);
		this._state
			.at(3)
			.addEq(this._b64.at(3).mulEq(p64_2))
			.lRotEq(31)
			.mulEq(p64_1);
		this._bPos = 0;
	}

	clone() {
		const ret = new XxHash64(this._seed);
		ret._state.set(this._state);
		ret._b8.set(this._b8);
		ret._ingestBytes.set(this._ingestBytes);
		ret._bPos = this._bPos;
		return ret;
	}

	sumIn(): Uint8Array {
		const result = U64Mut.fromI32s(0, 0);
		if (this._ingestBytes.gte(U64.fromInt(this._b8.length))) {
			result
				.addEq(this._state.at(0).lRot(1))
				.addEq(this._state.at(1).lRot(7))
				.addEq(this._state.at(2).lRot(12))
				.addEq(this._state.at(3).lRot(18));
			//We must .mut() the states because we don't want to change the
			// running context
			result.set(
				this._state
					.at(0)
					.mut()
					.mulEq(p64_2)
					.lRotEq(31)
					.mulEq(p64_1)
					.xorEq(result)
					.mulEq(p64_1)
					.addEq(p64_4)
			);
			result.set(
				this._state
					.at(1)
					.mut()
					.mulEq(p64_2)
					.lRotEq(31)
					.mulEq(p64_1)
					.xorEq(result)
					.mulEq(p64_1)
					.addEq(p64_4)
			);
			result.set(
				this._state
					.at(2)
					.mut()
					.mulEq(p64_2)
					.lRotEq(31)
					.mulEq(p64_1)
					.xorEq(result)
					.mulEq(p64_1)
					.addEq(p64_4)
			);
			result.set(
				this._state
					.at(3)
					.mut()
					.mulEq(p64_2)
					.lRotEq(31)
					.mulEq(p64_1)
					.xorEq(result)
					.mulEq(p64_1)
					.addEq(p64_4)
			);
		} else {
			result.addEq(this._seed).addEq(p64_5);
		}
		result.addEq(this._ingestBytes);
		let nToAdd = this._bPos;
		//i is el-pos
		let i = 0;
		asLE.i32(this._b8, 0, blockSizeEls * 2);
		for (; nToAdd >= 8; i++) {
			result.set(
				result
					.xorEq(this._b64.at(i).mulEq(p64_2).lRotEq(31).mulEq(p64_1))
					.lRotEq(27)
					.mulEq(p64_1)
					.addEq(p64_4)
			);
			nToAdd -= 8;
		}
		//Switch i to byte-pos
		i *= 8;
		if (nToAdd >= 4) {
			result.set(
				U64Mut.fromI32s(U32.fromBytesLE(this._b8, i), 0)
					.mulEq(p64_1)
					.xorEq(result)
					.lRotEq(23)
					.mulEq(p64_2)
					.addEq(p64_3)
			);
			i += 4;
		}
		for (; i < this._bPos; i++) {
			result.set(
				U64Mut.fromI32s(this._b8[i], 0)
					.mulEq(p64_5)
					.xorEq(result)
					.lRotEq(11)
					.mulEq(p64_1)
			);
		}
		result.xorEq(result.rShift(33));
		result.mulEq(p64_2);
		result.xorEq(result.rShift(29));
		result.mulEq(p64_3);
		result.xorEq(result.rShift(32));
		//We write numbers in BE
		return result.toBytesBE();
	}
}