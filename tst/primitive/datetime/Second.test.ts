import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Second} from '../../../src/primitive/datetime/Second';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';

const tsts = suite('Second');

const serSet:[number,string][] = [
    [0,'00'],
    [1,'04'],
    [2,'08'],
    [3,'0C'],
    [4,'10'],
    [5,'14'],
    [6,'18'],
    [7,'1C'],
    [8,'20'],
    [9,'24'],

    [58,'E8'],
    [59,'EC']
];
for (const [mi,ser] of serSet) {
    tsts(`ser(${mi})`,()=>{
        const m = Second.new(mi);
        assert.equal(m.value,mi);
    
        const bw=new BitWriter(Math.ceil(Second.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=Second.deserialize(br).validate();
        assert.is(m.value,mi);
    });
}

tsts(`deser with invalid source value (60) throws`,()=>{
    const bytes=Uint8Array.of(60<<2);
    const br=new BitReader(bytes);
    assert.throws(()=>Second.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Second.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0x00);
    const br=new BitReader(bytes);
    assert.throws(()=>Second.deserialize(br,stor).validate());
});

tsts(`new`,()=>{
    const m=Second.new(11);
    assert.is(m.value,11);
    assert.is(m.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(1);
    const m=Second.new(12,stor);
    assert.is(m.valueOf(),12);
});

tsts(`fromDate`,()=>{
    const dt=new Date(2001,2,3,4,5,6);
    const m=Second.fromDate(dt);
    assert.is(m.value,dt.getSeconds());
});
tsts(`fromDate-provide storage`,()=>{
    const stor=new Uint8Array(1);
    const dt=new Date(2001,2,3,4,5,6);
    const m=Second.fromDate(dt,stor);
    assert.is(m.value,dt.getSeconds());
});

tsts(`now`,()=>{
    const dt=new Date();
    const m=Second.now();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing near midnight)
    assert.is(m.value,dt.getSeconds());
});


tsts.run();