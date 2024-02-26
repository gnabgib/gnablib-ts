import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Microsecond } from '../../src/datetime/outdex';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';
import { BitReader } from '../../src/primitive/BitReader';
import { hex } from '../../src/codec/Hex';
import { BitWriter } from '../../src/primitive/BitWriter';

const tsts = suite('Microsecond');

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
        const m = Microsecond.new(us);
        assert.equal(m.valueOf(),us);
    
        const bw=new BitWriter(Math.ceil(Microsecond.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=Microsecond.deserialize(br).validate();
        assert.is(m.valueOf(),us);
    });
}

tsts(`deser with invalid source value (1000000) throws`,()=>{
    const bytes=Uint8Array.of(0xF4,0x24,0);
    const br=new BitReader(bytes);
    assert.throws(()=>Microsecond.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Microsecond.deserialize(br).validate());
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
    const s = Microsecond.new(se);
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
    const m=Microsecond.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
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
        const ms=Microsecond.parse(w);
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
        assert.throws(()=>Microsecond.parse(w,true));
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
        const ms=Microsecond.parse(w,false,true);
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
        assert.throws(()=>Microsecond.parse(w));
    })
}

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6, 777);
	const m = Microsecond.fromDate(dt);
	assert.is(m.valueOf(), dt.getMilliseconds() * 1000);
});

const fromUnixTimeSet: [number, number][] = [
    //2024-01-20 07:13:30
	[1705734810, 0],
    //2024-01-20 07:13:30.534
	[1705734810.534, 534000],
];
for (const [epoch, expect] of fromUnixTimeSet) {
	tsts(`fromUnixTime(${epoch})`, () => {
		const e = Microsecond.fromUnixTime(epoch);
		assert.is(e.valueOf(), expect);
	});
}

const fromUnixTimeMsSet: [number, number][] = [
    //2024-01-20 07:13:30.542
	[1705734810542, 542000],
    //2024-01-20 07:13:30.542789
	[1705734810542.789, 542789],
	[1705734810543,543000]
];
for (const [epoch, expect] of fromUnixTimeMsSet) {
	tsts(`fromUnixTimeMs(${epoch})`, () => {
		const e = Microsecond.fromUnixTimeMs(epoch);
		assert.is(e.valueOf(), expect);
	});
}

tsts(`fromUnixTimeUs`, () => {
	const e = Microsecond.fromUnixTimeUs(1705734810542789);
	assert.is(e.valueOf(), 542789);
});

tsts(`now`, () => {
	const m = Microsecond.now();
	const mNum = +m;
	//Tricky to test this!
	assert.is(mNum >= 0 && mNum <= 999999, true, 'In valid range');
	//console.log(m.toString());
});

tsts(`parse(now)`, () => {
	const ms = Microsecond.parse(WindowStr.new('now'));
	const mNum = +ms;
	//Tricky to test this!
	assert.is(mNum >= 0 && mNum <= 999999, true, 'In valid range');
});

tsts('[Symbol.toStringTag]', () => {
    const o=Microsecond.min;
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Microsecond') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Microsecond.max;
    const u=util.inspect(o);
    assert.is(u.startsWith('Microsecond('),true);
});

tsts('serialSizeBits',()=>{
    const o=Microsecond.max;
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

// tsts('cloneTo',()=>{
// 	const stor1=new Uint8Array(Microsecond.storageBytes);
// 	const stor2=new Uint8Array(Microsecond.storageBytes);

// 	const o=Microsecond.new(22,stor1);
// 	assert.instance(o,Microsecond);
// 	assert.is(o.valueOf(),22);

// 	const o2=o.cloneTo(stor2);
// 	assert.instance(o2,Microsecond);
// 	assert.is(o2.valueOf(),22);
	
// 	//This is a terrible idea, but it proves diff memory
// 	stor2[0]=13;//This corrupts o2 in the 8 msb
//     assert.not.equal(o.valueOf(),o2.valueOf());
// });

tsts(`deser`,()=>{
	const bytes=Uint8Array.of(0,0,3<<4);//Value in the top 20 bits of 3 bytes
	const br=new BitReader(bytes);
	const m=Microsecond.deserialize(br).validate();
	assert.instance(m,Microsecond);
	assert.is(m.valueOf(),3);
});

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();
