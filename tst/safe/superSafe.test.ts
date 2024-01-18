import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {superSafe} from '../../src/safe';
import { ILengther } from '../../src/primitive/interfaces/ILengther';

const tsts = suite('superSafe');

const isInt:[unknown,boolean][]=[
    [0,true],
    [1,true],

    [true,false],
    [1.1,false]
];
for(const [test,isValid] of isInt) {
    tsts(`safe.int.is(${test})`,()=>{
        if (isValid) {
            assert.not.throws(()=>superSafe.int.is(test));
        } else {
            assert.throws(()=>superSafe.int.is(test));
        }
    })
}

const intInRange1To5:[number,boolean][]=[
    [0,false],
    [1,true],
    [2,true],/*! Copyright 2024 the gnablib contributors MPL-1.1 */
    [4,true],
    [5,true],
    [6,false],

    [1.5,false]
];
for(const [test,inRange] of intInRange1To5) {
    tsts(`safe.int.inRangeInc(${test},1,5)`,()=>{
        if (inRange) {
            assert.not.throws(()=>superSafe.int.inRangeInc(test,1,5));
        } else {
            assert.throws(()=>superSafe.int.inRangeInc(test,1,5));
        }
    })
}

const isString:[unknown,boolean][]=[
    [undefined,false],
    [null,false],
    //[Symbol('nope'),false],
    [true,false],
    [0,false],
    [1.1,false],

    ['yep',true],
    ['',true]
];
for(const [test,isValid] of isString) {
    tsts(`safe.string.is(${test})`,()=>{
        if (isValid) {
            assert.not.throws(()=>superSafe.string.is(test));
        } else {
            assert.throws(()=>superSafe.string.is(test));
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
        assert.is(superSafe.string.nullEmpty(test),expect);
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
            assert.not.throws(()=>superSafe.lengthAtLeast(test,need));
        } else {
            assert.throws(()=>superSafe.lengthAtLeast(test,need));
        }
    });
}

tsts.run();