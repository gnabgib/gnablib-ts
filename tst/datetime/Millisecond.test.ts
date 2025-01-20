import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Millisecond } from '../../src/datetime/dt';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';
import { BitReader } from '../../src/primitive/BitReader';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';

const tsts = suite('Millisecond');

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
const bytes=new Uint8Array(Math.ceil(Millisecond.serialBits/8));
for (const [us,ser] of serSet) {
    tsts(`ser(${us})`,()=>{
        const m = Millisecond.new(us);
        assert.equal(m.valueOf(),us);
    
        const bw=BitWriter.mount(bytes);
        m.serialize(bw);
        assert.is(hex.fromBytes(bytes),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br = BitReader.mount(bytes);
        const m=Millisecond.deserialize(br).validate();
        assert.is(m.valueOf(),us);
    });
}

tsts(`deser with invalid source value (1000) throws`,()=>{
    const bytes=Uint8Array.of(0xFA,0);
    const br = BitReader.mount(bytes);
    assert.throws(()=>Millisecond.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br = BitReader.mount(bytes);
    assert.throws(()=>Millisecond.deserialize(br).validate());
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
    const s = Millisecond.new(se);
    tsts(`toString(${se})`,()=>{        
        assert.equal(s.toString(),str);
    });
    tsts(`toIsoString(${se})`,()=>{        
        assert.equal(s.toIsoString(),isoStr);
    });
    tsts(`toJSON(${se})`,()=>{        
        const json=JSON.stringify(s);
        assert.equal(json,jsonStr);
    });
}

tsts(`new`,()=>{
    const m=Millisecond.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
});

const parseSet:[WindowStr,number,number][]=[
    [WindowStr.new('0'),0,0],
    [WindowStr.new('1'),1,0],
    [WindowStr.new('10'),10,0],
    [WindowStr.new('100'),100,0],
    [WindowStr.new('010'),10,0],
    [WindowStr.new('999'),999,0],
    
    [WindowStr.new(' 17 '),17,0],
    [WindowStr.new('0999'),999,0],//Leading zero ok
];
for (const [w,expect,rem] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const ms=Millisecond.parse(w);
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
        assert.throws(()=>Millisecond.parse(w,true));
    });
}

const parseLeftSet:[WindowStr,number][]=[
    [WindowStr.new('1'),100],
    [WindowStr.new('01'),10],
    [WindowStr.new('001'),1],
];
for (const [w,expect] of parseLeftSet) {
    tsts(`parse(${w.debug()})-left`,()=>{
        const ms=Millisecond.parse(w,false,true);
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
        assert.throws(()=>Millisecond.parse(w));
    })
}

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6, 777);
	const m = Millisecond.fromDate(dt);
	assert.is(m.valueOf(), dt.getMilliseconds());
});

const fromUnixTimeSet: [number, number][] = [
    //2024-01-20 07:13:30
	[1705734810, 0],
    //2024-01-20 07:13:30.534
	[1705734810.534, 534],
];
for (const [epoch, expect] of fromUnixTimeSet) {
	tsts(`fromUnixTime(${epoch})`, () => {
		const e = Millisecond.fromUnixTime(epoch);
		assert.is(e.valueOf(), expect);
	});
}

const fromUnixTimeMsSet: [number, number][] = [
    //2024-01-20 07:13:30.534
	[1705734810543, 543],
    //2024-01-20 07:13:30.534789
	[1705734810543.789, 543],
];
for (const [epoch, expect] of fromUnixTimeMsSet) {
	tsts(`fromUnixTimeMs(${epoch})`, () => {
		const e = Millisecond.fromUnixTimeMs(epoch);
		assert.is(e.valueOf(), expect);
	});
}

const fromUnixTimeUsSet: [number, number][] = [
    //2024-01-20 07:13:30.534
	[1705734810543210, 543],
    //2024-01-20 07:13:30.534789
	[1705734810543789, 543],
];
for (const [epoch, expect] of fromUnixTimeUsSet) {
	tsts(`fromUnixTimeUs(${epoch})`, () => {
		const e = Millisecond.fromUnixTimeUs(epoch);
		assert.is(e.valueOf(), expect);
	});
}

tsts(`now`, () => {
	const m = Millisecond.now();
	const mNum = +m;
	//Tricky to test this!
	assert.is(mNum >= 0 && mNum <= 999, true, 'In valid range');
	//console.log(m.toString());
});

tsts(`parse(now)`, () => {
	const ms = Millisecond.parse(WindowStr.new('now'));
	const mNum = +ms;
	//Tricky to test this!
	assert.is(mNum >= 0 && mNum <= 999, true, 'In valid range');
});

tsts('[Symbol.toStringTag]', () => {
    const dt=Millisecond.min;
	const str = Object.prototype.toString.call(dt);
	assert.is(str.indexOf('Millisecond') > 0, true);
});

tsts('util.inspect',()=>{
    const dt=Millisecond.max;
    const u=util.inspect(dt);
    assert.is(u.startsWith('Millisecond('),true);
});

tsts('serialSizeBits',()=>{
    const o=Millisecond.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

// tsts('cloneTo',()=>{
// 	const stor1=new Uint8Array(Millisecond.storageBytes);
// 	const stor2=new Uint8Array(Millisecond.storageBytes);

// 	const o=Millisecond.new(22,stor1);
// 	assert.instance(o,Millisecond);
// 	assert.is(o.valueOf(),22);

// 	const o2=o.cloneTo(stor2);
// 	assert.instance(o2,Millisecond);
// 	assert.is(o2.valueOf(),22);
	
// 	//This is a terrible idea, but it proves diff memory
// 	stor2[0]=13;//This corrupts o2 in the 8 msb
//     assert.not.equal(o.valueOf(),o2.valueOf());
// });

tsts(`deser`,()=>{
	const bytes=Uint8Array.of(3,0);//Value in the top 10 bits of 2 bytes
	const br = BitReader.mount(bytes);
	const m=Millisecond.deserialize(br).validate();
	assert.instance(m,Millisecond);
	assert.is(m.valueOf(),3<<2);
});

tsts.run();
