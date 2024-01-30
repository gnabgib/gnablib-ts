import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {DateOnly} from '../../../src/primitive/datetime/DateOnly';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';

const tsts = suite('DateOnly');

const serSet:[number,number,number,string,string][] = [
    [-10000,1,1,'-10000-01-01','000000'],//Yep, the null date, also min
    [1952,12,31,'1952-12-31','5D617E'],//010111010110000 1011 11110
    [2024,1,14,'2024-01-14','5DF00D'],//010111011111000 0000 01101
    [22767,12,31,'+22767-12-31','FFFF7E']//max
];
for (const [yr,mo,da,str,ser] of serSet) {
    tsts(`ser(${yr} ${mo} ${da})`,()=>{
        var d=DateOnly.new(yr,mo,da);
        
        assert.is(d.toString(),str);

        var bw=new BitWriter(Math.ceil(DateOnly.serialBits/8));
        d.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const d=DateOnly.deserialize(br).validate();
        assert.is(d.year.valueOf(),yr,'year');
        assert.is(d.month.valueOf(),mo,'month');
        assert.is(d.day.valueOf(),da,'day');
        assert.is(d.toString(),str);
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

const fromUnixTimeSet: [number, string][] = [
    //2024-01-20 07:13:30
	[1705734810, '2024-01-20'],
    //2024-01-20 07:13:30.534
	[1705734810.534, '2024-01-20'],
];
for (const [epoch, expect] of fromUnixTimeSet) {
	tsts(`fromUnixTime(${epoch})`, () => {
		const e = DateOnly.fromUnixTime(epoch);
		assert.is(e.toString(), expect);
	});
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

tsts.run();