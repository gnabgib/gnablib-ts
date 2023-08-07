import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Aes, Blowfish, Ecb, IBlockCrypt, IPad, Pkcs7, Zero } from '../../../src/crypto';

const tsts = suite('ECB');

/** Blowfish with a zero key - terrible IRL, but fine for testing */
const blowfish_KeyZero=new Blowfish(hex.toBytes('0000000000000000'));
/** EBC with blowfish zero, zero pad, and zero IV - terrible IRL, but fine for testing */
const ebc_blowfishKeyZero_zeroPad=new Ecb(blowfish_KeyZero,Zero);


const tests:[IBlockCrypt,IPad,string,string][]=[
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
    //https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines/example-values

    //https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/AES_Core128.pdf
    [
        new Aes(hex.toBytes('2B7E151628AED2A6ABF7158809CF4F3C')),
        Zero,
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        '3AD77BB40D7A3660A89ECAF32466EF97F5D3D58503B9699DE785895A96FDBAAF43B1CD7F598ECE23881B00E3ED0306887B0C785E27E8AD3F8223207104725DD4'
    ],
    //https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/AES_ECB.pdf
    //AES192
    [
        new Aes(hex.toBytes('8E73B0F7DA0E6452C810F32B809079E562F8EAD2522C6B7B')),
        Zero,
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        'BD334F1D6E45F25FF712A214571FA5CC974104846D0AD3AD7734ECB3ECEE4EEFEF7AFD2270E2E60ADCE0BA2FACE6444E9A4B41BA738D6C72FB16691603C18E0E'
    ],
    //AES256
    [
        new Aes(hex.toBytes('603DEB1015CA71BE2B73AEF0857D77811F352C073B6108D72D9810A30914DFF4')),
        Zero,
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        'F3EED1BDB5D2A03C064B5A7E3DB181F8591CCB10D410ED26DC5BA74A31362870B6ED21B99CA6F4F9F153E7B1BEAFED1D23304B7A39F9F3FF067D8D8F9E24ECC7'
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