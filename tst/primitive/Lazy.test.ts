import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Lazy } from '../../src/primitive/Lazy';


const tsts = suite('Lazy');

tsts('Creation does not build',()=>{
    let buildCount=0;
    assert.is(buildCount,0);
    new Lazy(()=>{buildCount++;});
    assert.is(buildCount,0);
});

tsts('Access builds',()=>{
    let buildCount=0;
    assert.is(buildCount,0);
    const l=new Lazy(()=>{buildCount++;return 5;});
    assert.is(l.value,5);
    assert.is(buildCount,1,'Built once');
    const b=2+l.value;
    assert.is(buildCount,1,'Still only built once');
});

tsts.run();