import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Pkcs5,Pkcs7 } from '../../../src/crypt/padding/Pkcs7';

const tsts = suite('Padding-PKCS7');

const pad8Tests:[string,boolean,string][]=[
    ['',true,'0808080808080808'],
    ['01',true,'0107070707070707'],
    ['0201',true,'0201060606060606'],
    ['030201',true,'0302010505050505'],
    ['04030201',true,'0403020104040404'],
    ['0504030201',true,'0504030201030303'],
    ['060504030201',true,'0605040302010202'],
    ['07060504030201',true,'0706050403020101'],
    //This doesn't work because we MUST pad (the next block would match test:0)
    //['0807060504030201',true,'0807060504030201'],
];
for(const [start,should,padded] of pad8Tests) {
    tsts(`pad(${start})`,()=>{
        const bytes=hex.toBytes(start);
        const found=Pkcs7.pad(bytes,8);
        assert.equal(hex.fromBytes(found),padded);
    });
    tsts(`unpad(${padded})`,()=>{
        const bytes=hex.toBytes(padded);
        const found=Pkcs7.unpad(bytes);
        assert.equal(hex.fromBytes(found),start);
    });
    tsts(`shouldPad(${start})`,()=>{
        assert.equal(Pkcs7.shouldPad(start.length/2,8),should);
    });
}

tsts(`Input too large throws`,()=>{
    assert.throws(()=>Pkcs5.pad(Uint8Array.of(1),0));
});

tsts(`Pad too big throws`,()=>{
    assert.throws(()=>Pkcs7.unpad(Uint8Array.of(2)));
});

tsts(`Pad inconsistent throws`,()=>{
    assert.throws(()=>Pkcs7.unpad(Uint8Array.of(0,1,2)));
});

tsts.run();