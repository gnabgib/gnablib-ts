import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { U32MutArray } from '../../src/primitive/U32';

const tsts = suite('U32MutArray');

tsts('gen',()=>{
    const len=3;
    const arr=U32MutArray.fromLen(len);
    assert.is(arr.length,len);
    for(let i=0;i<len;i++) assert.is(arr.at(i).value,0);
});

tsts.run();