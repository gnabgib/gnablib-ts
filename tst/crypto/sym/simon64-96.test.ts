import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Simon64_96 } from '../../../src/crypto/sym/Simon';


const tsts = suite('Simon64/96');

// prettier-ignore
const tests:[string,string,string][]=[
    //From the spec
    ['0001020308090A0B10111213','636C696E6720726F','C88F1A117FE2A25C'],
];
for (const [key,plain,enc] of tests) {
    const c=new Simon64_96(hex.toBytes(key));
    tsts(`Simon64/96(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found=hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found),enc);
    });
    tsts(`Simon64/96(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found=hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found),plain);
    });
}


tsts.run();