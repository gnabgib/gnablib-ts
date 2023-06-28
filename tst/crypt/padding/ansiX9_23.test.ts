import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { AnsiX9_23,Iso10126 } from '../../../src/crypt/padding/AnsiX9_23';

const tsts = suite('Padding-ansi x9-23');

const pad8Tests:[string,string][]=[
    ['','FFEEDDCCBBCCAA08'],
    ['01','01EEDDCCBBCCAA07'],
    ['0201','0201DDCCBBCCAA06'],
    ['030201','030201CCBBCCAA05'],
    ['04030201','04030201BBCCAA04'],
    ['0504030201','0504030201CCAA03'],
    ['060504030201','060504030201AA02'],
    ['07060504030201','0706050403020101'],
    //This doesn't work because we MUST pad (the next block would match test:0)
    //['0807060504030201',true,'0807060504030201'],
];
for(const [start,egPad] of pad8Tests) {
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
}

const shouldPad8Tests:[number,number][]=[
    [0,8],
    [1,8],
    [2,8],
    [3,8],
    [4,8],
    [5,8],
    [6,8],
    [7,8],
    [8,8],
    [9,0],
];
for(const [len,size] of shouldPad8Tests) {
    tsts(`padSize(${len})`,()=>{
        assert.equal(AnsiX9_23.padSize(len,8),size);
    });
}

tsts(`Input too large throws`,()=>{
    assert.throws(()=>Iso10126.pad(Uint8Array.of(1),0));
});

tsts(`Pad too big throws`,()=>{
    assert.throws(()=>Iso10126.unpad(Uint8Array.of(2)));
});


tsts.run();