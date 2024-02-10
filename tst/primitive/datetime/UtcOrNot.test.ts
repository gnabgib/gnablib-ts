import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {UtcOrNot} from '../../../src/primitive/datetime/UtcOrNot';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../../src/primitive/WindowStr';

const tsts = suite('UtcOrNot');

const serSet:[boolean,string][] = [
    [false,'00'],
    [true,'80']
];
for (const [utc,ser] of serSet) {
    tsts(`ser(${utc})`,()=>{
        const m = UtcOrNot.new(utc);
        assert.equal(m.valueBool(),utc);
    
        const bw=new BitWriter(Math.ceil(UtcOrNot.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=UtcOrNot.deserialize(br);
        assert.is(m.valueBool(),utc);
    });
}

tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>UtcOrNot.deserialize(br));
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0);
    const br=new BitReader(bytes);
    assert.throws(()=>UtcOrNot.deserialize(br,stor));
});

const toStrSet:[boolean,string,string][]=[
    [false,'?',''],
    [true,'Z','Z']
];
for (const [utc,str,isoStr] of toStrSet) {
    const u = UtcOrNot.new(utc);
    tsts(`toString(${utc})`,()=>{        
        assert.equal(u.toString(),str);
    });
    tsts(`toIsoString(${utc})`,()=>{        
        assert.equal(u.toIsoString(),isoStr);
    });
}

tsts(`new`,()=>{
    const u=UtcOrNot.new(true);
    assert.is(u.valueOf(),1);
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(1);
    const u=UtcOrNot.new(false,stor);
    assert.is(u.valueOf(),0);
});

const parseSet:[WindowStr,number,number][]=[
    [WindowStr.new(''),0,0],
    [WindowStr.new(' '),0,0],
    [WindowStr.new('\t'),0,0],
    [WindowStr.new('z'),1,0],
    [WindowStr.new('Z'),1,0],
    [WindowStr.new(' Z'),1,0],
    [WindowStr.new(' Z '),1,0],
];
for (const [w,expect,rem] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const u=UtcOrNot.parse(w);
        assert.equal(u.valueOf(),expect);
        assert.equal(w.length,rem);
    });
}

const badParse:WindowStr[]=[
    //Valid for a bool type
    WindowStr.new('true'),
    WindowStr.new('1'),
    //Valid for a bool type with certain settings:
    WindowStr.new('yes'),
    //Invalid
    WindowStr.new('1.5'),
];
for (const w of badParse) {
    tsts(`${w.debug()} parse throws`,()=>{
        assert.throws(()=>UtcOrNot.parse(w));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const o=UtcOrNot.new(true);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('UtcOrNot') > 0, true);
});

tsts('util.inspect',()=>{
    const o=UtcOrNot.new(false);
    const u=util.inspect(o);
    assert.is(u.startsWith('UtcOrNot('),true);
});

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(UtcOrNot.storageBytes);
	const stor2=new Uint8Array(UtcOrNot.storageBytes);

	const o=UtcOrNot.new(true,stor1);
	assert.instance(o,UtcOrNot);
	assert.is(o.valueOf(),1);

	const o2=o.cloneTo(stor2);
	assert.instance(o2,UtcOrNot);
	assert.is(o2.valueOf(),1);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=0;
    assert.not.equal(o.valueOf(),o2.valueOf());
})

tsts.run();