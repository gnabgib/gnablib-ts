import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Aes, Blowfish, Cfb, IBlockCrypt } from '../../../src/crypto';


const tsts = suite('CFB');

/** Blowfish with a zero key - terrible IRL, but fine for testing */
const blowfish_KeyZero=new Blowfish(hex.toBytes('0000000000000000'));
/** CFB with blowfish zero, zero pad, and zero IV - terrible IRL, but fine for testing */
const cfb_blowfishKeyZero_zeroIv=new Cfb(blowfish_KeyZero,new Uint8Array(8));


const tests:[IBlockCrypt,string,string,string][]=[
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
    //https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/AES_CFB.pdf
    //AES128 (segmentLength=128)
    [
        new Aes(hex.toBytes('2B7E151628AED2A6ABF7158809CF4F3C')),
        '000102030405060708090A0B0C0D0E0F',
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        '3B3FD92EB72DAD20333449F8E83CFB4AC8A64537A0B3A93FCDE3CDAD9F1CE58B26751F67A3CBB140B1808CF187A4F4DFC04B05357C5D1C0EEAC4C66F9FF7F2E6'
    ],
    //AES192 (segmentLength=128)
    [
        new Aes(hex.toBytes('8E73B0F7DA0E6452C810F32B809079E562F8EAD2522C6B7B')),
        '000102030405060708090A0B0C0D0E0F',
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        'CDC80D6FDDF18CAB34C25909C99A417467CE7F7F81173621961A2B70171D3D7A2E1E8A1DD59B88B1C8E60FED1EFAC4C9C05F9F9CA9834FA042AE8FBA584B09FF'
    ],
    //AES256 (segmentLength=128)
    [
        new Aes(hex.toBytes('603DEB1015CA71BE2B73AEF0857D77811F352C073B6108D72D9810A30914DFF4')),
        '000102030405060708090A0B0C0D0E0F',
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        'DC7E84BFDA79164B7ECD8486985D386039FFED143B28B1C832113C6331E5407BDF10132415E54B92A13ED0A8267AE2F975A385741AB9CEF82031623D55B1E471'
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