import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Nano } from '../../../src/primitive/number/Nano';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../../src/primitive/WindowStr';

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
    
        const bytes=new Uint8Array(Math.ceil(Nano.serialBits/8));
        const bw=BitWriter.mount(bytes);
        m.serialize(bw);
        assert.is(hex.fromBytes(bytes),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br = BitReader.mount(bytes);
        const m=Nano.deserialize(br).validate();
        assert.is(m.valueOf(),ns);
    });
}

tsts(`deser with invalid source value (xEE6B2800) throws`,()=>{
    const bytes=Uint8Array.of(0xEE,0x6B,0x28,0x00);
    const br = BitReader.mount(bytes);
    assert.throws(()=>Nano.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br = BitReader.mount(bytes);
    assert.throws(()=>Nano.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0,0,0,0);
    const br = BitReader.mount(bytes);
    assert.throws(()=>Nano.deserialize(br,stor).validate());
});

const toStrSet:[number,string,string,string][]=[
    [0,'0','000000000','0'],//min
    [1,'1','000000001','1'],
    [2,'2','000000002','2'],
    [10,'10','000000010','10'],
    [100,'100','000000100','100'],
    [1000,'1000','000001000','1000'],
    [10000,'10000','000010000','10000'],
    [100000,'100000','000100000','100000'],
    [999999,'999999','000999999','999999'],
    [999999999,'999999999','999999999','999999999']//max
];
for (const [se,str,isoStr,jsonStr] of toStrSet) {
    const s = Nano.new(se);
    tsts(`toString(${se})`,()=>{        
        assert.equal(s.toString(),str);
    });
    tsts(`toPadString(${se})`,()=>{        
        assert.equal(s.toPadString(),isoStr);
    });
    tsts(`toJSON(${se})`,()=>{        
        const json=JSON.stringify(s);
        assert.equal(json,jsonStr);
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


const parseSet:[WindowStr,number,number][]=[
    [WindowStr.new('0'),0,0],
    [WindowStr.new('1'),1,0],
    [WindowStr.new('10'),10,0],
    [WindowStr.new('100'),100,0],
    [WindowStr.new('1000'),1000,0],
    [WindowStr.new('10000'),10000,0],
    [WindowStr.new('100000'),100000,0],
    [WindowStr.new('999999'),999999,0],
    [WindowStr.new('999999999'),999999999,0],//Max
    [WindowStr.new('001000'),1000,0],

    [WindowStr.new(' 13 '),13,1],//Trailing space not consumed
    [WindowStr.new('0999999999'),999999999,0],//Leading zeros ok
];
for (const [w,expect,rem] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const ms=Nano.parse(w);
        assert.equal(ms.valueOf(),expect);
        assert.equal(w.length,rem);
    });
}

const badParseStrict:WindowStr[]=[
    //Should be zero padded
    WindowStr.new('1'),
    WindowStr.new('3'),
];
for (const w of badParseStrict) {
    tsts(`${w.debug()} parse-strict throws`,()=>{
        assert.throws(()=>Nano.parse(w,true));
    });
}

const badParse:WindowStr[]=[
    WindowStr.new(''),//Empty string not allowed
    WindowStr.new('tomorrow'),//We support "now" only
    WindowStr.new('1.5'),//Floating point - not allowed
    WindowStr.new('1e1'),//10 in scientific - not allowed
    WindowStr.new('+01'),//Can't have sign
    //Out of range:
    WindowStr.new('1000000000'),
];
for (const w of badParse) {
    tsts(`${w.debug()} parse throws`,()=>{
        assert.throws(()=>Nano.parse(w));
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

tsts('serialSizeBits',()=>{
    const o=Nano.new(13);
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(Nano.storageBytes);
	const stor2=new Uint8Array(Nano.storageBytes);

	const o=Nano.new(22,stor1);
	assert.instance(o,Nano);
	assert.is(o.valueOf(),22);

	const o2=o.cloneTo(stor2);
	assert.instance(o2,Nano);
	assert.is(o2.valueOf(),22);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=13;//This corrupts o2 in the 8 msb
    assert.not.equal(o.valueOf(),o2.valueOf());
});

// tsts('general',()=>{
//     const o=Nano.new(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });


tsts.run();