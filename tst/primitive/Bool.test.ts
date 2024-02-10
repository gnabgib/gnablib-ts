import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Bool} from '../../src/primitive/Bool';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';

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

const toStrSet:[boolean,string,string][]=[
    [false,'false','false'],
    [true,'true','true']
];
for (const [v,expectStr,expectJson] of toStrSet) {
    const u = Bool.new(v);
    tsts(`toString(${v})`,()=>{        
        assert.equal(u.toString(),expectStr);
    });
    tsts(`toJSON(${u})`,()=>{        
        const json=JSON.stringify(u);
        assert.equal(json,expectJson);
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

const parseSet:[WindowStr,number,number][]=[
    [WindowStr.new('true'),1,0],
    [WindowStr.new('1'),1,0],
    [WindowStr.new(' 1'),1,0],
    [WindowStr.new('1\t'),1,0],

    [WindowStr.new('false'),0,0],
    [WindowStr.new('0'),0,0],
    [WindowStr.new('false\t'),0,0],
    [WindowStr.new(' false'),0,0],
    [WindowStr.new(' false '),0,0],
    [WindowStr.new(' FALSE '),0,0],
];
for (const [w,expect,rem] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const u=Bool.parse(w);
        assert.equal(u.valueOf(),expect);
        assert.equal(w.length,rem);
    });
}

tsts(`parse(yes/no)`,()=>{
    assert.throws(()=>Bool.parse(WindowStr.new('yes'),{allowYes:false}))
    assert.throws(()=>Bool.parse(WindowStr.new('no'),{allowYes:false}))
    assert.equal(1,Bool.parse(WindowStr.new('yes'),{allowYes:true}).valueOf());
    assert.equal(0,Bool.parse(WindowStr.new('no'),{allowYes:true}).valueOf());
});

tsts(`parse(on/off)`,()=>{
    //Bool.parse(WindowStr.new('offf'),undefined,{allowOn:true,allowYes:true});//testing error message
    assert.throws(()=>Bool.parse(WindowStr.new('on'),{allowOn:false}))
    assert.throws(()=>Bool.parse(WindowStr.new('off'),{allowOn:false}))
    assert.equal(1,Bool.parse(WindowStr.new('on'),{allowOn:true}).valueOf());
    assert.equal(0,Bool.parse(WindowStr.new('off'),{allowOn:true}).valueOf());
});

const badParse:WindowStr[]=[
    WindowStr.new('2'),
    WindowStr.new('1.0'),//Bad string even though 1.0 resolves to 1 which is truthy
    WindowStr.new(''),//Empty string not understood
    WindowStr.new(' '),//Or whitespace string
    WindowStr.new('\t\t'),//"
];
for (const w of badParse) {
    tsts(`${w.debug()} parse throws`,()=>{
        assert.throws(()=>Bool.parse(w));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const o=Bool.new(true);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Bool') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Bool.new(false);
    const u=util.inspect(o);
    assert.is(u.startsWith('Bool('),true);
});

tsts('serialSizeBits',()=>{
    const o=Bool.new(false);
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<2,true);
});

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(Bool.storageBytes);
	const stor2=new Uint8Array(Bool.storageBytes);

	const o=Bool.new(true,stor1);
	assert.instance(o,Bool);
	assert.is(o.valueOf(),1);

	const o2=o.cloneTo(stor2);
	assert.instance(o2,Bool);
	assert.is(o2.valueOf(),1);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=0;
    assert.not.equal(o.valueOf(),o2.valueOf());
})


tsts.run();