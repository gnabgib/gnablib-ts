import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Blowfish } from '../../../src/crypt/sym/Blowfish';
import { Cbc } from '../../../src/crypt/block/Cbc';
import { Pkcs7 } from '../../../src/crypt/pad/Pkcs7';
import { Zero } from '../../../src/crypt/pad/Zero';
import { ICrypt } from '../../../src/crypt/sym/ICrypt';
import { IPad } from '../../../src/crypt/pad/IPad';
import { Iso7816_4 } from '../../../src/crypt/pad/Iso7816_4';


const tsts = suite('CBC');

/** Blowfish with a zero key - terrible IRL, but fine for testing */
const blowfish_KeyZero=new Blowfish(hex.toBytes('0000000000000000'));
/** CBC with blowfish zero, zero pad, and zero IV - terrible IRL, but fine for testing */
const cbc_blowfishKeyZero_zeroPad_zeroIv=new Cbc(blowfish_KeyZero,Zero,new Uint8Array(8));

const tests:[ICrypt,IPad,string,string,string][]=[
    [
        blowfish_KeyZero,
        Pkcs7,
        '0000000000000000',
        '00000000000000',//pad=0000000000000001
        '64ED065757511FA7'
    ],
    [
        blowfish_KeyZero,
        Pkcs7,
        '0000000000000000',
        '0000000000000000',//pad=00000000000000000808080808080808
        '4EF997456198DD78B1CB8D069562C76B'
    ],
    [
        blowfish_KeyZero,
        Pkcs7,
        '0000000000000000',
        '00000000000000000000000000000000',//pad=000000000000000000000000000000000808080808080808
        '4EF997456198DD78E1C030E74C14D2618BA55D1827449CD3'
    ],
    [
        blowfish_KeyZero,
        Zero,
        'FEDCBA9876543210',
        '0000000000000000',
        '09A5AA8371843981'
    ],
    [
        //https://www.schneier.com/wp-content/uploads/2015/12/vectors-2.txt
        new Blowfish(hex.toBytes('0123456789ABCDEFF0E1D2C3B4A59687')),
        Zero,
        'FEDCBA9876543210',
        '37363534333231204E6F77206973207468652074696D6520666F722000',
        '6B77B4D63006DEE605B156E27403979358DEB9E7154616D959F1652BD5FF92CC'
    ],
    [
        //https://www.di-mgt.com.au/cryptopad.html
        new Blowfish(hex.toBytes('0123456789ABCDEFF0E1D2C3B4A59687')),
        Pkcs7,
        'FEDCBA9876543210',
        '37363534333231204E6F77206973207468652074696D6520666F722000',
        '6B77B4D63006DEE605B156E27403979358DEB9E7154616D9749DECBEC05D264B'
    ],
    [
        //https://www.di-mgt.com.au/cryptopad.html
        new Blowfish(hex.toBytes('0123456789ABCDEFF0E1D2C3B4A59687')),
        Iso7816_4,
        'FEDCBA9876543210',
        '37363534333231204E6F77206973207468652074696D6520666F722000',
        '6B77B4D63006DEE605B156E27403979358DEB9E7154616D9BB3F8B9254003C40'
    ],
];
for(const [crypt,pad,iv,plain,enc] of tests) {
    const p=hex.toBytes(plain);
    const b=new Cbc(crypt,pad,hex.toBytes(iv));
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

tsts(`IV must be block size`,()=>{
    assert.throws(()=>new Cbc(blowfish_KeyZero,Zero,hex.toBytes('00')));
});

tsts(`Block size matches crypt`,()=>{
    assert.equal(cbc_blowfishKeyZero_zeroPad_zeroIv.blockSize,blowfish_KeyZero.blockSize);
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
        assert.is(cbc_blowfishKeyZero_zeroPad_zeroIv.encryptSize(plainLen),expect);
	});
}

tsts.run();