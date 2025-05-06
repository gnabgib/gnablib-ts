import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Speck64_128 } from '../../../src/crypto/sym/Speck64';

const tsts = suite('Speck64/128');

// prettier-ignore
const tests:[string,string,string][]=[
    //From https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf (2019)
    ['0001020308090A0B1011121318191A1B','2D4375747465723B','8B024E4548A56F8C'],
    //https://github.com/weidai11/cryptopp/blob/master/TestVectors/speck.txt
    //From Crypto++6 gen
    ['64B76FA61CE980AB2F71098D75D66E5F','1589A8BBFF4C7A85','2F1D122370946BDA'],
    ['5524ABB77240EB5C4554FAD4AB730DDF','F85FA0721A3C9AD6','2A740170155B33EE'],
    ['1A531CD6BA3608075A8713AFCE355015','0232F83A4A647D06','98251CA1B58C59B5'],
    ['922BF30E46F8CD8CB624D0BCFF7AE7A2','35B7E6E160815A52','F1761C9CBE6621E9'],
    ['636343394D464D9C395C662E567BAC4C','ECD85815FF2F6F6D','682DAEEF521688D5'],
    ['4EA353DD118EA8365F97DBBBDE809F55','775709292D2BEE93','92F55C0015B9F649'],
    ['5F51F790E60F2751C2E158F7784D56EC','C4C1002CCBA66F2C','F55426AFB097E170'],
];
for (const [key, plain, enc] of tests) {
	const c = new Speck64_128(hex.toBytes(key));
	tsts(`Speck64/128(${key}).encrypt(${plain})`, () => {
		//Set found equal to plain-source-bytes
		const found = hex.toBytes(plain);
		//Encrypt a block (note the test vectors are all one block)
		c.encryptBlock(found);
		assert.is(hex.fromBytes(found), enc);
	});
	tsts(`Speck64/128(${key}).decrypt(${enc})`, () => {
		//Set found equal to encoded-source-bytes
		const found = hex.toBytes(enc);
		//Decrypt a block (note the test vectors are all one block)
		c.decryptBlock(found);
		assert.is(hex.fromBytes(found), plain);
	});
}

tsts.run();
