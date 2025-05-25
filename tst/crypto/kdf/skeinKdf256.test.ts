import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { SkeinKdf256 } from '../../../src/crypto/hash/Skein';

const tsts = suite('SkeinKDF 256');

const tests:[number,string,string,string,string][]=[
    //Todo find a better source than another impl
    [
        32,
        "CB41F1706CDE09651203C2D0EFBADDF8",
        "000102030405060708090A0B0C",
        "D3090C72",
        "B7AB2276F21F1C6974C0333D0059788BF7CA7663FB4EBF16F3B225F65C590C84"
    ],
    [
        32,
        "0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B0B",
        "000102030405060708090A0B0C",
        "F0F1F2F3F4F5F6F7F8F9",
        "9085EDC573DEDF67D1E55E94B0B88A0D1BF56705289863A4DAD1AF0E8B5A9A24"
    ]

];
for (const [size,ikm,salt,info, expect] of tests) {
    tsts(`SkeinKDF-256(${size},x${ikm},x${salt},x${info})`, () => {
        const hash = new SkeinKdf256(size,hex.toBytes(ikm),hex.toBytes(salt));
        hash.write(hex.toBytes(info));
        const md = hash.sum();
        assert.is(hex.fromBytes(md), expect);
    });
}

tsts.run();