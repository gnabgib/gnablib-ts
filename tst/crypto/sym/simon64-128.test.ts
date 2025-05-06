import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Simon64_128 } from '../../../src/crypto/sym/Simon';


const tsts = suite('Simon64/128');

// prettier-ignore
const tests:[string,string,string][]=[
    //From the spec
    ['0001020308090A0B1011121318191A1B','756E64206C696B65','7AA0DFB920FCC844'],
];
for (const [key,plain,enc] of tests) {
    const c=new Simon64_128(hex.toBytes(key));
    tsts(`Simon64/128(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found=hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found),enc);
    });
    tsts(`Simon64/128(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found=hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found),plain);
    });
}


tsts.run();