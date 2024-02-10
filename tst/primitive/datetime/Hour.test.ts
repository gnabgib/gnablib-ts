import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Hour} from '../../../src/primitive/datetime/Hour';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../../src/primitive/WindowStr';

const tsts = suite('Hour');

const serSet:[number,string][] = [
    //Exhaustive
    [0,'00'],
    [1,'08'],
    [2,'10'],
    [3,'18'],
    [4,'20'],
    [5,'28'],
    [6,'30'],
    [7,'38'],
    [8,'40'],
    [9,'48'],

    [10,'50'],
    [11,'58'],
    [12,'60'],
    [13,'68'],
    [14,'70'],
    [15,'78'],
    [16,'80'],
    [17,'88'],
    [18,'90'],
    [19,'98'],

    [20,'A0'],
    [21,'A8'],
    [22,'B0'],
    [23,'B8'],
];
for (const [mi,ser] of serSet) {
    tsts(`ser(${mi})`,()=>{
        const h = Hour.new(mi);
        assert.equal(h.valueOf(),mi);
    
        const bw=new BitWriter(Math.ceil(Hour.serialBits/8));
        h.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const h=Hour.deserialize(br).validate();
        assert.is(h.valueOf(),mi);
    });
}

tsts(`deser with invalid source value (24) throws`,()=>{
    const bytes=Uint8Array.of(24<<3);
    const br=new BitReader(bytes);
    assert.throws(()=>Hour.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Hour.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0x00);
    const br=new BitReader(bytes);
    assert.throws(()=>Hour.deserialize(br,stor).validate());
});

const toStrSet:[number,string,string,string][]=[
    [1,'1','01','1'],
    [2,'2','02','2'],
    [12,'12','12','12'],
    [23,'23','23','23'],
];
for (const [hr,str,isoStr,jsonStr] of toStrSet) {
    const h = Hour.new(hr);
    tsts(`toString(${hr})`,()=>{        
        assert.equal(h.toString(),str);
    });
    tsts(`toIsoString(${hr})`,()=>{        
        assert.equal(h.toIsoString(),isoStr);
    });
    tsts(`toJSON(${hr})`,()=>{    
        const json=JSON.stringify(h);
        assert.equal(json,jsonStr);
    });
}

tsts(`new`,()=>{
    const h=Hour.new(11);
    assert.is(h.valueOf(),11);
    assert.is(h.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(Hour.storageBytes);
    const h=Hour.new(12,stor);
    assert.is(h.valueOf(),12);
});

tsts(`fromDate`,()=>{
    const dt=new Date(2001,2,3,4,5,6);
    const h=Hour.fromDate(dt);
    assert.is(h.valueOf(),dt.getHours());
});

tsts(`fromDateUtc`,()=>{
    //2024-01-20 07:13:30
    const dt=new Date(1705734810);
    const h=Hour.fromDateUtc(dt);
    assert.is(h.valueOf(),dt.getUTCHours());
});


tsts(`fromUnixTime`, () => {
	const h = Hour.fromUnixTime(1705734810);
	assert.is(h.valueOf(), 7);
});

tsts(`fromUnixTimeMs`, () => {
	const h = Hour.fromUnixTimeMs(1705734810543);
	assert.is(h.valueOf(), 7);
});

tsts(`fromUnixTimeUs`, () => {
	const h = Hour.fromUnixTimeUs(1705734810543000);
	assert.is(h.valueOf(), 7);
});


tsts(`now`,()=>{
    const dt=new Date();
    const h=Hour.now();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing at the end of an hour)
    assert.is(h.valueOf(),dt.getHours());
});

tsts(`nowUtc`,()=>{
    const dt=new Date();
    const h=Hour.nowUtc();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing at the end of an hour)
    assert.is(h.valueOf(),dt.getUTCHours());
});

const parseSet:[WindowStr,number][]=[
    //Completely valid
    [WindowStr.new('01'),1],
    [WindowStr.new('02'),2],
    [WindowStr.new('03'),3],
    [WindowStr.new('04'),4],
    [WindowStr.new('05'),5],
    [WindowStr.new('06'),6],
    [WindowStr.new('07'),7],
    [WindowStr.new('08'),8],
    [WindowStr.new('09'),9],
    [WindowStr.new('10'),10],
    [WindowStr.new('20'),20],
    [WindowStr.new('23'),23],
    //Doesn't have to be zero padded
    [WindowStr.new('2'),2],
];
for (const [str,expect] of parseSet) {
    tsts(`parse(${str})`,()=>{
        const d=Hour.parse(str);
        assert.equal(d.valueOf(),expect);
    });
}
tsts(`parse(now)`, () => {
	const h = Hour.parse(WindowStr.new('now'));
    const dt=new Date();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing at the end of an hour)
    assert.is(h.valueOf(),dt.getHours());
});

const badParseStrict:WindowStr[]=[
    //Should be zero padded
    WindowStr.new('1'),
    WindowStr.new('3'),
];
for (const w of badParseStrict) {
    tsts(`${w.debug()} parse strict throws`,()=>{
        assert.throws(()=>Hour.parse(w,true));
    });
}

const badParse:WindowStr[]=[
    WindowStr.new(''),//Empty string not allowed
    WindowStr.new('tomorrow'),//We support "now" only
    WindowStr.new('1.5'),//Floating point - not allowed
    WindowStr.new('1e1'),//10 in scientific - not allowed
    WindowStr.new('+01'),//Can't have sign
    //Out of range:
    WindowStr.new('32'),
    WindowStr.new('1000'),
];
for (const w of badParse) {
    tsts(`${w.debug()} parse throws`,()=>{
        //@ts-ignore - this is the point of the test
        assert.throws(()=>Hour.parse(w));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const o=Hour.now();
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('HourOfDay') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Hour.now();
    const u=util.inspect(o);
    assert.is(u.startsWith('HourOfDay('),true);
});

tsts('serialSizeBits',()=>{
    const o=Hour.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

tsts('cloneTo',()=>{
	const stor1=new Uint8Array(Hour.storageBytes);
	const stor2=new Uint8Array(Hour.storageBytes);

	const h=Hour.new(22,stor1);
	assert.instance(h,Hour);
	assert.is(h.valueOf(),22);

	const h2=h.cloneTo(stor2);
	assert.instance(h2,Hour);
	assert.is(h2.valueOf(),22);
	
	//This is a terrible idea, but it proves diff memory
	stor2[0]=13;
	assert.is(h.valueOf(),22);
	assert.is(h2.valueOf(),13);
})


// tsts('general',()=>{
//     const dt=Hour.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();