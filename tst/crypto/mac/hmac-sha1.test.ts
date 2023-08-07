import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex, utf8 } from '../../../src/codec';
import { Hmac, Sha1 } from '../../../src/crypto';

const tsts = suite('HMAC/RFC 2104 (Sha1)');

type hashHex={
    key:string|Uint8Array,
    data:string|Uint8Array,
    expect:string
};

const sha1Hex:hashHex[]=[
    //Wikipedia
    {
        key:'key',
        data:'The quick brown fox jumps over the lazy dog',
        expect:'DE7C9B85B8B78AA6BC8A7A36F70A90701C9DB4D9'},
    //https://www.liavaag.org/English/SHA-Generator/HMAC/
    {
        key:'key',
        data:'gnabgib',
        expect:'D33121BFC9B5023C60BEE5607AF3A7736C0EBE71'
    },
];

const hash=new Sha1();
for (const test of sha1Hex) {
    //Note we reuse the hash object
    tsts('hmac-sha1: '+test.data,()=>{
        const bKey=test.key instanceof Uint8Array ? test.key : utf8.toBytes(test.key);
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        const mac=new Hmac(hash,bKey);
        mac.write(bMsg);
        const found=mac.sum();
        assert.is(hex.fromBytes(found),test.expect);
    });
}

tsts(`clone`,()=>{
    const mac=new Hmac(hash,Uint8Array.of(1));
    mac.write(Uint8Array.of(0));
    assert.is(hex.fromBytes(mac.sum()),'D6258E5C147B7A1FB6479BD36A2D8EA7FAAB7C1C');
    assert.is(hex.fromBytes(mac.sum()),'D6258E5C147B7A1FB6479BD36A2D8EA7FAAB7C1C','double sum doesn\'t mutate');
    const mac2=mac.clone();
    assert.is(hex.fromBytes(mac2.sum()),'D6258E5C147B7A1FB6479BD36A2D8EA7FAAB7C1C');
    mac.write(Uint8Array.of(0));

    assert.is(hex.fromBytes(mac.sum()),'8E67AE6BF0FFA7852B31363C8CF689962699D699');
    assert.is(hex.fromBytes(mac2.sum()),'D6258E5C147B7A1FB6479BD36A2D8EA7FAAB7C1C','didn\'t mutate clone');
});

tsts(`sumIn`,()=>{
    const mac=new Hmac(hash,Uint8Array.of(1));
    mac.write(Uint8Array.of(0));
    assert.is(hex.fromBytes(mac.sumIn(1)),'D6');
});

tsts.run();
