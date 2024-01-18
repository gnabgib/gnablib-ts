import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';

const tsts = suite('BitWriter');

tsts('3x2,5x3,7x4,0x2,Fx2 in 2 bytes',()=>{
    var bw=new BitWriter(2);
    bw.writeNumber(3,2);
    bw.writeNumber(5,3);
    bw.writeNumber(7,4);
    bw.writeNumber(0,2);
    bw.writeNumber(0xf,2);
    bw.writeNumber(0,3);//This is just here to make sure exact bits doesn't cause a size override

    // 3x2 =b11, 5x3 = b101, 7x4 = b0111, 0x2 = b00, fx2 = b11 = 1110101110011000
    assert.is(hex.fromBytes(bw.getBytes()),'EB98');
});

tsts.run();
