import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Day} from '../../src/datetime/dt';
import { BitWriter } from '../../src/primitive/BitWriter';
import { hex } from '../../src/codec';
import { BitReader } from '../../src/primitive/BitReader';
import util from 'util';
import { WindowStr } from '../../src/primitive/WindowStr';

const tsts = suite('Day');

const serSet:[number,string][] = [
    [1,'00'],
    [2,'08'],
    [3,'10'],
    [4,'18'],
    [5,'20'],
    [6,'28'],
    [7,'30'],
    [8,'38'],
    [9,'40'],

    [10,'48'],
    [11,'50'],
    [12,'58'],
    [13,'60'],
    [14,'68'],//b01101
    [15,'70'],
    [16,'78'],
    [17,'80'],
    [18,'88'],
    [19,'90'],

    [20,'98'],
    [21,'A0'],
    [22,'A8'],
    [23,'B0'],
    [24,'B8'],
    [25,'C0'],
    [26,'C8'],
    [27,'D0'],
    [28,'D8'],
    [29,'E0'],

    [30,'E8'],
    [31,'F0'],
];
for (const [da,ser] of serSet) {
    tsts(`ser(${da})`,()=>{
        const d = Day.new(da);
        assert.equal(d.valueOf(),da);
    
        const bw=new BitWriter(Math.ceil(Day.serialBits/8));
        d.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const d=Day.deserialize(br).validate();
        assert.is(d.valueOf(),da);
    });
}

tsts(`deser with invalid source value (32) throws`,()=>{
    const bytes=Uint8Array.of(0xF8);
    const br=new BitReader(bytes);
    assert.throws(()=>Day.deserialize(br).validate());
});
tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Day.deserialize(br).validate());
});

const toStrSet:[number,string,string,string][]=[
    [1,'1','01','1'],
    [2,'2','02','2'],
    [12,'12','12','12'],
    [31,'31','31','31'],
];
for (const [da,str,isoStr,jsonStr] of toStrSet) {
    const d = Day.new(da);
    tsts(`toString(${da})`,()=>{        
        assert.equal(d.toString(),str);
    });
    tsts(`toIsoString(${da})`,()=>{        
        assert.equal(d.toIsoString(),isoStr);
    });
    tsts(`toJSON(${da})`,()=>{    
        const json=JSON.stringify(d);
        assert.equal(json,jsonStr);
    });
}

tsts(`new`,()=>{
    const d=Day.new(11);
    assert.is(d.valueOf(),11);
    assert.is(d.toString(),'11');
});

tsts(`fromDate`,()=>{
    const dt=new Date(2001,2,3,4,5,6);
    const d=Day.fromDate(dt);
    assert.is(d.valueOf(),dt.getDate());//Not a great name, JS
});

tsts(`fromDateUtc`,()=>{
    const dt=new Date(2001,2,3,4,5,6);
    const d=Day.fromDateUtc(dt);
    assert.is(d.valueOf(),dt.getUTCDate());//Not a great name, JS
});

tsts(`now`,()=>{
    const dt=new Date();
    const d=Day.now();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing near midnight)
    assert.is(d.valueOf(),dt.getDate());//Not a great name, JS
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
    [WindowStr.new('30'),30,0],
    [WindowStr.new('31'),31,0],
    //Doesn't have to be zero padded
    [WindowStr.new('2'),2,0],
    [WindowStr.new(' 2 '),2,0],//Trailing isn't removed
    [WindowStr.new('20240208',6),8,0],

    //Note: This could fail at the end of the year :|
    [WindowStr.new('now'),new Date().getDate(),0],
    [WindowStr.new('nOW '),new Date().getDate(),0],
    
];
for (const [w,expect,expectLen] of parseSet) {
    tsts(`parse(${w.debug()})`,()=>{
        const d=Day.parse(w);
        assert.equal(d.valueOf(),expect);
        assert.is(w.length,expectLen,'remaining length');
    });
}

const badParseStrict:WindowStr[]=[
    //Should be zero padded
    WindowStr.new('1'),
    WindowStr.new('3'),
];
for (const w of badParseStrict) {
    tsts(`parse(${w.debug()},undefined,true)`,()=>{
        assert.throws(()=>Day.parse(w,true));
    });
}

const badParse:WindowStr[]=[
    //Bad strings
    WindowStr.new(''),//Empty string not allowed
    WindowStr.new('tomorrow'),//We support "now" only
    WindowStr.new('1.5'),//Floating point - not allowed
    WindowStr.new('1e1'),//10 in scientific - not allowed
    WindowStr.new('+01'),//Can't have sign
    WindowStr.new('-1'),//Oh sure the minusst day
    //Out of range:
    WindowStr.new('0'),
    WindowStr.new('32'),
    WindowStr.new('1000'),
];
for (const w of badParse) {
    tsts(`badParse(${w.debug()})`,()=>{
        assert.throws(()=>Day.parse(w));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const o=Day.now();
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('DayOfMonth') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Day.now();
    const u=util.inspect(o);
    assert.is(u.startsWith('DayOfMonth('),true);
});

tsts('serialSizeBits',()=>{
    const o=Day.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

//While these are brittle, I think we know the first and last day of any month
tsts(`min`,()=>{
    const d=Day.min;
    assert.is(d.valueOf(),1);
});
tsts(`max`,()=>{
    const d=Day.max;
    assert.is(d.valueOf(),31);
});

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();