import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Sexagesimal } from '../../../src/primitive/number/Sexagesimal';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../../src/primitive/WindowStr';

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
    
        const bytes=new Uint8Array(Math.ceil(Sexagesimal.serialBits/8));
        const bw=BitWriter.mount(bytes);
        m.serialize(bw);
        assert.is(hex.fromBytes(bytes),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br = BitReader.mount(bytes);
        const m=Sexagesimal.deserialize(br).validate();
        assert.is(m.valueOf(),mi);
    });
}

tsts(`deser with invalid source value (60) throws`,()=>{
    const bytes=Uint8Array.of(60<<2);
    const br = BitReader.mount(bytes);
    assert.throws(()=>Sexagesimal.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br = BitReader.mount(bytes);
    assert.throws(()=>Sexagesimal.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0x00);
    const br = BitReader.mount(bytes);
    assert.throws(()=>Sexagesimal.deserialize(br,stor).validate());
});

const toStrSet:[number,string,string,string][]=[
    [1,'1','01','1'],
    [2,'2','02','2'],
    [12,'12','12','12'],
    [59,'59','59','59'],
];
for (const [se,str,isoStr,jsonStr] of toStrSet) {
    const s = Sexagesimal.new(se);
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
    const m=Sexagesimal.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(1);
    const m=Sexagesimal.new(12,stor);
    assert.is(m.valueOf(),12);
});

const parseSet:[WindowStr,number,number][]=[
    //Completely valid
    [WindowStr.new('01'),1,0],
    [WindowStr.new('02'),2,0],
    [WindowStr.new('03'),3,0],
    [WindowStr.new('04'),4,0],
    [WindowStr.new('05'),5,0],
    [WindowStr.new('06'),6,0],
    [WindowStr.new('07'),7,0],
    [WindowStr.new('08'),8,0],
    [WindowStr.new('09'),9,0],
    [WindowStr.new('10'),10,0],
    [WindowStr.new('20'),20,0],
    [WindowStr.new('43'),43,0],
    [WindowStr.new('59'),59,0],
    //Doesn't have to be zero padded
    [WindowStr.new('2'),2,0],

    [WindowStr.new(' 2 '),2,1],//Trailing not trimmed
    [WindowStr.new('011'),11,0],//Leading zero ok
];
for (const [w,expect,rem] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const s=Sexagesimal.parse(w);
        assert.equal(s.valueOf(),expect);
        assert.equal(w.length,rem);
    });
}

const badParseStrict:WindowStr[]=[
    //Should be zero padded
    WindowStr.new('1'),
    WindowStr.new('3'),
];
for (const w of badParseStrict) {
    tsts(`${w.debug()} parse strict throws`,()=>{
        assert.throws(()=>Sexagesimal.parse(w,true));
    });
}

const badParse:WindowStr[]=[
    WindowStr.new(''),//Empty string not allowed
    WindowStr.new('tomorrow'),//We support "now" only
    WindowStr.new('1.5'),//Floating point - not allowed
    WindowStr.new('1e1'),//10 in scientific - not allowed
    WindowStr.new('+01'),//Can't have sign
    //Out of range:
    WindowStr.new('320'),
    WindowStr.new('1000'),
];
for (const w of badParse) {
    tsts(`${w.debug()} parse throws`,()=>{
        assert.throws(()=>Sexagesimal.parse(w));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const o=Sexagesimal.new(13);
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Sexagesimal') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Sexagesimal.new(13);
    const u=util.inspect(o);
    assert.is(u.startsWith('Sexagesimal('),true);
});

tsts('serialSizeBits',()=>{
    const o=Sexagesimal.new(13);
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});


// tsts('general',()=>{
//     const o=Sexagesimal.new(13);
//     console.log(o);
//     console.log(Object.prototype.toString.call(o));
// });

tsts.run();