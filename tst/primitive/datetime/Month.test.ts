import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Month} from '../../../src/primitive/datetime/Month';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';

const tsts = suite('Month');

const serSet:[number,string][] = [
    [1,'00'],//b0000
    [2,'10'],
    [3,'20'],
    [4,'30'],
    [5,'40'],
    [6,'50'],
    [7,'60'],
    [8,'70'],
    [9,'80'],
    [10,'90'],
    [11,'A0'],
    [12,'B0'],
];
for (const [mo,ser] of serSet) {
    tsts(`ser(${mo})`,()=>{
        const m = Month.new(mo);
        assert.equal(m.valueOf(),mo);
    
        const bw=new BitWriter(Math.ceil(Month.serialBits/8));
        m.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const m=Month.deserialize(br);
        assert.is(m.valueOf(),mo);
    });
}

tsts(`deser with invalid source value (13) throws`,()=>{
    const bytes=Uint8Array.of(0xC0);
    const br=new BitReader(bytes);
    assert.throws(()=>Month.deserialize(br).validate());
});

tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Month.deserialize(br).validate());
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0x50);
    const br=new BitReader(bytes);
    assert.throws(()=>Month.deserialize(br,stor).validate());
});

const toStrSet:[number,string,string,string][]=[
    [1,'1','01','1'],
    [2,'2','02','2'],
    [12,'12','12','12'],
];
for (const [mo,str,isoStr,jsonStr] of toStrSet) {
    const m = Month.new(mo);
    tsts(`toString(${mo})`,()=>{        
        assert.equal(m.toString(),str);
    });
    tsts(`toIsoString(${mo})`,()=>{        
        assert.equal(m.toIsoString(),isoStr);
    });
    tsts(`toJSON(${mo})`,()=>{    
        const json=JSON.stringify(m);
        assert.equal(json,jsonStr);
    });
}

tsts(`new`,()=>{
    const m=Month.new(11);
    assert.is(m.valueOf(),11);
    assert.is(m.toString(),'11');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(Month.storageBytes);
    const m=Month.new(12,stor);
    assert.is(m.valueOf(),12);
});

tsts(`fromDate`,()=>{
    var dt=new Date(2001,2,3,4,5,6);
    var m=Month.fromDate(dt);
    assert.is(m.valueOf(),dt.getMonth()+1);//JS stores months 0 based
});

tsts(`fromDateUtc`,()=>{
    var dt=new Date(2001,2,3,4,5,6);
    var m=Month.fromDateUtc(dt);
    assert.is(m.valueOf(),dt.getUTCMonth()+1);//JS stores months 0 based
});

tsts(`now`,()=>{
    var dt=new Date();
    var m=Month.now();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing near midnight)
    assert.is(m.valueOf(),dt.getMonth()+1);//JS stores months 0 based
});

const parseSet:[string,number][]=[
    //Exhaustive month-int
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
    ['11',11],
    ['12',12],
    //Doesn't have to be zero padded
    ['1',1],
    ['2',2],
    ['3',3],
    ['4',4],
    ['5',5],
    ['6',6],
    ['7',7],
    ['8',8],
    ['9',9],
    //Exhaustive month-short (may fail if tests run in different locality)
    ['jan',1],
    ['feb',2],
    ['mar',3],
    ['apr',4],
    ['may',5],
    ['jun',6],
    ['jul',7],
    ['aug',8],
    ['sep',9],
    ['oct',10],
    ['nov',11],
    ['dec',12],
    //Exhaustive month-long (may fail if tests run in different locality)
    ['January',1],
    ['February',2],
    ['March',3],
    ['April',4],
    ['May',5],
    ['June',6],
    ['July',7],
    ['August',8],
    ['September',9],
    ['October',10],
    ['November',11],
    ['December',12],

    //Can be space padded
    [' 1 ',1],

    //Note: This could fail at the end of the year :|
    ['now',new Date().getMonth()+1],
    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [10,10],
];
for (const [str,expect] of parseSet) {
    tsts(`parse(${str})`,()=>{
        const m=Month.parse(str);
        assert.equal(m.valueOf(),expect);
    });
}

const badParseStrict:string[]=[
    //Should be zero padded
    '1',
    '3',
];
for (const str of badParseStrict) {
    tsts(`parse(${str},undefined,true)`,()=>{
        assert.throws(()=>Month.parse(str,undefined,true));
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
    '-02',//"
    'A',//Hex isn't allowed (good ol' tenth month)
    //Out of range:
    '0',
    '00',
    '13',
    '1000',
];
for (const unk of badParse) {
    tsts(`badParse(${unk})`,()=>{
        //@ts-ignore - this is the point of the test
        assert.throws(()=>Month.parse(unk));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const o=Month.now();
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Month') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Month.now();
    const u=util.inspect(o);
    assert.is(u.startsWith('Month('),true);
});

tsts('serialSizeBits',()=>{
    const o=Month.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

// tsts('general',()=>{
//     const dt=Day.now();
//     console.log(dt);
//     console.log(Object.prototype.toString.call(dt));
// });


tsts.run();