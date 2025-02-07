/*! Copyright 2025 the gnablib contributors MPL-1.1 */

import { IHashsum } from "./interfaces/IChecksum.js";

export abstract class _AHashsum implements IHashsum {
    /** Temp block pos */
    protected _bPos = 0;
    /** Temp proc block */
    protected readonly _b8: Uint8Array;

    constructor(
        /** Digest size in bytes */
        readonly size: number,
        blockSize: number
    ) {
        this._b8 = new Uint8Array(blockSize);
    }

    /** Block size in bytes */
    get blockSize(): number {
        return this._b8.length;
    }

    protected abstract hash(): void;
    
    write(data: Uint8Array) {
        let nToWrite = data.length;
        let dPos = 0;
        let space = this._b8.length - this._bPos;
        while (nToWrite > 0) {
            //Note this is >, so if there's exactly space this won't trigger
            // (ie bPos will always be some distance away from max allowing at least 1 byte write)
            if (space > nToWrite) {
                //More space than data, copy in verbatim
                this._b8.set(data.subarray(dPos), this._bPos);
                //Update pos
                this._bPos += nToWrite;
                return;
            }
            this._b8.set(data.subarray(dPos, dPos + space), this._bPos);
            this.hash();
            dPos += space;
            nToWrite -= space;
            space = this._b8.length;
        }
    }

    /** Create a copy of this hashsum (uses different memory) */
    abstract clone():IHashsum;

	/**
	 * Generate the checksum by mutating the internal state, avoids memory alloc.
	 * Use if you won't need the obj again (for performance)
	 */
    abstract sumIn():Uint8Array;

    sum(): Uint8Array {
        return this.clone().sumIn();
    }
}

export abstract class AHashsum32 extends _AHashsum {
    /** Number of bytes added to the hash */
    protected _ingestBytes = 0;

    /** Write a series of bytes */
    write(data: Uint8Array) {
        this._ingestBytes += data.length;
        super.write(data);
    }
}