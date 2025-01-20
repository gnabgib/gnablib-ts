import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Minute } from '../../src/datetime/dt';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';
import { BitReader } from '../../src/primitive/BitReader';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec/Hex';

const tsts = suite('Minute');

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
const bytes=new Uint8Array(Math.ceil(Minute.serialBits/8));
for (const [mi,ser] of serSet) {
    tsts(`ser(${mi})`,()=>{
        const m = Minute.new(mi);
        assert.equal(m.valueOf(),mi);
    
        const bw=BitWriter.mount(bytes);
        m.serialize(bw);
        assert.is(hex.fromBytes(bytes),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br = BitReader.mount(bytes);
        const m=Minute.deserialize(br).validate();
        assert.is(m.valueOf(),mi);
    });
}

tsts(`deser with invalid source value (60) throws`,()=>{
    const bytes=Uint8Array.of(60<<2);
    const br = BitReader.mount(bytes);
    assert.throws(()=>Minute.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br = BitReader.mount(bytes);
    assert.throws(()=>Minute.deserialize(br).validate());
});

const toStrSet:[number,string,string,string][]=[
    [1,'1','01','1'],
    [2,'2','02','2'],
    [12,'12','12','12'],
    [59,'59','59','59'],
];
for (const [se,str,isoStr,jsonStr] of toStrSet) {
    const s = Minute.new(se);
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
    const m=Minute.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
});

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6);
	const m = Minute.fromDate(dt);
	assert.is(m.valueOf(), dt.getMinutes());
});

tsts(`fromDateUtc`,()=>{
    //2024-01-20 07:13:30
    const dt=new Date(1705734810);
    const h=Minute.fromDateUtc(dt);
    assert.is(h.valueOf(),dt.getUTCMinutes());
});


tsts(`fromUnixTime`,()=>{
    const m = Minute.fromUnixTime(1705734810);
    assert.is(m.valueOf(),13);
});

tsts(`fromUnixTimeMs`,()=>{
    const m = Minute.fromUnixTimeMs(1705734810543);
    assert.is(m.valueOf(),13);
});

tsts(`fromUnixTimeUs`,()=>{
	const m=Minute.fromUnixTimeUs(1705734810543000);
    assert.is(m.valueOf(),13);
})

tsts(`now`, () => {
	const m = Minute.now();
	//Near the end of a minute, this test can fail, (but passes otherwise)
	// so we've replaced with a more generic form (not super useful)
	//const dt = new Date();
	//assert.is(m.valueOf(), dt.getMinutes());
	
	const mNum=m.valueOf();
	assert.is(mNum >= 0 && mNum <= 59, true, 'In valid range');
});

tsts(`nowUtc`, () => {
	const dt = new Date();
	const m = Minute.nowUtc();
	//This isn't a great test, but let's use a date object to compare
	//(tiny chance of this test failing near midnight UTC)
	assert.is(m.valueOf(), dt.getUTCMinutes());
});

const parseSet: [WindowStr, number][] = [
    [WindowStr.new('01'), 1],
	[WindowStr.new('13'), 13],
];
for (const [w, expect] of parseSet) {
	tsts(`parse(${w.debug()})`, () => {
		const m = Minute.parse(w, true);
		assert.instance(m,Minute);
		assert.equal(m.valueOf(), expect);
	});
}

tsts(`parse(now)`, () => {
	//Turns out setup of unit tests on the full suite is >second so this can't be part of a set
	//Note: This could fail at the end of the year :|
	const m = Minute.parse(WindowStr.new('now'));
	const mNum=m.valueOf();
	assert.is(mNum >= 0 && mNum <= 59, true, 'In valid range');
});

const badParseStrict:WindowStr[]=[
    //Should be zero padded
    WindowStr.new('1'),
    WindowStr.new('3'),
];
for (const w of badParseStrict) {
    tsts(`${w.debug()} parse strict throws`,()=>{
        assert.throws(()=>Minute.parse(w,true));
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
        assert.throws(()=>Minute.parse(w));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const dt=Minute.min;
	const str = Object.prototype.toString.call(dt);
	assert.is(str.indexOf('Minute') > 0, true);
});

tsts('util.inspect',()=>{
    const dt=Minute.max;
    const u=util.inspect(dt);
    assert.is(u.startsWith('Minute('),true);
});

tsts('serialSizeBits',()=>{
    const o=Minute.min;
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

// tsts('cloneTo',()=>{
// 	const stor1=new Uint8Array(Minute.storageBytes);
// 	const stor2=new Uint8Array(Minute.storageBytes);

// 	const m=Minute.new(22,stor1);
// 	assert.instance(m,Minute);
// 	assert.is(m.valueOf(),22);

// 	const m2=m.cloneTo(stor2);
// 	assert.instance(m2,Minute);
// 	assert.is(m2.valueOf(),22);
	
// 	//This is a terrible idea, but it proves diff memory
// 	stor2[0]=13;
// 	assert.is(m.valueOf(),22);
// 	assert.is(m2.valueOf(),13);
// })

tsts.run();
