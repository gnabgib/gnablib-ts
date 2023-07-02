import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Blowfish } from '../../../src/crypt/sym/Blowfish';
import { CountMode, Ctr } from '../../../src/crypt/block/Ctr';
import { ICrypt } from '../../../src/crypt/sym/ICrypt';


const tsts = suite('CTR');

/** Blowfish with a zero key - terrible IRL, but fine for testing */
const blowfish_KeyZero=new Blowfish(hex.toBytes('0000000000000000'));
/** CFB with blowfish zero, zero pad, and zero IV - terrible IRL, but fine for testing */
const ctr_blowfishKeyZero_zeroIv=new Ctr(blowfish_KeyZero,new Uint8Array(8),CountMode.Incr);


const incrTests:[ICrypt,string,string,string][]=[
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
        //Causes a key-wrap on +1
        blowfish_KeyZero,
        'FFFFFFFFFFFFFFFF',
        '0000000000000000',
        '014933E0CDAFF6E4'
    ],
    [
        blowfish_KeyZero,
        '0000000000000000',
        '00000000000000000000000000000000',
        '4EF997456198DD7864ED065757511FA7'
    ],
    [
        new Blowfish(hex.toBytes('0123456789ABCDEFF0E1D2C3B4A59687')),
        'FEDCBA9876543210',
        '37363534333231204E6F77206973207468652074696D6520666F722000',
        'E73214A2822139CA60254740DD8C5B8ACF5E9569C4AFFEB944B8FC020E'
    ],
]
for(const [crypt,iv,plain,enc] of incrTests) {
    const p=hex.toBytes(plain);
    const b=new Ctr(crypt,hex.toBytes(iv),CountMode.Incr);
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

const concat32Tests:[ICrypt,string,string,string][]=[
    [
        new Blowfish(hex.toBytes('0123456789ABCDEFF0E1D2C3B4A59687')),
        'FEDCBA98',
        '37363534333231204E6F77206973207468652074696D6520666F722000',
        '12E4AFC07386C110FF9AB80775285A5C9297F40B4AB1CC3EA3DDE06F19'
    ],
];
for(const [crypt,iv,plain,enc] of concat32Tests) {
    const p=hex.toBytes(plain);
    const b=new Ctr(crypt,hex.toBytes(iv),CountMode.Concat32);
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

tsts(`incr-IV must be block size`,()=>{
    assert.throws(()=>new Ctr(blowfish_KeyZero,hex.toBytes('00'),CountMode.Incr));
});

tsts(`concat32-IV must be block size-4`,()=>{
    assert.throws(()=>new Ctr(blowfish_KeyZero,hex.toBytes('00'),CountMode.Concat32));
});

tsts(`Block size matches crypt`,()=>{
    assert.equal(ctr_blowfishKeyZero_zeroIv.blockSize,blowfish_KeyZero.blockSize);
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
        assert.is(ctr_blowfishKeyZero_zeroIv.encryptSize(plainLen),expect);
	});
}

tsts.run();