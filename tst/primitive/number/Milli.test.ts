import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Milli } from '../../../src/primitive/number/Milli';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';

const tsts = suite('Milli');

const serSet:[number,string][] = [
    [0,'0000'],//min
    [1,'0040'],
    [2,'0080'],
    [3,'00C0'],
    [4,'0100'],
    [5,'0140'],
    [6,'0180'],
    [7,'01C0'],
    [8,'0200'],
    [9,'0240'],

    [58,'0E80'],
    [59,'0EC0'],
    [99,'18C0'],
    [999,'F9C0'],//max
];
for (const [us,ser] of serSet) {
    tsts(`ser(${us})`,()=>{
        const m = Milli.new(us);
        assert.equal(m.valueOf(),us);
    
        const bw=new BitWriter(Math.ceil(Milli.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=Milli.deserialize(br).validate();
        assert.is(m.valueOf(),us);
    });
}

tsts(`deser with invalid source value (1000) throws`,()=>{
    const bytes=Uint8Array.of(0xFA,0);
    const br=new BitReader(bytes);
    assert.throws(()=>Milli.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Milli.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0xF9,0xC0);
    const br=new BitReader(bytes);
    assert.throws(()=>Milli.deserialize(br,stor).validate());
});

const toStrSet:[number,string,string,string][]=[
    [0,'0','000','0'],//min
    [1,'1','001','1'],
    [2,'2','002','2'],
    [10,'10','010','10'],
    [100,'100','100','100'],
    [99,'99','099','99'],
    [999,'999','999','999'],//max
];
for (const [se,str,isoStr,jsonStr] of toStrSet) {
    const s = Milli.new(se);
    tsts(`toString(${se})`,()=>{        
        assert.equal(s.toString(),str);
    });
    tsts(`toIsoString(${se})`,()=>{        
        assert.equal(s.toPadString(),isoStr);
    });
    tsts(`toJSON(${se})`,()=>{        
        const json=JSON.stringify(s);
        assert.equal(json,jsonStr);
    });
}

tsts(`new`,()=>{
    const m=Milli.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(3);
    const m=Milli.new(12,stor);
    assert.is(m.valueOf(),12);
});


const parseSet:[string,number][]=[
    ['0',0],
    ['1',1],
    ['10',10],
    ['100',100],
    ['010',10],
    ['999',999],
    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [10,10],
];
for (const [str,expect] of parseSet) {
    tsts(`parse(${str})`,()=>{
        const ms=Milli.parse(str);
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
        assert.throws(()=>Milli.parse(str,undefined,true));
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
        assert.throws(()=>Milli.parse(unk));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const o=Milli.new(13);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Milli') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Milli.new(13);
    const u=util.inspect(o);
    assert.is(u.startsWith('Milli('),true);
});

tsts('serialSizeBits',()=>{
    const o=Milli.new(13);
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

// tsts('general',()=>{
//     const o=Micro.new(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });


tsts.run();