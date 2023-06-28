import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Blowfish } from '../../../src/crypt/sym/Blowfish';
import { Ecb } from '../../../src/crypt/block/Ecb';
import { Pkcs7 } from '../../../src/crypt/padding/Pkcs7';

const tsts = suite('ECB-blowfish');

const tests:[string,string,string][]=[
    [
        '0000000000000000',
        '00000000000000',//pad=0000000000000001
        '64ED065757511FA7'
    ],
    [
        '0000000000000000',
        '0000000000000000',//pad=00000000000000000808080808080808
        '4EF997456198DD78B0D4ACB28AA5EBE3'
    ],
    [
        '0000000000000000',
        '00000000000000000000000000000000',//pad=000000000000000000000000000000000808080808080808
        '4EF997456198DD784EF997456198DD78B0D4ACB28AA5EBE3'
    ],
]
for(const [key,plain,enc] of tests) {
    const pBytes=hex.toBytes(plain);
    const c=new Blowfish(hex.toBytes(key));
    const bl=new Ecb(c,Pkcs7);
    tsts(`b(${key}).encrypt(${plain})`, () => {
        assert.is(bl.blockSize,c.blockSize);
        
        const found=new Uint8Array(enc.length/2);
        //const encBytes=new Uint8Array(bl.encryptSize(pBytes.length));
        bl.encryptInto(found,pBytes);
        assert.is(hex.fromBytes(found),enc);
	});

    tsts(`b(${key}).decrypt(${enc})`, () => {
        //const encBytes=new Uint8Array(bl.encryptSize(pBytes.length));
        const found=new Uint8Array(pBytes.length);
        bl.decryptInto(found,hex.toBytes(enc));
        assert.is(hex.fromBytes(found),plain);
	});
}
tsts.run();