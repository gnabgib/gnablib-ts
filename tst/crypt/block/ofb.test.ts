import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Blowfish } from '../../../src/crypt/sym/Blowfish';
import { Ofb } from '../../../src/crypt/block/Ofb';
import { ICrypt } from '../../../src/crypt/sym/ICrypt';
import { Aes } from '../../../src/crypt/sym/Aes';


const tsts = suite('OFB');

/** Blowfish with a zero key - terrible IRL, but fine for testing */
const blowfish_KeyZero=new Blowfish(hex.toBytes('0000000000000000'));
/** CFB with blowfish zero, zero pad, and zero IV - terrible IRL, but fine for testing */
const ofb_blowfishKeyZero_zeroIv=new Ofb(blowfish_KeyZero,new Uint8Array(8));


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
        'E73214A2822139CA62B343CC5B65587310DD908D0C241B2263C2CF80DA'
    ],
    //https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/AES_OFB.pdf
    //AES128
    [
        new Aes(hex.toBytes('2B7E151628AED2A6ABF7158809CF4F3C')),
        '000102030405060708090A0B0C0D0E0F',
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        '3B3FD92EB72DAD20333449F8E83CFB4A7789508D16918F03F53C52DAC54ED8259740051E9C5FECF64344F7A82260EDCC304C6528F659C77866A510D9C1D6AE5E'
    ],
    //AES192
    [
        new Aes(hex.toBytes('8E73B0F7DA0E6452C810F32B809079E562F8EAD2522C6B7B')),
        '000102030405060708090A0B0C0D0E0F',
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        'CDC80D6FDDF18CAB34C25909C99A4174FCC28B8D4C63837C09E81700C11004018D9A9AEAC0F6596F559C6D4DAF59A5F26D9F200857CA6C3E9CAC524BD9ACC92A'
    ],
    //AES256
    [
        new Aes(hex.toBytes('603DEB1015CA71BE2B73AEF0857D77811F352C073B6108D72D9810A30914DFF4')),
        '000102030405060708090A0B0C0D0E0F',
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        'DC7E84BFDA79164B7ECD8486985D38604FEBDC6740D20B3AC88F6AD82A4FB08D71AB47A086E86EEDF39D1C5BBA97C4080126141D67F37BE8538F5A8BE740E484'
    ],
]
for(const [crypt,iv,plain,enc] of tests) {
    const p=hex.toBytes(plain);
    const b=new Ofb(crypt,hex.toBytes(iv));
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
    assert.throws(()=>new Ofb(blowfish_KeyZero,hex.toBytes('00')));
});

tsts(`Block size matches crypt`,()=>{
    assert.equal(ofb_blowfishKeyZero_zeroIv.blockSize,blowfish_KeyZero.blockSize);
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
        assert.is(ofb_blowfishKeyZero_zeroIv.encryptSize(plainLen),expect);
	});
}

tsts.run();