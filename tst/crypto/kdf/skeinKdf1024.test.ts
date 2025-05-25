import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { SkeinKdf1024 } from '../../../src/crypto/hash/Skein';

const tsts = suite('SkeinKDF 1024');

const tests:[number,string,string,string,string][]=[
    //Todo find a better source than another impl
    [
        32,
        "CB41F1706CDE09651203C2D0EFBADDF8",
        "000102030405060708090A0B0C",
        "D3090C72",
        "619A8E53F7E0166FEF68782B57BA7D1211B03A4AC7F098DAB14314067C36C9A8"
    ],
    [
        32,
        "0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B",
        "000102030405060708090A0B0C",
        "F0F1F2F3F4F5F6F7F8F9",
        "4A79E1BA1499178FA375251E43ECBAE4AE6EE9164F75F787EBBDBCB1A1A1DFA7"
    ]

];
for (const [size,ikm,salt,info, expect] of tests) {
    tsts(`SkeinKDF-1024(${size},x${ikm},x${salt},x${info})`, () => {
        const hash = new SkeinKdf1024(size,hex.toBytes(ikm),hex.toBytes(salt));
        hash.write(hex.toBytes(info));
        const md = hash.sum();
        assert.is(hex.fromBytes(md), expect);
    });
}

tsts.run();