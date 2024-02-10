import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Milli } from '../../../src/primitive/number/Milli';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../../src/primitive/WindowStr';

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


const parseSet:[WindowStr,number,number][]=[
    [WindowStr.new('0'),0,0],
    [WindowStr.new('1'),1,0],
    [WindowStr.new('10'),10,0],
    [WindowStr.new('100'),100,0],
    [WindowStr.new('010'),10,0],
    [WindowStr.new('999'),999,0],
    
    [WindowStr.new(' 17 '),17,1],//Trailing space not consumed
    [WindowStr.new('0999'),999,0],//Leading zero ok
];
for (const [w,expect,rem] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const ms=Milli.parse(w);
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
        assert.throws(()=>Milli.parse(w,true));
    });
}

const parseLeftSet:[WindowStr,number][]=[
    [WindowStr.new('1'),100],
    [WindowStr.new('01'),10],
    [WindowStr.new('001'),1],
];
for (const [w,expect] of parseLeftSet) {
    tsts(`parse(${w.debug()})-left`,()=>{
        const ms=Milli.parse(w,false,true);
        assert.equal(ms.valueOf(),expect);
    });
}

const badParse:WindowStr[]=[
    //Bad strings
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
        assert.throws(()=>Milli.parse(w));
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

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(Milli.storageBytes);
	const stor2=new Uint8Array(Milli.storageBytes);

	const o=Milli.new(22,stor1);
	assert.instance(o,Milli);
	assert.is(o.valueOf(),22);

	const o2=o.cloneTo(stor2);
	assert.instance(o2,Milli);
	assert.is(o2.valueOf(),22);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=13;//This corrupts o2 in the 8 msb
    assert.not.equal(o.valueOf(),o2.valueOf());
});

tsts(`deser`,()=>{
	const bytes=Uint8Array.of(3,0);//Value in the top 10 bits of 2 bytes
	const br=new BitReader(bytes);
	const m=Milli.deserialize(br).validate();
	assert.instance(m,Milli);
	assert.is(m.valueOf(),3<<2);
});

// tsts('general',()=>{
//     const o=Micro.new(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });


tsts.run();