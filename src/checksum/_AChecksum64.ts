/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { U64, U64Mut } from '../primitive/number/U64.js';
import { _AChecksum } from './_AChecksum.js';

export abstract class AChecksum64 extends _AChecksum {
	/** Number of bytes added to the hash */
	protected _ingestBytes = U64Mut.fromI32s(0, 0);

	/** Write data to the hash (can be called multiple times) */
	write(data: Uint8Array) {
		this._ingestBytes.addEq(U64Mut.fromInt(data.length));
		super.write(data);
	}

	protected _reset(): void {
		this._ingestBytes.set(U64.zero);
		this._bPos = 0;
	}

	protected _clone(o: AChecksum64) {
		o._b8.set(this._b8);
		o._ingestBytes.set(this._ingestBytes);
		o._bPos = this._bPos;
	}
}
