import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Blowfish } from '../../../src/crypt/sym/Blowfish';
import { Cfb } from '../../../src/crypt/block/Cfb';
import { ICrypt } from '../../../src/crypt/sym/ICrypt';


const tsts = suite('CFB');

/** Blowfish with a zero key - terrible IRL, but fine for testing */
const blowfish_KeyZero=new Blowfish(hex.toBytes('0000000000000000'));
/** CFB with blowfish zero, zero pad, and zero IV - terrible IRL, but fine for testing */
const cfb_blowfishKeyZero_zeroIv=new Cfb(blowfish_KeyZero,new Uint8Array(8));


const tests:[ICrypt,string,string,string][]=[
    [
        blowfish_KeyZero,
        '0000000000000000',
        '00000000000000',
        '4EF997456198DD'
    ],
    [
        blowfish_KeyZero,
        '0000000000000000',
        '0000000000000000',
        '4EF997456198DD78'
    ],
    [
        blowfish_KeyZero,
        '0000000000000000',
        '00000000000000000000000000000000',
        '4EF997456198DD78E1C030E74C14D261'
    ],
    [
        //https://www.schneier.com/wp-content/uploads/2015/12/vectors-2.txt
        new Blowfish(hex.toBytes('0123456789ABCDEFF0E1D2C3B4A59687')),
        'FEDCBA9876543210',
        '37363534333231204E6F77206973207468652074696D6520666F722000',
        'E73214A2822139CAF26ECF6D2EB9E76E3DA3DE04D1517200519D57A6C3'
    ],
]
for(const [crypt,iv,plain,enc] of tests) {
    const p=hex.toBytes(plain);
    const b=new Cfb(crypt,hex.toBytes(iv));
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
    assert.throws(()=>new Cfb(blowfish_KeyZero,hex.toBytes('00')));
});

tsts(`Block size matches crypt`,()=>{
    assert.equal(cfb_blowfishKeyZero_zeroIv.blockSize,blowfish_KeyZero.blockSize);
});

const encryptSizeBlowfishZeroTests:[number,number][]=[
    [0,0],
    [1,1],
    [2,2],
    [3,3],
    [4,4],
    [5,5],
    [6,6],
    [7,7],
    [8,8],
    [9,9],
];
for(const [plainLen,expect] of encryptSizeBlowfishZeroTests) {
    tsts(`encryptSize(${plainLen})`, () => {
        assert.is(cfb_blowfishKeyZero_zeroIv.encryptSize(plainLen),expect);
	});
}

tsts.run();