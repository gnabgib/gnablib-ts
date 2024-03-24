import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { safe } from '../../src/safe';
import { ILengther } from '../../src/primitive/interfaces/ILengther';

const tsts = suite('safe.len');

const atLeast5Set: [ILengther, boolean][] = [
	//Anything that gives us a length element
	[new Uint8Array(0), false],
    [new Uint8Array(1),false],
	[new Uint8Array(4), false],
    [new Uint8Array(5), true],
    [new Uint8Array(6), true],
	['', false],
	['abba', false],
	['alpha', true],
];
for (const [test, expect] of atLeast5Set) {
    const need=5;
    tsts(`atLeast(${test},${need})`, () => {
        if (expect) {
            assert.not.throws(()=>safe.len.atLeast('$noun',test,need));
        } else {
            assert.throws(()=>safe.len.atLeast('$noun',test,need));
        }
    });	
}

const exactly5Set:[ILengther,boolean][] =[
	[new Uint8Array(1),false],
    [new Uint8Array(4),false],
    [new Uint8Array(5),true],
    [new Uint8Array(6),false],
];
for(const [test,expect] of exactly5Set) {
    const need=5;    
    tsts(`exactly(${test},${need})`,()=>{
        if (expect) {
            assert.not.throws(()=>safe.len.exactly('$noun',test,need));
        } else {
            assert.throws(()=>safe.len.exactly('$noun',test,need));
        }
    });
}

const inRange4to5Set:[ILengther,boolean][]=[
	[new Uint8Array(1),false],
    [new Uint8Array(4),true],
    [new Uint8Array(5),true],
    [new Uint8Array(6),false],
];
for(const [test,expect] of inRange4to5Set) {
    const low=4;
    const high=5;
    tsts(`inRangeInc(${test},${low},${high})`,()=>{
        if (expect) {
            assert.not.throws(()=>safe.len.inRangeInc('$noun',test,low,high));
        } else {
            assert.throws(()=>safe.len.inRangeInc('$noun',test,low,high));
        }
    });
}

const atMost5Set:[ILengther,boolean][] =[
	[new Uint8Array(1),true],
    [new Uint8Array(4),true],
    [new Uint8Array(5),true],
    [new Uint8Array(6),false],
];
for(const [test,expect] of atMost5Set) {
    const need=5;    
    tsts(`atMost(${test},${need})`,()=>{
        if (expect) {
            assert.not.throws(()=>safe.len.atMost('$noun',test,need));
        } else {
            assert.throws(()=>safe.len.atMost('$noun',test,need));
        }
    });
}

tsts.run();