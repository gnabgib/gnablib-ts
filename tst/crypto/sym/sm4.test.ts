import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Sm4 } from '../../../src/crypto/sym/SM4';

const tsts = suite('Sm4');

// prettier-ignore
const tests:[string,string,string][]=[
    //https://datatracker.ietf.org/doc/html/draft-ribose-cfrg-sm4-10#appendix-A.2.1
    ['0123456789ABCDEFFEDCBA9876543210','AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDD','5EC8143DE509CFF7B5179F8F474B8619'],
    ['0123456789ABCDEFFEDCBA9876543210','EEEEEEEEFFFFFFFFAAAAAAAABBBBBBBB','2F1D305A7FB17DF985F81C8482192304'],
    ['FEDCBA98765432100123456789ABCDEF','AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDD','C5876897E4A59BBBA72A10C83872245B'],
    ['FEDCBA98765432100123456789ABCDEF','EEEEEEEEFFFFFFFFAAAAAAAABBBBBBBB','12DD90BC2D200692B529A4155AC9E600'],
    //https://datatracker.ietf.org/doc/html/draft-ribose-cfrg-sm4-10#appendix-A.1.1
    ['0123456789ABCDEFFEDCBA9876543210','0123456789ABCDEFFEDCBA9876543210','681EDF34D206965E86B3E94F536E4246'],
    //https://datatracker.ietf.org/doc/html/draft-ribose-cfrg-sm4-10#appendix-A.1.4
    ['FEDCBA98765432100123456789ABCDEF','000102030405060708090A0B0C0D0E0F','F766678F13F01ADEAC1B3EA955ADB594'],
    //Calculated
    ['9F589F5CF6122C32B6BFEC2F2AE8C35A','D491DB16E7B1C39E86CB086B789F5419','23464E512CDBF8E5290807B143F5D33A'],
];
for (const [key, plain, enc] of tests) {
	const c = new Sm4(hex.toBytes(key));
	tsts(`Sm4(${key}).encrypt(${plain})`, () => {
		//Set found equal to plain-source-bytes
		const found = hex.toBytes(plain);
		//Encrypt a block (note the test vectors are all one block)
		c.encryptBlock(found);
		assert.is(hex.fromBytes(found), enc);
	});
	tsts(`Sm4(${key}).decrypt(${enc})`, () => {
		//Set found equal to encoded-source-bytes
		const found = hex.toBytes(enc);
		//Decrypt a block (note the test vectors are all one block)
		c.decryptBlock(found);
		assert.is(hex.fromBytes(found), plain);
	});
}

tsts.run();
