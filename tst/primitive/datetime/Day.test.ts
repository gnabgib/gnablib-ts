import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Day} from '../../../src/primitive/datetime/Day';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';

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
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0x98);
    const br=new BitReader(bytes);
    assert.throws(()=>Day.deserialize(br,stor).validate());
});

const toStrSet:[number,string,string][]=[
    [1,'1','01'],
    [2,'2','02'],
    [12,'12','12'],
    [31,'31','31'],
];
for (const [da,str,isoStr] of toStrSet) {
    const d = Day.new(da);
    tsts(`toString(${da})`,()=>{        
        assert.equal(d.toString(),str);
    });
    tsts(`toIsoString(${da})`,()=>{        
        assert.equal(d.toIsoString(),isoStr);
    });
}

tsts(`new`,()=>{
    const d=Day.new(11);
    assert.is(d.valueOf(),11);
    assert.is(d.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(Day.storageBytes);
    const d=Day.new(12,stor);
    assert.is(d.valueOf(),12);
});

tsts(`fromDate`,()=>{
    const dt=new Date(2001,2,3,4,5,6);
    const d=Day.fromDate(dt);
    assert.is(d.valueOf(),dt.getDate());//Not a great name, JS
});

tsts(`now`,()=>{
    const dt=new Date();
    const d=Day.now();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing near midnight)
    assert.is(d.valueOf(),dt.getDate());//Not a great name, JS
});

const parseSet:[string,number][]=[
    //Completely valid
    ['01',1],
    ['02',2],
    ['03',3],
    ['04',4],
    ['05',5],
    ['06',6],
    ['07',7],
    ['08',8],
    ['09',9],
    ['10',10],
    ['20',20],
    ['30',30],
    ['31',31],
    //Doesn't have to be zero padded
    ['2',2],

    //Note: This could fail at the end of the year :|
    ['now',new Date().getDate()],
    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [10,10],
];
for (const [str,expect] of parseSet) {
    tsts(`parse(${str})`,()=>{
        const d=Day.parse(str);
        assert.equal(d.valueOf(),expect);
    });
}

const badParseStrict:string[]=[
    //Should be zero padded
    '1',
    '3',
];
for (const str of badParseStrict) {
    tsts(`parse(${str},undefined,true)`,()=>{
        assert.throws(()=>Day.parse(str,undefined,true));
    });
}

const badParse:unknown[]=[
    //Primitives
    undefined,//Undefined not allowed
    null,//null not allowed
    true,
    //Symbol("year"),
    1.5,//Like integers, this is converted to a string, but floating point isn't allowed

    //Bad strings
    '',//Empty string not allowed
    'tomorrow',//We support "now" only
    '1.5',//Floating point - not allowed
    '1e1',//10 in scientific - not allowed
    '+01',//Can't have sign
    //Out of range:
    '0',
    '32',
    '1000',
];
for (const unk of badParse) {
    tsts(`badParse(${unk})`,()=>{
        //@ts-ignore - this is the point of the test
        assert.throws(()=>Day.parse(unk));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const dt=Day.now();
	const str = Object.prototype.toString.call(dt);
	assert.is(str.indexOf('DayOfMonth') > 0, true);
});

tsts('util.inspect',()=>{
    const dt=Day.now();
    const u=util.inspect(dt);
    assert.is(u.startsWith('DayOfMonth('),true);
});

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });

tsts.run();