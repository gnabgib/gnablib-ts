import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Assert, errorSetting} from '../../src/test';

const tsts = suite('Asset');

const inClosedOpenTests:[number,number,number,boolean][]=[
    [0,0,1,false],
    [1,0,1,true],
];
let count=0;
for(const [actual,low,highEx,throws] of inClosedOpenTests) {
    tsts(`inClosedOpen[${count++}]`,()=>{
        if (throws) {
            assert.throws(()=>Assert.inClosedOpen(actual,low,highEx));
        } else {
            assert.not.throws(()=>Assert.inClosedOpen(actual,low,highEx));
        }
    });
}

const equalishTests:[number,number,errorSetting,boolean][]=[
    [11,10,{percent:11},false],
    [11,10,{percent:9},true],
    [12,10,{amount:2},false],
    [13,10,{amount:2},true],
];
count=0;
for(const [found,expect,error,throws] of equalishTests) {
    tsts(`equalish[${count++}]`,()=>{
        if (throws) {
            assert.throws(()=>Assert.equalish(found,expect,error));
        } else {
            assert.not.throws(()=>Assert.equalish(found,expect,error));
        }
    });
}

const bytesMatchHexTests:[Uint8Array,string,boolean][]=[
    [Uint8Array.of(0),'00',false],
    [Uint8Array.of(0),'01',true],
];
count=0;
for(const [actual,expect,throws] of bytesMatchHexTests) {
    tsts(`bytesMatchHex[${count++}]`,()=>{
        if (throws) {
            assert.throws(()=>Assert.bytesMatchHex(actual,expect));
        } else {
            assert.not.throws(()=>Assert.bytesMatchHex(actual,expect));
        }
    });
}

tsts.run();