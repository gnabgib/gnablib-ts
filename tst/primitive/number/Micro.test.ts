import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Micro } from '../../../src/primitive/number/Micro';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../../src/primitive/WindowStr';

const tsts = suite('Micro');

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
        const m = Micro.new(us);
        assert.equal(m.valueOf(),us);
    
        const bw=new BitWriter(Math.ceil(Micro.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=Micro.deserialize(br).validate();
        assert.is(m.valueOf(),us);
    });
}

tsts(`deser with invalid source value (1000000) throws`,()=>{
    const bytes=Uint8Array.of(0xF4,0x24,0);
    const br=new BitReader(bytes);
    assert.throws(()=>Micro.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Micro.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0,0x3E,0x70);
    const br=new BitReader(bytes);
    assert.throws(()=>Micro.deserialize(br,stor).validate());
});

const toStrSet:[number,string,string,string][]=[
    [0,'0','000000','0'],//min
    [1,'1','000001','1'],
    [2,'2','000002','2'],
    [10,'10','000010','10'],
    [100,'100','000100','100'],
    [1000,'1000','001000','1000'],
    [10000,'10000','010000','10000'],
    [100000,'100000','100000','100000'],
    [999999,'999999','999999','999999'],//max
];
for (const [se,str,isoStr,jsonStr] of toStrSet) {
    const s = Micro.new(se);
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
    const m=Micro.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(3);
    const m=Micro.new(12,stor);
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
    [WindowStr.new('001000'),1000,0],
    
    [WindowStr.new(' 1 '),1,1],//Trailing space not consumed
    [WindowStr.new('0999999'),999999,0],//Leading zero ok
];
for (const [w,expect,rem] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const ms=Micro.parse(w);
        assert.equal(ms.valueOf(),expect);
        assert.equal(w.length,rem);
    });
}

const badParseStrictSet:WindowStr[]=[
    //Should be zero padded
    WindowStr.new('1'),
    WindowStr.new('3'),
];
for (const w of badParseStrictSet) {
    tsts(`${w.debug()} parse-strict throws`,()=>{
        assert.throws(()=>Micro.parse(w,true));
    });
}

const parseLeftSet:[WindowStr,number][]=[
    [WindowStr.new('1'),100000],
    [WindowStr.new('01'),10000],
    [WindowStr.new('001'),1000],
    [WindowStr.new('0001'),100],
    [WindowStr.new('00001'),10],
    [WindowStr.new('000001'),1],
];
for (const [w,expect] of parseLeftSet) {
    tsts(`parse(${w.debug()})-left`,()=>{
        const ms=Micro.parse(w,false,true);
        assert.equal(ms.valueOf(),expect);
    });
}

const badParse:WindowStr[]=[
    WindowStr.new(''),//Empty string not allowed
    WindowStr.new('tomorrow'),//We support "now" only
    WindowStr.new('1.5'),//Floating point - not allowed
    WindowStr.new('1e1'),//10 in scientific - not allowed
    WindowStr.new('+01'),//Can't have sign
    //Out of range:
    WindowStr.new('1000000'),
];
for (const w of badParse) {
    tsts(`${w.debug()} parse throws`,()=>{
        assert.throws(()=>Micro.parse(w));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const o=Micro.new(13);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Micro') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Micro.new(13);
    const u=util.inspect(o);
    assert.is(u.startsWith('Micro('),true);
});

tsts('serialSizeBits',()=>{
    const o=Micro.new(13);
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(Micro.storageBytes);
	const stor2=new Uint8Array(Micro.storageBytes);

	const o=Micro.new(22,stor1);
	assert.instance(o,Micro);
	assert.is(o.valueOf(),22);

	const o2=o.cloneTo(stor2);
	assert.instance(o2,Micro);
	assert.is(o2.valueOf(),22);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=13;//This corrupts o2 in the 8 msb
    assert.not.equal(o.valueOf(),o2.valueOf());
});

// tsts('general',()=>{
//     const o=Micro.new(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });


tsts.run();