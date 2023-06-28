import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../../src/encoding/Hex';
import { Zero } from '../../../src/crypt/padding/Zero';

const tsts = suite('Padding-Zero/Pad1');

const pad8Tests:[string,string][]=[
    ['','0000000000000000'],
    ['01','0100000000000000'],
    ['0201','0201000000000000'],
    ['030201','0302010000000000'],
    ['04030201','0403020100000000'],
    ['0504030201','0504030201000000'],
    ['060504030201','0605040302010000'],
    ['07060504030201','0706050403020100'],
    ['0807060504030201','0807060504030201'],
];
for(const [start,padded] of pad8Tests) {
    tsts(`pad(${start})`,()=>{
        const bytes=hex.toBytes(start);
        const found=Zero.pad(bytes,8);
        assert.equal(hex.fromBytes(found),padded);
    });
    tsts(`unpad(${padded})`,()=>{
        const bytes=hex.toBytes(padded);
        const found=Zero.unpad(bytes);
        assert.equal(hex.fromBytes(found),start);
    });
}

const shouldPad8Tests:[number,number][]=[
    [0,0],
    [1,8],
    [2,8],
    [3,8],
    [4,8],
    [5,8],
    [6,8],
    [7,8],
    [8,0],
    [9,0],
];
for(const [len,size] of shouldPad8Tests) {
    tsts(`padSize(${len})`,()=>{
        assert.equal(Zero.padSize(len,8),size);
    });
}

tsts(`Input too large throws`,()=>{
    assert.throws(()=>Zero.pad(Uint8Array.of(1),0));
})

tsts(`Ambiguous pad`,()=>{
    const start=hex.toBytes('0100');//Note the trailing 0
    const pad=Zero.pad(start,8);
    assert.equal(hex.fromBytes(pad),'0100000000000000');
    const unpad=Zero.unpad(pad);
    assert.equal(hex.fromBytes(unpad),'01');//Lost the trailing zero
})

tsts.run();