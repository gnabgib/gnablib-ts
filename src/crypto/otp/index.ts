/*! Copyright 2026 the gnablib contributors MPL-1.1 */

import { base32 } from '../../codec/Base32.js';
import { asBE } from '../../endian/platform.js';
import { ParseProblem } from '../../error/probs/ParseProblem.js';
import { U32 } from '../../primitive/number/U32Static.js';
import { U64, U64Mut } from '../../primitive/number/U64.js';
import { WindowStr } from '../../primitive/WindowStr.js';
import { sInt, sNum } from '../../safe/safe.js';
import { Sha1 } from '../hash/Sha1.js';
import { Sha256, Sha512 } from '../hash/Sha2.js';
import { IHash } from '../interfaces/IHash.js';
import { Hmac } from '../mac/Hmac.js';
import { getRandomValues } from 'crypto';

const one = U64.fromI32s(1);
class Otp {
	/** Counter-bytes */
	private readonly _a8 = new Uint8Array(8);
	/** Counter */
	protected readonly _c = U64Mut.mount(new Uint32Array(this._a8.buffer));
	/** decimal digits to show */
	readonly digits: number;
	private readonly _mod: number;
	private readonly _hashAlgo: string;
	/** HMAC with hash and key preconfigured */
	private _h: Hmac;

	protected constructor(key: Uint8Array, digits: number, algo: IHash) {
		this.digits = digits;
		this._mod = Math.pow(10, digits);
		// @ts-expect-error @typescript-eslint/no-unsafe-member-access
		// All objects have toStringTag, it might be dumb (Object) but it'll exist
		this._hashAlgo = algo[Symbol.toStringTag];
		this._h = new Hmac(algo, key);
	}

	/** Return a copy of the internal counter (eg for serializing) */
	get counter(): U64 {
		return this._c.clone();
	}

	/**
	 * Calculate the code from the hash-result (Sec5.3)
	 * @param hashResult Hash result bytes, 16 or more bytes
	 * @returns
	 */
	protected _truncate(hashResult: Uint8Array): number {
		const offset = hashResult[hashResult.length - 1] & 0xf;
		const num =
			((hashResult[offset] & 0x7f) << 24) |
			(hashResult[offset + 1] << 16) |
			(hashResult[offset + 2] << 8) |
			hashResult[offset + 3];
		//console.log(`offset=${offset} num=${num} mod=${this._mod}`)
		return num % this._mod;
	}

	/** Generate OTP based on internal state */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- need this sig to match Totp
	public generate(_nop=true): number {
		//Make sure BE
		asBE.i64(this._a8);
		this._h.write(this._a8);
		//Invert the BE if it happened
		asBE.i64(this._a8);
		const found = this._h.sumIn();
		//Because generate could be called more than once, reset to cleanup
		this._h.reset();
		return this._truncate(found);
	}

	/**
	 * Validate with a window of counter-values around the target.
	 *
	 * The internal counter will indicate which window passed
	 * @param tok
	 * @param backWindow
	 * @param forwardWindow
	 * @returns
	 */
	validate(tok: number, backWindow = 1, forwardWindow = 1): boolean {
		let exp = this.generate(false);
		if (U32.ctEq(tok, exp)) return true;
		let i = 0;
		const one = U64.fromI32s(1);
		while (i++ < backWindow) {
			this._c.subEq(one);
			exp = this.generate(false);
			if (U32.ctEq(tok, exp)) return true;
		}
		i = 0;
		//Reset counter drift
		this._c.addEq(U64.fromI32s(backWindow));
		while (i++ < forwardWindow) {
			this._c.addEq(one);
			exp = this.generate(false);
			if (U32.ctEq(tok, exp)) return true;
		}
		//Reset counter drift
		this._c.subEq(U64.fromI32s(forwardWindow));
		return false;
	}

	protected _uriBase(
		iss: string,
		user: string,
		key: string | Uint8Array,
	): string {
		//Todo: switch to iproblem?
		if (iss.indexOf(':') >= 0) throw new URIError('Issuer may not include ":"');
		if (user.indexOf(':') >= 0) throw new URIError('User may not include ":"');

		if (key instanceof Uint8Array) {
			key = base32.fromBytes(key, false);
		}
		//Note we're assuming the caller gave us a valid base32 string

		//Prevent ? from being included in the user (would indicate parameter string, but encodeURIComponent would escape @)
		// todo: use encodeURIComponent and replace %40=@ ?
		let ret = `/${encodeURIComponent(iss)}:${encodeURI(user).replace(/\?/g, '%3F')}?secret=${key}`;
		//Include algo if not SHA1
		if (this._hashAlgo != 'SHA1') ret += `&algorithm=${this._hashAlgo}`;
		//Include digits if not 6
		if (this.digits != 6) ret += `&digits=${this.digits}`;
		return ret;
	}

	protected static _parseUri(
		uri: string,
		type: string,
	):
		| [string, string, Uint8Array, IHash | undefined, number, number, number]
		| ParseProblem {
		const ws = WindowStr.new(uri);
		if (!ws.startsWith('otpauth://'))
			return new ParseProblem(
				'URI',
				"don't recognize schema",
				ws.substring(0, ws.indexOf(':')),
			);
		ws.shrink(10);
		if (!ws.startsWith(type + '/'))
			return new ParseProblem(
				'URI',
				"don't recognize type",
				ws.substring(0, ws.indexOf('/')),
			);
		ws.shrink(type.length + 1);
		const [label, query] = ws.split('?', 2);
		const cpos = label.indexOfAny([':', '%3A']);
		let iss: string;
		let user: string;
		if (cpos < 0) {
			iss = '';
			user = decodeURI(label.toString());
		} else {
			iss = decodeURIComponent(label.substring(0, cpos));
			if (label.charAt(cpos) == ':')
				user = decodeURI(label.substring(cpos + 1)).trim();
			else user = decodeURI(label.substring(cpos + 3)).trim();
		}
		//If there's no query part, the first problem is going to be the lack of secret
		if (!query) return new ParseProblem('secret', 'required');
		//Params can be secret/base32, digits/number, algorithm/alphanum, counter/number, period/number so we shouldn't
		// need any decodeURI (for valid entries)
		const params = query.split('&');
		let key: Uint8Array | undefined;
		let algo: IHash | undefined = undefined;
		let digits: number = 6;
		let counter: number = 0;
		let period: number = 30;
		for (const p of params) {
			const [name, val] = p.toString().split('=');
			switch (name) {
				case 'secret':
					key = base32.toBytes(val);
					break;
				case 'digits':
					digits = Number.parseInt(val, 10);
					break;
				case 'algorithm':
					//todo.. hash oracle that does this?
					switch (val.toUpperCase()) {
						case 'SHA1':
							break;
						case 'SHA256':
							algo = new Sha256();
							break;
						case 'SHA512':
							algo = new Sha512();
							break;
						//Support other algos (no standard)
						default:
							return new ParseProblem('algorithm', 'Unknown value', val);
					}
					break;
				case 'counter':
					counter = Number.parseInt(val, 10);
					break;
				case 'period':
					period = Number.parseInt(val, 10);
					break;
				//Ignore other params
				//default: return new ParseProblem('parameter','unknown',val);
			}
		}
		if (!key || key.length == 0) return new ParseProblem('secret', 'required');
		//console.log(`iss=${iss} user=${user} counter=${counter} digits=${digits} period=${period}`);

		return [iss, user, key, algo, digits, counter, period];
	}

	/**
	 * Create a new random key with optional size (defaults to 16)
	 * Will throw is size is <4 (but you're encouraged to chose 16+).
	 * The larger this key is, the harder your OTP is to brute-force, and this only needs to be communicated once.
	 * Matching the block-size of your hashing algorithm is a good practice
	 */
	static randomKey(size?: number): Uint8Array {
		if (!size) {
			size = 16;
		} else {
			sNum('size', size).atLeast(4).throwNot();
		}
		const k = new Uint8Array(size);
		getRandomValues(k);
		return k;
	}
}

/**
 * [HMAC-based one-time password](https://en.wikipedia.org/wiki/HMAC-based_one-time_password)
 * [RFC-4226](https://datatracker.ietf.org/doc/html/rfc4226) (2005)
 */
export class Hotp extends Otp {
	/** Details of this OTP as a URI, note the key has to be re-injected
	 * (base32 encoded or binary) because we don't want to keep the key in
	 * this object in plain text (could be captured in logs)
	 **/
	createUri(iss: string, user: string, key: string | Uint8Array): string {
		//We follow the google (original) specs https://github.com/google/google-authenticator/wiki/Key-Uri-Format
		// not the late conflicting apple specs https://developer.apple.com/documentation/authenticationservices/securing-logins-with-icloud-keychain-verification-codes
		return `otpauth://hotp${this._uriBase(iss, user, key)}&counter=${this._c.toDecStr()}`;
	}

	/**
	 * Consume the current counter value - you should only call this if the resulting value
	 * passed validation from the server (or if the client used this value)
	 */
	consume() {
		this._c.addEq(one);
	}

	static newWithKey(
		key: Uint8Array,
		digits?: number,
		algo?: IHash,
		counter?: U64,
	): Hotp {
		if (digits) {
			//Note 10 digits is of dubious value over 9 since the top digit can only be 0-2
			// (limits of i32)
			sNum('digits', digits).atLeast(6).atMost(10).throwNot();
		} else {
			digits = 6;
		}
		if (algo) {
			//Apparently at some point MD5 was supported, but the truncate algorithm
			// in the RFC doesn't explain whether you mask offset differently,
			// skip the last byte (since it's used for offset), wrap around.. so we'll
			// just require an algorithm that generates at least 20 bytes (SHA1+)
			sNum('algo.length', algo.size).atLeast(20).throwNot();
		} else {
			algo = new Sha1();
		}
		const ret = new Hotp(key, digits, algo);
		if (counter) {
			ret._c.set(counter);
		}
		return ret;
	}

	/**
	 * Parse a HOTP URI into an operating object, also returns issuer/user if successful (for UI display).
	 * Will return a ParseProblem if there were issues with the URI
	 * @param uri
	 * @returns
	 */
	static parseUri(uri: string): [Hotp, string, string] | ParseProblem {
		const p = super._parseUri(uri, 'hotp');
		if (p instanceof ParseProblem) {
			return p;
		}
		const [iss, user, key, algo, digits, counter] = p;

		//Validate counter (limits of JS - U52)
		sInt('counter', counter).unsigned().throwNot();

		//We could construct directly, but we might get bad digits or algo-size
		//const ret = new Hotp(key, digits, algo);
		const h = Hotp.newWithKey(key, digits, algo, U64.fromInt(counter));
		return [h, iss, user];
	}
}

/**
 * [Time-based one-time password](https://en.wikipedia.org/wiki/Time-based_one-time_password)
 * [RFC-6238](http://tools.ietf.org/html/rfc6238) (2011)
 */
export class Totp extends Otp {
	/** time-step */
	private readonly _x: number;
	protected constructor(
		key: Uint8Array,
		timeStep: number,
		digits: number,
		algo: IHash,
	) {
		super(key, digits, algo);
		this._x = timeStep;
	}

	/** Time step (or period) - number of seconds in the testing window (default 30s) */
	get timeStep(): number {
		return this._x;
	}

	private _setNow() {
		//In theory T0 is customizable (according to the RFC), however the URI
		// spec doesn't allow transmissions, so we'll assume zero.
		//const c=U64Mut.fromInt(Math.floor(Date.now() / 1000)).subEq(this._t0).divEq32(this._x);
		const c = U64Mut.fromInt(Math.floor(Date.now() / 1000)).divEq32(this._x);
		this._c.set(c);
	}

	setUtime(utime: U64) {
		//In theory T0 is customizable (according to the RFC), however the URI
		// spec doesn't allow transmissions, so we'll assume zero.
		//const c=unixtime.mut().subEq(this._t0).divEq32(this._x);
		const c = utime.mut().divEq32(this._x);
		this._c.set(c);
	}

	/** Generate a TOTP using the current seconds since unix-epoch/timeStep */
	generate(liveTime = true): number {
		if (liveTime) this._setNow();
		return super.generate();
	}

	/**
	 * Validate with a window of timeStep around the target.  For example
	 * with a `timeStep=30, backWindow=2, forwardWindow=1`, the clock can be 60s behind
	 * or 30s ahead before the TOTP will fail.  Expected window is tested first, then past windows,
	 * then future windows.
	 *
	 * The internal counter will indicate which window passed, although it's a multiple of timeStep steps
	 * from Unix origin
	 * @param tok
	 * @param backWindow
	 * @param forwardWindow
	 * @returns
	 */
	validate(
		tok: number,
		backWindow = 1,
		forwardWindow = 1,
		liveTime = true,
	): boolean {
		//Todo, provide a drift indicator?
		/* c8 ignore next */
		if (liveTime) this._setNow();
		return super.validate(tok, backWindow, forwardWindow);
	}

    createUri(iss: string, user: string, key: string | Uint8Array): string {
		//We follow the google (original) specs https://github.com/google/google-authenticator/wiki/Key-Uri-Format
		// not the late conflicting apple specs https://developer.apple.com/documentation/authenticationservices/securing-logins-with-icloud-keychain-verification-codes
		let ret = `otpauth://totp${this._uriBase(iss, user, key)}`;
		if (this._x != 30) ret += `&period=${this._x}`;
		return ret;
	}

	static newWithKey(
		key: Uint8Array,
		timeStep?: number,
		digits?: number,
		algo?: IHash,
	): Totp {
		if (timeStep) {
			//10s is very small, and 10m is very large (reference in docs as poor useability)
			sInt('timeStep', timeStep).atLeast(10).atMost(600).throwNot();
		} else {
			//Specified default
			timeStep = 30;
		}
		if (digits) {
			//Note 10 digits is of dubious value over 9 since the top digit can only be 0-2
			// (limits of i32)
			sNum('digits', digits).atLeast(6).atMost(10).throwNot();
		} else {
			digits = 6;
		}
		if (algo) {
			//Apparently at some point MD5 was supported, but the truncate algorithm
			// in the RFC doesn't explain whether you mask offset differently,
			// skip the last byte (since it's used for offset), wrap around.. so we'll
			// just require an algorithm that generates at least 20 bytes (SHA1+)
			sNum('algo.length', algo.size).atLeast(20).throwNot();
		} else {
			algo = new Sha1();
		}
		return new Totp(key, timeStep, digits, algo);
	}

	/**
	 * Parse a TOTP URI into an operating object, also returns issuer/user if successful (for UI display).
	 * Will return a ParseProblem if there were issues with the URI
	 * @param uri
	 * @returns
	 */
	static parseUri(uri: string): [Totp, string, string] | ParseProblem {
		const p = super._parseUri(uri, 'totp');
		if (p instanceof ParseProblem) {
			return p;
		}
		const [iss, user, key, algo, digits, , period] = p;

		const ret = Totp.newWithKey(key, period, digits, algo);
		return [ret, iss, user];
	}
}
