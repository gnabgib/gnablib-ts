import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Salsa20 } from '../../../src/crypto';
import { U64 } from '../../../src/primitive';


const tsts = suite('Salsa20');


const testEnc:[string,string,string,U64,string,string][]=[
    [
        'salsafamily Section 4.1',
        '0102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F20',
        '0301040105090206',
        U64.fromInt(7),
        '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        //Note the docs show U32 in little endian (reverse each 4 byte set)
        'A305A2B950E195061A8894AA2CB1B7ADD442897916701026A4B1ED643F17272DFAF1C7B1DC6E066223FA35E0046F49C4B3E6312128DE0B8107B42CF63DDEDE6B'
    ],
    //ss=https://asecuritysite.com/encryption/salsa20
    //Imperfectly you cannot set the nonce so reproduction means changing the Nonce each time
    [
        'SS(long text)',
        '59378499F2A89CC5844B2EB11EFB7B12A8B458942452695B342D7D11723C3379',
        '43A547D9B3C34CE6',//hex.fromBytes(base64.toBytes('Q6VH2bPDTOY=')),
        U64.zero,
        hex.fromBytes(utf8.toBytes('ChaCha20 and Salsa take a 256-bit key (or a 128-bit version) and a 32-bit nonce This creates a key stream, which is then XORed with the plaintext stream. In software, it is more than three times faster than AES, and is well suited to lower-powered devices and in real-time communications.')),
        '9B36891A473AA0433E5875C56B7D21FBEC4C8612DE8F2317684BB6BB7FAFDEA14C71AC2FA4263A58997B4714EA21329319461568A1B552CC6771336BBA176EA1A54651F3EF47221260BBF6A7D7295DD35D916D8BDC0C7FC3CD1E7326EEA777990E048880B3A260E0AC42A6FC2967EDA171CD0F5AF72231B9F4DC1D49D3A49A84944E8BE20B261B0F604D2C8B493263380AE7A82142CA1509E7C49B15D0872982EDE04DA2FB727075A9A81965AB4B2C9AAC44109FBC44E47232E8F016CEAB05E3E593B6D32CCE3389030A103B28580CD696089B543255F18F3CD05E42999149D362184D699623251D0D35466074C8580876CC7E10FF9B4BD3126CEA8B5B646ACCD0A5C7B93AA0E818BF0E19DAD1070C91C328EE35141EDD7E27EDD7C9981B4793',
    ],
    [
        'SS(The quick brown fox)',
        '59378499F2A89CC5844B2EB11EFB7B12A8B458942452695B342D7D11723C3379',
        'B8D29A1CB4DBA59B',
        U64.zero,
        hex.fromBytes(utf8.toBytes('The quick brown fox')),
        '20761DE3355F2D8B0C68E15529579E6D64A9E2',
    ],
    [
        'SS(gnablib)',
        '59378499F2A89CC5844B2EB11EFB7B12A8B458942452695B342D7D11723C3379',
        '98E2D79710D2A320',
        U64.zero,
        hex.fromBytes(utf8.toBytes('gnablib')),
        '303EE6CD32EC35'
    ],
    [
        'gnablib, short key (tau instead of sigma) - calculated',
        '000102030405060708090a0b0c0d0e0f',
        '0000000000000000',
        U64.zero,
        hex.fromBytes(utf8.toBytes('gnablib')),
        '4ABBA295D64242'
    ],
];
for(const [descr,key,nonce,counter,plain,enc] of testEnc) {
    tsts(`enc(${descr})`,()=>{
        const cc=new Salsa20(hex.toBytes(key),hex.toBytes(nonce),counter);
        const pBytes=hex.toBytes(plain);
        const eBytes=new Uint8Array(pBytes.length);
        cc.encryptInto(eBytes,pBytes);
        assert.equal(hex.fromBytes(eBytes),enc);
    });
    tsts(`dec(${descr})`,()=>{
        const cc=new Salsa20(hex.toBytes(key),hex.toBytes(nonce),counter);
        const eBytes=hex.toBytes(enc);
        const pBytes=new Uint8Array(eBytes.length);
        cc.decryptInto(pBytes,eBytes);
        assert.equal(hex.fromBytes(pBytes),plain);
    });
}

tsts(`Encrypt size matches plaintext`,()=>{
    var cc=new Salsa20(new Uint8Array(32),new Uint8Array(8));
    assert.is(cc.encryptSize(13),13);
});

tsts(`Invalid keysize throws size matches plaintext`,()=>{
    assert.throws(()=>new Salsa20(new Uint8Array(0),new Uint8Array(0)));
});

tsts.run();