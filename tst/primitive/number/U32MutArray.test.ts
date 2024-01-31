import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { U32MutArray } from '../../../src/primitive/number';
import util from 'util';

const tsts = suite('U32MutArray');

tsts('gen',()=>{
    const len=3;
    const arr=U32MutArray.fromLen(len);
    assert.is(arr.length,len);
    for(let i=0;i<len;i++) assert.is(arr.at(i).value,0);
});

tsts('[Symbol.toStringTag]', () => {
    const o=U32MutArray.fromLen(13);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('U32MutArray') > 0, true);
});

tsts('util.inspect',()=>{
    const o=U32MutArray.fromLen(13);
    const u=util.inspect(o);
    assert.is(u.startsWith('U32MutArray('),true);
});

// tsts('general',()=>{
//     const o=U32MutArray.fromLen(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });

tsts.run();