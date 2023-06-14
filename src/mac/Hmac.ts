/*! Copyright 2023 gnabgib MPL-2.0 */

import { hex } from '../encoding/Hex.js';
import type { IHash } from '../hash/IHash.js';

//[Wikipedia: HMAC](https://en.wikipedia.org/wiki/HMAC)
//[HMAC: Keyed-Hashing for Message Authentication](https://datatracker.ietf.org/doc/html/rfc2104) (1997)
const oPad = 0x5c;
const iPad = 0x36;

function fixKey(hash: IHash, key: Uint8Array): Uint8Array {
	if (key.length > hash.blockSize) {
		//Keys longer than blockSize are shortened by hashing
		hash.reset();
		hash.write(key);
		return hash.sum();
	}
	//Otherwise pad with zeros and leave as is (strange?)
	const ret = new Uint8Array(hash.blockSize);
	//By default will be zero filled
	ret.set(key);
	return ret;
}

/**
 * Hash-based message authentication code (HMAC)
 * - Looks like a Hash, but built with the hash-type, and key
 */
export class Hmac implements IHash {
	readonly #oHash:IHash;
	readonly #iHash:IHash;
	readonly #oPadKey:Uint8Array;
	readonly #iPadKey:Uint8Array;

	/**
	 * New HMAC
	 * @param hash Hash to use (output will be hash.blockSize in length)
	 * @param key Secret key (as bytes, see utf8.toBytes, hex.toBytes etc)
	 */
	constructor(hash:IHash,key:Uint8Array) {
		const fk = fixKey(hash, key);
		this.#oPadKey = new Uint8Array(hash.blockSize);
		this.#iPadKey = new Uint8Array(hash.blockSize);
		for (let i = 0; i < hash.blockSize; i++) {
			this.#oPadKey[i] = fk[i] ^ oPad;
			this.#iPadKey[i] = fk[i] ^ iPad;
		}
		//console.log(`ipad= ${hex.fromBytes(this.#iPadKey)}`);
		//console.log(`opad= ${hex.fromBytes(this.#oPadKey)}`);
	
		this.#oHash=hash.newEmpty();
		this.#oHash.write(this.#oPadKey);

		this.#iHash=hash.newEmpty();
		this.#iHash.write(this.#iPadKey);
	}

	/**
	 * Write more data to the MAC
	 * @param data 
	 */
	write(data: Uint8Array): void {
		this.#iHash.write(data);
	}

	/**
	 * Sum the hash (does not mutate )
	 * @param size Tag length (truncates output to this many bites if >0), defaults to hash size
	 * @returns HMAC-digest
	 */
	sum(size:number|undefined=0): Uint8Array {
		const iHash=this.#iHash.sum();
		//console.log(`i= ${hex.fromBytes(iHash)}`);
		this.#oHash.write(iHash);
		const ret=this.#oHash.sum();
		return size>0?ret.slice(0,size):ret;
	}

	/**
     * Set hash to initial state. Any past writes will be forgotten
     */
	reset(): void {
		this.#oHash.reset();
		this.#oHash.write(this.#oPadKey);
		this.#iHash.reset();
		this.#iHash.write(this.#iPadKey);
	}

	/**
     * Create an empty IHash using the same algorithm
     */
	newEmpty(): IHash {
		const key=new Uint8Array(this.#oPadKey);
		for(let i=0;i<key.length;i++) key[i]^=oPad;
		return new Hmac(this.#oHash,key);
	}

	/**
     * Digest size in bytes
     */
	get size(): number {
		return this.#iHash.size;
	}

	/**
     * Block size in bytes
     */
	get blockSize(): number {
		return this.#iHash.blockSize;
	}
}