import * as intExt from '../primitive/IntExt';
import * as utf8 from '../encoding/Utf8';
import { iv512 } from './_Sha2';
import { _sha2_512 } from './_Sha2-512';

export const init512_224 = [
	//These are pre-generated @see generateIV
	0x8c3d37c8, 0x19544da2, 0x73e19966, 0x89dcd4d6, 0x1dfab7ae, 0x32ff9c82, 0x679dd514, 0x582f9fcf,
	0x0f6d2b69, 0x7bd44da8, 0x77e36f73, 0x04c48942, 0x3f9d85a8, 0x6a1d36c8, 0x1112e6ad, 0x91d692a1
];

/**
 * The "SHA-512/t IV generation function"
 * - This is expensive (you have to SHA512 with a modified INIT in order to generate the new
 *  initial values, so for the common forms (224,256), the init is hard-coded.
 * @see sha2_512_224, @see sha2_512_256
 * @param t - Must be a multiple of 8, greater than zero, less than 512, and NOT 384
 *  (use @see sha2_384 instead)
 * @throws {EnforceTypeError} - t isn't a number
 * @throws {RangeError}- t doesn't satisfy above rules
 */
function generatetIV(t: number): Uint8Array {
	intExt.satisfiesRules(t, (t) => t >= 8 && t <= 504 && t % 8 == 0 && t != 384);
	//First we xor 0xa5a5a5a5a5a5a5a5 with the initial IV
	// In two parts: 0xa5a5a5a5 0xa5a5a5a5
	const init = new Array<number>(iv512.length);
	for (let i = 0; i < init.length; i++) init[i] = (iv512[i] ^ 0xa5a5a5a5) >>> 0;

	//Now we SHA2-512 the description string
	const descr = 'SHA-512/' + t.toString();
	const res = _sha2_512(utf8.toBytes(descr), init);

	return res;
}
// const res=generatetIV(256);
// for(let i=0;i<res.length;i+=4)
//     console.log('0x'+hex.fromBytes(res.slice(i,i+4))+', ');

export function sha2_512_224(bytes: Uint8Array): Uint8Array {
	//224/8=28
	return _sha2_512(bytes, init512_224).slice(0, 28);
}
