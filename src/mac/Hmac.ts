/*! Copyright 2023 the gnablib contributors MPL-1.1 */

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
	/** Outside hash, initialized with oPad, never write directly (clone first) */
	#oHash:IHash;
	#startIHash:IHash;
	#iHash:IHash;
	
	/**
	 * New HMAC
	 * @param hash Hash to use (output will be hash.blockSize in length)
	 * @param key Secret key (as bytes, see utf8.toBytes, hex.toBytes etc)
	 */
	constructor(hash:IHash,key:Uint8Array) {
		const fk = fixKey(hash, key);
		const opk=new Uint8Array(hash.blockSize);
		const ipk=new Uint8Array(hash.blockSize);
		for (let i = 0; i < hash.blockSize; i++) {
			opk[i]=fk[i] ^ oPad;
			ipk[i]=fk[i] ^ iPad;
		}
	
		this.#oHash=hash.newEmpty();
		this.#oHash.write(opk);

		this.#startIHash=hash.newEmpty();
		this.#startIHash.write(ipk);
		this.#iHash=this.#startIHash.clone();
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
	 * @param size Output length (truncates output to this many bytes if >0), defaults to hash size
	 * @returns HMAC-digest
	 */
	sum(size:number|undefined=0): Uint8Array {
		const iHash=this.#iHash.sum();
		const oh=this.#oHash.clone();
		oh.write(iHash)
		const ret=oh.sumIn();
		return size>0?ret.slice(0,size):ret;
	}

    /**
     * Sum the hash with internal - mutates internal state, but avoids
     * memory allocation. Use if you won't need the obj again (for performance)
	 * @param size Output length (truncates output to this many bytes if >0), defaults to hash size
	 * @returns HMAC-digest
     */
	sumIn(size:number|undefined=0): Uint8Array {
		const iHash=this.#iHash.sumIn();
		const oh=this.#oHash.clone();
		oh.write(iHash);
		const ret=oh.sumIn();
		return size>0?ret.slice(0,size):ret;
	}

	/**
     * Set hash to initial state. Any past writes will be forgotten
     */
	reset(): void {
		this.#iHash=this.#startIHash.clone();
	}

	/**
     * Create an empty IHash using the same algorithm
     */
	newEmpty(): IHash {
		const ret=new Hmac(this.#oHash,new Uint8Array(this.#oHash.blockSize));
		ret.#oHash=this.#oHash;
		ret.#startIHash=this.#startIHash;
		ret.#iHash=this.#startIHash.clone();
		return ret;
	}

	clone():Hmac {
		const ret=new Hmac(this.#oHash,new Uint8Array(this.#oHash.blockSize));
		ret.#oHash=this.#oHash;
		ret.#startIHash=this.#startIHash;
		ret.#iHash=this.#iHash.clone();
		return ret;
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