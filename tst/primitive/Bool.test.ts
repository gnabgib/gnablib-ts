import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Bool} from '../../src/primitive/Bool';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';

const tsts = suite('Bool');

const serSet:[boolean,string][] = [
    [false,'00'],
    [true,'80']
];
for (const [v,ser] of serSet) {
    tsts(`ser(${v})`,()=>{
        const m = Bool.new(v);
        assert.equal(m.valueBool(),v,'valueBool');
    
        const bw=new BitWriter(Math.ceil(Bool.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=Bool.deserialize(br);
        assert.is(m.valueBool(),v);
    });
}

tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Bool.deserialize(br));
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0);
    const br=new BitReader(bytes);
    assert.throws(()=>Bool.deserialize(br,stor));
});

const toStrSet:[boolean,string][]=[
    [false,'false'],
    [true,'true']
];
for (const [v,str] of toStrSet) {
    const u = Bool.new(v);
    tsts(`toString(${v})`,()=>{        
        assert.equal(u.toString(),str);
    });
}

const newSet:[boolean,number,string][]=[
    //Pos doesn't effect ser
    [true,0,'80'],
    [true,1,'80'],
    [true,2,'80'],
    [true,3,'80'],
    [true,4,'80'],
    [true,5,'80'],
    [true,6,'80'],
    [true,7,'80'],

    [false,0,'00'],
    [false,1,'00'],
    [false,2,'00'],
    [false,3,'00'],
    [false,4,'00'],
    [false,5,'00'],
    [false,6,'00'],
    [false,7,'00'],    
];
for(const [v,pos,ser] of newSet) {
    tsts(`new(${v},,${pos})`,()=>{
        const u=Bool.new(v,undefined,pos);
        assert.is(u.valueBool(),v);

        const bw=new BitWriter(Math.ceil(Bool.serialBits/8));
        u.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    })
}

tsts(`new`,()=>{
    const u=Bool.new(true);
    assert.is(u.valueOf(),1);
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(Bool.storageBytes);
    const u=Bool.new(false,stor);
    assert.is(u.valueOf(),0);
});

const parseSet:[string,number][]=[
    ['true',1],
    ['1',1],
    [' 1',1],
    ['1\t',1],

    ['false',0],
    ['0',0],
    ['false\t',0],
    [' false',0],

    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [true,1],
    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [1,1],
    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [false,0],
    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [0,0],
];
for (const [str,expect] of parseSet) {
    tsts(`parse(${str})`,()=>{
        const u=Bool.parse(str);
        assert.equal(u.valueOf(),expect);
    });
}

tsts(`parse(yes/no)`,()=>{
    assert.throws(()=>Bool.parse('yes',undefined,{allowYes:false}))
    assert.throws(()=>Bool.parse('no',undefined,{allowYes:false}))
    assert.equal(1,Bool.parse('yes',undefined,{allowYes:true}).valueOf());
    assert.equal(0,Bool.parse('no',undefined,{allowYes:true}).valueOf());
});

tsts(`parse(on/off)`,()=>{
    assert.throws(()=>Bool.parse('on',undefined,{allowOn:false}))
    assert.throws(()=>Bool.parse('off',undefined,{allowOn:false}))
    assert.equal(1,Bool.parse('on',undefined,{allowOn:true}).valueOf());
    assert.equal(0,Bool.parse('off',undefined,{allowOn:true}).valueOf());
    //Bool.parse('offf',undefined,{allowOn:true,allowYes:true});//testing error message
});

tsts(`parse-empty`,()=>{
    //You get a different error message, but this is really just here for coverage
    //@ts-ignore - We need to send undefined or null to trigger this case
    assert.throws(()=>Bool.parse(undefined,undefined,{preventUndefined:true}));
})

const badParse:unknown[]=[
    //Primitives
    undefined,//Undefined not allowed
    null,//null not allowed
    //Symbol("year"),
    2,//Integers out of range
    1.5,//Floats cannot be parsed as boolean
    '2',
    '1.0',//Bad string even though 1.0 resolves to 1 which is truthy
    '',//Empty string not understood
    ' ',//Or whitespace string
    '\t\t',//"
];
for (const unk of badParse) {
    tsts(`badParse(${unk})`,()=>{
        //@ts-ignore - this is the point of the test
        assert.throws(()=>Bool.parse(unk));
    })
}

tsts.run();