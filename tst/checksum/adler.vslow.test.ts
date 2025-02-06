import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { hex } from '../../src/codec';
import { Adler32 } from '../../src/checksum/adler';

const tsts = suite('Adler - SLOW');

const b1k=new Uint8Array(1000);

tsts(`Adler(1M bytes)`,()=>{
    const cs=new Adler32();
    for(let i=0;i<1000;i++) cs.write(b1k);
    // 1M = xF4240, mod xFFF1 = x4321
    assert.is(hex.fromBytes(cs.sum()),'43210001');
})

tsts.run();
