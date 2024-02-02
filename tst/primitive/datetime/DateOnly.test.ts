import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {DateOnly} from '../../../src/primitive/datetime/DateOnly';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';

const tsts = suite('DateOnly');

const serSet:[number,number,number,string,string,string][] = [
    [-10000,1,1,'-10000-01-01','000000','"-10000-01-01"'],//Yep, the null date, also min
    [1952,12,31,'1952-12-31','5D617E','"1952-12-31"'],//010111010110000 1011 11110
    [2024,1,14,'2024-01-14','5DF00D','"2024-01-14"'],//010111011111000 0000 01101
    [22767,12,31,'+22767-12-31','FFFF7E','"+22767-12-31"']//max
];
for (const [yr,mo,da,str,serStr,jsonStr] of serSet) {
    tsts(`ser(${yr} ${mo} ${da})`,()=>{
        var d=DateOnly.new(yr,mo,da);
        
        assert.is(d.toString(),str);

        var bw=new BitWriter(Math.ceil(DateOnly.serialBits/8));
        d.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),serStr);
    });

    tsts(`deser(${serStr})`,()=>{
        const bytes=hex.toBytes(serStr);
        const br=new BitReader(bytes);
        const d=DateOnly.deserialize(br).validate();
        assert.is(d.year.valueOf(),yr,'year');
        assert.is(d.month.valueOf(),mo,'month');
        assert.is(d.day.valueOf(),da,'day');
        assert.is(d.toString(),str);
    });

    tsts(`toJSON(${yr} ${mo} ${da})`,()=>{    
        var d=DateOnly.new(yr,mo,da);    
        const json=JSON.stringify(d);
        assert.equal(json,jsonStr);
    });
}

tsts(`deser with invalid source value (FFFFFFFF) throws`,()=>{
    const bytes=Uint8Array.of(0xFF,0xff,0xff);
    const br=new BitReader(bytes);
    assert.throws(()=>DateOnly.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>DateOnly.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0xFF,0xFF,0x7E);
    const br=new BitReader(bytes);
    assert.throws(()=>DateOnly.deserialize(br,stor).validate());
});


tsts(`new`,()=>{
    const d=DateOnly.new(2000,1,2);
    assert.is(d.toString(),'2000-01-02');
    assert.is(d.year.valueOf(),2000,'year');
    assert.is(d.month.valueOf(),1,'month');
    assert.is(d.day.valueOf(),2,'day');
    //Value off uses base 10 shifting of month/year
    assert.is(d.valueOf(),20000102);
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(DateOnly.storageBytes);
    const d=DateOnly.new(2000,1,2,stor);
    assert.is(d.toString(),'2000-01-02');
    assert.is(d.year.valueOf(),2000);
    assert.is(d.month.valueOf(),1);
    assert.is(d.day.valueOf(),2);
    //Value off uses base 10 shifting of month/year
    assert.is(d.valueOf(),20000102);
});

tsts(`fromDate`,()=>{
    // deepcode ignore DateMonthIndex/test: yes, we know
    const dt=new Date(2001,1/*=2 for fucks sake JS*/,3,4,5,6);
    const d=DateOnly.fromDate(dt);
    assert.is(d.year.valueOf(),2001);
    assert.is(d.month.valueOf(),2);
    assert.is(d.day.valueOf(),3);

    assert.is(d.valueOf(),20010203);
});

tsts(`toDate`,()=>{
    //Note you have to use a truncated epoch (h/m/s all zero)
    const epochMs=981158400000;
    const o=DateOnly.fromUnixTimeMs(epochMs);
    assert.is(o.toDate().valueOf(),epochMs)
})

const fromUnixTimeSet: [number, string][] = [
    //2024-01-20 07:13:30
	[1705734810, '2024-01-20'],
    //2024-01-20 07:13:30.534
	[1705734810.534, '2024-01-20'],
];
for (const [epoch, str] of fromUnixTimeSet) {
    const e = DateOnly.fromUnixTime(epoch);
	tsts(`fromUnixTime(${epoch})`, () => {
		assert.is(e.toString(), str);
	});
}

//Because `fromUnixTime` ignores lower units (smaller than day) we can't
// roundtrip from unix->DateOnly->unix (unless h/m/s are zeroed)
const toUnixTimeSet: [number,number,number,string,number,number][]=[
    [2001,2,3,'2001-02-03',981158400,981158400000],
    [2024,1,20,'2024-01-20',1705708800,1705708800000],
    [2024,2,1,'2024-02-01',1706745600,1706745600000],
];
for(const [y,m,d,str,epoch,epochMs] of toUnixTimeSet) {
    const dt=DateOnly.new(y,m,d);
    tsts(`toUnixTime(${str})`,()=>{
        assert.is(dt.toString(),str);
        assert.is(dt.toUnixTime(),epoch);
    });
    tsts(`toUnixTimeMs(${str})`,()=>{
        assert.is(dt.toUnixTimeMs(),epochMs);
    })
    //We can back convert epoch to date with these zeroed values
    tsts(`fromUnixTime(${epoch})`,()=>{
        const fr=DateOnly.fromUnixTime(epoch);
        assert.is(fr.toString(),str);
    })
    tsts(`fromUnixTimeMs(${epochMs})`,()=>{
        const fr=DateOnly.fromUnixTimeMs(epochMs);
        assert.is(fr.toString(),str);
    })
}

const fromUnixTimeMsSet: [number, string][] = [
    //2024-01-20 07:13:30.542
	[1705734810542, '2024-01-20'],
    //2024-01-20 07:13:30.542789
	[1705734810542.789, '2024-01-20'],
];
for (const [epoch, expect] of fromUnixTimeMsSet) {
	tsts(`fromUnixTimeMs(${epoch})`, () => {
		const e = DateOnly.fromUnixTimeMs(epoch);
		assert.is(e.toString(), expect);
	});
}

tsts(`now`,()=>{
    const dt=new Date();
    const d=DateOnly.now();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing near midnight)
    assert.is(d.year.valueOf(),dt.getFullYear());
    assert.is(d.month.valueOf(),dt.getMonth()+1);//JS stores months off by 1 (0=Jan)
    assert.is(d.day.valueOf(),dt.getDate());//Not a great name, JS
});

tsts(`nowUtc`,()=>{
    const dt=new Date();
    const d=DateOnly.nowUtc();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing near midnight UTC)
    assert.is(d.year.valueOf(),dt.getUTCFullYear());
    assert.is(d.month.valueOf(),dt.getUTCMonth()+1);//JS stores months off by 1 (0=Jan)
    assert.is(d.day.valueOf(),dt.getUTCDate());//Not a great name, JS
});

tsts('[Symbol.toStringTag]', () => {
    const o=DateOnly.now();
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('DateOnly') > 0, true);
});

tsts('util.inspect',()=>{
    const o=DateOnly.now();
    const u=util.inspect(o);
    assert.is(u.startsWith('DateOnly('),true);
});

tsts('serialSizeBits',()=>{
    const o=DateOnly.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});


tsts.run();