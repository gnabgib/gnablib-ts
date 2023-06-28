import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Iso7816_4 } from '../../../src/crypt/padding/Iso7816_4';

const tsts = suite('Padding-ISO-7816-4/Pad2');

const pad8Tests:[string,boolean,string][]=[
    ['',true,'8000000000000000'],
    ['01',true,'0180000000000000'],
    ['0201',true,'0201800000000000'],
    ['030201',true,'0302018000000000'],
    ['04030201',true,'0403020180000000'],
    ['0504030201',true,'0504030201800000'],
    ['060504030201',true,'0605040302018000'],
    ['07060504030201',true,'0706050403020180'],
    //This doesn't work because we MUST pad (the next block would match test:0)
    //['0807060504030201',true,'0807060504030201'],
];
for(const [start,should,padded] of pad8Tests) {
    tsts(`pad(${start})`,()=>{
        const bytes=hex.toBytes(start);
        const found=Iso7816_4.pad(bytes,8);
        assert.equal(hex.fromBytes(found),padded);
    });
    tsts(`unpad(${padded})`,()=>{
        const bytes=hex.toBytes(padded);
        const found=Iso7816_4.unpad(bytes);
        assert.equal(hex.fromBytes(found),start);
    });
    tsts(`shouldPad(${start})`,()=>{
        assert.equal(Iso7816_4.shouldPad(start.length/2,8),should);
    });
}

tsts(`Input too large throws`,()=>{
    assert.throws(()=>Iso7816_4.pad(Uint8Array.of(1),0));
});

tsts(`No marker throws`,()=>{
    assert.throws(()=>Iso7816_4.unpad(Uint8Array.of(1)));
});

tsts.run();