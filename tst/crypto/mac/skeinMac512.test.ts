import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/codec';
import { SkeinMac512 } from '../../../src/crypto/hash/Skein';

const tsts = suite('SkeinMAC 512');

const tests:[string,string,string][]=[
    //github.com/aead/skein
    [
        'CB41F1706CDE09651203C2D0EFBADDF847A0D315CB2E53FF8BAC41DA0002672E'+
        '920244C66E02D5F0DAD3E94C42BB65F0D14157DECF4105EF5609D5B0984457C1',
        
        'D3090C72167517F7C7AD82A70C2FD3F6',
        
        '478D7B6C0CC6E35D9EBBDEDF39128E5A36585DB6222891692D1747D401DE34CE'+
        '3DB6FCBAB6C968B7F2620F4A844A2903B547775579993736D2493A75FF6752A1'
    ],
];
for (const [key, msg, expect] of tests) {
    tsts(`SkeinMAC-512(x${key},x${msg})`, () => {
        const mac=new SkeinMac512(hex.toBytes(key));
        mac.write(hex.toBytes(msg));
        const md = mac.sum();
        assert.is(hex.fromBytes(md), expect);
    });
}

tsts.run();
