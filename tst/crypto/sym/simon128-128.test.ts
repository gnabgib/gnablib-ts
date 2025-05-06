import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { Simon128_128 } from '../../../src/crypto/sym/Simon128';

const tsts = suite('Simon128/128');

// prettier-ignore
const tests:[string,string,string][]=[
    //From https://nsacyber.github.io/simon-speck/implementations/ImplementationGuide1.1.pdf (2019)
    ['000102030405060708090A0B0C0D0E0F','2074726176656C6C6572732064657363','BC0B4EF82A83AA653FFE541E1E1B6849'],
    // //https://github.com/weidai11/cryptopp/blob/master/TestVectors/simon.txt
    // //From Crypto++6 gen
    ['4025FB84F626B651F98B624E07D4916F','48E77185133A2B7E7D3A0E7CB4BAF2F3','89E5C21F350C959C36F9C1D25EF1D1A9'],
    ['C6CA4D23517C2BCA9EF41F073BAB3D3E','98E3D09B061109FCB00D9EB516819990','FC78ADEAD7E41AED23FBBE61E4AC43C2'],
    ['9B737204297E92E29A0466B491A7B548','3AF473E5AF583ABBE642C8AA3535A599','940B4E08DAD46616EC8AB1319F608F47'],
    ['279ABD54E2ECB2C904F4402C74E711D6','995A22386F4D09718DCA4A756EB58512','D15AAC4C190F314CD372B9BAAA338170'],
    ['4479C441DBCB18F9EE47DD9B71E029DA','BBDEF323AC6A6060B58D8063B74E1E3F','F61880D5952B67D7A935CEB779E41099'],
    ['081A60EC367BFE87F24744BDD6954F15','47199DAC3C5C5E7812749F32324DE5E6','6F22DA8592EA13E8ACC4BCA1D0041B3E'],
    ['90041AC92DB746E191875EF010371D99','A8C496C946EDF47D8D354250A26117C3','278B734C1EC04121B9627E3D9CB30326'],
];
for (const [key, plain, enc] of tests) {
    const c = new Simon128_128(hex.toBytes(key));
    tsts(`Simon128/128(${key}).encrypt(${plain})`, () => {
        //Set found equal to plain-source-bytes
        const found = hex.toBytes(plain);
        //Encrypt a block (note the test vectors are all one block)
        c.encryptBlock(found);
        assert.is(hex.fromBytes(found), enc);
    });
    tsts(`Simon128/128(${key}).decrypt(${enc})`, () => {
        //Set found equal to encoded-source-bytes
        const found = hex.toBytes(enc);
        //Decrypt a block (note the test vectors are all one block)
        c.decryptBlock(found);
        assert.is(hex.fromBytes(found), plain);
    });
}

tsts.run();
