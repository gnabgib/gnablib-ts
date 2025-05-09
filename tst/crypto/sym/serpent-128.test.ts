import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Serpent_128 } from '../../../src/crypto/sym/Serpent';

const tsts = suite('Serpent/128');

// prettier-ignore
const tests:[string,string,string][]=[
    //https://biham.cs.technion.ac.il/Reports/Serpent/Serpent-128-128.verified.test-vectors
    ['80000000000000000000000000000000','00000000000000000000000000000000','264E5481EFF42A4606ABDA06C0BFDA3D'],
    ['40000000000000000000000000000000','00000000000000000000000000000000','4A231B3BC727993407AC6EC8350E8524'],
    ['20000000000000000000000000000000','00000000000000000000000000000000','E03269F9E9FD853C7D8156DF14B98D56'],
    ['10000000000000000000000000000000','00000000000000000000000000000000','A798181C3081AC59D5BA89754DACC48F'],
    ['00000000000000000000000000000000','00000000000000000000000000000000','3620B17AE6A993D09618B8768266BAE9'],

    ['00000000000000000000000000000000','80000000000000000000000000000000','A3B35DE7C358DDD82644678C64B8BCBB'],
    ['00000000000000000000000000000000','40000000000000000000000000000000','04ABCFE4E0AF27FF92A2BB10949D7DD2'],
    ['00000000000000000000000000000000','20000000000000000000000000000000','8F773194B78EF2B2740237EF12D08608'],
    ['00000000000000000000000000000000','10000000000000000000000000000000','8B1EA69EE8D7C8D95B1DE4A670EC6997'],

    ['000102030405060708090A0B0C0D0E0F','00112233445566778899AABBCCDDEEFF','563E2CF8740A27C164804560391E9B27'],
    ['2BD6459F82C5B300952C49104881FF48','EA024714AD5C4D84EA024714AD5C4D84','92D7F8EF2C36C53409F275902F06539F'],
];
for (const [key, plain, enc] of tests) {
	const c = new Serpent_128(hex.toBytes(key));
	tsts(`Serpent/128(${key}).encrypt(${plain})`, () => {
		//Set found equal to plain-source-bytes
		const found = hex.toBytes(plain);
		//Encrypt a block (note the test vectors are all one block)
		c.encryptBlock(found);
		assert.is(hex.fromBytes(found), enc);
	});
	tsts(`Serpent/128(${key}).decrypt(${enc})`, () => {
		//Set found equal to encoded-source-bytes
		const found = hex.toBytes(enc);
		//Decrypt a block (note the test vectors are all one block)
		c.decryptBlock(found);
		assert.is(hex.fromBytes(found), plain);
	});
}

tsts.run();
