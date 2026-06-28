import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { SkeinKdf512 } from '../../../src/crypto/hash/Skein';

const tsts = suite('SkeinKDF 512');

const tests:[number,string,string,string,string][]=[
    //Todo find a better source than another impl
    [
        32,
        "CB41F1706CDE09651203C2D0EFBADDF8",
        "000102030405060708090A0B0C",
        "D3090C72",
        "27353E0B834BF692157538A979302BF602CD9EBE8ADEDCC6016AF3E5E17513A0"
    ],
    [
        32,
        "0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B",
        "000102030405060708090A0B0C",
        "F0F1F2F3F4F5F6F7F8F9",
        "44B06945979AA878BC4CBBE1E170D8068940AE857FF312E8082339E71B37772E"
    ]

];
for (const [size,ikm,salt,info, expect] of tests) {
    tsts(`SkeinKDF-512(${size},x${ikm},x${salt},x${info})`, () => {
        const hash = new SkeinKdf512(size,hex.toBytes(ikm),hex.toBytes(salt));
        hash.write(hex.toBytes(info));
        const md = hash.sum();
        assert.is(hex.fromBytes(md), expect);
    });
}

tsts.run();