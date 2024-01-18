import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Hour} from '../../../src/primitive/datetime/Hour';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';

const tsts = suite('Hour');

const serSet:[number,string][] = [
    [0,'00'],
    [1,'08'],
    [2,'10'],
    [3,'18'],
    [4,'20'],
    [5,'28'],
    [6,'30'],
    [7,'38'],
    [8,'40'],
    [9,'48'],

    [10,'50'],
    [11,'58'],
    [12,'60'],
    [13,'68'],
    [14,'70'],
    [15,'78'],
    [16,'80'],
    [17,'88'],
    [18,'90'],
    [19,'98'],

    [20,'A0'],
    [21,'A8'],
    [22,'B0'],
    [23,'B8'],
];
for (const [mi,ser] of serSet) {
    tsts(`ser(${mi})`,()=>{
        const h = Hour.new(mi);
        assert.equal(h.value,mi);
    
        const bw=new BitWriter(Math.ceil(Hour.serialBits/8));
        h.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const h=Hour.deserialize(br).validate();
        assert.is(h.value,mi);
    });
}

tsts(`deser with invalid source value (24) throws`,()=>{
    const bytes=Uint8Array.of(24<<3);
    const br=new BitReader(bytes);
    assert.throws(()=>Hour.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Hour.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0x00);
    const br=new BitReader(bytes);
    assert.throws(()=>Hour.deserialize(br,stor).validate());
});

tsts(`new`,()=>{
    const h=Hour.new(11);
    assert.is(h.value,11);
    assert.is(h.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(1);
    const h=Hour.new(12,stor);
    assert.is(h.valueOf(),12);
});

tsts(`fromDate`,()=>{
    const dt=new Date(2001,2,3,4,5,6);
    const h=Hour.fromDate(dt);
    assert.is(h.value,dt.getHours());
});
tsts(`fromDate-provide storage`,()=>{
    const stor=new Uint8Array(1);
    const dt=new Date(2001,2,3,4,5,6);
    const h=Hour.fromDate(dt,stor);
    assert.is(h.value,dt.getHours());
});

tsts(`now`,()=>{
    const dt=new Date();
    const h=Hour.now();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing near midnight)
    assert.is(h.value,dt.getHours());
});

tsts(`nowUtc`,()=>{
    const dt=new Date();
    const h=Hour.nowUtc();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing near midnight UTC)
    assert.is(h.value,dt.getUTCHours());
});


tsts.run();