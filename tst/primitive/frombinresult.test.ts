import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { BinResult, FromBinResult } from '../../src/primitive/FromBinResult';


const tsts = suite('FromBinResult');
//Note sure how useful this is, not useless tests, but.. code coverage

tsts('BinResult',()=>{
    const b=new BinResult(1,11);
    assert.instance(b,Object);
});

const fbrTests:[number|undefined,string|undefined][]=[
    [11,undefined],
    [40,'a reason'],
    [undefined,'who cares'],
];
let count=0;
for(const [value,reason] of fbrTests) {
    tsts(`FromBinResult[${count++}]`,()=>{
        const e=new FromBinResult(1,value,reason);
        assert.is(e.success,true);
        assert.instance(e,Object);
        if (value!==undefined) {
            assert.throws(()=>e.switchT());
        } else {
            const _=e.switchT();
        }
    });
}

tsts.run();