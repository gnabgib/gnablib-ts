import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { utf } from '../../src/primitive';

const tsts = suite('Utf');

const lineBreakTests:[number|string,boolean][]=[
    [10,true],
    [11,true],
    [12,true],
    [13,true],
    [0x85,true],
    ['\r',true],
    ['\n',true],
    ['\t',false],
    [' ',false],
    ['a',false],
];
let count=0;
for(const [ord,expect] of lineBreakTests) {
    tsts(`lineBreak[${count++}]`,()=>{
        assert.is(utf.lineBreak(ord),expect);
    });
}

const whiteSpaceTests:[number|string,boolean][]=[
    [9,true],
    [10,true],
    [11,true],
    [12,true],
    [13,true],
    [32,true],
    [33,false],
    ['\t',true],
    [' ',true],
    ['a',false],
];
count=0;
for(const [ord,expect] of whiteSpaceTests) {
    tsts(`whiteSpace[${count++}]`,()=>{
        assert.is(utf.whiteSpace(ord),expect);
    });
}

const printableTests:[number|string,boolean][]=[
    [0,false],
    [32,true],
    [128,false],
    [0x2028,false],
    [0xfff9,false],
    [0x061c,false],
    [0x2070,true],
];
count=0;
for(const [ord,expect] of printableTests) {
    tsts(`printable[${count++}]`,()=>{
        assert.is(utf.printable(ord),expect);
    });
}

const asciiCasedTests:[number|string,boolean][]=[
    [0,false],
    [64,false],
    [90,true],
    [91,false],
    [98,true],
    [123,false],
    ['a',true]
];
count=0;
for(const [ord,expect] of asciiCasedTests) {
    tsts(`asciiCased[${count++}]`,()=>{
        assert.is(utf.asciiCased(ord),expect);
    });
}

tsts.run();