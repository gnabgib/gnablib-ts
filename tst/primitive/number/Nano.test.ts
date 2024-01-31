import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Nano } from '../../../src/primitive/number/Nano';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';

const tsts = suite('Nano');

const serSet:[number,string][] = [
    [0,'00000000'],//min
    [1,'00000004'],
    [2,'00000008'],
    [3,'0000000C'],
    [4,'00000010'],
    [5,'00000014'],
    [6,'00000018'],
    [7,'0000001C'],
    [8,'00000020'],
    [9,'00000024'],

    // [58,'0003A0'],
    // [59,'0003B0'],
    // [999,'003E70'],
    // [9999,'0270F0'],
    // [99999,'1869F0'],
    // [999999,'F423F0']//max
];
for (const [ns,ser] of serSet) {
    tsts(`ser(${ns})`,()=>{
        const m = Nano.new(ns);
        assert.equal(m.valueOf(),ns);
    
        const bw=new BitWriter(Math.ceil(Nano.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=Nano.deserialize(br).validate();
        assert.is(m.valueOf(),ns);
    });
}

tsts(`deser with invalid source value (xEE6B2800) throws`,()=>{
    const bytes=Uint8Array.of(0xEE,0x6B,0x28,0x00);
    const br=new BitReader(bytes);
    assert.throws(()=>Nano.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Nano.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0,0,0,0);
    const br=new BitReader(bytes);
    assert.throws(()=>Nano.deserialize(br,stor).validate());
});

const toStrSet:[number,string,string][]=[
    [0,'0','000000000'],//min
    [1,'1','000000001'],
    [2,'2','000000002'],
    [10,'10','000000010'],
    [100,'100','000000100'],
    [1000,'1000','000001000'],
    [10000,'10000','000010000'],
    [100000,'100000','000100000'],
    [999999,'999999','000999999'],
    [999999999,'999999999','999999999']//max
];
for (const [se,str,isoStr] of toStrSet) {
    const s = Nano.new(se);
    tsts(`toString(${se})`,()=>{        
        assert.equal(s.toString(),str);
    });
    tsts(`toPadString(${se})`,()=>{        
        assert.equal(s.toPadString(),isoStr);
    });
}

tsts(`new`,()=>{
    const m=Nano.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(4);
    const m=Nano.new(12,stor);
    assert.is(m.valueOf(),12);
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
        const ms=Nano.parse(str);
        assert.equal(ms.valueOf(),expect);
    });
}

const badParseStrict:string[]=[
    //Should be zero padded
    '1',
    '3',
];
for (const str of badParseStrict) {
    tsts(`parse(${str},undefined,true)`,()=>{
        assert.throws(()=>Nano.parse(str,undefined,true));
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
    '1000000000',
];
for (const unk of badParse) {
    tsts(`badParse(${unk})`,()=>{
        //@ts-ignore - this is the point of the test
        assert.throws(()=>Nano.parse(unk));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const o=Nano.new(13);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Nano') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Nano.new(13);
    const u=util.inspect(o);
    assert.is(u.startsWith('Nano('),true);
});

// tsts('general',()=>{
//     const o=Nano.new(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });


tsts.run();