import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Blowfish } from '../../../src/crypt/sym/Blowfish';
import { Ctr, ICountMode, IncrBytes, Concat32 } from '../../../src/crypt/block/Ctr';
import { ICrypt } from '../../../src/crypt/sym/ICrypt';
import { Aes } from '../../../src/crypt/sym/Aes';


const tsts = suite('CTR');

/** Blowfish with a zero key - terrible IRL, but fine for testing */
const blowfish_KeyZero=new Blowfish(hex.toBytes('0000000000000000'));
/** CFB with blowfish zero, zero pad, and zero IV - terrible IRL, but fine for testing */
const ctr_blowfishKeyZero_zeroIv=new Ctr(blowfish_KeyZero,new IncrBytes(new Uint8Array(8)));


const tests:[ICrypt,ICountMode,string,string][]=[
    [
        blowfish_KeyZero,
        new IncrBytes(hex.toBytes('0000000000000000')),
        '00000000000000',
        '4EF997456198DD'
    ],
    [
        blowfish_KeyZero,
        new IncrBytes(hex.toBytes('0000000000000000')),
        '0000000000000000',
        '4EF997456198DD78'
    ],
    [
        //Causes a key-wrap on +1
        blowfish_KeyZero,
        new IncrBytes(hex.toBytes('FFFFFFFFFFFFFFFF')),
        '0000000000000000',
        '014933E0CDAFF6E4'
    ],
    [
        blowfish_KeyZero,
        new IncrBytes(hex.toBytes('0000000000000000')),
        '00000000000000000000000000000000',
        '4EF997456198DD7864ED065757511FA7'
    ],
    [
        new Blowfish(hex.toBytes('0123456789ABCDEFF0E1D2C3B4A59687')),
        new IncrBytes(hex.toBytes('FEDCBA9876543210')),
        '37363534333231204E6F77206973207468652074696D6520666F722000',
        'E73214A2822139CA60254740DD8C5B8ACF5E9569C4AFFEB944B8FC020E'
    ],
    [
        new Blowfish(hex.toBytes('0123456789ABCDEFF0E1D2C3B4A59687')),
        new Concat32(hex.toBytes('FEDCBA98')),
        '37363534333231204E6F77206973207468652074696D6520666F722000',
        '12E4AFC07386C110FF9AB80775285A5C9297F40B4AB1CC3EA3DDE06F19'
    ],
    [
        new Blowfish(hex.toBytes('0123456789ABCDEFF0E1D2C3B4A59687')),
        new Concat32(hex.toBytes('FEDCBA98')),
        '37363534333231204E6F77206973207468652074696D6520666F722000',
        '12E4AFC07386C110FF9AB80775285A5C9297F40B4AB1CC3EA3DDE06F19'
    ],
    //https://datatracker.ietf.org/doc/html/rfc3686.html
    //Test Vector #1: Encrypting 16 octets using AES-CTR with 128-bit key
    [
        new Aes(hex.toBytes('AE6852F8121067CC4BF7A5765577F39E')),
        new Concat32(hex.toBytes('000000300000000000000000'),1),
        '53696E676C6520626C6F636B206D7367',
        'E4095D4FB7A7B3792D6175A3261311B8'
    ],
    //https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/AES_CTR.pdf
    //AES128
    [
        new Aes(hex.toBytes('2B7E151628AED2A6ABF7158809CF4F3C')),
        new IncrBytes(hex.toBytes('F0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF')),
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        '874D6191B620E3261BEF6864990DB6CE9806F66B7970FDFF8617187BB9FFFDFF5AE4DF3EDBD5D35E5B4F09020DB03EAB1E031DDA2FBE03D1792170A0F3009CEE'
    ],
    //AES192
    [
        new Aes(hex.toBytes('8E73B0F7DA0E6452C810F32B809079E562F8EAD2522C6B7B')),
        new IncrBytes(hex.toBytes('F0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF')),
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        '1ABC932417521CA24F2B0459FE7E6E0B090339EC0AA6FAEFD5CCC2C6F4CE8E941E36B26BD1EBC670D1BD1D665620ABF74F78A7F6D29809585A97DAEC58C6B050'
    ],
    //AES256
    [
        new Aes(hex.toBytes('603DEB1015CA71BE2B73AEF0857D77811F352C073B6108D72D9810A30914DFF4')),
        new IncrBytes(hex.toBytes('F0F1F2F3F4F5F6F7F8F9FAFBFCFDFEFF')),
        '6BC1BEE22E409F96E93D7E117393172AAE2D8A571E03AC9C9EB76FAC45AF8E5130C81C46A35CE411E5FBC1191A0A52EFF69F2445DF4F9B17AD2B417BE66C3710',
        '601EC313775789A5B7A7F504BBF3D228F443E3CA4D62B59ACA84E990CACAF5C52B0930DAA23DE94CE87017BA2D84988DDFC9C58DB67AADA613C2DD08457941A6'
    ],
];
for(const [crypt,ctr,plain,enc] of tests) {
    const p=hex.toBytes(plain);
    const b=new Ctr(crypt,ctr);
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
    assert.throws(()=>new Ctr(blowfish_KeyZero,new IncrBytes(new Uint8Array(1))));
});

tsts(`concat32-IV must be block size-4`,()=>{
    assert.throws(()=>new Ctr(blowfish_KeyZero,new Concat32(new Uint8Array(1))));
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

tsts(`IncrBytes`,()=>{
    const ib=new IncrBytes(hex.toBytes('00FA'));
    const found:string[]=[];
    for(const i of ib) {
        const h=hex.fromBytes(i);
        found.push(h);
        if (h==='0101') break;
    }
    assert.equal(found.join(''),'00FA00FB00FC00FD00FE00FF01000101');
    //Double iter resets
    const found2:string[]=[];
    for(const i of ib) {
        const h=hex.fromBytes(i);
        found2.push(h);
        if (h==='00FB') break;
    }
    assert.equal(found2.join(''),'00FA00FB');
});

tsts(`Concat32`,()=>{
    const ib=new Concat32(hex.toBytes('00FA'));
    const found:string[]=[];
    for(const i of ib) {
        const h=hex.fromBytes(i);
        found.push(h);
        if (h==='00FA00000002') break;
    }
    assert.equal(found.join(''),'00FA0000000000FA0000000100FA00000002');
    //Double iter resets
    const found2:string[]=[];
    for(const i of ib) {
        const h=hex.fromBytes(i);
        found2.push(h);
        if (h==='00FA00000001') break;
    }
    assert.equal(found2.join(''),'00FA0000000000FA00000001');

})

tsts.run();