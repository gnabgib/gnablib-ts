import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {SecondMs} from '../../../src/primitive/datetime/SecondMs';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';

const tsts = suite('SecondMs');

const serSet:[number,string][] = [
    [0,'0000'],//min
    [1,'0001'],
    [2,'0002'],
    [3,'0003'],
    [4,'0004'],
    [5,'0005'],
    [6,'0006'],
    [7,'0007'],
    [8,'0008'],
    [9,'0009'],

    [58,'003A'],
    [59,'003B'],
    [999,'03E7'],
    [9999,'270F'],
    [59999,'EA5F'],//max
];
for (const [ms,ser] of serSet) {
    tsts(`ser(${ms})`,()=>{
        const sms = SecondMs.new(ms);
        assert.equal(sms.valueMs(),ms,'valueMs');
    
        const bw=new BitWriter(Math.ceil(SecondMs.serialBits/8));
        sms.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser,'ser');
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const sms=SecondMs.deserialize(br).validate();
        assert.is(sms.valueMs(),ms,'valueMs');
    });
}

tsts(`deser with invalid source value (65535) throws`,()=>{
    const bytes=Uint8Array.of(0xFF,0xFF);
    const br=new BitReader(bytes);
    assert.throws(()=>SecondMs.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>SecondMs.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0,0);
    const br=new BitReader(bytes);
    assert.throws(()=>SecondMs.deserialize(br,stor).validate());
});

tsts(`new`,()=>{
    const sms=SecondMs.new(11);
    assert.is(sms.valueMs(),11);
    assert.is(sms.toString(),'0.011');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(2);
    const sms=SecondMs.new(12,stor);
    assert.is(sms.valueMs(),12);
});

tsts(`fromDate`,()=>{
    const dt=new Date(2001,2,3,4,5,6,777);
    const sms=SecondMs.fromDate(dt);
    console.log(dt.getMilliseconds());
    assert.is(sms.valueMs(),dt.getSeconds()*1000+dt.getMilliseconds());
});
tsts(`fromDate-provide storage`,()=>{
    const stor=new Uint8Array(3);
    const dt=new Date(2001,2,3,4,5,6,777);
    const sms=SecondMs.fromDate(dt,stor);
    assert.is(sms.valueMs(),dt.getSeconds()*1000+dt.getMilliseconds());
});

tsts(`now`,()=>{
    const m=SecondMs.now();
    const mNum=+m;
    //Tricky to test this!
    assert.is(mNum>=0 && mNum<=59999,true,'In valid range');
    //console.log(m.toString());
});
tsts(`now-provide storage`,()=>{
    const stor=new Uint8Array(3);
    const m=SecondMs.now(stor);
    const mNum=+m;
    assert.is(mNum>=0 && mNum<=59999,true,'In valid range');
});

tsts(`second/millisecond`,()=>{
    const m=SecondMs.new(1666);//Fire of london
    //Just the seconds, ignoring any ms (not rounded)
    assert.is(m.second,1,'second');
    //Just the ms, ignoring any seconds
    assert.is(m.millisecond,666,'millisecond');
    //The full value in s, round if you want approximate seconds
    assert.is(m.valueOf(),1.666,'valueOf');
    //The full value in ms
    assert.is(m.valueMs(),1666,'valueMs')
})

tsts.run();