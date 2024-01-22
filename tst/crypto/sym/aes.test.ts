import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Aes } from '../../../src/crypto/sym';


const tsts = suite('AES');


const tests:[string,string,string][]=[
    //https://csrc.nist.gov/csrc/media/publications/fips/197/final/documents/fips-197.pdf
    // B - Note matrix transform (cols then rows)
    ['2B7E151628AED2A6ABF7158809CF4F3C','3243F6A8885A308D313198A2E0370734','3925841D02DC09FBDC118597196A0B32'],
    // C.1 AES128
    ['000102030405060708090A0B0C0D0E0F','00112233445566778899AABBCCDDEEFF','69C4E0D86A7B0430D8CDB78070B4C55A'],
    // C.2 AES192
    ['000102030405060708090A0B0C0D0E0F1011121314151617','00112233445566778899AABBCCDDEEFF','DDA97CA4864CDFE06EAF70A0EC0D7191'],
    // C.3 AES256
    ['000102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F','00112233445566778899AABBCCDDEEFF','8EA2B7CA516745BFEAFC49904B496089'],
];
for (const [key,plain,enc] of tests) {
    const c=new Aes(hex.toBytes(key));
    tsts(`b(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found=hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found),enc);
	});
    tsts(`b(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found=hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found),plain);
	});
}

tsts(`second block enc/dec`,()=>{
    const c=new Aes(Uint8Array.of(0,0,0,0,0,0,0,0));
    const plain='0000000000000000000000000000000000000000000000000000000000000000';
    const found=hex.toBytes(plain);
    c.encryptBlock(found,1);
    assert.is(hex.fromBytes(found),'00000000000000000000000000000000E1E58327782CFA7CBBCF8A347583BFC4')
});

tsts(`encrypt from too small throws`,()=>{
    const c=new Aes(Uint8Array.of(0,0,0,0));
    assert.throws(()=>c.encryptBlock(new Uint8Array(0)));
});

tsts(`decrypt from too small throws`,()=>{
    const c=new Aes(Uint8Array.of(0,0,0,0));
    assert.throws(()=>c.decryptBlock(new Uint8Array(0)));
});

tsts.run();