import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/encoding/Hex';
import { utf8 } from '../../src/encoding/Utf8';
import { Hmac } from '../../src/mac/Hmac';
import { Md5 } from '../../src/hash/Md5';

const tsts = suite('HMAC/RFC 2104 (md5)');

type hashHex={
    key:string|Uint8Array,
    data:string|Uint8Array,
    expect:string
};

const md5Hex:hashHex[]=[
    //From RFC 2104
    {
        key:hex.toBytes('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b'),
        data:'Hi There',
        expect:'9294727A3638BB1C13F48EF8158BFC9D'},
    {
        key:'Jefe',
        data:'what do ya want for nothing?',
        expect:'750C783E6AB0B503EAA86E310A5DB738'},
    {
        key:hex.toBytes('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
        data:hex.toBytes('DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD'),
        expect:'56BE34521D144C88DBB8C733F0E8B3F6'},
    //Wikipedia
    {
        key:'key',
        data:'The quick brown fox jumps over the lazy dog',
        expect:'80070713463E7749B90C2DC24911E275'},
];

for (const test of md5Hex) {
    //Note we reuse the hash object
    const hash=new Md5();
    tsts('hmac-md5: '+test.data,()=>{
        const bKey=test.key instanceof Uint8Array ? test.key : utf8.toBytes(test.key);
        const bMsg=test.data instanceof Uint8Array ? test.data : utf8.toBytes(test.data);
        const mac=new Hmac(hash,bKey);
        mac.write(bMsg);
        const found=mac.sum();
        assert.is(hex.fromBytes(found),test.expect);
    });
}

tsts('newEmpty',()=>{
    const hash=new Md5();
    const bKey=hex.toBytes('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b');
    const mac=new Hmac(hash,bKey);
    mac.write(utf8.toBytes('Hi There'));
    assert.is(hex.fromBytes(mac.sum()),'9294727A3638BB1C13F48EF8158BFC9D','original sum');
    assert.is(mac.size,hash.size);
    assert.is(mac.blockSize,hash.blockSize);

    const other=mac.newEmpty();
    //Note it doesn't have any written data
    assert.is(hex.fromBytes(other.sum()),'C9E99A43CD8FA24A840AA85C7CCA0061','clone sum');
});

tsts.run();
