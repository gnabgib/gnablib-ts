import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Speck64_96 } from '../../../src/crypto/sym/Speck64';

const tsts = suite('Speck64/96');

// prettier-ignore
const tests:[string,string,string][]=[
    //From https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf (2019)
    ['0001020308090A0B10111213','65616E7320466174','6C947541EC52799F'],
    //https://github.com/weidai11/cryptopp/blob/master/TestVectors/speck.txt
    //From Crypto++6 gen
    ['F64F824BDA9DA2D0D446ABE3','48731C8BFE3260D4','55CABA8DE9F967C8'],
    ['21942E9C01FD29C4C9FA4534','377EC26C13792317','28B6430148F16E86'],
    ['29E3722931BAC130F52789C2','7574E874EE68873A','B2ACBFB9E6D1DD92'],
    ['7473B3BB16E52F6B856639F9','32F5A97A020BB7AA','0CEB7AD5C89C744F'],
    ['738350E6D8851BC84F20ED41','2E46B2EFDEF2C9FB','44046D9B97E30F84'],
    ['1EBA2100965E3D94F715A9E0','A40EF0CB7D750A29','A2917A43F49EBF2D'],
    ['77C06871ECC5DC349C022E8D','4603E1E16719F44E','02BB97CED0D4ED4B'],
];
for (const [key, plain, enc] of tests) {
    const c = new Speck64_96(hex.toBytes(key));
    tsts(`Speck64/96(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found = hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found), enc);
    });
    tsts(`Speck64/96(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found = hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found), plain);
    });
}

tsts.run();
