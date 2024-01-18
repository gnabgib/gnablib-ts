import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Microsecond} from '../../../src/primitive/datetime/Microsecond';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';

const tsts = suite('MicroSecond');

const serSet:[number,string][] = [
    [0,'000000'],//min
    [1,'000010'],
    [2,'000020'],
    [3,'000030'],
    [4,'000040'],
    [5,'000050'],
    [6,'000060'],
    [7,'000070'],
    [8,'000080'],
    [9,'000090'],

    [58,'0003A0'],
    [59,'0003B0'],
    [999,'003E70'],
    [9999,'0270F0'],
    [99999,'1869F0'],
    [999999,'F423F0']//max
];
for (const [us,ser] of serSet) {
    tsts(`ser(${us})`,()=>{
        const m = Microsecond.new(us);
        assert.equal(m.valueOf(),us);
    
        const bw=new BitWriter(Math.ceil(Microsecond.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=Microsecond.deserialize(br).validate();
        assert.is(m.valueOf(),us);
    });
}

tsts(`deser with invalid source value (1000000) throws`,()=>{
    const bytes=Uint8Array.of(0xF4,0x24,0);
    const br=new BitReader(bytes);
    assert.throws(()=>Microsecond.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Microsecond.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0,0x3E,0x70);
    const br=new BitReader(bytes);
    assert.throws(()=>Microsecond.deserialize(br,stor).validate());
});

tsts(`new`,()=>{
    const m=Microsecond.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(3);
    const m=Microsecond.new(12,stor);
    assert.is(m.valueOf(),12);
});

tsts(`fromDate`,()=>{
    const dt=new Date(2001,2,3,4,5,6,777);
    const m=Microsecond.fromDate(dt);
    assert.is(m.valueOf(),dt.getMilliseconds()*1000);
});
tsts(`fromDate-provide storage`,()=>{
    const stor=new Uint8Array(3);
    const dt=new Date(2001,2,3,4,5,6,777);
    const m=Microsecond.fromDate(dt,stor);
    assert.is(m.valueOf(),dt.getMilliseconds()*1000);
});

tsts(`now`,()=>{
    const m=Microsecond.now();
    const mNum=+m;
    //Tricky to test this!
    assert.is(mNum>=0 && mNum<=999999,true,'In valid range');
    //console.log(m.toString());
});
tsts(`now-provide storage`,()=>{
    const stor=new Uint8Array(3);
    const m=Microsecond.now(stor);
    const mNum=+m;
    assert.is(mNum>=0 && mNum<=999999,true,'In valid range');
});


tsts.run();