import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {UtcOrNot} from '../../../src/primitive/datetime/UtcOrNot';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';

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

const parseSet:[string,number][]=[
    ['',0],
    [' ',0],
    ['\t',0],
    ['z',1],
    ['Z',1],
    [' Z',1],
];
for (const [str,expect] of parseSet) {
    tsts(`parse(${str})`,()=>{
        const stor=new Uint8Array(1);
        const u=UtcOrNot.parse(str,stor);
        assert.equal(u.valueOf(),expect);
    });
}

const badParse:unknown[]=[
    //Primitives
    undefined,//Undefined not allowed
    null,//null not allowed
    true,
    //Symbol("year"),
    1,//Integers cannot be parsed as utc indicator
    1.5,//Floats cannot be parsed as utc indicator

    //Bad strings
    'yes',
    'true',
    '1',
    '1.5',
];
for (const unk of badParse) {
    tsts(`badParse(${unk})`,()=>{
        //@ts-ignore - this is the point of the test
        assert.throws(()=>UtcOrNot.parse(unk));
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

tsts.run();