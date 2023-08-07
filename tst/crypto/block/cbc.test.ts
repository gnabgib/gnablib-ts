import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Aes, Blowfish, Cbc, IBlockCrypt, Iso7816_4, IPad, Pkcs7, Zero } from '../../../src/crypto';


const tsts = suite('CBC');

/** Blowfish with a zero key - terrible IRL, but fine for testing */
const blowfish_KeyZero=new Blowfish(hex.toBytes('0000000000000000'));
/** CBC with blowfish zero, zero pad, and zero IV - terrible IRL, but fine for testing */
const cbc_blowfishKeyZero_zeroPad_zeroIv=new Cbc(blowfish_KeyZero,Zero,new Uint8Array(8));

const tests:[IBlockCrypt,IPad,string,string,string][]=[
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
    //https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/AES_CBC.pdf
    //AES128
    [
        new Aes(hex.toBytes('2B7E151628AED2A6ABF7158809CF4F3C')),
        Zero,
        '000102030405060708090A0B0C0D0E0F',
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        '7649ABAC8119B246CEE98E9B12E9197D5086CB9B507219EE95DB113A917678B273BED6B8E3C1743B7116E69E222295163FF1CAA1681FAC09120ECA307586E1A7'
    ],
    //AES192
    [
        new Aes(hex.toBytes('8E73B0F7DA0E6452C810F32B809079E562F8EAD2522C6B7B')),
        Zero,
        '000102030405060708090A0B0C0D0E0F',
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        '4F021DB243BC633D7178183A9FA071E8B4D9ADA9AD7DEDF4E5E738763F69145A571B242012FB7AE07FA9BAAC3DF102E008B0E27988598881D920A9E64F5615CD'
    ],
    //AES256
    [
        new Aes(hex.toBytes('603DEB1015CA71BE2B73AEF0857D77811F352C073B6108D72D9810A30914DFF4')),
        Zero,
        '000102030405060708090A0B0C0D0E0F',
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        'F58C4C04D6E5F1BA779EABFB5F7BFBD69CFC4E967EDB808D679F777BC6702C7D39F23369A9D9BACFA530E26304231461B2EB05E2C39BE9FCDA6C19078C6A9D1B'
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