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

const toStrSet:[number,string,string][]=[
    [0,'0','000000'],//min
    [1,'1','000001'],
    [2,'2','000002'],
    [10,'10','000010'],
    [100,'100','000100'],
    [1000,'1000','001000'],
    [10000,'10000','010000'],
    [100000,'100000','100000'],
    [999999,'999999','999999'],//max
];
for (const [se,str,isoStr] of toStrSet) {
    const s = Microsecond.new(se);
    tsts(`toString(${se})`,()=>{        
        assert.equal(s.toString(),str);
    });
    tsts(`toIsoString(${se})`,()=>{        
        assert.equal(s.toIsoString(),isoStr);
    });
}

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
    const ms=Microsecond.now(stor);
    const mNum=+ms;
    assert.is(mNum>=0 && mNum<=999999,true,'In valid range');
});

const parseSet:[string,number][]=[
    ['0',0],
    ['1',1],
    ['10',10],
    ['100',100],
    ['1000',1000],
    ['10000',10000],
    ['100000',100000],
    ['999999',999999],
    ['001000',1000],

    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [10,10],
];
for (const [str,expect] of parseSet) {
    tsts(`parse(${str})`,()=>{
        const ms=Microsecond.parse(str);
        assert.equal(ms.valueOf(),expect);
    });
}

tsts(`parse(now)`,()=>{
    const stor=new Uint8Array(3);
    const ms=Microsecond.parse('now',stor);
    const mNum=+ms;
    //Tricky to test this!
    assert.is(mNum>=0 && mNum<=999999,true,'In valid range');
})

const badParseStrict:string[]=[
    //Should be zero padded
    '1',
    '3',
];
for (const str of badParseStrict) {
    tsts(`parse(${str},undefined,true)`,()=>{
        assert.throws(()=>Microsecond.parse(str,undefined,true));
    });
}

const badParse:unknown[]=[
    //Primitives
    undefined,//Undefined not allowed
    null,//null not allowed
    true,
    //Symbol("year"),
    1.5,//Like integers, this is converted to a string, but floating point isn't allowed

    //Bad strings
    '',//Empty string not allowed
    'tomorrow',//We support "now" only
    '1.5',//Floating point - not allowed
    '1e1',//10 in scientific - not allowed
    '+01',//Can't have sign
    //Out of range:
    '1000000',
];
for (const unk of badParse) {
    tsts(`badParse(${unk})`,()=>{
        //@ts-ignore - this is the point of the test
        assert.throws(()=>Microsecond.parse(unk));
    })
}


tsts.run();