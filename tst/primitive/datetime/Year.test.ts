import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import {Year} from '../../../src/primitive/datetime/Year';
import { BitWriter } from '../../../src/primitive/BitWriter';
import { hex } from '../../../src/codec';
import { BitReader } from '../../../src/primitive/BitReader';
import util from 'util';

const tsts = suite('Year');

const serSet:[number,string][] = [
    [-10000,'0000'],//min
    [1,'4E22'],//1+10000 <<1
    [1952,'5D60'],
    [1970,'5D84'],
    [2000,'5DC0'],
    [2023,'5DEE'],
    [2024,'5DF0'],//b010111011111000
    [22767,'FFFE']
];
for (const [yr,ser] of serSet) {
    tsts(`ser(${yr})`,()=>{
        const y = Year.new(yr);
        assert.equal(y.valueOf(),yr);
    
        const bw=new BitWriter(Math.ceil(Year.serialBits/8));
        y.serialize(bw);
        assert.is(hex.fromBytes(bw.getBytes()),ser);
    });

    tsts(`deser(${ser})`,()=>{
        const bytes=hex.toBytes(ser);
        const br=new BitReader(bytes);
        const y=Year.deserialize(br)
        assert.is(y.valueOf(),yr);
    });
}

tsts(`deser without source data throws`,()=>{
    const bytes=new Uint8Array();
    const br=new BitReader(bytes);
    assert.throws(()=>Year.deserialize(br));
});
tsts(`deser without storage space throws`,()=>{
    const stor=new Uint8Array(0);
    const bytes=Uint8Array.of(0,0);
    const br=new BitReader(bytes);
    assert.throws(()=>Year.deserialize(br,stor));
});

const toStrSet:[number,string,string,string][]=[
    [-3333,'-3333','-3333','-3333'],
    [-333,'-333','-0333','-333'],
    [-33,'-33','-0033','-33'],
    [-3,'-3','-0003','-3'],
    [0,'0','0000','0'],
    [2,'2','0002','2'],
    [20,'20','0020','20'],
    [200,'200','0200','200'],
    [2000,'2000','2000','2000'],
    [20000,'20000','+20000','20000'],
];
for (const [yr,str,isoStr,jsonStr] of toStrSet) {
    const y=Year.new(yr);
    tsts(`toString(${yr})`,()=>{        
        assert.equal(y.toString(),str);
    });
    tsts(`toIsoString(${yr})`,()=>{        
        assert.equal(y.toIsoString(),isoStr);
    });
    tsts(`toJSON(${yr})`,()=>{        
        const json=JSON.stringify(y);
        assert.equal(json,jsonStr);
    });
}

tsts(`new`,()=>{
    const y=Year.new(2001);
    assert.is(y.valueOf(),2001);
    assert.is(y.toString(),'2001');
});
tsts(`new-provide storage`,()=>{
    const stor=new Uint8Array(Year.storageBytes);
    const y=Year.new(2020,stor);
    assert.is(y.valueOf(),2020);
});

const gregSet:[number,boolean,number][]=[
    [2001,true,2001],
    [1,false,0],
    [2,false,-1],
];
for(const [year,ad,expectValue] of gregSet) {
    tsts(`newGregorian(${year},${ad})`,()=>{
        const y=Year.newGregorian(year,ad);
        assert.is(y.valueOf(),expectValue);
    });
}

tsts(`newHolocene`,()=>{
    const y=Year.newHolocene(12001);
    assert.is(y.valueOf(),2001);
    assert.is(y.toString(),'2001');
});

tsts(`fromDate`,()=>{
    const dt=new Date(2001,2,3,4,5,6);
    const y=Year.fromDate(dt);
    assert.is(y.valueOf(),dt.getFullYear());
});
tsts(`fromDateUtc`,()=>{
    const dt=new Date(2001,2,3,4,5,6);
    const y=Year.fromDateUtc(dt);
    assert.is(y.valueOf(),dt.getUTCFullYear());
});

tsts(`now`,()=>{
    const dt=new Date();
    const y=Year.now();
    //This isn't a great test, but let's use a date object to compare 
    //(tiny chance of this test failing near midnight)
    assert.is(y.valueOf(),dt.getFullYear());
});

tsts(`validate`,()=>{
    //Note validate is a noop
    const y=Year.new(2024);
    assert.is(y.valueOf(),2024);
});

{
    //Because years follow a cycle of 400, a test of a range of 400 is "all"
    //We want a range of y > 256 so two bytes of storage are used
    for(let y=2000;y<2400;y++) {
        tsts(`isLeap(${y})`,()=>{
            //Note this is the more traditional calc, but you pay the penalty of:
            // 1 mod for basic-non-leap (can be optimized to bit logic)
            // 2 mods for most leap
            // 3 mods for 4 values (0/100/200/300)
            const leap=y%4==0&&(y%100!=0||y%400==0);
            assert.is(Year.isLeap(y),leap);
        })
    }
}

const parseSet:[string,number][]=[
    ['2024',2024],
    ['+2024',2024],//+ sign is optionally allowed (RFC/ISO aren't clear)
    ['-0002',-2],
    ['-0022',-22],
    ['-0222',-222],
    ['-2222',-2222],
    ['-10000',-10000],
    ['0002',2],
    ['0022',22],
    ['0222',222],
    ['2222',2222],
    ['+22222',22222],
    //Note: This could fail at the end of the year :|
    ['now',new Date().getFullYear()],
    //@ts-ignore - Note parse casts to string, so this is inefficient, but works
    [2000,2000],
];
for (const [str,expect] of parseSet) {
    tsts(`parse(${str})`,()=>{
        const y=Year.parse(str);
        assert.equal(y.valueOf(),expect);
    });
}

const badParseStrict:string[]=[
    //Should be zero padded
    '-2',
    '-22',
    '-222',
    '2',
    '22',
    '222',
    //Must have sign:
    '00000',
    '02024',
    '22222',
];
for (const str of badParseStrict) {
    tsts(`parse(${str},undefined,true)`,()=>{
        assert.throws(()=>Year.parse(str,undefined,true));
    });
}

const badParse:unknown[]=[
    //Primitives
    undefined,//Undefined not allowed
    null,//null not allowed
    true,
    //Symbol("year"),
    2000.5,//Like integers, this is converted to a string, but floating point isn't allowed

    //Bad strings
    '',//Empty string not allowed
    'tomorrow',//We support "now" onl
    '2000.5',//Floating point - not allowed
    '2e3',//2000 in scientific - not allowed
    '- 2000',//The sign must be BESIDE the integer
    //Need at least 4 digits
    //Too big
    '+123456',
];
for (const unk of badParse) {
    tsts(`badParse(${unk})`,()=>{
        //@ts-ignore - this is the point of the test
        assert.throws(()=>Year.parse(unk));
    })
}

tsts('[Symbol.toStringTag]', () => {
    const o=Year.now();
	const str = Object.prototype.toString.call(o);
	assert.is(str.indexOf('Year') > 0, true);
});

tsts('util.inspect',()=>{
    const o=Year.now();
    const u=util.inspect(o);
    assert.is(u.startsWith('Year('),true);
});

tsts('serialSizeBits',()=>{
    const o=Year.now();
    const bits=o.serialSizeBits;
    assert.is(bits>0 && bits<64,true);//Make sure it fits in 64 bits
});

tsts(`min`,()=>{
    const y=Year.min;
    assert.is(y.valueOf(),-10000);
});
tsts(`max`,()=>{
    const y=Year.max;
    assert.is(y.valueOf(),22767);
});

tsts.run();
