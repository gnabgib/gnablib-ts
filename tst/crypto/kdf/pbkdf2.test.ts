import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import {
	pbkdf2,
	pbkdf2_hmac_sha1,
	pbkdf2_hmac_sha256,
	pbkdf2_hmac_sha512,
} from '../../../src/crypto/kdf';
import { Sha1 } from '../../../src/crypto/hash';

const tsts = suite('PBKDF2/RFC 8018');

const sha1: [string, string | Uint8Array, number, number, string][] = [
	//https://datatracker.ietf.org/doc/html/rfc6070
	['password', 'salt', 1, 20, '0C60C80F961F0E71F3A9B524AF6012062FE037A6'],
	['password', 'salt', 2, 20, 'EA6C014DC72D6F8CCD1ED92ACE1D41F0D8DE8957'],
	['password', 'salt', 4096, 20, '4B007901B765489ABEAD49D926F721D065A429C1'],
	// //Takes 70 seconds :|
	// [
	//     'password',
	//     'salt',16777216,20,
	//     'EEFE3D61CD4DA4E4E9945B3D6BA2158C2634E984'
	// ],
	[
		'passwordPASSWORDpassword',
		'saltSALTsaltSALTsaltSALTsaltSALTsalt',
		4096,
		25,
		'3D2EEC4FE41C849B80C8D83662C0E44A8B291A964CF2F07038',
	],
	['pass\0word', 'sa\0lt', 4096, 16, '56FA6AA75548099DCC37D7F03425E0C3'],
	//https://en.wikipedia.org/wiki/PBKDF2
	[
		'plnlrtfpijpuhqylxbgqiiyipieyxvfsavzgxbbcfusqkozwpngsyejqlmjsytrmd',
		//Strange choice writing the salt as HEX without saying so wikipedia
		hex.toBytes('A009C1A485912C6AE630D3E744240B04'),
		1000,
		16,
		'17EB4014C8C461C300E9B61518B9A18B',
	],
	[
		"eBkXQTfuBqp'cTcar&g*",
		//Strange choice writing the salt as HEX without saying so wikipedia
		hex.toBytes('A009C1A485912C6AE630D3E744240B04'),
		1000,
		16,
		'17EB4014C8C461C300E9B61518B9A18B',
	],
];
const hash = new Sha1();
for (const [pass, salt, count, keySize, expect] of sha1) {
	tsts(`PBKDF2(${pass},${salt},${count})`, () => {
		const found = pbkdf2(hash, pass, salt, count, keySize);
		assert.is(hex.fromBytes(found), expect);
	});
}

tsts(`pbkdf2_hmac_sha1`, () => {
	const found = pbkdf2_hmac_sha1(
		Uint8Array.of(0),
		Uint8Array.of(7, 8, 9),
		2,
		2
	);
	assert.is(hex.fromBytes(found), '34EC');
});

tsts(`pbkdf2_hmac_sha256`, () => {
	const found = pbkdf2_hmac_sha256(
		Uint8Array.of(0),
		Uint8Array.of(7, 8, 9),
		2,
		2
	);
	assert.is(hex.fromBytes(found), 'C1A8');
});

tsts(`pbkdf2_hmac_sha512`, () => {
	const found = pbkdf2_hmac_sha512(
		Uint8Array.of(0),
		Uint8Array.of(7, 8, 9),
		2,
		2
	);
	assert.is(hex.fromBytes(found), '635F');
});

// const exp=4000000
// tsts(`PBFDK2(${exp})`,()=>{
//     console.profile();
//     const found=pbkdf2(hash,'password','salt',exp,20);
//     // 1_000_000=F5496BB1328184F5228EFF393AB4BE9AE8FE69E7
//     // 2_000_000=BBB83C8773D9768DE427FFAF44FB8040081C72DC
//     assert.is(hex.fromBytes(found).length>0,true);
//     console.profileEnd();
// })

// cry_pb2('password','salt',16777216,20,'sha1',(err, derivedKey) => {
//     if (err) throw err;
//     // Prints derivedKey
//     console.log(derivedKey.toString('hex'));
//   });

tsts.run();
