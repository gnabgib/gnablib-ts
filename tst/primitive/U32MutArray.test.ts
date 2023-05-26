import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as hex from '../../src/encoding/Hex';
import {Platform, asLE} from '../../src/endian/platform';
import {U32, U32MutArray } from '../../src/primitive/U32';

const tsts = suite('U32MutArray');

tsts('gen',()=>{
    const len=3;
    const a=U32MutArray.fromLen(len);
    assert.is(a.length,len);
    for(let i=0;i<len;i++) assert.is(a[i].value,0);
});

tsts.run();