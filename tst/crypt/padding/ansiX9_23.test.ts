import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { AnsiX9_23,Iso10126 } from '../../../src/crypt/padding/AnsiX9_23';

const tsts = suite('Padding-ansi x9-23');

const pad8Tests:[string,boolean,string][]=[
    ['',true,'FFEEDDCCBBCCAA08'],
    ['01',true,'01EEDDCCBBCCAA07'],
    ['0201',true,'0201DDCCBBCCAA06'],
    ['030201',true,'030201CCBBCCAA05'],
    ['04030201',true,'04030201BBCCAA04'],
    ['0504030201',true,'0504030201CCAA03'],
    ['060504030201',true,'060504030201AA02'],
    ['07060504030201',true,'0706050403020101'],
    //This doesn't work because we MUST pad (the next block would match test:0)
    //['0807060504030201',true,'0807060504030201'],
];
for(const [start,should,egPad] of pad8Tests) {
    //NOTE pad generates random bytes, so we can't know anything but the
    // start and count indicator's values (last byte)
    const padBytes=hex.toBytes(egPad);
    const padCount=padBytes[7];
    tsts(`pad(${start})`,()=>{
        const bytes=hex.toBytes(start);
        const found=AnsiX9_23.pad(bytes,8);
        assert.is(found[7],padCount);
        assert.equal(found.subarray(0,bytes.length),bytes);
    });
    tsts(`unpad(${egPad})`,()=>{
        const found=AnsiX9_23.unpad(padBytes);
        assert.equal(hex.fromBytes(found),start);
    });
    tsts(`shouldPad(${start})`,()=>{
        assert.equal(AnsiX9_23.shouldPad(start.length/2,8),should);
    });
}

tsts(`Input too large throws`,()=>{
    assert.throws(()=>Iso10126.pad(Uint8Array.of(1),0));
});

tsts(`Pad too big throws`,()=>{
    assert.throws(()=>Iso10126.unpad(Uint8Array.of(2)));
});


tsts.run();