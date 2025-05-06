import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Simon64_128 } from '../../../src/crypto/sym/Simon64';

const tsts = suite('Simon64/128');

// prettier-ignore
const tests:[string,string,string][]=[
    //From https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf (2019)
    ['0001020308090A0B1011121318191A1B','756E64206C696B65','7AA0DFB920FCC844'],
    //https://github.com/weidai11/cryptopp/blob/master/TestVectors/simon.txt
    //From Crypto++6 gen
    ['435CCAE27799F6117C08652EB81E0EBE','EF4A99D6E0D6992C','B172958BE0F28647'],
    ['6CCE23B05650D41237FC83805A76EDDC','6E27377AFC08ECF4','C889752D52F046E5'],
    ['44FEFD471820EA58B1733B1AE94B1598','DC40B363A39366BC','96BEF5A267BE1738'],
    ['C2358C444168BAD0AB5067FD536885F1','547AB26AA85DA02D','BD99B9583D4C5449'],
    ['73F69803E01889294CFEBE43744856E6','6E8832F8188A7E35','EDD92FBD9C9E0695'],
    ['F5D38DFA6AF99C7FF2BD96EF2F6A4291','D2A50E77640EFE09','9FE213BC7D3EB3D0'],
    ['9B86566080E2B0BDD8ADA8AA23AB36B2','0958A7FFD7104705','CE369A1BA3F7537A'],
    //from https://eprint.iacr.org/2013/404.pdf - this seems to be a different implementation (2013)
    // the encryption section (pg 13) is slightly different - x-y swap vs compound action
    //['1B1A1918131211100B0A090803020100','656B696C20646E75','44C8FC20B9DFA07A'],
];
for (const [key, plain, enc] of tests) {
	const c = new Simon64_128(hex.toBytes(key));
	tsts(`Simon64/128(${key}).encrypt(${plain})`, () => {
		//Set found equal to plain-source-bytes
		const found = hex.toBytes(plain);
		//Encrypt a block (note the test vectors are all one block)
		c.encryptBlock(found);
		assert.is(hex.fromBytes(found), enc);
	});
	tsts(`Simon64/128(${key}).decrypt(${enc})`, () => {
		//Set found equal to encoded-source-bytes
		const found = hex.toBytes(enc);
		//Decrypt a block (note the test vectors are all one block)
		c.decryptBlock(found);
		assert.is(hex.fromBytes(found), plain);
	});
}

tsts.run();
