import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Simon64_96 } from '../../../src/crypto/sym/Simon64';

const tsts = suite('Simon64/96');

// prettier-ignore
const tests:[string,string,string][]=[
    //From https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf (2019)
    ['0001020308090A0B10111213','636C696E6720726F','C88F1A117FE2A25C'],
    //https://github.com/weidai11/cryptopp/blob/master/TestVectors/simon.txt
    //From Crypto++6 gen
    ['C04DDD70D26730FD7FE0B451','FD7E2EE54B1EBEF8','570B1682A037E68D'],
    ['5AACDE740D8668C21E88440A','706B7B9DFAB67CEE','76A7EF01710B1A73'],
    ['73A39735967BD97B5B154900','6311734C621DBC92','CE1BDC96CE098C71'],
    ['5D6429E850566A757A843FBB','45E5535569CE86E8','FECF18585F5D2615'],
    ['D151969B26A40B363DB7C56D','2E395F105A20A4FD','CBEFEBC34F5300D4'],
    ['E65F1BC4EA5BDA82E47EFE6C','3677F95B75FC80A7','EDD6CD13B322C7CE'],
    ['A7EC1C1B95E50FB82438B333','D21CE7BF891EE2E7','C089F0A03578ED50'],
];
for (const [key, plain, enc] of tests) {
	const c = new Simon64_96(hex.toBytes(key));
	tsts(`Simon64/96(${key}).encrypt(${plain})`, () => {
		//Set found equal to plain-source-bytes
		const found = hex.toBytes(plain);
		//Encrypt a block (note the test vectors are all one block)
		c.encryptBlock(found);
		assert.is(hex.fromBytes(found), enc);
	});
	tsts(`Simon64/96(${key}).decrypt(${enc})`, () => {
		//Set found equal to encoded-source-bytes
		const found = hex.toBytes(enc);
		//Decrypt a block (note the test vectors are all one block)
		c.decryptBlock(found);
		assert.is(hex.fromBytes(found), plain);
	});
}

tsts.run();
