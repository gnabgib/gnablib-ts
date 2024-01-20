import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Sexagesimal } from '../../../src/primitive/number/Sexagesimal';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';

const tsts = suite('Sexagesimal');

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
        const m = Sexagesimal.new(mi);
        assert.equal(m.valueOf(),mi);
    
        const bw=new BitWriter(Math.ceil(Sexagesimal.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=Sexagesimal.deserialize(br).validate();
        assert.is(m.valueOf(),mi);
    });
}

tsts(`deser with invalid source value (60) throws`,()=>{
    const bytes=Uint8Array.of(60<<2);
    const br=new BitReader(bytes);
    assert.throws(()=>Sexagesimal.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Sexagesimal.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0x00);
    const br=new BitReader(bytes);
    assert.throws(()=>Sexagesimal.deserialize(br,stor).validate());
});

const toStrSet:[number,string,string][]=[
    [1,'1','01'],
    [2,'2','02'],
    [12,'12','12'],
    [59,'59','59'],
];
for (const [se,str,isoStr] of toStrSet) {
    const s = Sexagesimal.new(se);
    tsts(`toString(${se})`,()=>{        
        assert.equal(s.toString(),str);
    });
    tsts(`toIsoString(${se})`,()=>{        
        assert.equal(s.toPadString(),isoStr);
    });
}

tsts(`new`,()=>{
    const m=Sexagesimal.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(1);
    const m=Sexagesimal.new(12,stor);
    assert.is(m.valueOf(),12);
});

const parseSet:[string,number][]=[
    //Completely valid
    ['01',1],
    ['02',2],
    ['03',3],
    ['04',4],
    ['05',5],
    ['06',6],
    ['07',7],
    ['08',8],
    ['09',9],
    ['10',10],
    ['20',20],
    ['43',43],
    ['59',59],
    //Doesn't have to be zero padded
    ['2',2],

    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [10,10],
];
for (const [str,expect] of parseSet) {
    tsts(`parse(${str})`,()=>{
        const stor=new Uint8Array(1);
        const s=Sexagesimal.parse(str,stor);
        assert.equal(s.valueOf(),expect);
    });
}

const badParseStrict:string[]=[
    //Should be zero padded
    '1',
    '3',
];
for (const str of badParseStrict) {
    tsts(`parse(${str},undefined,true)`,()=>{
        assert.throws(()=>Sexagesimal.parse(str,undefined,true));
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
    '320',
    '1000',
];
for (const unk of badParse) {
    tsts(`badParse(${unk})`,()=>{
        //@ts-ignore - this is the point of the test
        assert.throws(()=>Sexagesimal.parse(unk));
    })
}

tsts.run();