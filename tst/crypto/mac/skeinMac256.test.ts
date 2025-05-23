import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { SkeinMac256 } from '../../../src/crypto/hash/Skein';

const tsts = suite('SkeinMAC 256');

const tests:[string,string,string][]=[
    //github.com/aead/skein/skein256
    [
        'CB41F1706CDE09651203C2D0EFBADDF8',

        '',
        
        '886E4EFEFC15F06AA298963971D7A25398FFFE5681C84DB39BD00851F64AE29D'
    ],
];
for (const [key, msg, expect] of tests) {
    tsts(`SkeinMAC-256(x${key},x${msg})`, () => {
        const mac=new SkeinMac256(hex.toBytes(key));
        mac.write(hex.toBytes(msg));
        const md = mac.sum();
        assert.is(hex.fromBytes(md), expect);
    });
}

tsts.run();
