import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Blowfish } from '../../../src/crypt/sym/Blowfish';
import { Ecb } from '../../../src/crypt/block/Ecb';
import { Pkcs7 } from '../../../src/crypt/pad/Pkcs7';
import { Zero } from '../../../src/crypt/pad/Zero';
import { ICrypt } from '../../../src/crypt/sym/ICrypt';
import { IPad } from '../../../src/crypt/pad/IPad';

const tsts = suite('ECB');

/** Blowfish with a zero key - terrible IRL, but fine for testing */
const blowfish_KeyZero=new Blowfish(hex.toBytes('0000000000000000'));
/** EBC with blowfish zero, zero pad, and zero IV - terrible IRL, but fine for testing */
const ebc_blowfishKeyZero_zeroPad=new Ecb(blowfish_KeyZero,Zero);


const tests:[ICrypt,IPad,string,string][]=[
    [
        blowfish_KeyZero,
        Pkcs7,
        '00000000000000',//pad=0000000000000001
        '64ED065757511FA7'
    ],
    [
        blowfish_KeyZero,
        Pkcs7,
        '0000000000000000',//pad=00000000000000000808080808080808
        '4EF997456198DD78B0D4ACB28AA5EBE3'
    ],
    [
        blowfish_KeyZero,
        Pkcs7,
        '00000000000000000000000000000000',//pad=000000000000000000000000000000000808080808080808
        '4EF997456198DD784EF997456198DD78B0D4ACB28AA5EBE3'
    ],
    [
        blowfish_KeyZero,
        Zero,
        '0000000000000000',
        '4EF997456198DD78'
    ],
    [
        new Blowfish(hex.toBytes('0123456789ABCDEFF0E1D2C3B4A59687')),
        Pkcs7,
        '37363534333231204E6F77206973207468652074696D6520666F722000',
        '2AFD7DAA60626BA38616468CC29CF6E1291E817CC740982D39A7F406AB494E60'
    ],

]
for(const [crypt,pad,plain,enc] of tests) {
    const p=hex.toBytes(plain);
    const b=new Ecb(crypt,pad);
    tsts(`encrypt(${plain})`, () => {
        const found=new Uint8Array(enc.length/2);
        b.encryptInto(found,p);
        assert.is(hex.fromBytes(found),enc);
	});

    tsts(`decrypt(${enc})`, () => {
        const found=new Uint8Array(p.length);
        b.decryptInto(found,hex.toBytes(enc));
        assert.is(hex.fromBytes(found),plain);
	});
}

tsts(`Block size matches crypt`,()=>{
    assert.equal(ebc_blowfishKeyZero_zeroPad.blockSize,blowfish_KeyZero.blockSize);
});

const encryptSizeBlowfishZeroTests:[number,number][]=[
    [0,0],
    [1,8],
    [2,8],
    [3,8],
    [4,8],
    [5,8],
    [6,8],
    [7,8],
    [8,8],//Zero pad allows a full block
    [9,16],
];
for(const [plainLen,expect] of encryptSizeBlowfishZeroTests) {
    tsts(`encryptSize(${plainLen})`, () => {
        assert.is(ebc_blowfishKeyZero_zeroPad.encryptSize(plainLen),expect);
	});
}

tsts.run();