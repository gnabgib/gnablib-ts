import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {safe} from '../../src/test/runtime';

const tsts = suite('runtime');

const numSet:[unknown,boolean,boolean][]=[
    [undefined,false,false],
    [null,false,false],
    [true,false,false],
    [false,false,false],
    ["1",false,false],
    [{},false,false],
    [[],false,false],
    [1,false,true],
    [1.1,false,true],
    [Number.NaN,false,true],
    [Number.POSITIVE_INFINITY,false,true],
    [Number.NEGATIVE_INFINITY,false,true],

    [undefined,true,true],
    [null,true,false],
];
for(const [v,allowNull,expect] of numSet) {
    tsts(`safe.num(${v},${allowNull})`,()=>{
        if (expect) {
            safe.num(v,allowNull);
        } else {
            assert.throws(()=>safe.num(v,allowNull));
        }
    })
}

const intSet:[unknown,boolean,boolean][]=[
    [undefined,false,false],
    [null,false,false],
    [true,false,false],
    [false,false,false],
    ["1",false,false],
    [{},false,false],
    [[],false,false],
    [1,false,true],
    [1.1,false,false],
    [Number.NaN,false,false],
    [Number.POSITIVE_INFINITY,false,false],
    [Number.NEGATIVE_INFINITY,false,false],

    [undefined,true,true],
    [null,true,false],
];
for(const [v,allowNull,expect] of intSet) {
    tsts(`safe.int(${v},${allowNull})`,()=>{
        if (expect) {
            safe.int(v,allowNull);
        } else {
            assert.throws(()=>safe.int(v,allowNull));
        }
    })
}

const strSet:[unknown,boolean,boolean][]=[
    [undefined,false,false],
    [null,false,false],
    [true,false,false],
    [false,false,false],
    ["1",false,true],
    [{},false,false],
    [[],false,false],
    [1,false,false],
    [1.1,false,false],
    [Number.NaN,false,false],
    [Number.POSITIVE_INFINITY,false,false],
    [Number.NEGATIVE_INFINITY,false,false],

    [undefined,true,true],
    [null,true,false],
];
for(const [v,allowNull,expect] of strSet) {
    tsts(`safe.str(${v},${allowNull})`,()=>{
        if (expect) {
            safe.str(v,allowNull);
        } else {
            assert.throws(()=>safe.str(v,allowNull));
        }
    })
}

const boolSet:[unknown,boolean,boolean][]=[
    [undefined,false,false],
    [null,false,false],
    [true,false,true],
    [false,false,true],
    ["1",false,false],
    [{},false,false],
    [[],false,false],
    [1,false,false],
    [1.1,false,false],
    [Number.NaN,false,false],
    [Number.POSITIVE_INFINITY,false,false],
    [Number.NEGATIVE_INFINITY,false,false],

    [undefined,true,true],
    [null,true,false],
];
for(const [v,allowNull,expect] of boolSet) {
    tsts(`safe.bool(${v},${allowNull})`,()=>{
        if (expect) {
            safe.bool(v,allowNull);
        } else {
            assert.throws(()=>safe.bool(v,allowNull));
        }
    })
}


tsts.run();