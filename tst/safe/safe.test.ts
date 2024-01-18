import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {somewhatSafe} from '../../src/safe';
import { ILengther } from '../../src/primitive/interfaces/ILengther';

const tsts = suite('somewhatSafe');

// safe.int.is doesn't throw (Only superSafe.int.is does)
const isInt:[unknown,boolean][]=[
    [0,true],
    [1,true],

    [true,true],
    [1.1,true]
];
for(const [test,isValid] of isInt) {
    tsts(`safe.int.is(${test})`,()=>{
        if (isValid) {
            assert.not.throws(()=>somewhatSafe.int.is(test));
        } else {
            assert.throws(()=>somewhatSafe.int.is(test));
        }
    })
}

//safe.int.inRangeInc doesn't confirm integer-ness
const intInRange1To5:[number,boolean][]=[
    [0,false],
    [1,true],
    [2,true],
    [4,true],
    [5,true],
    [6,false],

    [1.5,true]
];
for(const [test,inRange] of intInRange1To5) {
    tsts(`safe.int.inRangeInc(${test},1,5)`,()=>{
        if (inRange) {
            assert.not.throws(()=>somewhatSafe.int.inRangeInc(test,1,5));
        } else {
            assert.throws(()=>somewhatSafe.int.inRangeInc(test,1,5));
        }
    })
}

const isString:[unknown,boolean][]=[
    [undefined,true],
    [null,true],
    //[Symbol('nope'),false],
    [true,true],
    [0,true],
    [1.1,true],

    ['yep',true],
    ['',true]
];
for(const [test,isValid] of isString) {
    tsts(`safe.string.is(${test})`,()=>{
        if (isValid) {
            assert.not.throws(()=>somewhatSafe.string.is(test));
        } else {
            assert.throws(()=>somewhatSafe.string.is(test));
        }
    })
}

const nullEmpty:[unknown,string|undefined][]=[
    [undefined,undefined],
    [null,undefined],//null -> undefined
    ['',undefined],//empty string -> undefined
    [4,'4'],//Number coerced to string
    ['hello','hello']
];
for(const [test,expect] of nullEmpty) {
    tsts(`safe.string.nullEmpty(${test})`,()=>{
        assert.is(somewhatSafe.string.nullEmpty(test),expect);
    })
}

const lengthAtLeast:[ILengther,number,boolean][]=[
    //Anything that gives us a length element
    [new Uint8Array(0),0,true],
    [new Uint8Array(0),1,false],
    [new Uint8Array(10),1,true],
    ['',1,false],
    ['a',1,true],
    ['abba',1,true],
];
for(const [test,need,expect] of lengthAtLeast) {
    tsts(`safe.string.lengthAtLeast(${test},${need})`,()=>{
        if (expect) {
            assert.not.throws(()=>somewhatSafe.lengthAtLeast(test,need));
        } else {
            assert.throws(()=>somewhatSafe.lengthAtLeast(test,need));
        }
    });
}

tsts.run();