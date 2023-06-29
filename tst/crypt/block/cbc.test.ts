import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Blowfish } from '../../../src/crypt/sym/Blowfish';
import { Cbc } from '../../../src/crypt/block/Cbc';
import { Pkcs7 } from '../../../src/crypt/pad/Pkcs7';
//import { Zero } from '../../../src/crypt/pad/Zero';


const tsts = suite('CBC-blowfish');

const tests:[string,string,string,string][]=[
    [
        '0000000000000000',
        '0000000000000000',
        '00000000000000',//pad=0000000000000001
        '64ED065757511FA7'
    ],
    [
        '0000000000000000',
        '0000000000000000',
        '0000000000000000',//pad=00000000000000000808080808080808
        '4EF997456198DD78B1CB8D069562C76B'
    ],
    [
        '0000000000000000',
        '0000000000000000',
        '00000000000000000000000000000000',//pad=000000000000000000000000000000000808080808080808
        '4EF997456198DD78E1C030E74C14D2618BA55D1827449CD3'
    ],
    // [
    //     //Uses zero padding, from https://www.schneier.com/wp-content/uploads/2015/12/vectors-2.txt
    //     'FEDCBA9876543210',
    //     '0123456789ABCDEFF0E1D2C3B4A59687',
    //     '37363534333231204E6F77206973207468652074696D6520666F722000',
    //     '6B77B4D63006DEE605B156E27403979358DEB9E7154616D959F1652BD5FF92CC'
    // ],
]
for(const [iv,key,plain,enc] of tests) {
    const p=hex.toBytes(plain);
    const c=new Blowfish(hex.toBytes(key));
    const bl=new Cbc(c,Pkcs7,hex.toBytes(iv));
    //da 39 a3 ee 5e 6b 4b 0d
    tsts(`b(${key}).encrypt(${plain})`, () => {
        assert.is(bl.blockSize,c.blockSize);
        
        const found=new Uint8Array(enc.length/2);
        //const encBytes=new Uint8Array(bl.encryptSize(pBytes.length));
        bl.encryptInto(found,p);
        assert.is(hex.fromBytes(found),enc);
	});

    tsts(`b(${key}).decrypt(${enc})`, () => {
        //const encBytes=new Uint8Array(bl.encryptSize(pBytes.length));
        const found=new Uint8Array(p.length);
        bl.decryptInto(found,hex.toBytes(enc));
        assert.is(hex.fromBytes(found),plain);
	});
}
tsts.run();