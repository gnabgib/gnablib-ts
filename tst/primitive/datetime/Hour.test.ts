import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Hour} from '../../../src/primitive/datetime/Hour';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';

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

const toStrSet:[number,string,string][]=[
    [1,'1','01'],
    [2,'2','02'],
    [12,'12','12'],
    [23,'23','23'],
];
for (const [hr,str,isoStr] of toStrSet) {
    const h = Hour.new(hr);
    tsts(`toString(${hr})`,()=>{        
        assert.equal(h.toString(),str);
    });
    tsts(`toIsoString(${hr})`,()=>{        
        assert.equal(h.toIsoString(),isoStr);
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

tsts(`fromSecondsSinceEpoch`, () => {
	const h = Hour.fromSecondsSinceEpoch(1705734810);
	assert.is(h.valueOf(), 7);
});

tsts(`fromMillisecondsSinceEpoch`, () => {
	const h = Hour.fromMillisecondsSinceEpoch(1705734810543);
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
    ['23',23],
    //Doesn't have to be zero padded
    ['2',2],

    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [10,10],
];
for (const [str,expect] of parseSet) {
    tsts(`parse(${str})`,()=>{
        const d=Hour.parse(str);
        assert.equal(d.valueOf(),expect);
    });
}
tsts(`parse(now)`, () => {
	const h = Hour.parse('now');
    const dt=new Date();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing at the end of an hour)
    assert.is(h.valueOf(),dt.getHours());
});

const badParseStrict:string[]=[
    //Should be zero padded
    '1',
    '3',
];
for (const str of badParseStrict) {
    tsts(`parse(${str},undefined,true)`,()=>{
        assert.throws(()=>Hour.parse(str,undefined,true));
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
    '32',
    '1000',
];
for (const unk of badParse) {
    tsts(`badParse(${unk})`,()=>{
        //@ts-ignore - this is the point of the test
        assert.throws(()=>Hour.parse(unk));
    })
}

tsts.run();