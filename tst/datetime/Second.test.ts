import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Second } from '../../src/datetime/outdex';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';
import { BitReader } from '../../src/primitive/BitReader';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';

const tsts = suite('Second');

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
        const m = Second.new(mi);
        assert.equal(m.valueOf(),mi);
    
        const bw=new BitWriter(Math.ceil(Second.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=Second.deserialize(br).validate();
        assert.is(m.valueOf(),mi);
    });
}

tsts(`deser with invalid source value (60) throws`,()=>{
    const bytes=Uint8Array.of(60<<2);
    const br=new BitReader(bytes);
    assert.throws(()=>Second.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Second.deserialize(br).validate());
});

const toStrSet:[number,string,string,string][]=[
    [1,'1','01','1'],
    [2,'2','02','2'],
    [12,'12','12','12'],
    [59,'59','59','59'],
];
for (const [se,str,isoStr,jsonStr] of toStrSet) {
    const s = Second.new(se);
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
    const m=Second.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
});

tsts(`fromDate`, () => {
	const dt = new Date(2001, 2, 3, 4, 5, 6);
	const m = Second.fromDate(dt);
	assert.is(m.valueOf(), dt.getSeconds());
});

tsts(`fromUnixTime`, () => {
	const m = Second.fromUnixTime(1705734810);
	assert.is(m.valueOf(), 30);
});

tsts(`fromUnixTimeMs`, () => {
	const m = Second.fromUnixTimeMs(1705734810543);
	assert.is(m.valueOf(), 30);
});

tsts(`fromUnixTimeMs`, () => {
	const m = Second.fromUnixTimeUs(1705734810543000);
	assert.is(m.valueOf(), 30);
});


tsts(`now`, () => {
	const s = Second.now();
	//Near the end of a second, this test can fail, (but passes otherwise)
	// so we've replaced with a more generic form (not super useful)
	//const dt = new Date();
	//assert.is(s.valueOf(), dt.getSeconds());

	const sNum=s.valueOf();
	assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
});

const parseSet: [WindowStr, number][] = [
    [WindowStr.new('01'), 1],
	[WindowStr.new('13'), 13],
];
for (const [w, expect] of parseSet) {
	tsts(`parse(${w.debug()})`, () => {
		const s = Second.parse(w, true);
		assert.instance(s,Second);
		assert.equal(s.valueOf(), expect);
	});
}

tsts(`parse(now)`, () => {
	const s = Second.parse(WindowStr.new('now'));
	const sNum=s.valueOf();
	assert.is(sNum >= 0 && sNum <= 59, true, 'In valid range');
});

const badParseStrict:WindowStr[]=[
    //Should be zero padded
    WindowStr.new('1'),
    WindowStr.new('3'),
];
for (const w of badParseStrict) {
    tsts(`${w.debug()} parse strict throws`,()=>{
        assert.throws(()=>Second.parse(w,true));
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
        assert.throws(()=>Second.parse(w));
    })
}


tsts('[Symbol.toStringTag]', () => {
    const dt=Second.min;
	const str = Object.prototype.toString.call(dt);
	assert.is(str.indexOf('Second') > 0, true);
});

tsts('util.inspect',()=>{
    const dt=Second.max;
    const u=util.inspect(dt);
    assert.is(u.startsWith('Second('),true);
});

tsts('serialSizeBits',()=>{
    const o=Second.min;
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

// tsts('cloneTo',()=>{
// 	const stor1=new Uint8Array(Second.storageBytes);
// 	const stor2=new Uint8Array(Second.storageBytes);

// 	const s=Second.new(22,stor1);
// 	assert.instance(s,Second);
// 	assert.is(s.valueOf(),22);

// 	const s2=s.cloneTo(stor2);
// 	assert.instance(s2,Second);
// 	assert.is(s2.valueOf(),22);
	
// 	//This is a terrible idea, but it proves diff memory
// 	stor2[0]=13;
// 	assert.is(s.valueOf(),22);
// 	assert.is(s2.valueOf(),13);
// })

tsts.run();
